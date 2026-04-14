import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/marketing/operations/semaine — opérations de la semaine en cours
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();
  const day = now.getDay(); // 0=dimanche
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const operations = await prisma.operationMarketing.findMany({
    where: {
      date: { gte: monday, lte: sunday },
    },
    include: { canal: true },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({
    operations,
    semaine: {
      debut: monday.toISOString(),
      fin: sunday.toISOString(),
    },
  });
}
