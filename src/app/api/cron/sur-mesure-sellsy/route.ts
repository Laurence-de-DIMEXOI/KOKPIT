import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncProjetSellsy } from "@/lib/sur-mesure-sellsy";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Cron : rafraîchit automatiquement le montant Sellsy + statut de conversion
 * de tous les projets sur-mesure actifs ayant un numéro Sellsy.
 *
 * Lecture seule depuis la DB locale (Vente/Devis synchronisés par le cron sync-sellsy)
 * + LiaisonDevisCommande pour la conversion. Aucun appel à l'API Sellsy.
 *
 * Auth : UA vercel-cron OU Bearer CRON_API_SECRET.
 */
async function run(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const ua = req.headers.get("user-agent") || "";
  const cronSecret = process.env.CRON_API_SECRET;
  const isVercelCron = ua.includes("vercel-cron");
  const isBearerOk = !!cronSecret && auth === `Bearer ${cronSecret}`;
  if (!isVercelCron && !isBearerOk) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Tous les projets avec un n° Sellsy OU un Need Price lié (y compris Gagné/Perdu :
  // le montant final doit être capturé même une fois le projet gagné).
  const projets = await prisma.projetSurMesure.findMany({
    where: {
      deletedAt: null,
      OR: [{ numeroSellsy: { not: null } }, { needPriceId: { not: null } }],
    },
    select: { id: true },
  });

  let updated = 0;
  let gagnes = 0;
  let perdus = 0;

  for (const p of projets) {
    const r = await syncProjetSellsy(p.id);
    if (!r.ok) continue;
    if (r.statutApres !== r.statutAvant) {
      updated++;
      if (r.statutApres === "GAGNE") gagnes++;
      else if (r.statutApres === "PERDU") perdus++;
    } else if (r.montant != null) {
      updated++;
    }
  }

  return NextResponse.json({ success: true, scanned: projets.length, updated, gagnes, perdus });
}

export async function GET(req: NextRequest) { return run(req); }
export async function POST(req: NextRequest) { return run(req); }
