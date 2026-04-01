import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ROLES_AUTORISES = ["ADMIN", "DIRECTION"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const role = (session.user as any).role as string;
    if (!ROLES_AUTORISES.includes(role)) {
      return NextResponse.json(
        { error: "Accès refusé — réservé ADMIN et DIRECTION" },
        { status: 403 }
      );
    }

    const sessions = await prisma.sessionTarif.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        createdBy: { select: { prenom: true, nom: true } },
      },
    });

    return NextResponse.json({ sessions });
  } catch (err) {
    console.error("tarifs/historique:", err);
    return NextResponse.json(
      { error: "Erreur chargement historique" },
      { status: 500 }
    );
  }
}
