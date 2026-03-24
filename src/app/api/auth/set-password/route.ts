import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/set-password
 * Définit le mot de passe via un token d'invitation.
 * Body: { token, password }
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, password } = body;

  if (!token || !password) {
    return NextResponse.json({ error: "Token et mot de passe requis" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Le mot de passe doit faire au moins 6 caractères" }, { status: 400 });
  }

  // Trouver l'utilisateur par token
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
    select: { id: true, email: true, prenom: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Lien invalide ou expiré. Demandez un nouveau lien à votre administrateur." },
      { status: 400 }
    );
  }

  // Hasher le nouveau mot de passe
  const passwordHash = await bcrypt.hash(password, 10);

  // Mettre à jour et invalider le token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return NextResponse.json({
    success: true,
    message: `Mot de passe défini pour ${user.email}`,
  });
}
