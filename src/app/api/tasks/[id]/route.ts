import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  titre: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  echeance: z.string().datetime().optional().nullable(),
  statut: z.enum(["A_FAIRE", "EN_COURS", "TERMINEE"]).optional(),
  contactId: z.string().optional().nullable(),
  assigneAId: z.string().optional(),
});

// PUT /api/tasks/[id] — Mettre à jour une tâche
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (data.titre !== undefined) updateData.titre = data.titre;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.statut !== undefined) updateData.statut = data.statut;
    if (data.assigneAId !== undefined) updateData.assigneAId = data.assigneAId;
    if (data.contactId !== undefined) updateData.contactId = data.contactId;
    if (data.echeance !== undefined) {
      updateData.echeance = data.echeance ? new Date(data.echeance) : null;
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        contact: { select: { id: true, nom: true, prenom: true, email: true } },
        assigneA: { select: { id: true, nom: true, prenom: true } },
        createdBy: { select: { id: true, nom: true, prenom: true } },
      },
    });

    return NextResponse.json(task);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("PUT /api/tasks/[id] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] — Supprimer une tâche
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("DELETE /api/tasks/[id] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
