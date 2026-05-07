import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sellsyFetch } from "@/lib/sellsy";

export const maxDuration = 900; // 15 min (Vercel Pro)

/**
 * POST /api/admin/refresh-etat-produit?since=YYYY-MM-DD&onlyMissing=true&type=both|orders|estimates&limit=200
 *
 * Backfill du champ perso "Etat des produit" + statut Sellsy brut sur Vente et Devis.
 *
 * Pour chaque BDC/Devis Sellsy de la période, on appelle GET /orders/{id}/custom-fields
 * (ou /estimates/{id}/custom-fields) puis on extrait :
 *   - Le champ dont nom contient "etat" + "produit" (insensible casse/accent)
 *   - La valeur résolue en label si c'est un select/radio
 * + on stocke le statut brut Sellsy via /orders/{id} ou /estimates/{id} si pas déjà connu.
 *
 * Auth : ADMIN / DIRECTION / Laurence / CRON_API_SECRET (Bearer)
 */

interface CustomFieldOnDoc {
  id?: number;
  cf_id?: number;
  code?: string;
  name?: string;
  label?: string;
  value?: unknown;
  parameters?: { items?: Array<{ id: number | string; label: string }> };
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function isEtatProduit(cf: CustomFieldOnDoc): boolean {
  const fields = [cf.code, cf.name, cf.label].filter(Boolean) as string[];
  return fields.some((v) => {
    const n = normalize(v);
    return n.includes("etat") && n.includes("produit");
  });
}

function readValueLabel(cf: CustomFieldOnDoc): string | null {
  if (cf.value == null || cf.value === "") return null;
  if (typeof cf.value === "string" || typeof cf.value === "number" || typeof cf.value === "boolean") {
    const raw = String(cf.value).trim();
    const items = cf.parameters?.items || [];
    const matched = items.find((it) => String(it.id) === raw);
    return matched?.label || raw;
  }
  return JSON.stringify(cf.value);
}

async function fetchEtatAndStatus(
  type: "order" | "estimate",
  sellsyId: string
): Promise<{ etatProduit: string | null; statutSellsy: string | null }> {
  const path = type === "order" ? `/orders/${sellsyId}` : `/estimates/${sellsyId}`;
  const cfPath = `${path}/custom-fields?limit=100`;

  const [docRes, cfRes] = await Promise.all([
    sellsyFetch<{ data: any }>(path).catch(() => ({ data: null })),
    sellsyFetch<{ data: CustomFieldOnDoc[] }>(cfPath).catch(() => ({ data: [] })),
  ]);

  const statutSellsy = (docRes.data?.status as string | undefined) || null;
  const cfList = cfRes.data || [];
  const target = cfList.find(isEtatProduit);
  const etatProduit = target ? readValueLabel(target) : null;

  return { etatProduit, statutSellsy };
}

async function runRefresh(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_API_SECRET;
  const isCron = !!cronSecret && auth === `Bearer ${cronSecret}`;
  if (!isCron) {
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
  const since = url.searchParams.get("since"); // YYYY-MM-DD
  const onlyMissing = url.searchParams.get("onlyMissing") !== "false";
  const type = (url.searchParams.get("type") || "both") as "both" | "orders" | "estimates";
  const limit = Math.min(2000, Math.max(1, parseInt(url.searchParams.get("limit") || "300", 10)));
  const PARALLEL = 8; // Sellsy rate-limit safe

  const stats = {
    orders: { scanned: 0, updated: 0, errors: 0 },
    estimates: { scanned: 0, updated: 0, errors: 0 },
  };

  // ======= BDC =======
  if (type === "both" || type === "orders") {
    const where: any = { sellsyInvoiceId: { not: null } };
    if (onlyMissing) where.etatProduit = null;
    if (since) where.dateVente = { gte: new Date(since) };

    const ventes = await prisma.vente.findMany({
      where,
      select: { id: true, sellsyInvoiceId: true },
      orderBy: { dateVente: "desc" },
      take: limit,
    });

    for (let i = 0; i < ventes.length; i += PARALLEL) {
      const slice = ventes.slice(i, i + PARALLEL);
      await Promise.all(
        slice.map(async (v) => {
          if (!v.sellsyInvoiceId) return;
          stats.orders.scanned++;
          try {
            const { etatProduit, statutSellsy } = await fetchEtatAndStatus("order", v.sellsyInvoiceId);
            await prisma.vente.update({
              where: { id: v.id },
              data: { etatProduit, statutSellsy },
            });
            if (etatProduit || statutSellsy) stats.orders.updated++;
          } catch (e) {
            stats.orders.errors++;
            console.warn(`[refresh-etat] BDC ${v.sellsyInvoiceId}:`, (e as Error).message);
          }
        })
      );
    }
  }

  // ======= DEVIS =======
  if (type === "both" || type === "estimates") {
    const where: any = { sellsyQuoteId: { not: null } };
    if (onlyMissing) where.etatProduit = null;
    if (since) where.createdAt = { gte: new Date(since) };

    const devis = await prisma.devis.findMany({
      where,
      select: { id: true, sellsyQuoteId: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    for (let i = 0; i < devis.length; i += PARALLEL) {
      const slice = devis.slice(i, i + PARALLEL);
      await Promise.all(
        slice.map(async (d) => {
          if (!d.sellsyQuoteId) return;
          stats.estimates.scanned++;
          try {
            const { etatProduit, statutSellsy } = await fetchEtatAndStatus("estimate", d.sellsyQuoteId);
            await prisma.devis.update({
              where: { id: d.id },
              data: { etatProduit, statutSellsy },
            });
            if (etatProduit || statutSellsy) stats.estimates.updated++;
          } catch (e) {
            stats.estimates.errors++;
            console.warn(`[refresh-etat] Devis ${d.sellsyQuoteId}:`, (e as Error).message);
          }
        })
      );
    }
  }

  return NextResponse.json({
    success: true,
    params: { since, onlyMissing, type, limit },
    ...stats,
  });
}

// POST manuel + GET pour Vercel cron
export async function POST(req: NextRequest) {
  return runRefresh(req);
}
export async function GET(req: NextRequest) {
  return runRefresh(req);
}
