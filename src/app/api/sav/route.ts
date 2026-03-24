import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { genererNumeroDossier } from "@/lib/sav-numero";

/**
 * GET /api/sav
 * Liste les dossiers SAV avec filtres, pagination et KPIs.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search") || "";
    const statut = searchParams.get("statut") || "";
    const type = searchParams.get("type") || "";
    const assigneId = searchParams.get("assigneId") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const showCloture = searchParams.get("showCloture") === "true";

    const where: any = { deletedAt: null };

    // Hide CLOTURE by default
    if (!showCloture) {
      if (statut) {
        where.statut = statut;
      } else {
        where.statut = { not: "CLOTURE" };
      }
    } else if (statut) {
      where.statut = statut;
    }

    if (type) {
      where.type = type;
    }

    if (assigneId) {
      where.assigneId = assigneId;
    }

    const contactIdParam = searchParams.get("contactId") || "";
    if (contactIdParam) {
      where.contactId = contactIdParam;
    }

    if (search) {
      where.OR = [
        { numero: { contains: search, mode: "insensitive" } },
        { titre: { contains: search, mode: "insensitive" } },
        { contactNom: { contains: search, mode: "insensitive" } },
        { sellsyBdcRef: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [dossiers, total] = await Promise.all([
      prisma.dossierSAV.findMany({
        where,
        include: {
          assigne: { select: { nom: true, prenom: true } },
          creeParUser: { select: { nom: true, prenom: true } },
          _count: { select: { documents: true, commentaires: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.dossierSAV.count({ where }),
    ]);

    // KPIs (always on non-deleted dossiers, ignoring filters)
    const kpiBase = { deletedAt: null };
    const [kpiTotal, aTraiter, enCours, traites] = await Promise.all([
      prisma.dossierSAV.count({ where: kpiBase }),
      prisma.dossierSAV.count({ where: { ...kpiBase, statut: "A_TRAITER" } }),
      prisma.dossierSAV.count({ where: { ...kpiBase, statut: "EN_COURS" } }),
      prisma.dossierSAV.count({ where: { ...kpiBase, statut: "CLOTURE" } }),
    ]);

    return NextResponse.json({
      dossiers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      kpis: {
        total: kpiTotal,
        aTraiter,
        enCours,
        traites,
      },
    });
  } catch (error: any) {
    console.error("[SAV] Erreur GET:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la recuperation des dossiers" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sav
 * Cree un nouveau dossier SAV.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const userId = (session.user as any).id;
    const body = await req.json();
    const { titre, type, description, contactId, sellsyBdcId, sellsyBdcRef, contactNom, assigneId } = body;

    if (!titre || !type) {
      return NextResponse.json(
        { error: "Le titre et le type sont requis" },
        { status: 400 }
      );
    }

    const numero = await genererNumeroDossier();

    const dossier = await prisma.dossierSAV.create({
      data: {
        numero,
        titre,
        type,
        description,
        contactId,
        sellsyBdcId,
        sellsyBdcRef,
        contactNom,
        assigneId,
        creePar: userId,
      },
      include: {
        assigne: { select: { nom: true, prenom: true } },
        creeParUser: { select: { nom: true, prenom: true } },
      },
    });

    return NextResponse.json(dossier, { status: 201 });
  } catch (error: any) {
    console.error("[SAV] Erreur POST:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la creation du dossier" },
      { status: 500 }
    );
  }
}
