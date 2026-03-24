import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/sav/[id]
 * Detail d'un dossier SAV avec toutes les relations.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const dossier = await prisma.dossierSAV.findFirst({
      where: { id, deletedAt: null },
      include: {
        documents: {
          include: {
            ajoute: { select: { nom: true, prenom: true } },
          },
        },
        commentaires: {
          include: {
            auteur: { select: { nom: true, prenom: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        assigne: { select: { id: true, nom: true, prenom: true } },
        creeParUser: { select: { id: true, nom: true, prenom: true } },
        contact: true,
      },
    });

    if (!dossier) {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    }

    return NextResponse.json(dossier);
  } catch (error: any) {
    console.error("[SAV] Erreur GET detail:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la recuperation du dossier" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sav/[id]
 * Met a jour un dossier SAV.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { titre, type, statut, description, assigneId, contactId, contactNom, sellsyBdcId, sellsyBdcRef } = body;

    const existing = await prisma.dossierSAV.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    }

    const dossier = await prisma.dossierSAV.update({
      where: { id },
      data: {
        ...(titre !== undefined && { titre }),
        ...(type !== undefined && { type }),
        ...(statut !== undefined && { statut }),
        ...(description !== undefined && { description }),
        ...(assigneId !== undefined && { assigneId }),
        ...(contactId !== undefined && { contactId }),
        ...(contactNom !== undefined && { contactNom }),
        ...(sellsyBdcId !== undefined && { sellsyBdcId }),
        ...(sellsyBdcRef !== undefined && { sellsyBdcRef }),
      },
      include: {
        assigne: { select: { nom: true, prenom: true } },
        creeParUser: { select: { nom: true, prenom: true } },
      },
    });

    return NextResponse.json(dossier);
  } catch (error: any) {
    console.error("[SAV] Erreur PUT:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la mise a jour du dossier" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sav/[id]
 * Soft delete d'un dossier SAV (ADMIN uniquement).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  if (userRole !== "ADMIN") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const existing = await prisma.dossierSAV.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    }

    await prisma.dossierSAV.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[SAV] Erreur DELETE:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la suppression du dossier" },
      { status: 500 }
    );
  }
}
