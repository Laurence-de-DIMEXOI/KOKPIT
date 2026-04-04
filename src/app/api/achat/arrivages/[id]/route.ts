import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const WRITE_ROLES = ["ADMIN", "DIRECTION", "ACHAT"];

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const arrivage = await prisma.arrivage.findUnique({
    where: { id },
    include: {
      lignes: { orderBy: { designation: "asc" } },
      bdcLies: { orderBy: { bdcReference: "asc" } },
      createdBy: { select: { prenom: true, nom: true } },
    },
  });

  if (!arrivage) return NextResponse.json({ error: "Arrivage introuvable" }, { status: 404 });

  return NextResponse.json(arrivage);
}

export async function PUT(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role;
  if (!WRITE_ROLES.includes(role))
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { reference, dateDepart, dateLivraisonEstimee, statut, notes } = body;

  const arrivage = await prisma.arrivage.findUnique({ where: { id } });
  if (!arrivage) return NextResponse.json({ error: "Arrivage introuvable" }, { status: 404 });

  // Check uniqueness if reference changed
  if (reference && reference.trim() !== arrivage.reference) {
    const existing = await prisma.arrivage.findUnique({ where: { reference: reference.trim() } });
    if (existing)
      return NextResponse.json({ error: "Un arrivage avec cette référence existe déjà" }, { status: 409 });
  }

  const updated = await prisma.arrivage.update({
    where: { id },
    data: {
      ...(reference ? { reference: reference.trim() } : {}),
      dateDepart: dateDepart !== undefined ? (dateDepart ? new Date(dateDepart) : null) : arrivage.dateDepart,
      dateLivraisonEstimee:
        dateLivraisonEstimee !== undefined
          ? dateLivraisonEstimee
            ? new Date(dateLivraisonEstimee)
            : null
          : arrivage.dateLivraisonEstimee,
      ...(statut ? { statut } : {}),
      notes: notes !== undefined ? (notes?.trim() || null) : arrivage.notes,
    },
    include: {
      _count: { select: { lignes: true, bdcLies: true } },
      createdBy: { select: { prenom: true, nom: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["ADMIN", "DIRECTION"].includes(role))
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;

  await prisma.arrivage.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
