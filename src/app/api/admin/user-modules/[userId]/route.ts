import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT — Mettre à jour les overrides d'un utilisateur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = (session.user as any).role;
  const email = session.user?.email;
  if (email !== "laurence.payet@dimexoi.fr" && !["DIRECTION"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { userId } = await params;
  const body = await request.json();
  const { overrides } = body; // Record<string, boolean> ou null pour reset

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      moduleAccessOverrides: overrides === null ? null : overrides,
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      role: true,
      moduleAccessOverrides: true,
    },
  });

  return NextResponse.json(updated);
}
