import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/sav/[id]/commentaires/[cId]
 * Supprime un commentaire (uniquement par son auteur).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const { id, cId } = await params;
    const userId = (session.user as any).id;

    const commentaire = await prisma.commentaireSAV.findFirst({
      where: { id: cId, dossierId: id },
    });

    if (!commentaire) {
      return NextResponse.json(
        { error: "Commentaire introuvable dans ce dossier" },
        { status: 404 }
      );
    }

    if (commentaire.auteurId !== userId) {
      return NextResponse.json(
        { error: "Vous ne pouvez supprimer que vos propres commentaires" },
        { status: 403 }
      );
    }

    await prisma.commentaireSAV.delete({
      where: { id: cId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[SAV] Erreur DELETE commentaire:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la suppression du commentaire" },
      { status: 500 }
    );
  }
}
