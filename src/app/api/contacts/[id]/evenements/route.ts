import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  type: z.enum(["APPEL", "NOTE", "RELANCE"]),
  description: z.string().min(1, "Description requise"),
});

// GET /api/contacts/[id]/evenements — Liste paginée
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
  const skip = (page - 1) * limit;

  try {
    const [evenements, total] = await Promise.all([
      prisma.evenement.findMany({
        where: { contactId: id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          auteur: { select: { id: true, nom: true, prenom: true } },
        },
      }),
      prisma.evenement.count({ where: { contactId: id } }),
    ]);

    return NextResponse.json({
      evenements,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("GET /api/contacts/[id]/evenements error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/contacts/[id]/evenements — Créer un événement (APPEL, NOTE, RELANCE)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data = createSchema.parse(body);

    // Vérifier que le contact existe
    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) {
      return NextResponse.json({ error: "Contact non trouvé" }, { status: 404 });
    }

    const evenement = await prisma.evenement.create({
      data: {
        contactId: id,
        type: data.type,
        description: data.description,
        auteurId: session.user.id,
      },
      include: {
        auteur: { select: { id: true, nom: true, prenom: true } },
      },
    });

    return NextResponse.json(evenement, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("POST /api/contacts/[id]/evenements error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/contacts/[id]/evenements — Supprimer un événement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  await params; // consume params

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "eventId requis" }, { status: 400 });
  }

  try {
    await prisma.evenement.delete({ where: { id: eventId } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("DELETE /api/contacts/[id]/evenements error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
