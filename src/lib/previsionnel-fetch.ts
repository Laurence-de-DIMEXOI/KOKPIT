import { prisma } from "@/lib/prisma";
import {
  sellsyFetch,
  sellsyV1Call,
  listStaffs,
  type SellsyOrder,
} from "@/lib/sellsy";

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
}

async function fetchOrderInfo(
  bcdi: string,
  staffMap: Map<number, string>
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
      status: order.status || null,
      etatProduit,
      isSav,
      sellsyOrderId: order.id,
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
      batch.map(async (b) => ({ bcdi: b, info: await fetchOrderInfo(b, staffMap) }))
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
