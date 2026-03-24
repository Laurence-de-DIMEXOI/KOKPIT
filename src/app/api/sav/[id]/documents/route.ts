import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/sav/[id]/documents
 * Ajoute un document a un dossier SAV.
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
    const { nom, type, url, contenu, taille } = body;

    if (!nom || !type) {
      return NextResponse.json(
        { error: "Le nom et le type sont requis" },
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

    const document = await prisma.documentSAV.create({
      data: {
        dossierId: id,
        nom,
        type,
        url,
        contenu,
        taille,
        ajoutePar: userId,
      },
      include: {
        ajoute: { select: { nom: true, prenom: true } },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    console.error("[SAV] Erreur POST document:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'ajout du document" },
      { status: 500 }
    );
  }
}
