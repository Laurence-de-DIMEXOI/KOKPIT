import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const sessionUserId = (session.user as any).id;
  const now = new Date();
  const dateJour = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Mon propre pointage + solde heures
  const [pointage, currentUser] = await Promise.all([
    prisma.pointage.findUnique({
      where: { userId_date: { userId: sessionUserId, date: dateJour } },
    }),
    prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { soldeHeures: true },
    }),
  ]);

  const soldeHeures = currentUser?.soldeHeures ?? 0;

  // Personnes dont je suis le délégué (je peux pointer pour elles)
  const delegues = await prisma.user.findMany({
    where: { pointageDelegueId: sessionUserId, pointageActif: true, actif: true },
    select: { id: true, nom: true, prenom: true },
  });

  // Pointages des délégués pour aujourd'hui
  const deleguesPointages: Record<string, any> = {};
  for (const d of delegues) {
    const dp = await prisma.pointage.findUnique({
      where: { userId_date: { userId: d.id, date: dateJour } },
    });
    deleguesPointages[d.id] = dp;
  }

  // Config pointage (seuil récup)
  const config = await prisma.configPointage.findFirst();
  const seuilRecup = config?.seuilRecup ?? 4;
  const recupDispo = soldeHeures >= seuilRecup;

  return NextResponse.json({
    pointage,
    soldeHeures: Math.round(soldeHeures * 100) / 100,
    seuilRecup,
    recupDispo,
    delegues: delegues.map((d) => ({
      ...d,
      pointage: deleguesPointages[d.id] || null,
    })),
  });
}
