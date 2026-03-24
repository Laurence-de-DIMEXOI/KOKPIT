import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const jours = parseInt(req.nextUrl.searchParams.get("jours") || "10", 10);

  const depuis = new Date();
  depuis.setDate(depuis.getDate() - jours);
  depuis.setHours(0, 0, 0, 0);

  const pointages = await prisma.pointage.findMany({
    where: {
      userId,
      date: { gte: depuis },
    },
    orderBy: { date: "desc" },
  });

  // Total du mois en cours
  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  const pointagesMois = await prisma.pointage.findMany({
    where: {
      userId,
      date: { gte: debutMois },
      heuresTravaillees: { not: null },
    },
    select: { heuresTravaillees: true, heuresSupp: true },
  });

  const totalHeures = pointagesMois.reduce(
    (sum, p) => sum + (p.heuresTravaillees || 0),
    0
  );
  const totalSupp = pointagesMois.reduce(
    (sum, p) => sum + (p.heuresSupp || 0),
    0
  );

  return NextResponse.json({
    pointages,
    totalMois: {
      heures: Math.round(totalHeures * 100) / 100,
      supp: Math.round(totalSupp * 100) / 100,
      jours: pointagesMois.length,
    },
  });
}
