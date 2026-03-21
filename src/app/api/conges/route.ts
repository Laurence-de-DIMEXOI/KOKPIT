import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculerJoursOuvres } from "@/data/conges-config";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId");
  const statut = searchParams.get("statut");
  const annee = searchParams.get("annee") || String(new Date().getFullYear());
  const mois = searchParams.get("mois");

  const where: Record<string, unknown> = {};

  if (userId) {
    where.userId = userId;
  }

  if (statut) {
    where.statut = statut;
  }

  // Filtre par annee
  const startOfYear = new Date(`${annee}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${annee}-12-31T23:59:59.999Z`);

  if (mois) {
    const m = mois.padStart(2, "0");
    const startOfMonth = new Date(`${annee}-${m}-01T00:00:00.000Z`);
    const lastDay = new Date(Number(annee), Number(m), 0).getDate();
    const endOfMonth = new Date(`${annee}-${m}-${lastDay}T23:59:59.999Z`);
    where.dateDebut = {
      gte: startOfMonth,
      lte: endOfMonth,
    };
  } else {
    where.dateDebut = {
      gte: startOfYear,
      lte: endOfYear,
    };
  }

  const conges = await prisma.conge.findMany({
    where,
    include: {
      user: {
        select: { nom: true, prenom: true, couleur: true, titre: true },
      },
      approuvePar: {
        select: { nom: true, prenom: true },
      },
    },
    orderBy: { dateDebut: "desc" },
  });

  return NextResponse.json({ conges });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const body = await req.json();
  const { userId, type, periodes, notes } = body;

  if (!userId || !type || !periodes || !Array.isArray(periodes) || periodes.length === 0 || periodes.length > 4) {
    return NextResponse.json(
      { error: "Donnees invalides. Fournir userId, type, et 1 a 4 periodes." },
      { status: 400 }
    );
  }

  const user = session.user as { id: string; role?: string };
  const isAdminOrDirection = user.role === "ADMIN" || user.role === "DIRECTION";

  // Statut par defaut : en_attente, sauf si ADMIN/DIRECTION
  const statut = isAdminOrDirection ? "approuve" : "en_attente";

  const createdConges = [];

  for (const periode of periodes) {
    const { dateDebut, dateFin } = periode;

    if (!dateDebut || !dateFin) {
      return NextResponse.json(
        { error: "Chaque periode doit avoir dateDebut et dateFin." },
        { status: 400 }
      );
    }

    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    if (fin < debut) {
      return NextResponse.json(
        { error: `dateFin (${dateFin}) ne peut pas etre avant dateDebut (${dateDebut}).` },
        { status: 400 }
      );
    }

    const nbJours = calculerJoursOuvres(debut, fin);

    const conge = await prisma.conge.create({
      data: {
        userId,
        type,
        dateDebut: debut,
        dateFin: fin,
        nbJours,
        statut,
        notes: notes || null,
        ...(isAdminOrDirection
          ? {
              approuveParId: user.id,
              approuveLe: new Date(),
            }
          : {}),
      },
    });

    createdConges.push(conge);
  }

  return NextResponse.json({ conges: createdConges }, { status: 201 });
}
