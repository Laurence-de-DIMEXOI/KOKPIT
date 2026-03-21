import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const JOURS_CP_ANNUEL = 25;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear + 1, 0, 1);
    const monthStart = new Date(currentYear, now.getMonth(), 1);
    const monthEnd = new Date(currentYear, now.getMonth() + 1, 1);

    // 1. Total conges count for current year (all statuses)
    const total = await prisma.conge.count({
      where: {
        dateDebut: { gte: yearStart, lt: yearEnd },
      },
    });

    // 2. Count by statut
    const statutGroups = await prisma.conge.groupBy({
      by: ["statut"],
      where: {
        dateDebut: { gte: yearStart, lt: yearEnd },
      },
      _count: { id: true },
    });

    const parStatut: Record<string, number> = {
      en_attente: 0,
      approuve: 0,
      modifie: 0,
      refuse: 0,
    };
    for (const group of statutGroups) {
      if (group.statut in parStatut) {
        parStatut[group.statut] = group._count.id;
      }
    }

    // 3. Total jours approved this month
    const congesApprouvesCeMois = await prisma.conge.findMany({
      where: {
        statut: "approuve",
        dateDebut: { gte: monthStart, lt: monthEnd },
      },
      select: { nbJours: true },
    });
    const joursApprouvesCeMois = congesApprouvesCeMois.reduce(
      (sum, c) => sum + c.nbJours,
      0
    );

    // 4. Per-user solde — tous les collaborateurs (même inactifs KOKPIT comme Georget)
    const allUsersForSoldes = await prisma.user.findMany({
      select: { id: true, nom: true, prenom: true, couleur: true },
      orderBy: { nom: "asc" },
    });

    const soldes = await Promise.all(
      allUsersForSoldes.map(async (user) => {
        const congesApprouves = await prisma.conge.findMany({
          where: {
            userId: user.id,
            statut: "approuve",
            dateDebut: { gte: yearStart, lt: yearEnd },
          },
          select: { nbJours: true },
        });

        const joursPris = congesApprouves.reduce(
          (sum, c) => sum + c.nbJours,
          0
        );

        return {
          userId: user.id,
          nom: user.nom,
          prenom: user.prenom,
          couleur: user.couleur,
          joursTotal: JOURS_CP_ANNUEL,
          joursPris,
          soldeRestant: JOURS_CP_ANNUEL - joursPris,
        };
      })
    );

    return NextResponse.json({
      total,
      parStatut,
      joursApprouvesCeMois,
      soldes,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des stats congés:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
