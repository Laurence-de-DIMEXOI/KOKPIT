import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PUT /api/planning/reorder — Déplacer un post (drag & drop)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { postId, newStatut, newPosition } = body;

    if (!postId || !newStatut || newPosition === undefined) {
      return NextResponse.json(
        { success: false, error: "postId, newStatut et newPosition requis" },
        { status: 400 }
      );
    }

    // Mettre à jour le post avec son nouveau statut et position
    const post = await prisma.postPlanning.update({
      where: { id: postId },
      data: {
        statut: newStatut,
        position: newPosition,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error("Erreur reorder planning:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
