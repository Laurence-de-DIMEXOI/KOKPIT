import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/planning — Tous les posts du kanban
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const posts = await prisma.postPlanning.findMany({
      include: {
        checklist: { orderBy: { position: "asc" } },
        attachments: { orderBy: { createdAt: "desc" } },
        createdBy: { select: { id: true, nom: true, prenom: true } },
      },
      orderBy: [{ statut: "asc" }, { position: "asc" }],
    });

    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    console.error("Erreur GET planning:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/planning — Créer un nouveau post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, statut, labels, dueDate, coverImage } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: "Le titre est requis" },
        { status: 400 }
      );
    }

    // Position = max position dans la colonne + 1000
    const maxPos = await prisma.postPlanning.aggregate({
      where: { statut: statut || "IDEE" },
      _max: { position: true },
    });
    const position = (maxPos._max.position || 0) + 1000;

    const post = await prisma.postPlanning.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        statut: statut || "IDEE",
        position,
        labels: labels || [],
        dueDate: dueDate ? new Date(dueDate) : null,
        coverImage: coverImage || null,
        createdById: session.user.id,
      },
      include: {
        checklist: true,
        attachments: true,
        createdBy: { select: { id: true, nom: true, prenom: true } },
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error("Erreur POST planning:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
