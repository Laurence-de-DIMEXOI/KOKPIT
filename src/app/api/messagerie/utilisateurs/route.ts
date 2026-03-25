import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List active users for DM creation
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const utilisateurs = await prisma.user.findMany({
    where: {
      actif: true,
      id: { not: session.user.id },
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      role: true,
      couleur: true,
    },
    orderBy: { nom: "asc" },
  });

  return NextResponse.json(utilisateurs);
}
