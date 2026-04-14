import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/marketing/operations/[id]/duplicate — duplique l'op
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const original = await prisma.operationMarketing.findUnique({ where: { id } });

  if (!original) {
    return NextResponse.json({ error: "Opération introuvable" }, { status: 404 });
  }

  const duplicate = await prisma.operationMarketing.create({
    data: {
      date: new Date(),
      titre: `${original.titre} (copie)`,
      type: original.type,
      description: original.description,
      canalId: original.canalId,
      notes: original.notes,
      statut: "BROUILLON",
      createdBy: session.user.id,
    },
    include: { canal: true, fichiers: true },
  });

  return NextResponse.json({ operation: duplicate }, { status: 201 });
}
