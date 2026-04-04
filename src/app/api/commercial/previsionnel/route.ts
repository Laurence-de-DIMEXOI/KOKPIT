import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Arrivages PREVU + EN_TRANSIT + ARRIVE (30 jours)
  const arrivages = await prisma.arrivage.findMany({
    where: {
      OR: [
        { statut: { in: ["PREVU", "EN_TRANSIT"] } },
        {
          statut: "ARRIVE",
          updatedAt: { gte: thirtyDaysAgo },
        },
      ],
    },
    orderBy: [{ statut: "asc" }, { dateDepart: "asc" }],
    include: {
      lignes: { orderBy: { designation: "asc" } },
      _count: { select: { bdcLies: true } },
    },
  });

  return NextResponse.json(arrivages);
}
