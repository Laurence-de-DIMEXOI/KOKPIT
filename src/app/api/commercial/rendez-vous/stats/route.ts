import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/commercial/rendez-vous/stats
 * KPIs dashboard RDV : à venir, honorés, annulés, taux RDV→Vente.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
  const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [aVenir, honoresMois, annulesMois, totalHonores] = await Promise.all([
    // RDV confirmés à venir
    prisma.rendezVous.count({
      where: { statut: "CONFIRME", dateDebut: { gt: now } },
    }),
    // Honorés ce mois
    prisma.rendezVous.count({
      where: {
        statut: "HONORE",
        dateDebut: { gte: debutMois, lt: finMois },
      },
    }),
    // Annulés ce mois
    prisma.rendezVous.count({
      where: {
        statut: "ANNULE",
        dateDebut: { gte: debutMois, lt: finMois },
      },
    }),
    // Total honorés (pour taux RDV→Vente)
    prisma.rendezVous.findMany({
      where: { statut: "HONORE" },
      select: { contactId: true, dateDebut: true },
    }),
  ]);

  // Taux RDV→Vente : parmi les RDV honorés, combien ont un BDC/Vente après le RDV ?
  let tauxRdvVente = 0;
  if (totalHonores.length > 0) {
    let conversions = 0;
    for (const rdv of totalHonores) {
      const venteApres = await prisma.vente.findFirst({
        where: {
          contactId: rdv.contactId,
          createdAt: { gte: rdv.dateDebut },
        },
      });
      if (venteApres) conversions++;
    }
    tauxRdvVente = Math.round((conversions / totalHonores.length) * 100);
  }

  return NextResponse.json({
    aVenir,
    honoresMois,
    annulesMois,
    tauxRdvVente,
  });
}
