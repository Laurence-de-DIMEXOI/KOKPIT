import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { IMPORTS } from "@/lib/imports-config";

/**
 * GET /api/achat/previsionnel?imp=IMP-618[&fresh=true]
 *
 * Page de projection trésorerie : lecture pure DB (snapshot Sellsy par BCDI
 * + overrides utilisateur + prix HT catalogue). Aucun appel Sellsy live.
 *
 * Le snapshot `bcdi_sellsy_snapshot` est rafraîchi par le cron
 * `/api/cron/previsionnel-refresh` (Vercel cron toutes les 30 min) :
 * → la page s'affiche instantanément (~50 ms), même sur cold start.
 *
 * `fresh=true` vide le cache mémoire ; il ne déclenche pas de fetch Sellsy
 * (réservé au cron). Pour forcer un refetch immédiat, taper le cron avec
 * `?force=true`.
 */

interface PackingItem {
  bcdi: string;
  ref: string;
  description: string;
  qty: number;
  note?: string;
  priceHTOverride?: number;
}

interface PackingFile {
  meta: Record<string, string>;
  items: PackingItem[];
}

interface RowItem {
  ref: string;
  description: string;
  qty: number;
  note?: string;
  priceHT?: number | null;
}

interface Row {
  bcdi: string;
  isStock: boolean;
  convertedFromBcdi: boolean;
  originalBcdi?: string;
  overrideNote?: string | null;
  client: string | null;
  commercial: string | null;
  nbMeubles: number;
  totalHT: number | null;
  restePayerHT: number | null;
  potentielCommercial: number | null;
  status: string | null;
  paidPct: number | null;
  etatProduit: string | null;
  isSav: boolean;
  note: string | null;
  hasManualRestePayer: boolean;
  hasManualTotalHT: boolean;
  items: RowItem[];
}

const cache = new Map<string, { data: unknown; expires: number }>();
const TTL_MS = 5 * 60 * 1000; // cache mémoire 5 min (la BDD est déjà la source de vérité)

// ────────────────────────────────────────────────────────────
// PRIX HT CATALOGUE (pour les lignes STOCK) — batch DB pur
// ────────────────────────────────────────────────────────────

/**
 * Charge en une passe le prix HT de toutes les refs nécessaires
 * (déclinaisons + items). Renvoie une Map case-insensitive `ref → priceHT`.
 * Pas d'appel Sellsy live — uniquement la BDD locale (catalogue cache).
 * Les refs sans prix retournent null.
 */
async function batchPriceHTByRef(
  refs: string[]
): Promise<Map<string, number | null>> {
  const map = new Map<string, number | null>();
  const wanted = Array.from(
    new Set(
      refs
        .map((r) => (r || "").trim())
        .filter((r) => r && r !== "—")
        .map((r) => r.toUpperCase())
    )
  );
  if (wanted.length === 0) return map;

  // 1) Déclinations exactes
  const declis = await prisma.sellsyDeclinationCache.findMany({
    where: { reference: { in: wanted, mode: "insensitive" } },
    select: { reference: true, priceHT: true, itemId: true },
  });
  for (const d of declis) {
    if (d.priceHT != null) {
      map.set(d.reference.toUpperCase(), Number(d.priceHT));
    }
  }

  // 2) Pour les refs sans prix direct, prend la sœur du même itemId qui a un prix
  const stillMissing = wanted.filter((r) => !map.has(r));
  const itemIdByMissingRef = new Map<string, number>();
  for (const r of stillMissing) {
    const decli = declis.find((d) => d.reference.toUpperCase() === r);
    if (decli?.itemId) itemIdByMissingRef.set(r, decli.itemId);
  }
  if (itemIdByMissingRef.size > 0) {
    const itemIds = Array.from(new Set(itemIdByMissingRef.values()));
    const sisters = await prisma.sellsyDeclinationCache.findMany({
      where: { itemId: { in: itemIds }, priceHT: { not: null } },
      select: { itemId: true, priceHT: true },
    });
    const sisterByItem = new Map<number, number>();
    for (const s of sisters) {
      if (s.priceHT != null && !sisterByItem.has(s.itemId)) {
        sisterByItem.set(s.itemId, Number(s.priceHT));
      }
    }
    for (const [ref, itemId] of itemIdByMissingRef.entries()) {
      const sp = sisterByItem.get(itemId);
      if (sp != null) map.set(ref, sp);
    }

    // 3) Item parent
    const stillMissing2 = stillMissing.filter((r) => !map.has(r));
    const parentIds = Array.from(
      new Set(stillMissing2.map((r) => itemIdByMissingRef.get(r)!).filter(Boolean))
    );
    if (parentIds.length > 0) {
      const parents = await prisma.sellsyItemCache.findMany({
        where: { id: { in: parentIds } },
        select: { id: true, priceHT: true },
      });
      const parentMap = new Map<number, number>();
      for (const p of parents) {
        if (p.priceHT != null) parentMap.set(p.id, Number(p.priceHT));
      }
      for (const r of stillMissing2) {
        const itemId = itemIdByMissingRef.get(r);
        if (itemId) {
          const pp = parentMap.get(itemId);
          if (pp != null) map.set(r, pp);
        }
      }
    }
  }

  // 4) Items directs (refs sans déclinaison)
  const stillMissing3 = wanted.filter((r) => !map.has(r));
  if (stillMissing3.length > 0) {
    const items = await prisma.sellsyItemCache.findMany({
      where: { reference: { in: stillMissing3, mode: "insensitive" } },
      select: { reference: true, priceHT: true },
    });
    for (const it of items) {
      if (it.priceHT != null) {
        map.set(it.reference.toUpperCase(), Number(it.priceHT));
      }
    }
  }

  // 5) Refs résiduelles sans prix : null (le cron de catalogue se chargera)
  for (const r of wanted) {
    if (!map.has(r)) map.set(r, null);
  }
  return map;
}

