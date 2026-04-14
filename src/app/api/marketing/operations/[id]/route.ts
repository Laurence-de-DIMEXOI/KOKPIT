import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromStorage } from "@/lib/supabase";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/marketing/operations/[id] — détail
export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const operation = await prisma.operationMarketing.findUnique({
    where: { id },
    include: {
      canal: true,
      fichiers: { orderBy: { ordre: "asc" } },
    },
  });

  if (!operation) {
    return NextResponse.json({ error: "Opération introuvable" }, { status: 404 });
  }

  return NextResponse.json({ operation });
}

// PATCH /api/marketing/operations/[id] — update
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { date, titre, type, description, canalId, notes, statut } = body;

  const operation = await prisma.operationMarketing.update({
    where: { id },
    data: {
      ...(date !== undefined && { date: new Date(date) }),
      ...(titre !== undefined && { titre: titre.trim() }),
      ...(type !== undefined && { type }),
      ...(description !== undefined && { description: description || null }),
      ...(canalId !== undefined && { canalId: canalId || null }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(statut !== undefined && { statut }),
    },
    include: { canal: true, fichiers: { orderBy: { ordre: "asc" } } },
  });

  return NextResponse.json({ operation });
}

// DELETE /api/marketing/operations/[id] — suppression
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  // Supprimer les fichiers du storage
  const fichiers = await prisma.operationFichier.findMany({
    where: { operationId: id },
  });
  for (const f of fichiers) {
    await deleteFromStorage("op-marketing", f.storagePath).catch(() => {});
  }

  // Cascade : supprime aussi les OperationFichier
  await prisma.operationMarketing.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
