import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET /api/marketing/operations — liste filtrable
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const periode = sp.get("periode") || "ce_mois";
  const types = sp.getAll("type");
  const canalIds = sp.getAll("canalId");
  const statuts = sp.getAll("statut");
  const search = sp.get("search")?.trim();

  // Calcul des dates selon la période
  const now = new Date();
  let dateDebut: Date;
  let dateFin: Date;

  switch (periode) {
    case "mois_dernier": {
      dateDebut = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      dateFin = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    }
    case "mois": {
      const mois = sp.get("mois"); // YYYY-MM
      if (mois) {
        const [y, m] = mois.split("-").map(Number);
        dateDebut = new Date(y, m - 1, 1);
        dateFin = new Date(y, m, 0, 23, 59, 59);
      } else {
        dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFin = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      }
      break;
    }
    case "custom": {
      dateDebut = sp.get("dateDebut") ? new Date(sp.get("dateDebut")!) : new Date(now.getFullYear(), now.getMonth(), 1);
      dateFin = sp.get("dateFin") ? new Date(sp.get("dateFin")!) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      dateFin.setHours(23, 59, 59);
      break;
    }
    default: {
      // ce_mois
      dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFin = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }
  }

  const where: Prisma.OperationMarketingWhereInput = {
    date: { gte: dateDebut, lte: dateFin },
    ...(types.length > 0 && { type: { in: types as any[] } }),
    ...(canalIds.length > 0 && { canalId: { in: canalIds } }),
    ...(statuts.length > 0 && { statut: { in: statuts as any[] } }),
    ...(search && {
      OR: [
        { titre: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const operations = await prisma.operationMarketing.findMany({
    where,
    include: {
      canal: true,
      fichiers: { orderBy: { ordre: "asc" }, take: 1 },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ operations });
}

// POST /api/marketing/operations — création
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { date, titre, type, description, canalId, notes, statut } = body;

  if (!date || !titre?.trim() || !type) {
    return NextResponse.json(
      { error: "date, titre et type sont requis" },
      { status: 400 }
    );
  }

  const operation = await prisma.operationMarketing.create({
    data: {
      date: new Date(date),
      titre: titre.trim(),
      type,
      description: description || null,
      canalId: canalId || null,
      notes: notes || null,
      statut: statut || "PLANIFIE",
      createdBy: session.user.id,
    },
    include: { canal: true, fichiers: true },
  });

  return NextResponse.json({ operation }, { status: 201 });
}
