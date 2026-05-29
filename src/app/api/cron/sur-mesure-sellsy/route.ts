import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  const STATUTS_ACTIFS = [
    "DEMANDE", "DESSIN_DEMANDE", "RDV_CLIENT", "DESSIN_EN_COURS",
    "PLANS_PRETS", "NEED_PRICE", "PRIX_RECU", "PRESENTE_CLIENT",
  ];

  const projets = await prisma.projetSurMesure.findMany({
    where: {
      deletedAt: null,
      numeroSellsy: { not: null },
      statut: { in: STATUTS_ACTIFS as never },
    },
    select: { id: true, numeroSellsy: true },
  });

  let updated = 0;
  let introuvables = 0;

  for (const p of projets) {
    const numero = (p.numeroSellsy || "").toUpperCase().trim();
    let montant: number | null = null;
    let statutConversion: string | null = null;
    let typeSellsy: "DEVIS" | "BON_COMMANDE" | null = null;

    if (numero.startsWith("BCDI")) {
      typeSellsy = "BON_COMMANDE";
      const vente = await prisma.vente.findFirst({
        where: { numero: { equals: p.numeroSellsy!, mode: "insensitive" } },
        select: { montant: true },
      });
      if (vente) { montant = vente.montant; statutConversion = "converti"; }
    } else if (numero.startsWith("DEPI")) {
      typeSellsy = "DEVIS";
      const devis = await prisma.devis.findFirst({
        where: { numero: { equals: p.numeroSellsy!, mode: "insensitive" } },
        select: { montant: true, sellsyQuoteId: true },
      });
      if (devis) {
        montant = devis.montant;
        if (devis.sellsyQuoteId) {
          const liaison = await prisma.liaisonDevisCommande.findFirst({
            where: { estimateId: Number(devis.sellsyQuoteId) },
          });
          statutConversion = liaison ? "converti" : "non_converti";
        } else {
          statutConversion = "non_converti";
        }
      }
    }

    if (montant === null) { introuvables++; continue; }

    await prisma.projetSurMesure.update({
      where: { id: p.id },
      data: { montantSellsy: montant, statutConversion, typeSellsy, montantSyncedAt: new Date() },
    });
    updated++;
  }

  return NextResponse.json({
    success: true,
    scanned: projets.length,
    updated,
    introuvables,
  });
}

export async function GET(req: NextRequest) { return run(req); }
export async function POST(req: NextRequest) { return run(req); }