// ────────────────────────────────────────────────────────────
// GET handler — lecture pure DB
// ────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const url = new URL(request.url);
  const impCode = url.searchParams.get("imp") || IMPORTS[0]?.code || "IMP-618";
  const fresh = url.searchParams.get("fresh") === "true";

  const conf = IMPORTS.find((i) => i.code === impCode);
  if (!conf) {
    return NextResponse.json({ error: "Import inconnu" }, { status: 404 });
  }

  const cacheKey = impCode;
  if (!fresh) {
    const c = cache.get(cacheKey);
    if (c && Date.now() < c.expires) {
      return NextResponse.json({ ...(c.data as object), cached: true });
    }
  }

  // 1) Packing JSON
  let packing: PackingFile;
  try {
    const origin = new URL(request.url).origin;
    const res = await fetch(`${origin}/data/${conf.dataFile}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    packing = await res.json();
  } catch (e: unknown) {
    return NextResponse.json(
      {
        error: `Packing list introuvable: ${conf.dataFile}`,
        debug: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }

  // 2) Groupe par BCDI
  const groups = new Map<string, PackingItem[]>();
  for (const it of packing.items) {
    const k = it.bcdi || "STOCK";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(it);
  }

  // 3) Overrides
  const overrides = await prisma.previsionnelBcdiOverride.findMany({
    where: { impCode: conf.code },
    select: {
      bcdi: true,
      action: true,
      note: true,
      restePayerHTOverride: true,
      totalHTOverride: true,
    },
  });
  interface OverrideEntry {
    action: string;
    note: string | null;
    restePayerHTOverride: number | null;
    totalHTOverride: number | null;
  }
  const overrideMap = new Map<string, OverrideEntry>();
  for (const o of overrides) {
    overrideMap.set(o.bcdi.toUpperCase(), {
      action: o.action,
      note: o.note,
      restePayerHTOverride:
        o.restePayerHTOverride != null ? Number(o.restePayerHTOverride) : null,
      totalHTOverride:
        o.totalHTOverride != null ? Number(o.totalHTOverride) : null,
    });
  }

  // 4) Snapshots (toujours lu — pas de filtre TTL ici, le cron s'en occupe)
  const realBcdis = Array.from(groups.keys()).filter(
    (b) =>
      b.toUpperCase().startsWith("BCDI") &&
      overrideMap.get(b.toUpperCase())?.action !== "to-stock"
  );
  const snapshotsRaw = await prisma.bcdiSellsySnapshot.findMany({
    where: { bcdi: { in: realBcdis } },
  });
  interface SnapInfo {
    client: string | null;
    commercial: string | null;
    totalHT: number;
    restePayerHT: number;
    paidPct: number;
    status: string | null;
    etatProduit: string | null;
    isSav: boolean;
    computedAt: Date;
  }
  const snapByBcdi = new Map<string, SnapInfo>();
  let oldestComputedAt: Date | null = null;
  for (const s of snapshotsRaw) {
    const info: SnapInfo = {
      client: s.client,
      commercial: s.commercial,
      totalHT: s.totalHT != null ? Number(s.totalHT) : 0,
      restePayerHT: s.restePayerHT != null ? Number(s.restePayerHT) : 0,
      paidPct: s.paidPct != null ? Number(s.paidPct) : 0,
      status: s.status,
      etatProduit: s.etatProduit,
      isSav: s.isSav,
      computedAt: s.computedAt,
    };
    snapByBcdi.set(s.bcdi, info);
    if (!oldestComputedAt || s.computedAt < oldestComputedAt) {
      oldestComputedAt = s.computedAt;
    }
  }

  // 5) Auto-stock detection
  const AUTO_STOCK_CLIENTS = ["ORDER DIMEXOI", "DIMEXOI", "EXHIBITION"];
  const isAutoStockClient = (client: string | null | undefined): boolean => {
    if (!client) return false;
    const c = client.trim().toUpperCase();
    return AUTO_STOCK_CLIENTS.some((s) => c === s || c.startsWith(s + " "));
  };

  // 6) Pré-fetch des prix HT en un seul batch DB pour tous les items STOCK
  const stockRefs = packing.items
    .filter((it) => {
      const k = it.bcdi || "STOCK";
      const isReal = k.toUpperCase().startsWith("BCDI");
      const ov = overrideMap.get(k.toUpperCase());
      const info = isReal ? snapByBcdi.get(k) : undefined;
      const autoStock = isReal && info && isAutoStockClient(info.client);
      const converted = isReal && ov?.action === "to-stock";
      return !isReal || converted || autoStock;
    })
    .map((it) => it.ref);
  const priceMap = await batchPriceHTByRef(stockRefs);

  // 6) Construit les rangées
  const rows: Row[] = [];
  for (const [bcdi, items] of groups.entries()) {
    const nbMeubles = items.reduce((s, it) => s + (it.qty || 0), 0);
    const isRealBcdi = bcdi.toUpperCase().startsWith("BCDI");
    const override = overrideMap.get(bcdi.toUpperCase());
    const info = isRealBcdi ? snapByBcdi.get(bcdi) : undefined;
    const autoStock = isRealBcdi && isAutoStockClient(info?.client);
    const convertedFromBcdi = isRealBcdi && override?.action === "to-stock";
    const isStock = !isRealBcdi || convertedFromBcdi || autoStock;

    if (isStock) {
      let potentiel = 0;
      const detailedItems: RowItem[] = [];
      for (const it of items) {
        const price =
          it.priceHTOverride ?? priceMap.get((it.ref || "").toUpperCase().trim()) ?? null;
        detailedItems.push({
          ref: it.ref,
          description: it.description,
          qty: it.qty,
          note: it.note,
          priceHT: price,
        });
        if (price != null) potentiel += it.qty * price;
      }
      const clientLabel = convertedFromBcdi
        ? `Stock (ex ${bcdi})`
        : autoStock
          ? `Stock — ${info!.client}`
          : "STOCK";
      rows.push({
        bcdi,
        isStock: true,
        convertedFromBcdi,
        originalBcdi: convertedFromBcdi ? bcdi : undefined,
        overrideNote: convertedFromBcdi
          ? override?.note ?? null
          : autoStock
            ? `Commande interne ${info!.client}`
            : null,
        client: clientLabel,
        commercial: null,
        nbMeubles,
        totalHT: null,
        restePayerHT: null,
        potentielCommercial: Number(potentiel.toFixed(2)),
        status: null,
        paidPct: null,
        etatProduit: null,
        isSav: false,
        note: override?.note ?? null,
        hasManualRestePayer: false,
        hasManualTotalHT: false,
        items: detailedItems,
      });
    } else {
      let totalHT_ = info ? info.totalHT : null;
      let restePayer = info ? info.restePayerHT : null;
      let hasManualTotalHT = false;
      let hasManualRestePayer = false;
      if (override?.totalHTOverride != null) {
        totalHT_ = override.totalHTOverride;
        hasManualTotalHT = true;
      }
      if (override?.restePayerHTOverride != null) {
        restePayer = override.restePayerHTOverride;
        hasManualRestePayer = true;
      }
      rows.push({
        bcdi,
        isStock: false,
        convertedFromBcdi: false,
        client: info?.client || null,
        commercial: info?.commercial || null,
        nbMeubles,
        totalHT: totalHT_,
        restePayerHT: restePayer,
        potentielCommercial: 0,
        status: info?.status || null,
        paidPct: info?.paidPct ?? null,
        etatProduit: info?.etatProduit ?? null,
        isSav: info?.isSav ?? false,
        note: override?.note ?? null,
        hasManualRestePayer,
        hasManualTotalHT,
        items: items.map((it) => ({
          ref: it.ref,
          description: it.description,
          qty: it.qty,
          note: it.note,
        })),
      });
    }
  }

  rows.sort((a, b) => {
    if (a.isStock && !b.isStock) return 1;
    if (!a.isStock && b.isStock) return -1;
    return a.bcdi.localeCompare(b.bcdi);
  });

  const totals = {
    nbMeubles: rows.reduce((s, r) => s + r.nbMeubles, 0),
    totalHT: rows.reduce((s, r) => s + (r.totalHT || 0), 0),
    restePayerHT: rows.reduce((s, r) => s + (r.restePayerHT || 0), 0),
    potentielCommercial: rows.reduce(
      (s, r) => s + (r.potentielCommercial || 0),
      0
    ),
  };

  const missingSnapshots = realBcdis.filter((b) => !snapByBcdi.has(b)).length;

  const payload = {
    imp: conf,
    meta: packing.meta,
    rows,
    totals,
    generatedAt: new Date().toISOString(),
    snapshotOldestComputedAt: oldestComputedAt?.toISOString() ?? null,
    snapshotMissing: missingSnapshots,
  };

  cache.set(cacheKey, { data: payload, expires: Date.now() + TTL_MS });
  return NextResponse.json({ ...payload, cached: false });
}
