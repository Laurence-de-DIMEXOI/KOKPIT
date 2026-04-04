import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/commercial/rendez-vous
 * Liste paginée des RDV avec filtres statut et période.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statut = searchParams.get("statut"); // CONFIRME | HONORE | ANNULE
  const periode = searchParams.get("periode"); // semaine | mois | mois_dernier | tout
  const search = searchParams.get("search") || "";

  // Filtre période
  const now = new Date();
  let dateFrom: Date | undefined;
  let dateTo: Date | undefined;

  switch (periode) {
    case "semaine": {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay() + 1); // Lundi
      d.setHours(0, 0, 0, 0);
      dateFrom = d;
      const end = new Date(d);
      end.setDate(end.getDate() + 7);
      dateTo = end;
      break;
    }
    case "mois": {
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    }
    case "mois_dernier": {
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      dateTo = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    }
    default:
      // tout
      break;
  }

  const where: Record<string, unknown> = {};
  if (statut) where.statut = statut;
  if (dateFrom && dateTo) {
    where.dateDebut = { gte: dateFrom, lt: dateTo };
  }

  // Recherche par nom/email contact
  if (search) {
    where.contact = {
      OR: [
        { nom: { contains: search, mode: "insensitive" } },
        { prenom: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const rdvs = await prisma.rendezVous.findMany({
    where,
    include: {
      contact: {
        select: { id: true, nom: true, prenom: true, email: true },
      },
    },
    orderBy: { dateDebut: "desc" },
    take: 100,
  });

  return NextResponse.json({ rdvs });
}
