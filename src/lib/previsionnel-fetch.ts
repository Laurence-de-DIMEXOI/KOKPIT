import { prisma } from "@/lib/prisma";
import {
  sellsyFetch,
  sellsyV1Call,
  listStaffs,
  type SellsyOrder,
} from "@/lib/sellsy";
import { fetchBoOrderPaidTTC } from "@/lib/sellsy-bdo";

/**
 * ────────────────────────────────────────────────────────────────────────
 * Bois d'Orient (BO) — BCDI DIMEXOI à 0€ qui sont en réalité des BC BO.
 *
 * Le lien BCDI → n° de BC figure dans l'objet du document (rare) et surtout
 * dans un COMMENTAIRE Sellsy ("BCDI Bois D'Orient : BC-11487-06122024").
 * ⚠ Les filtres de POST /comments/search sont TOTALEMENT inopérants sur ce
 * compte (même owner_id renvoie les 7157 commentaires) → impossible de cibler
 * une commande côté serveur. On scanne donc l'intégralité des commentaires
 * UNE fois et on mémoïse la map `orderId → n° BC` (le mapping est figé).
 *
 * Les MONTANTS (total HT, reste à payer) viennent de la base locale
 * `DocumentBoisDOrient` (les données BO y sont déjà migrées) — plus aucun
 * appel au Sellsy BO live.
 * ────────────────────────────────────────────────────────────────────────
 */

/** Extrait le n° de BC normalisé "BC-11487" depuis un texte (objet/commentaire). */
function extractBcNumber(...texts: (string | null | undefined)[]): string | null {
  const re = /BC[\s-]?(\d{4,6})/i;
  for (const t of texts) {
    if (!t) continue;
    const m = t.match(re);
    if (m) return `BC-${m[1]}`;
  }
  return null;
}

// Cache mémoire de la map orderId → n° BC (scan global des commentaires).
let commentBcMapCache: { map: Map<number, string>; expires: number } | null = null;
const COMMENT_MAP_TTL_MS = 6 * 60 * 60 * 1000; // 6h — mapping historique figé

interface SellsyComment {
  description?: string;
  related?: Array<{ type?: string; id?: number | string }>;
}

/**
 * Scanne tous les commentaires Sellsy (pagination) et construit la map
 * `orderId (V2) → n° BC` à partir des commentaires "BCDI Bois D'Orient : BC-…".
 * Mémoïsé 6h. Plafonné à 150 pages de 100 (≈ 15 000 commentaires) par sécurité.
 */
async function getOrderBcMap(): Promise<Map<number, string>> {
  if (commentBcMapCache && Date.now() < commentBcMapCache.expires) {
    return commentBcMapCache.map;
  }
  const map = new Map<number, string>();
  const PAGE = 100;
  let offset = 0;
  let total = Infinity;
  let pages = 0;
  while (offset < total && pages < 150) {
    let res: { data: SellsyComment[]; pagination?: { total?: number } };
    try {
      res = await sellsyFetch(`/comments/search?limit=${PAGE}&offset=${offset}`, {
        method: "POST",
        body: JSON.stringify({ filters: {} }),
      });
    } catch (e) {
      console.warn("[prev-fetch] scan commentaires interrompu:", (e as Error).message);
      break;
    }
    total = res.pagination?.total ?? 0;
    for (const c of res.data || []) {
      const bc = extractBcNumber(c.description);
      if (!bc) continue;
      for (const rel of c.related || []) {
        if ((rel.type === "order" || rel.type === "purchase-order") && rel.id != null) {
          map.set(Number(rel.id), bc);
        }
      }
    }
    if (!res.data || res.data.length === 0) break;
    offset += PAGE;
    pages++;
  }
  console.log(`[prev-fetch] map BO commentaires : ${map.size} commandes mappées (${pages} pages)`);
  commentBcMapCache = { map, expires: Date.now() + COMMENT_MAP_TTL_MS };
  return map;
}

interface BoAmounts {
  bcNumber: string;
  totalHT: number;
  restePayerHT: number;
  paidPct: number;
  status: string | null;
  client: string | null;
}

/**
 * Récupère les montants d'un BC depuis la base locale `DocumentBoisDOrient`.
 * `bcRef` peut être "BC-11487" ou "BC-11487-06122024" → on matche par le
 * cœur "BC-<digits>" (la référence en base est "BC-11487-06122024").
 * Reste à payer = 0 si une facture BO payée du même montant existe pour le
 * même client, sinon le montant HT de la commande.
 */
