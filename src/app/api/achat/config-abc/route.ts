import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const config = await prisma.configABC.findFirst();
  return NextResponse.json(config || { seuilA: 80, seuilB: 95 });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["ACHAT", "ADMIN", "DIRECTION"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const { seuilA, seuilB } = body;

  if (seuilA == null || seuilB == null) {
    return NextResponse.json({ error: "seuilA et seuilB requis" }, { status: 400 });
  }

  if (seuilA >= seuilB || seuilA < 0 || seuilB > 100) {
    return NextResponse.json({ error: "seuilA doit être < seuilB, entre 0 et 100" }, { status: 400 });
  }

  const config = await prisma.configABC.upsert({
    where: { id: "default" },
    create: { id: "default", seuilA, seuilB },
    update: { seuilA, seuilB },
  });

  return NextResponse.json(config);
}
