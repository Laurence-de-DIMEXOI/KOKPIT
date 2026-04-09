import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const annee = req.nextUrl.searchParams.get("annee") || String(new Date().getFullYear());

  const evenements = await prisma.evenement.findMany({
    where: {
      type: "NOTE",
      description: { contains: "Téléchargement guide PDF" },
      createdAt: {
        gte: new Date(`${annee}-01-01`),
        lt: new Date(`${parseInt(annee) + 1}-01-01`),
      },
    },
    include: {
      contact: { select: { email: true, prenom: true, nom: true, telephone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(evenements);
}
