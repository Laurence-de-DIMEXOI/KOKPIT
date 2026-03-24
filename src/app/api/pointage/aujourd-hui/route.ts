import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const now = new Date();
  const dateJour = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const pointage = await prisma.pointage.findUnique({
    where: { userId_date: { userId, date: dateJour } },
  });

  return NextResponse.json(pointage);
}
