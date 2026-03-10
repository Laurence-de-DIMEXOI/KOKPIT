import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PUT /api/planning/[id] — Mettre à jour un post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, statut, position, labels, dueDate, coverImage } = body;

    const updateData: any = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (statut !== undefined) updateData.statut = statut;
    if (position !== undefined) updateData.position = position;
    if (labels !== undefined) updateData.labels = labels;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (coverImage !== undefined) updateData.coverImage = coverImage || null;

    const post = await prisma.postPlanning.update({
      where: { id },
      data: updateData,
      include: {
        checklist: { orderBy: { position: "asc" } },
        attachments: { orderBy: { createdAt: "desc" } },
        createdBy: { select: { id: true, nom: true, prenom: true } },
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error("Erreur PUT planning:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/planning/[id] — Supprimer un post
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.postPlanning.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur DELETE planning:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
