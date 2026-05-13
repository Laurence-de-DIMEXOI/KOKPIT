import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchOrders, searchEstimates, sellsyFetch } from "@/lib/sellsy";

export const maxDuration = 800; // Vercel Pro max
export const dynamic = "force-dynamic";

/**
 * Deep sync historique BDC + Devis (depuis 2019 ou date custom).
 *
 * GET/POST /api/admin/deep-sync-sellsy
 *   ?since=YYYY-MM-DD          (default 2019-01-01)
 *   ?until=YYYY-MM-DD          (default today)
 *   ?type=both|orders|estimates (default both)
 *   ?startOffset=N             (resume — pour orders OU estimates selon type)
 *   ?withEtat=true|false       (default true) — fetch custom field "Etat des produit"
 *
 * Mode resumable : si TIME_BUDGET atteint, retourne nextOffset pour relance.
 *
 * Auth : ADMIN/DIRECTION OU Bearer CRON_API_SECRET OU UA vercel-cron.
 */

const PAGE = 100;
const TIME_BUDGET_MS = 12 * 60 * 1000; // 12 min

function normalizeStr(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

async function fetchEtatProduit(
  type: "order" | "estimate",
  sellsyId: string
): Promise<{ etatProduit: string | null; statutSellsy: string | null }> {
  try {
    const path = type === "order" ? `/orders/${sellsyId}` : `/estimates/${sellsyId}`;
    const [docRes, cfRes] = await Promise.all([
      sellsyFetch<{ data: { status?: string } }>(path).catch(() => ({ data: null as any })),
      sellsyFetch<{ data: any[] }>(`${path}/custom-fields?limit=100`).catch(() => ({ data: [] })),
    ]);
    const statutSellsy = (docRes.data?.status as string | undefined) || null;
    const cfs = cfRes.data || [];
    const target = cfs.find((cf: any) => {
      const fields = [cf.code, cf.name, cf.label].filter(Boolean) as string[];
      return fields.some((v) => {
        const n = normalizeStr(v);
        return n.includes("etat") && n.includes("produit");
      });
    });
    let etatProduit: string | null = null;
    if (target?.value != null && target.value !== "") {
      const raw = String(target.value).trim();
      const items = (target.parameters?.items || []) as Array<{ id: number | string; label: string }>;
      const matched = items.find((it) => String(it.id) === raw);
      etatProduit = matched?.label || raw;
    }
    return { etatProduit, statutSellsy };
  } catch {
    return { etatProduit: null, statutSellsy: null };
  }
}

function mapEstimateStatus(status: string | undefined): "EN_ATTENTE" | "ENVOYE" | "ACCEPTE" | "REFUSE" | "EXPIRE" {
  switch ((status || "").toLowerCase()) {
    case "draft": return "EN_ATTENTE";
    case "sent": return "ENVOYE";
    case "accepted": return "ACCEPTE";
    case "refused":
    case "rejected": return "REFUSE";
    case "expired": return "EXPIRE";
    default: return "EN_ATTENTE";
  }
}

async function ensureContact(
  sellsyContactId: string | null,
  fallbackKey: string,
  fallbackName: string,
  lifecycle: "CLIENT" | "PROSPECT"
): Promise<string> {
  if (sellsyContactId) {
    const existing = await prisma.contact.findFirst({
      where: { sellsyContactId },
      select: { id: true },
    });
    if (existing) return existing.id;
  }
  // Placeholder
  const placeholder = await prisma.contact.upsert({
    where: { email: fallbackKey },
    create: {
      nom: fallbackName,
      prenom: "",
      email: fallbackKey,
      lifecycleStage: lifecycle,
      sourcePremiere: "SHOWROOM",
    },
    update: {},
    select: { id: true },
  });
  return placeholder.id;
}

async function syncOrders(
  sinceStr: string,
  untilStr: string,
  startOffset: number,
  withEtat: boolean,
  startTs: number
): Promise<{ scanned: number; upserted: number; nextOffset: number | null; total: number }> {
  let offset = startOffset;
  let scanned = 0;
  let upserted = 0;
  let total = 0;

  while (true) {
    if (Date.now() - startTs > TIME_BUDGET_MS) {
      return { scanned, upserted, nextOffset: offset, total };
    }
    const res = await searchOrders({
      filters: { date: { start: sinceStr, end: untilStr } },
      limit: PAGE,
      offset,
      embed: ["contact", "company"],
      order: "date",
      direction: "asc", // oldest first
    }).catch(() => null);
    if (!res) break;
    total = res.pagination?.total || total;
    const orders = res.data || [];
    if (orders.length === 0) break;

    // Map sellsyContactId → kokpitContactId
    const contactsBySellsyId = new Map<string, string>();
    const allRelatedIds = new Set<string>();
    for (const o of orders) {
      for (const r of (o.related || [])) allRelatedIds.add(String(r.id));
      if (o.contact_id) allRelatedIds.add(String(o.contact_id));
    }
    if (allRelatedIds.size > 0) {
      const contacts = await prisma.contact.findMany({
        where: { sellsyContactId: { in: Array.from(allRelatedIds) } },
        select: { id: true, sellsyContactId: true },
      });
      for (const c of contacts) {
        if (c.sellsyContactId) {
          for (const sid of c.sellsyContactId.split(",")) {
            contactsBySellsyId.set(sid.trim(), c.id);
          }
        }
      }
    }

    for (const ord of orders) {
      scanned++;
      try {
        const relatedIds = (ord.related || []).map((r: any) => String(r.id));
        const sellsyContactId =
          relatedIds.find((rid) => contactsBySellsyId.get(rid)) ||
          (ord.contact_id ? String(ord.contact_id) : null) ||
          relatedIds[0] || null;

        const kokpitContactId = await ensureContact(
          sellsyContactId,
          `sellsy-${ord.id}@placeholder.dimexoi.fr`,
          `Sellsy BDC ${ord.number || ord.id}`,
          "CLIENT"
        );

        const { etatProduit, statutSellsy } = withEtat
          ? await fetchEtatProduit("order", String(ord.id))
          : { etatProduit: null, statutSellsy: ord.status || null };

        const amount = Number(
          ord.amounts?.total_excl_tax ?? ord.amounts?.total_raw_excl_tax ?? 0
        ) || 0;

        // Update : on n'écrase JAMAIS un etatProduit/statutSellsy déjà valides avec null
        await prisma.vente.upsert({
          where: { sellsyInvoiceId: String(ord.id) },
          update: {
            montant: amount,
            dateVente: ord.date ? new Date(ord.date) : new Date(),
            ...(etatProduit !== null ? { etatProduit } : {}),
            ...(statutSellsy !== null ? { statutSellsy } : {}),
          },
          create: {
            contactId: kokpitContactId,
            sellsyInvoiceId: String(ord.id),
            montant: amount,
            dateVente: ord.date ? new Date(ord.date) : new Date(),
            etatProduit,
            statutSellsy,
          },
        });
        upserted++;
      } catch (e) {
        console.warn(`[deep-sync orders] ${ord.id}:`, (e as Error).message);
      }
    }

    offset += PAGE;
    if (offset >= total) {
      return { scanned, upserted, nextOffset: null, total };
    }
  }
  return { scanned, upserted, nextOffset: null, total };
}

async function syncEstimates(
  sinceStr: string,
  untilStr: string,
  startOffset: number,
  withEtat: boolean,
  startTs: number
): Promise<{ scanned: number; upserted: number; nextOffset: number | null; total: number }> {
  let offset = startOffset;
  let scanned = 0;
  let upserted = 0;
  let total = 0;

  while (true) {
    if (Date.now() - startTs > TIME_BUDGET_MS) {
      return { scanned, upserted, nextOffset: offset, total };
    }
    const res = await searchEstimates({
      filters: { date: { start: sinceStr, end: untilStr } },
      limit: PAGE,
      offset,
      embed: ["contact", "company"],
      order: "date",
      direction: "asc", // oldest first
    }).catch(() => null);
    if (!res) break;
    total = res.pagination?.total || total;
    const estimates = res.data || [];
    if (estimates.length === 0) break;

    const contactsBySellsyId = new Map<string, string>();
    const allRelatedIds = new Set<string>();
    for (const e of estimates) {
      for (const r of (e.related || [])) allRelatedIds.add(String(r.id));
      if (e.contact_id) allRelatedIds.add(String(e.contact_id));
    }
    if (allRelatedIds.size > 0) {
      const contacts = await prisma.contact.findMany({
        where: { sellsyContactId: { in: Array.from(allRelatedIds) } },
        select: { id: true, sellsyContactId: true },
      });
      for (const c of contacts) {
        if (c.sellsyContactId) {
          for (const sid of c.sellsyContactId.split(",")) {
            contactsBySellsyId.set(sid.trim(), c.id);
          }
        }
      }
    }

    for (const est of estimates) {
      scanned++;
      try {
        const relatedIds = (est.related || []).map((r: any) => String(r.id));
        const sellsyContactId =
          relatedIds.find((rid) => contactsBySellsyId.get(rid)) ||
          (est.contact_id ? String(est.contact_id) : null) ||
          relatedIds[0] || null;

        const kokpitContactId = await ensureContact(
          sellsyContactId,
          `sellsy-devis-${est.id}@placeholder.dimexoi.fr`,
          `Sellsy Devis ${est.number || est.id}`,
          "PROSPECT"
        );

        const { etatProduit, statutSellsy } = withEtat
          ? await fetchEtatProduit("estimate", String(est.id))
          : { etatProduit: null, statutSellsy: est.status || null };

        const amount = Number(
          est.amounts?.total_excl_tax ?? est.amounts?.total_raw_excl_tax ?? 0
        ) || 0;

        const finalStatutSellsy = statutSellsy || est.status || null;
        const dateDevisSellsy = est.date ? new Date(est.date) : null;
        await prisma.devis.upsert({
          where: { sellsyQuoteId: String(est.id) },
          update: {
            statut: mapEstimateStatus(est.status),
            ...(finalStatutSellsy !== null ? { statutSellsy: finalStatutSellsy } : {}),
            ...(etatProduit !== null ? { etatProduit } : {}),
            ...(dateDevisSellsy !== null ? { dateDevisSellsy } : {}),
            montant: amount,
            numero: est.number || undefined,
            dateEnvoi: est.status === "sent" ? new Date(est.date) : undefined,
          },
          create: {
            contactId: kokpitContactId,
            sellsyQuoteId: String(est.id),
            numero: est.number || null,
            montant: amount,
            statut: mapEstimateStatus(est.status),
            statutSellsy: finalStatutSellsy,
            etatProduit,
            dateDevisSellsy,
            dateEnvoi: est.status === "sent" ? new Date(est.date) : undefined,
          },
        });
        upserted++;
      } catch (e) {
        console.warn(`[deep-sync estimates] ${est.id}:`, (e as Error).message);
      }
    }

    offset += PAGE;
    if (offset >= total) {
      return { scanned, upserted, nextOffset: null, total };
    }
  }
  return { scanned, upserted, nextOffset: null, total };
}

async function runDeepSync(req: NextRequest) {
  // Auth
  const auth = req.headers.get("authorization");
  const ua = req.headers.get("user-agent") || "";
  const cronSecret = process.env.CRON_API_SECRET;
  const isVercelCron = ua.includes("vercel-cron");
  const isBearerOk = !!cronSecret && auth === `Bearer ${cronSecret}`;
  if (!isVercelCron && !isBearerOk) {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    const email = session?.user?.email;
    const allowed =
      email === "laurence.payet@dimexoi.fr" ||
      email === "admin@kokpit.re" ||
      ["ADMIN", "DIRECTION"].includes(role);
    if (!session?.user || !allowed) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  const url = new URL(req.url);
  const since = url.searchParams.get("since") || "2019-01-01";
  const until = url.searchParams.get("until") || new Date().toISOString().split("T")[0];
  const type = (url.searchParams.get("type") || "both") as "both" | "orders" | "estimates";
  const startOffset = parseInt(url.searchParams.get("startOffset") || "0", 10);
  const withEtat = url.searchParams.get("withEtat") !== "false";

  const startTs = Date.now();
  const result: any = { params: { since, until, type, startOffset, withEtat } };

  if (type === "orders" || type === "both") {
    result.orders = await syncOrders(since, until, type === "orders" ? startOffset : 0, withEtat, startTs);
  }
  if (type === "estimates" || type === "both") {
    result.estimates = await syncEstimates(since, until, type === "estimates" ? startOffset : 0, withEtat, startTs);
  }

  result.elapsedMs = Date.now() - startTs;
  result.partial =
    (result.orders?.nextOffset !== undefined && result.orders?.nextOffset !== null) ||
    (result.estimates?.nextOffset !== undefined && result.estimates?.nextOffset !== null);

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) { return runDeepSync(req); }
export async function GET(req: NextRequest) { return runDeepSync(req); }
