import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/user — Modifier le profil de l'utilisateur connecté
 * Champs modifiables : nom, prenom, telephone (pas email, pas role)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { nom, prenom } = body;

    if (!nom?.trim() || !prenom?.trim()) {
      return NextResponse.json({ error: "Nom et prénom obligatoires" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        nom: nom.trim(),
        prenom: prenom.trim(),
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("PATCH /api/user error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
