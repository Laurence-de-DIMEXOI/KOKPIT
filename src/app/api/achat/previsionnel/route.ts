import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sellsyFetch, listStaffs, type SellsyOrder } from "@/lib/sellsy";
import { IMPORTS } from "@/lib/imports-config";

/**
 * GET /api/achat/previsionnel?imp=IMP-618
 *
 * Renvoie, pour l'arrivage demandé :
 *  - meta du container (CONT NO, dates, source)
 *  - lignes regroupées par BCDI avec :
 *      client, commercial (owner), nbMeubles (Σ qty),
 *      totalHT (BDC Sellsy), restePayerHT (calculé via paiements),
 *      potentielCommercial (Σ qty × prix HT cache, pour STOCK)
 *
 * Stratégie prix HT :
 *  1) SellsyDeclinationCache.reference == ref → priceHT
 *  2) sinon, une autre décli du même itemId avec priceHT non-null
 *  3) sinon, SellsyItemCache parent priceHT
 *  4) sinon, null (affiché « — »)
 *
 * Cache mémoire 15 min.
 */

interface PackingItem {
  bcdi: string;
  ref: string;
  description: string;
  qty: number;
  note?: string;
}

interface PackingFile {
  meta: Record<string, string>;
  items: PackingItem[];
}

interface Row {
  bcdi: string;
  isStock: boolean;
  client: string | null;
  commercial: string | null;
  nbMeubles: number;
  totalHT: number | null;
  restePayerHT: number | null;
  potentielCommercial: number | null;
  refsDetail?: Array<{ ref: string; qty: number; priceHT: number | null }>;
}

const cache = new Map<string, { data: unknown; expires: number }>();
const TTL_MS = 15 * 60 * 1000;

async function priceHTForRef(ref: string): Promise<number | null> {
  if (!ref || ref === "—") return null;
  const decli = await prisma.sellsyDeclinationCache.findFirst({
    where: { reference: { equals: ref, mode: "insensitive" } },
    select: { priceHT: true, itemId: true },
  });
  if (decli?.priceHT != null) return Number(decli.priceHT);

  if (decli?.itemId) {
    // Tente sœur du même itemId avec un prix
    const sister = await prisma.sellsyDeclinationCache.findFirst({
      where: { itemId: decli.itemId, priceHT: { not: null } },
      select: { priceHT: true },
    });
    if (sister?.priceHT != null) return Number(sister.priceHT);

    // Item parent
    const parent = await prisma.sellsyItemCache.findUnique({
      where: { id: decli.itemId },
      select: { priceHT: true },
    });
    if (parent?.priceHT != null) return Number(parent.priceHT);
  }

  // Tentative item direct par référence (pour les items sans déclinaison)
  const item = await prisma.sellsyItemCache.findFirst({
    where: { reference: { equals: ref, mode: "insensitive" } },
    select: { priceHT: true },
  });
  if (item?.priceHT != null) return Number(item.priceHT);

  return null;
}

