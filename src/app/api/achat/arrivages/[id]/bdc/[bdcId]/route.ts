import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const WRITE_ROLES = ["ADMIN", "DIRECTION", "ACHAT"];

type Params = { params: Promise<{ id: string; bdcId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role;
  if (!WRITE_ROLES.includes(role))
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { bdcId } = await params;

  const bdc = await prisma.bdcArrivage.findUnique({ where: { id: bdcId } });
  if (!bdc) return NextResponse.json({ error: "Liaison introuvable" }, { status: 404 });

  await prisma.bdcArrivage.delete({ where: { id: bdcId } });

  return NextResponse.json({ success: true });
}
