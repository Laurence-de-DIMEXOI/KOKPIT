import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/sav/[id]/commentaires
 * Ajoute un commentaire a un dossier SAV.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const userId = (session.user as any).id;
    const body = await req.json();
    const { contenu } = body;

    if (!contenu) {
      return NextResponse.json(
        { error: "Le contenu est requis" },
        { status: 400 }
      );
    }

    // Verify dossier exists
    const dossier = await prisma.dossierSAV.findFirst({
      where: { id, deletedAt: null },
    });

    if (!dossier) {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    }

    const commentaire = await prisma.commentaireSAV.create({
      data: {
        dossierId: id,
        contenu,
        auteurId: userId,
      },
      include: {
        auteur: { select: { nom: true, prenom: true } },
      },
    });

    return NextResponse.json(commentaire, { status: 201 });
  } catch (error: any) {
    console.error("[SAV] Erreur POST commentaire:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'ajout du commentaire" },
      { status: 500 }
    );
  }
}
