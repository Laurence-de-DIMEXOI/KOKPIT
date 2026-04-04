import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const WRITE_ROLES = ["ADMIN", "DIRECTION", "ACHAT"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const arrivages = await prisma.arrivage.findMany({
    orderBy: [{ statut: "asc" }, { dateDepart: "asc" }],
    include: {
      _count: { select: { lignes: true, bdcLies: true } },
      createdBy: { select: { prenom: true, nom: true } },
    },
  });

  return NextResponse.json(arrivages);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role;
  if (!WRITE_ROLES.includes(role))
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await req.json();
  const { reference, dateDepart, dateLivraisonEstimee, statut, notes } = body;

  if (!reference?.trim())
    return NextResponse.json({ error: "La référence est obligatoire" }, { status: 400 });

  const existing = await prisma.arrivage.findUnique({ where: { reference: reference.trim() } });
  if (existing)
    return NextResponse.json({ error: "Un arrivage avec cette référence existe déjà" }, { status: 409 });

  const arrivage = await prisma.arrivage.create({
    data: {
      reference: reference.trim(),
      dateDepart: dateDepart ? new Date(dateDepart) : null,
      dateLivraisonEstimee: dateLivraisonEstimee ? new Date(dateLivraisonEstimee) : null,
      statut: statut || "PREVU",
      notes: notes?.trim() || null,
      createdById: (session.user as any).id,
    },
    include: {
      _count: { select: { lignes: true, bdcLies: true } },
      createdBy: { select: { prenom: true, nom: true } },
    },
  });

  return NextResponse.json(arrivage, { status: 201 });
}
