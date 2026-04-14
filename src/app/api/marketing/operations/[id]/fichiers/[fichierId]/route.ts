import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromStorage, getSignedUrl } from "@/lib/supabase";

type Ctx = { params: Promise<{ id: string; fichierId: string }> };

// GET /api/marketing/operations/[id]/fichiers/[fichierId] — signed URL
export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { fichierId } = await params;
  const fichier = await prisma.operationFichier.findUnique({
    where: { id: fichierId },
  });

  if (!fichier) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  const url = await getSignedUrl("op-marketing", fichier.storagePath, 3600);

  return NextResponse.json({ url, fichier });
}

// DELETE /api/marketing/operations/[id]/fichiers/[fichierId] — supprime fichier
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { fichierId } = await params;
  const fichier = await prisma.operationFichier.findUnique({
    where: { id: fichierId },
  });

  if (!fichier) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  await deleteFromStorage("op-marketing", fichier.storagePath).catch(() => {});
  await prisma.operationFichier.delete({ where: { id: fichierId } });

  return NextResponse.json({ success: true });
}
