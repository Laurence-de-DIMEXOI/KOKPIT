import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/marketing/canaux — liste des canaux
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const inclureInactifs = req.nextUrl.searchParams.get("inclureInactifs") === "true";

  const canaux = await prisma.canalMarketing.findMany({
    where: inclureInactifs ? {} : { actif: true },
    orderBy: { nom: "asc" },
  });

  return NextResponse.json({ canaux });
}

// POST /api/marketing/canaux — créer un canal
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { nom, couleur } = body;

  if (!nom?.trim()) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }

  const canal = await prisma.canalMarketing.create({
    data: { nom: nom.trim(), couleur: couleur || null },
  });

  return NextResponse.json({ canal }, { status: 201 });
}
