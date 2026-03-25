import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Return single NeedPrice by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const needPrice = await prisma.needPrice.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { nom: true, prenom: true },
        },
      },
    });

    if (!needPrice) {
      return NextResponse.json(
        { error: "Demande de prix non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(needPrice);
  } catch (error) {
    console.error("Erreur lors de la récupération du NeedPrice:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PUT - Update NeedPrice by id (ACHAT or ADMIN only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    if (!["ACHAT", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Accès réservé aux rôles ACHAT ou ADMIN" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await prisma.needPrice.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Demande de prix non trouvée" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { statut, prixFournisseur, notes, refDevis } = body;

    const data: any = {};
    if (statut !== undefined) data.statut = statut;
    if (prixFournisseur !== undefined) data.prixFournisseur = prixFournisseur;
    if (notes !== undefined) data.notes = notes;
    if (refDevis !== undefined) data.refDevis = refDevis;

    const updated = await prisma.needPrice.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: { nom: true, prenom: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du NeedPrice:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