async function fetchOrderInfo(
  bcdi: string,
  staffMap: Map<number, string>
): Promise<{
  client: string | null;
  commercial: string | null;
  totalHT: number;
  restePayerHT: number;
} | null> {
  try {
    const search = await sellsyFetch<{ data: SellsyOrder[] }>(
      `/orders/search?limit=1&embed[]=owner&embed[]=contact&embed[]=company`,
      {
        method: "POST",
        body: JSON.stringify({ filters: { number: bcdi } }),
      }
    );
    const order = search.data?.[0];
    if (!order) return null;

    const amounts = order.amounts!;
    const totalHT = Number(amounts.total_excl_tax || 0);
    const totalTTC = Number(amounts.total_incl_tax || 0);

    // Owner / commercial
    const ownerId = order.owner_id ?? order.owner?.id ?? null;
    const commercial =
      ownerId && staffMap.has(ownerId) ? staffMap.get(ownerId)! : null;

    // Client
    let client: string | null = null;
    const ec = order._embed?.contact;
    if (ec) {
      const n = `${ec.first_name || ""} ${ec.last_name || ""}`.trim();
      if (n) client = n;
    }
    if (!client && order._embed?.company?.name) client = order._embed.company.name;
    if (!client && order.company_name) client = order.company_name;

    // Paiements liés
    let paidTTC = 0;
    try {
      const pay = await sellsyFetch<{
        data: Array<{ amount?: { value: string } }>;
      }>(`/orders/${order.id}/payments`);
      for (const p of pay.data || []) {
        const v = Number(p.amount?.value || 0);
        if (Number.isFinite(v)) paidTTC += v;
      }
    } catch {
      /* tolère */
    }

    const restePayerTTC = Math.max(0, totalTTC - paidTTC);
    const ratio = totalTTC > 0 ? totalHT / totalTTC : 1;
    const restePayerHT = Number((restePayerTTC * ratio).toFixed(2));

    return {
      client,
      commercial,
      totalHT: Number(totalHT.toFixed(2)),
      restePayerHT,
    };
  } catch (e) {
    console.warn(`[previsionnel] order ${bcdi}:`, e);
    return null;
  }
}

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

  // 1) Charger le packing JSON via HTTP (sert depuis /public/data)
  let packing: PackingFile;
  try {
    const origin = new URL(request.url).origin;
    const res = await fetch(`${origin}/data/${conf.dataFile}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    packing = await res.json();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Packing list introuvable: ${conf.dataFile}`, debug: msg },
      { status: 500 }
    );
  }

  // 2) Grouper par BCDI
  const groups = new Map<string, PackingItem[]>();
  for (const it of packing.items) {
    const k = it.bcdi || "STOCK";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(it);
  }

  // 3) Staffs Sellsy
  let staffMap = new Map<number, string>();
  try {
    const staffs = await listStaffs();
    staffMap = new Map(
      staffs.map((s) => [s.id, `${s.firstname} ${s.lastname}`.trim()])
    );
  } catch {
    /* tolère */
  }

  // 4) Construire les rangées
  const bcdis = Array.from(groups.keys());
  const rows: Row[] = [];

  // a) BCDI réels — appels Sellsy en parallèle
  const realBcdis = bcdis.filter((b) => b.toUpperCase().startsWith("BCDI"));
  const orderInfoByBcdi = new Map<string, Awaited<ReturnType<typeof fetchOrderInfo>>>();
  const CONC = 8;
  for (let i = 0; i < realBcdis.length; i += CONC) {
    const batch = realBcdis.slice(i, i + CONC);
    const results = await Promise.all(
      batch.map((b) => fetchOrderInfo(b, staffMap))
    );
    batch.forEach((b, idx) => orderInfoByBcdi.set(b, results[idx]));
  }

  for (const bcdi of bcdis) {
    const items = groups.get(bcdi)!;
    const nbMeubles = items.reduce((s, it) => s + (it.qty || 0), 0);
    const isStock = !bcdi.toUpperCase().startsWith("BCDI");

    if (isStock) {
      // Potentiel commercial = Σ qty × prix HT
      let potentiel = 0;
      let allKnown = true;
      const refsDetail: Row["refsDetail"] = [];
      for (const it of items) {
        const price = await priceHTForRef(it.ref);
        refsDetail.push({ ref: it.ref, qty: it.qty, priceHT: price });
        if (price == null) {
          allKnown = false;
        } else {
          potentiel += it.qty * price;
        }
      }
      rows.push({
        bcdi,
        isStock: true,
        client: "STOCK",
        commercial: null,
        nbMeubles,
        totalHT: null,
        restePayerHT: null,
        potentielCommercial: allKnown
          ? Number(potentiel.toFixed(2))
          : Number(potentiel.toFixed(2)), // partiel — affiché tel quel
        refsDetail,
      });
    } else {
      const info = orderInfoByBcdi.get(bcdi);
      rows.push({
        bcdi,
        isStock: false,
        client: info?.client || null,
        commercial: info?.commercial || null,
        nbMeubles,
        totalHT: info ? info.totalHT : null,
        restePayerHT: info ? info.restePayerHT : null,
        potentielCommercial: 0,
      });
    }
  }

  // Tri : BCDI ascendant, STOCK en bas
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

  const payload = {
    imp: conf,
    meta: packing.meta,
    rows,
    totals,
    generatedAt: new Date().toISOString(),
  };

  cache.set(cacheKey, { data: payload, expires: Date.now() + TTL_MS });
  return NextResponse.json({ ...payload, cached: false });
}