const BO_PAID_TTL_MS = 6 * 60 * 60 * 1000; // re-synchro paiements BO toutes les 6h max

async function lookupBoAmountsLocal(bcRef: string): Promise<BoAmounts | null> {
  const digits = (bcRef.match(/\d{4,6}/) || [])[0];
  if (!digits) return null;

  const commande = await prisma.documentBoisDOrient.findFirst({
    where: { type: "COMMANDE", reference: { startsWith: `BC-${digits}` } },
    orderBy: { date: "desc" },
  });
  if (!commande || commande.montantHT == null) return null;

  const totalHT = Number(commande.montantHT);
  const totalTTC = Number(commande.montantTTC || 0);

  let client: string | null = null;
  if (commande.clientBdoId) {
    const c = await prisma.clientBoisDOrient.findUnique({
      where: { id: commande.clientBdoId },
      select: { nom: true, prenom: true },
    });
    if (c) client = `${c.prenom || ""} ${c.nom || ""}`.trim() || null;
  }

  // Montant payé (TTC), combinaison de 3 signaux :
  //  - paiements directs de la commande (acomptes) → /orders/{id}/payments BO (caché)
  //  - commande `paid` → soldée
  //  - facture BO payée du même montant HT pour ce client → soldée
  //    (cas "invoiced" : le paiement est porté par la facture, pas la commande)
  let paidTTC: number =
    commande.paidInclTax != null ? Number(commande.paidInclTax) : 0;
  const stale =
    !commande.paidSyncedAt ||
    Date.now() - commande.paidSyncedAt.getTime() > BO_PAID_TTL_MS;
  if (commande.statut !== "paid" && (commande.paidInclTax == null || stale)) {
    const fetched = await fetchBoOrderPaidTTC(commande.sellsyDocId);
    if (fetched != null) {
      paidTTC = fetched;
      await prisma.documentBoisDOrient
        .update({
          where: { id: commande.id },
          data: { paidInclTax: fetched, paidSyncedAt: new Date() },
        })
        .catch(() => {});
    }
  }

  let soldee = commande.statut === "paid";
  if (!soldee && paidTTC < totalTTC && commande.clientBdoId) {
    const paidFact = await prisma.documentBoisDOrient.findFirst({
      where: {
        clientBdoId: commande.clientBdoId,
        type: "FACTURE",
        statut: "paid",
        montantHT: commande.montantHT,
      },
      select: { id: true },
    });
    if (paidFact) soldee = true;
  }

  let restePayerHT: number;
  if (soldee) {
    restePayerHT = 0;
  } else if (totalTTC > 0) {
    const resteTTC = Math.max(0, totalTTC - paidTTC);
    restePayerHT = Number((resteTTC * (totalHT / totalTTC)).toFixed(2));
  } else {
    restePayerHT = totalHT;
  }

  const paidPct = totalHT > 0 ? Math.min(Math.max(1 - restePayerHT / totalHT, 0), 1) : 1;
  return {
    bcNumber: commande.reference || bcRef,
    totalHT: Number(totalHT.toFixed(2)),
    restePayerHT,
    paidPct,
    status: commande.statut || null,
    client,
  };
}

/**
 * Fetch lourd Sellsy pour le Prévisionnel. Réservé au cron de refresh.
 * La page lit uniquement la table snapshot.
 */

