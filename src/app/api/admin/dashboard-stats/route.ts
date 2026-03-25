import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    effectifTotal,
    congesAujourdhui,
    demandesEnAttente,
    pointagesAujourdhui,
    usersActifs,
    prochainsConges,
  ] = await Promise.all([
    // Effectif total
    prisma.user.count({ where: { actif: true } }),

    // En congé aujourd'hui
    prisma.conge.findMany({
      where: {
        statut: "VALIDE",
        dateDebut: { lte: tomorrow },
        dateFin: { gte: today },
      },
      include: { user: { select: { nom: true, prenom: true } } },
    }),

    // Demandes en attente
    prisma.conge.count({ where: { statut: "EN_ATTENTE" } }),

    // Pointages aujourd'hui
    prisma.pointage.count({
      where: { date: today },
    }),

    // Users actifs avec pointage
    prisma.user.count({ where: { actif: true, pointageActif: true } }),

    // Prochains congés (validés, à venir)
    prisma.conge.findMany({
      where: {
        statut: "VALIDE",
        dateDebut: { gte: today },
      },
      include: { user: { select: { nom: true, prenom: true } } },
      orderBy: { dateDebut: "asc" },
      take: 6,
    }),
  ]);

  return NextResponse.json({
    effectifTotal,
    enCongeAujourdhui: {
      count: congesAujourdhui.length,
      noms: congesAujourdhui.map((c) => `${c.user.prenom} ${c.user.nom}`),
    },
    demandesEnAttente,
    pointagesAujourdhui: {
      count: pointagesAujourdhui,
      total: usersActifs,
    },
    prochainsConges: prochainsConges.map((c) => ({
      id: c.id,
      nom: c.user.nom,
      prenom: c.user.prenom,
      dateDebut: c.dateDebut.toISOString(),
      dateFin: c.dateFin.toISOString(),
      type: c.type,
    })),
  });
}
