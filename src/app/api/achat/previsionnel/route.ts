import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sellsyFetch,
  sellsyV1Call,
  listStaffs,
  type SellsyOrder,
} from "@/lib/sellsy";
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
  /** Override manuel du prix HT (utile pour les refs absentes du catalogue Sellsy) */
  priceHTOverride?: number;
}

interface PackingFile {
  meta: Record<string, string>;
  items: PackingItem[];
}

function normalizeStr(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Récupère le custom field "Etat des produits" d'un BDC Sellsy.
 *  - "SAV" / "RETOUR" → on flag pour badge UI + reste à payer = 0
 */
async function fetchEtatProduit(sellsyOrderId: number | string): Promise<string | null> {
  try {
    const cfRes = await sellsyFetch<{ data: Array<{ code?: string; name?: string; label?: string; value?: unknown; parameters?: { items?: Array<{ id: number | string; label: string }> } }> }>(
      `/orders/${sellsyOrderId}/custom-fields?limit=100`
    );
    const cfs = cfRes.data || [];
    const target = cfs.find((cf) => {
      const fields = [cf.code, cf.name, cf.label].filter(Boolean) as string[];
      return fields.some((v) => {
        const n = normalizeStr(v);
        return n.includes("etat") && n.includes("produit");
      });
    });
    if (target?.value != null && target.value !== "") {
      const raw = String(target.value).trim();
      const items = target.parameters?.items || [];
      const matched = items.find((it) => String(it.id) === raw);
      return matched?.label || raw;
    }
  } catch {
    /* tolère */
  }
  return null;
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
  /** true si convertit manuellement depuis un BCDI client (override "to-stock") */
  convertedFromBcdi: boolean;
  /** Référence métier réelle (avant conversion, pour l'affichage) */
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
  items: RowItem[];
}

const cache = new Map<string, { data: unknown; expires: number }>();
const TTL_MS = 15 * 60 * 1000;

/**
 * Cherche le prix HT live sur Sellsy pour un item / déclinaison + écrit dans le cache.
 *  - Tente d'abord /items/{id}/declinations/{declId}/prices (référence_price_taxes_exc)
 *  - Sinon retourne null
 */
async function fetchPriceHTLive(opts: {
  itemId?: number | null;
  declinationId?: number | null;
  ref?: string;
}): Promise<number | null> {
  const { itemId, declinationId, ref } = opts;
  try {
    if (itemId && declinationId) {
      const res = await sellsyFetch<{
        data: { data?: Array<{ unit_amount?: string }> } & {
          unit_amount?: string;
        };
      }>(`/items/${itemId}/declinations/${declinationId}/prices?limit=20`);
      const list: Array<{ unit_amount?: string }> =
        (res as unknown as { data: Array<{ unit_amount?: string }> }).data || [];
      for (const p of list) {
        if (p.unit_amount != null) {
          const v = Number(p.unit_amount);
          if (Number.isFinite(v) && v > 0) {
            // Écriture opportuniste dans le cache
            await prisma.sellsyDeclinationCache.updateMany({
              where: { id: declinationId },
              data: { priceHT: v },
            });
            return v;
          }
        }
      }
      // Fallback : /declinations/{id} renvoie reference_price_taxes_exc
      const detail = await sellsyFetch<{
        data: { reference_price_taxes_exc?: string | null };
      }>(`/declinations/${declinationId}`);
      const refPrice = Number(detail.data?.reference_price_taxes_exc || 0);
      if (Number.isFinite(refPrice) && refPrice > 0) {
        await prisma.sellsyDeclinationCache.updateMany({
          where: { id: declinationId },
          data: { priceHT: refPrice },
        });
        return refPrice;
      }
    }
    if (itemId && !declinationId) {
      const detail = await sellsyFetch<{
        data: { reference_price_taxes_exc?: string | null };
      }>(`/items/${itemId}`);
      const refPrice = Number(detail.data?.reference_price_taxes_exc || 0);
      if (Number.isFinite(refPrice) && refPrice > 0) {
        await prisma.sellsyItemCache.update({
          where: { id: itemId },
          data: { priceHT: refPrice },
        });
        return refPrice;
      }
    }
    // Dernier recours : items/search live par ref
    if (ref) {
      const res = await sellsyFetch<{
        data: Array<{ id: number; reference: string }>;
      }>(`/items/search?limit=5`, {
        method: "POST",
        body: JSON.stringify({ filters: { references: [ref] } }),
      });
      const hit = (res.data || []).find(
        (i) => (i.reference || "").toUpperCase() === ref.toUpperCase()
      );
      if (hit?.id) return fetchPriceHTLive({ itemId: hit.id });
    }
  } catch (e) {
    console.warn("[previsionnel] live price err:", e);
  }
  return null;
}

async function priceHTForRef(ref: string): Promise<number | null> {
  if (!ref || ref === "—") return null;
  // 1) cache : déclinaison exacte
  const decli = await prisma.sellsyDeclinationCache.findFirst({
    where: { reference: { equals: ref, mode: "insensitive" } },
    select: { id: true, priceHT: true, itemId: true },
  });
  if (decli?.priceHT != null) return Number(decli.priceHT);

  if (decli?.itemId) {
    // 2) cache : sœur même itemId
    const sister = await prisma.sellsyDeclinationCache.findFirst({
      where: { itemId: decli.itemId, priceHT: { not: null } },
      select: { priceHT: true },
    });
    if (sister?.priceHT != null) return Number(sister.priceHT);

    // 3) cache : item parent
    const parent = await prisma.sellsyItemCache.findUnique({
      where: { id: decli.itemId },
      select: { priceHT: true },
    });
    if (parent?.priceHT != null) return Number(parent.priceHT);

    // 4) live : Sellsy /declinations/{id} ou /items/{id}
    const live = await fetchPriceHTLive({
      itemId: decli.itemId,
      declinationId: decli.id,
    });
    if (live != null) return live;
  }

  // 5) item direct (sans déclinaison)
  const item = await prisma.sellsyItemCache.findFirst({
    where: { reference: { equals: ref, mode: "insensitive" } },
    select: { id: true, priceHT: true },
  });
  if (item?.priceHT != null) return Number(item.priceHT);
  if (item?.id) {
    const live = await fetchPriceHTLive({ itemId: item.id });
    if (live != null) return live;
  }

  // 6) live : search items par référence
  const live = await fetchPriceHTLive({ ref });
  return live;
}

/**
 * Calcul du reste à payer HT à partir du status + deposit Sellsy.
 *
 * L'API Sellsy V2 n'expose pas le « solde dû » directement sur un BDC
 * (les paiements sont reportés sur les factures, dont le lien BDC↔facture
 * n'est pas filtrable en V2 — filtre `contact_id` cassé, pas de relation
 * exploitable).
 *
 * Estimation pragmatique :
 *  - status `paid` | `invoiced`           → 0 (tout encaissé/facturé)
 *  - status `cancelled`|`refused`|`expired` → 0 (commande hors prévi)
 *  - status `advanced` (acompte versé)    → reste = total × (1 − acompte%)
 *      • si `deposit.type=percent`  → acompte% = deposit.value / 100
 *      • si `deposit.type=amount`   → acompte% = deposit.value / totalTTC
 *      • sinon (acompte versé sans % connu) → 60% restant par défaut (40/40/20)
 *  - status `draft`|`sent`|`accepted`     → reste = total (rien encaissé)
 */
/**
 * Calcule le reste à payer HT d'un BDC.
 *
 * Source de vérité : le V1 Sellsy `Document.getOne` qui expose `relateds_amount` —
 * la somme TTC de TOUTES les relations (paiements directs + factures d'acompte
 * + factures liées). Cette valeur reflète ce que Sellsy considère comme encaissé
 * dans le contexte de l'order, même quand les paiements ont migré vers les
 * documents enfants (BDL, facture finale).
 *
 * Exemple BCDI-05598 META FORGE :
 *   - totalAmount V1 : 1 250 € TTC
 *   - relateds_amount : 625 € TTC (acompte Bois d'Orient)
 *   - reste TTC = 625 € → HT = 575,97 € (≈ Michelle 625 TTC)
 *
 * Fallback V2 : si l'appel V1 échoue (rare), on retombe sur le calcul V2
 * status + deposit + paiements directs.
 */
async function calcPaymentSummary(order: SellsyOrder): Promise<{
  restePayerHT: number;
  paidPct: number;
}> {
  const totalHT = Number(order.amounts?.total_excl_tax || 0);
  const totalTTC = Number(order.amounts?.total_incl_tax || 0);
  if (totalHT <= 0 || totalTTC <= 0) {
    return { restePayerHT: 0, paidPct: 1 };
  }

  const status = (order.status || "").toLowerCase();
  if (["cancelled", "refused", "expired"].includes(status)) {
    return { restePayerHT: 0, paidPct: 0 };
  }
  if (["paid"].includes(status)) {
    return { restePayerHT: 0, paidPct: 1 };
  }

  // 1) Source principale : V1 Document.getOne → relateds_amount
  try {
    const v1 = (await sellsyV1Call("Document.getOne", {
      doctype: "order",
      docid: String(order.id),
    })) as {
      step?: string;
      totalAmount?: string;
      totalAmountTaxesFree?: string;
      relateds_amount?: string;
    } | null;

    if (v1) {
      const v1Total = Number(v1.totalAmount || totalTTC);
      const v1TotalHT = Number(v1.totalAmountTaxesFree || totalHT);
      const paidTTC = Math.min(v1Total, Number(v1.relateds_amount || 0));
      const resteTTC = Math.max(0, v1Total - paidTTC);
      const ratio = v1Total > 0 ? v1TotalHT / v1Total : 1;
      const restePayerHT = Number((resteTTC * ratio).toFixed(2));
      const paidPct = v1Total > 0 ? Math.min(Math.max(paidTTC / v1Total, 0), 1) : 0;
      return { restePayerHT, paidPct };
    }
  } catch (e) {
    console.warn("[previsionnel] V1 Document.getOne err:", e);
  }

  // 2) Fallback V2 : status + deposit + paiements directs
  if (status === "invoiced") {
    return { restePayerHT: 0, paidPct: 1 };
  }
  let paidFromPaymentsTTC = 0;
  try {
    const pay = await sellsyFetch<{
      data: Array<{ amount?: { value: string }; status?: string }>;
    }>(`/orders/${order.id}/payments?limit=100`);
    for (const p of pay.data || []) {
      if (p.status && p.status !== "confirmed") continue;
      const v = Number(p.amount?.value || 0);
      if (Number.isFinite(v)) paidFromPaymentsTTC += v;
    }
  } catch {
    /* tolère */
  }
  let paidFromDepositTTC = 0;
  const deposit = (order as unknown as { deposit?: { type?: string; value?: string } }).deposit;
  if (status === "advanced") {
    if (deposit?.type === "percent") {
      paidFromDepositTTC = (Number(deposit.value || 0) / 100) * totalTTC;
    } else if (deposit?.type === "amount") {
      paidFromDepositTTC = Number(deposit.value || 0);
    } else {
      paidFromDepositTTC = 0.4 * totalTTC;
    }
  }
  const paidTTC = Math.min(totalTTC, Math.max(paidFromPaymentsTTC, paidFromDepositTTC));
  const resteTTC = Math.max(0, totalTTC - paidTTC);
  const ratio = totalHT / totalTTC;
  const restePayerHT = Number((resteTTC * ratio).toFixed(2));
  const paidPct = Math.min(Math.max(paidTTC / totalTTC, 0), 1);
  return { restePayerHT, paidPct };
}

async function fetchOrderInfo(
  bcdi: string,
  staffMap: Map<number, string>
): Promise<{
  client: string | null;
  commercial: string | null;
  totalHT: number;
  restePayerHT: number;
  paidPct: number;
  status: string | null;
  etatProduit: string | null;
  isSav: boolean;
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

    const totalHT = Number(order.amounts?.total_excl_tax || 0);
    let { restePayerHT, paidPct } = await calcPaymentSummary(order);

    const ownerId = order.owner_id ?? order.owner?.id ?? null;
    const commercial =
      ownerId && staffMap.has(ownerId) ? staffMap.get(ownerId)! : null;

    let client: string | null = null;
    const ec = order._embed?.contact;
    if (ec) {
      const n = `${ec.first_name || ""} ${ec.last_name || ""}`.trim();
      if (n) client = n;
    }
    if (!client && order._embed?.company?.name) client = order._embed.company.name;
    if (!client && order.company_name) client = order.company_name;

    // Cherche d'abord dans la Vente locale (déjà synchronisée), sinon live Sellsy
    let etatProduit: string | null = null;
    try {
      const v = await prisma.vente.findFirst({
        where: { numero: { equals: bcdi, mode: "insensitive" } },
        select: { etatProduit: true },
      });
      etatProduit = v?.etatProduit || null;
    } catch {
      /* tolère */
    }
    if (!etatProduit) {
      etatProduit = await fetchEtatProduit(order.id);
    }

    const ep = (etatProduit || "").toUpperCase();
    const isSav = ep.includes("SAV") || ep.includes("RETOUR");
    if (isSav) {
      // Un SAV ou retour n'entre pas dans la projection de trésorerie
      restePayerHT = 0;
      paidPct = 1;
    }

    return {
      client,
      commercial,
      totalHT: Number(totalHT.toFixed(2)),
      restePayerHT,
      paidPct,
      status: order.status || null,
      etatProduit,
      isSav,
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

  // 2bis) Charger les overrides BCDI → STOCK pour cet IMP
  const overrides = await prisma.previsionnelBcdiOverride.findMany({
    where: { impCode: conf.code },
    select: { bcdi: true, action: true, note: true },
  });
  const overrideMap = new Map<string, { action: string; note: string | null }>();
  for (const o of overrides) {
    overrideMap.set(o.bcdi.toUpperCase(), { action: o.action, note: o.note });
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

  // a) BCDI réels — on ignore ceux convertis en stock (pas besoin d'appel Sellsy)
  const realBcdis = bcdis.filter(
    (b) =>
      b.toUpperCase().startsWith("BCDI") &&
      overrideMap.get(b.toUpperCase())?.action !== "to-stock"
  );
  const orderInfoByBcdi = new Map<string, Awaited<ReturnType<typeof fetchOrderInfo>>>();
  const CONC = 8;
  for (let i = 0; i < realBcdis.length; i += CONC) {
    const batch = realBcdis.slice(i, i + CONC);
    const results = await Promise.all(
      batch.map((b) => fetchOrderInfo(b, staffMap))
    );
    batch.forEach((b, idx) => orderInfoByBcdi.set(b, results[idx]));
  }

  // Clients qui sont toujours du stock (commandes internes DIMEXOI / Exhibition).
  // Comparé en majuscules après normalisation, match si le client commence par.
  const AUTO_STOCK_CLIENTS = ["ORDER DIMEXOI", "DIMEXOI", "EXHIBITION"];
  const isAutoStockClient = (client: string | null | undefined): boolean => {
    if (!client) return false;
    const c = client.trim().toUpperCase();
    return AUTO_STOCK_CLIENTS.some((s) => c === s || c.startsWith(s + " "));
  };

  for (const bcdi of bcdis) {
    const items = groups.get(bcdi)!;
    const nbMeubles = items.reduce((s, it) => s + (it.qty || 0), 0);
    const isRealBcdi = bcdi.toUpperCase().startsWith("BCDI");
    const override = overrideMap.get(bcdi.toUpperCase());
    const info = isRealBcdi ? orderInfoByBcdi.get(bcdi) : undefined;
    const autoStock = isRealBcdi && isAutoStockClient(info?.client);
    const convertedFromBcdi = isRealBcdi && override?.action === "to-stock";
    const isStock = !isRealBcdi || convertedFromBcdi || autoStock;

    if (isStock) {
      let potentiel = 0;
      const detailedItems: RowItem[] = [];
      for (const it of items) {
        const price = it.priceHTOverride ?? (await priceHTForRef(it.ref));
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
        items: detailedItems,
      });
    } else {
      rows.push({
        bcdi,
        isStock: false,
        convertedFromBcdi: false,
        client: info?.client || null,
        commercial: info?.commercial || null,
        nbMeubles,
        totalHT: info ? info.totalHT : null,
        restePayerHT: info ? info.restePayerHT : null,
        potentielCommercial: 0,
        status: info?.status || null,
        paidPct: info?.paidPct ?? null,
        etatProduit: info?.etatProduit ?? null,
        isSav: info?.isSav ?? false,
        items: items.map((it) => ({
          ref: it.ref,
          description: it.description,
          qty: it.qty,
          note: it.note,
        })),
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
