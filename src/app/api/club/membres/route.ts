import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/club/membres
 *
 * Liste paginée des membres Club Grandis.
 * Query params : ?niveau=1&search=nom&page=1&limit=20
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const niveau = searchParams.get("niveau");
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const skip = (page - 1) * limit;

  // Construction du filtre — exclure les membres retirés
  const where: Record<string, unknown> = { exclu: false };

  if (niveau) {
    const niv = parseInt(niveau, 10);
    if (!isNaN(niv) && niv >= 1 && niv <= 5) {
      where.niveau = niv;
    }
  }

  if (search.trim()) {
    where.OR = [
      { nom: { contains: search, mode: "insensitive" } },
      { prenom: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [membres, total] = await Promise.all([
      prisma.clubMembre.findMany({
        where: where as any,
        orderBy: [{ niveau: "desc" }, { totalMontant: "desc" }],
        skip,
        take: limit,
      }),
      prisma.clubMembre.count({ where: where as any }),
    ]);

    return NextResponse.json({
      membres,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("[Club Membres] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors du chargement" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/club/membres?id=xxx
 *
 * Retire un membre du Club Grandis (soft-delete : exclu=true).
 * Le membre ne sera pas recréé lors du prochain sync.
 */
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  try {
    const membre = await prisma.clubMembre.findUnique({ where: { id } });
    if (!membre) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    await prisma.clubMembre.update({
      where: { id },
      data: { exclu: true },
    });

    console.log(`[Club] Membre exclu : ${membre.prenom} ${membre.nom} (niv ${membre.niveau})`);

    return NextResponse.json({
      success: true,
      deleted: { id: membre.id, nom: membre.nom, prenom: membre.prenom },
    });
  } catch (error: any) {
    console.error("[Club Membres] Erreur suppression:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
