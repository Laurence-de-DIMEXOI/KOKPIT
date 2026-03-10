import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/planning/[id]/checklist — Ajouter un item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: postId } = await params;
    const body = await request.json();
    const { text } = body;

    if (!text?.trim()) {
      return NextResponse.json(
        { success: false, error: "Le texte est requis" },
        { status: 400 }
      );
    }

    const maxPos = await prisma.postChecklist.aggregate({
      where: { postId },
      _max: { position: true },
    });

    const item = await prisma.postChecklist.create({
      data: {
        postId,
        text: text.trim(),
        position: (maxPos._max.position || 0) + 1,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error("Erreur POST checklist:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/planning/[id]/checklist — Mettre à jour un item (toggle checked ou edit text)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await params; // consume params
    const body = await request.json();
    const { itemId, text, checked } = body;

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: "itemId requis" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (text !== undefined) updateData.text = text.trim();
    if (checked !== undefined) updateData.checked = checked;

    const item = await prisma.postChecklist.update({
      where: { id: itemId },
      data: updateData,
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error("Erreur PUT checklist:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/planning/[id]/checklist — Supprimer un item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: "itemId requis" },
        { status: 400 }
      );
    }

    await prisma.postChecklist.delete({ where: { id: itemId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur DELETE checklist:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
