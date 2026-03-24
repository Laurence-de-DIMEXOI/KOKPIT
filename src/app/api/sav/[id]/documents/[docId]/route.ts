import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/sav/[id]/documents/[docId]
 * Supprime un document d'un dossier SAV.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const { id, docId } = await params;

    // Verify document belongs to this dossier
    const document = await prisma.documentSAV.findFirst({
      where: { id: docId, dossierId: id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document introuvable dans ce dossier" },
        { status: 404 }
      );
    }

    await prisma.documentSAV.delete({
      where: { id: docId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[SAV] Erreur DELETE document:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la suppression du document" },
      { status: 500 }
    );
  }
}
