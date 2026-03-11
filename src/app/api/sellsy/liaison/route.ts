import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — Créer une liaison devis → commande
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { estimateId, orderId } = await request.json();

    if (!estimateId || !orderId) {
      return NextResponse.json(
        { error: "estimateId et orderId sont requis" },
        { status: 400 }
      );
    }

    const liaison = await prisma.liaisonDevisCommande.create({
      data: {
        estimateId: Number(estimateId),
        orderId: Number(orderId),
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ liaison }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Cette liaison existe déjà" },
        { status: 409 }
      );
    }
    console.error("POST /api/sellsy/liaison error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE — Supprimer une liaison
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { estimateId, orderId } = await request.json();

    if (!estimateId || !orderId) {
      return NextResponse.json(
        { error: "estimateId et orderId sont requis" },
        { status: 400 }
      );
    }

    await prisma.liaisonDevisCommande.delete({
      where: {
        estimateId_orderId: {
          estimateId: Number(estimateId),
          orderId: Number(orderId),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/sellsy/liaison error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