function normalizeStr(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

async function fetchEtatProduit(
  sellsyOrderId: number | string
): Promise<string | null> {
  try {
    const cfRes = await sellsyFetch<{
      data: Array<{
        code?: string;
        name?: string;
        label?: string;
        value?: unknown;
        parameters?: { items?: Array<{ id: number | string; label: string }> };
      }>;
    }>(`/orders/${sellsyOrderId}/custom-fields?limit=100`);
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

async function chainedPaidTTCFromLocalLinks(
  orderId: bigint
): Promise<number | null> {
  const directChildren = await prisma.sellsyDocLink.findMany({
    where: { parentId: orderId, parentType: "order" },
    select: { childId: true, childType: true },
  });
  if (directChildren.length === 0) return null;

  let paid = 0;
  const invoiceIds: bigint[] = [];
  for (const c of directChildren) {
    if (c.childType === "invoice") invoiceIds.push(c.childId);
    if (c.childType === "delivery") {
      const deliveryInvoices = await prisma.sellsyDocLink.findMany({
        where: { parentId: c.childId, parentType: "delivery", childType: "invoice" },
        select: { childId: true },
      });
      for (const di of deliveryInvoices) invoiceIds.push(di.childId);
    }
  }
  if (invoiceIds.length === 0) return null;

  const paidRows = await prisma.sellsyInvoicePaid.findMany({
    where: { invoiceId: { in: invoiceIds } },
    select: { paidInclTax: true },
  });
  for (const r of paidRows) {
    if (r.paidInclTax != null) paid += Number(r.paidInclTax);
  }
  return paid;
}

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

  // Tables locales (webhooks)
  try {
    const localPaidTTC = await chainedPaidTTCFromLocalLinks(BigInt(order.id));
    if (localPaidTTC != null) {
      const paidTTC = Math.min(totalTTC, localPaidTTC);
      const resteTTC = Math.max(0, totalTTC - paidTTC);
      const ratio = totalHT / totalTTC;
      return {
        restePayerHT: Number((resteTTC * ratio).toFixed(2)),
        paidPct: Math.min(Math.max(paidTTC / totalTTC, 0), 1),
      };
    }
  } catch (e) {
    console.warn("[prev-fetch] local links err:", e);
  }

  // V1 Document.getOne
  try {
    const v1 = (await sellsyV1Call("Document.getOne", {
      doctype: "order",
      docid: String(order.id),
    })) as {
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
      return {
        restePayerHT: Number((resteTTC * ratio).toFixed(2)),
        paidPct: v1Total > 0 ? Math.min(Math.max(paidTTC / v1Total, 0), 1) : 0,
      };
    }
  } catch (e) {
    console.warn("[prev-fetch] V1 err:", e);
  }

  // Fallback V2
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
  const deposit = (order as unknown as {
    deposit?: { type?: string; value?: string };
  }).deposit;
  if (status === "advanced") {
    if (deposit?.type === "percent") {
      paidFromDepositTTC = (Number(deposit.value || 0) / 100) * totalTTC;
    } else if (deposit?.type === "amount") {
      paidFromDepositTTC = Number(deposit.value || 0);
    } else {
      paidFromDepositTTC = 0.4 * totalTTC;
    }
  }
  const paidTTC = Math.min(
    totalTTC,
    Math.max(paidFromPaymentsTTC, paidFromDepositTTC)
  );
  const resteTTC = Math.max(0, totalTTC - paidTTC);
  const ratio = totalHT / totalTTC;
  return {
    restePayerHT: Number((resteTTC * ratio).toFixed(2)),
    paidPct: Math.min(Math.max(paidTTC / totalTTC, 0), 1),
  };
}

export interface BcdiInfo {
  client: string | null;
  commercial: string | null;
  totalHT: number;
  restePayerHT: number;
  paidPct: number;
  status: string | null;
  etatProduit: string | null;
  isSav: boolean;
  sellsyOrderId: number | null;
  bdoBcNumber: string | null;
}

async function fetchOrderInfo(
  bcdi: string,
  staffMap: Map<number, string>,
  priorBcNumber: string | null = null
): Promise<BcdiInfo | null> {
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

    let totalHT = Number(order.amounts?.total_excl_tax || 0);
    let { restePayerHT, paidPct } = await calcPaymentSummary(order);
    let statusValue: string | null = order.status || null;

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

    // ── Bois d'Orient : BCDI DIMEXOI à 0€ qui est en réalité un BC BO.
    //    n° BC = objet (rare) sinon commentaire (map scannée). Montants depuis
    //    la base locale DocumentBoisDOrient (plus d'appel Sellsy BO live).
    let bdoBcNumber: string | null = null;
    if (totalHT <= 0) {
      let bc = extractBcNumber(order.subject) || priorBcNumber;
      if (!bc) {
        const map = await getOrderBcMap();
        bc = map.get(order.id) || null;
      }
      if (bc) {
        bdoBcNumber = bc;
        try {
          const bo = await lookupBoAmountsLocal(bc);
          if (bo) {
            totalHT = bo.totalHT;
            restePayerHT = bo.restePayerHT;
            paidPct = bo.paidPct;
            if (bo.status) statusValue = bo.status;
            if (!client && bo.client) client = bo.client;
            bdoBcNumber = bo.bcNumber;
          }
        } catch (e) {
          console.warn(`[prev-fetch] BO ${bc} (BCDI ${bcdi}):`, (e as Error).message);
        }
      }
    }

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
      restePayerHT = 0;
      paidPct = 1;
    }

    return {
      client,
      commercial,
      totalHT: Number(totalHT.toFixed(2)),
      restePayerHT,
      paidPct,
      status: statusValue,
      etatProduit,
      isSav,
      sellsyOrderId: order.id,
      bdoBcNumber,
    };
  } catch (e) {
    console.warn(`[prev-fetch] order ${bcdi}:`, e);
    return null;
  }
}

