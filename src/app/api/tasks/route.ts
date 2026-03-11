import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  titre: z.string().min(1, "Titre requis"),
  description: z.string().optional(),
  echeance: z.string().datetime().optional().nullable(),
  contactId: z.string().optional().nullable(),
  assigneAId: z.string().optional(),
});

// GET /api/tasks — Liste des tâches (mes tâches par défaut)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statut = searchParams.get("statut"); // A_FAIRE, EN_COURS, TERMINEE
  const all = searchParams.get("all") === "true"; // Toutes les tâches (direction)

  const where: Record<string, unknown> = {};

  if (!all) {
    where.assigneAId = session.user.id;
  }

  if (statut && ["A_FAIRE", "EN_COURS", "TERMINEE"].includes(statut)) {
    where.statut = statut;
  }

  try {
    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { echeance: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      include: {
        contact: { select: { id: true, nom: true, prenom: true, email: true } },
        assigneA: { select: { id: true, nom: true, prenom: true } },
        createdBy: { select: { id: true, nom: true, prenom: true } },
      },
    });

    return NextResponse.json(tasks);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("GET /api/tasks error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/tasks — Créer une tâche
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createSchema.parse(body);

    const task = await prisma.task.create({
      data: {
        titre: data.titre,
        description: data.description || null,
        echeance: data.echeance ? new Date(data.echeance) : null,
        contactId: data.contactId || null,
        assigneAId: data.assigneAId || session.user.id,
        createdById: session.user.id,
      },
      include: {
        contact: { select: { id: true, nom: true, prenom: true, email: true } },
        assigneA: { select: { id: true, nom: true, prenom: true } },
        createdBy: { select: { id: true, nom: true, prenom: true } },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("POST /api/tasks error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
