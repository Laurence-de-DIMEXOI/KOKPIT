import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

// POST — enregistrer les métadonnées d'un fichier uploadé directement vers Supabase
export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const op = await prisma.operationMarketing.findUnique({ where: { id } });
  if (!op) {
    return NextResponse.json({ error: "Opération introuvable" }, { status: 404 });
  }

  const { nom, storagePath, mimeType, taille } = await req.json();

  if (!nom || !storagePath || !mimeType) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  // Ordre max actuel
  const maxOrdre = await prisma.operationFichier.aggregate({
    where: { operationId: id },
    _max: { ordre: true },
  });
  const ordre = (maxOrdre._max.ordre ?? -1) + 1;

  const fichierType = mimeType === "application/pdf"
    ? "PDF"
    : mimeType.startsWith("image/")
      ? "CAPTURE"
      : "AUTRE";

  const fichier = await prisma.operationFichier.create({
    data: {
      operationId: id,
      nom,
      storagePath,
      mimeType,
      taille: taille || 0,
      type: fichierType,
      ordre,
    },
  });

  return NextResponse.json({ fichier }, { status: 201 });
}