/**
 * Refresh des snapshots BCDI pour un IMP.
 *  - opts.forceAll : refetch tous (sinon seulement ceux trop vieux)
 *  - opts.maxAgeMs : âge max d'un snapshot avant refetch
 *  - opts.concurrency : nombre d'appels Sellsy parallèles
 */
export async function refreshBcdiSnapshots(
  bcdis: string[],
  opts: {
    forceAll?: boolean;
    maxAgeMs?: number;
    concurrency?: number;
  } = {}
): Promise<{
  refreshed: number;
  skipped: number;
  notFound: number;
  errors: string[];
}> {
  const concurrency = opts.concurrency || 12;
  const maxAgeMs = opts.maxAgeMs ?? 30 * 60 * 1000; // 30 min par défaut

  const realBcdis = bcdis.filter((b) => b.toUpperCase().startsWith("BCDI"));
  const cutoff = new Date(Date.now() - maxAgeMs);
  const existing = opts.forceAll
    ? []
    : await prisma.bcdiSellsySnapshot.findMany({
        where: { bcdi: { in: realBcdis }, computedAt: { gt: cutoff } },
        select: { bcdi: true },
      });
  const upToDate = new Set(existing.map((s) => s.bcdi));
  const toRefresh = realBcdis.filter((b) => !upToDate.has(b));

  // n° BC BO déjà connus → évite de re-scanner les commentaires à chaque refresh
  const knownBc = await prisma.bcdiSellsySnapshot.findMany({
    where: { bcdi: { in: realBcdis }, bdoBcNumber: { not: null } },
    select: { bcdi: true, bdoBcNumber: true },
  });
  const priorBcByBcdi = new Map(knownBc.map((s) => [s.bcdi, s.bdoBcNumber]));

  let staffMap = new Map<number, string>();
  try {
    const staffs = await listStaffs();
    staffMap = new Map(
      staffs.map((s) => [s.id, `${s.firstname} ${s.lastname}`.trim()])
    );
  } catch (e) {
    console.warn("[prev-fetch] staffs ko:", e);
  }

  let refreshed = 0;
  let notFound = 0;
  const errors: string[] = [];

  for (let i = 0; i < toRefresh.length; i += concurrency) {
    const batch = toRefresh.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (b) => ({
        bcdi: b,
        info: await fetchOrderInfo(b, staffMap, priorBcByBcdi.get(b) ?? null),
      }))
    );
    await Promise.all(
      results.map(async ({ bcdi, info }) => {
        if (!info) {
          notFound++;
          return;
        }
        try {
          await prisma.bcdiSellsySnapshot.upsert({
            where: { bcdi },
            create: {
              bcdi,
              sellsyOrderId: info.sellsyOrderId ? BigInt(info.sellsyOrderId) : null,
              client: info.client,
              commercial: info.commercial,
              totalHT: info.totalHT,
              restePayerHT: info.restePayerHT,
              paidPct: info.paidPct,
              status: info.status,
              etatProduit: info.etatProduit,
              isSav: info.isSav,
              bdoBcNumber: info.bdoBcNumber,
              computedAt: new Date(),
            },
            update: {
              sellsyOrderId: info.sellsyOrderId ? BigInt(info.sellsyOrderId) : null,
              client: info.client,
              commercial: info.commercial,
              totalHT: info.totalHT,
              restePayerHT: info.restePayerHT,
              paidPct: info.paidPct,
              status: info.status,
              etatProduit: info.etatProduit,
              isSav: info.isSav,
              bdoBcNumber: info.bdoBcNumber,
              computedAt: new Date(),
            },
          });
          refreshed++;
        } catch (e) {
          errors.push(`${bcdi}: ${(e as Error).message.slice(0, 80)}`);
        }
      })
    );
  }

  return {
    refreshed,
    skipped: upToDate.size,
    notFound,
    errors,
  };
}
