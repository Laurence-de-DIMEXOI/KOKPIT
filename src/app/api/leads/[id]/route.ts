import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateLeadSchema = z.object({
  statut: z.enum(["NOUVEAU", "EN_COURS", "DEVIS", "VENTE", "PERDU"]).optional(),
  commercialId: z.string().uuid().optional(),
  priorite: z.enum(["HAUTE", "NORMALE", "BASSE"]).optional(),
  notes: z.string().optional(),
});

// GET - Retrieve single lead with all relations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        contact: true,
        showroom: true,
        commercial: true,
        devis: true,
        evenements: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Erreur lors de la récupération du lead:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PATCH - Update lead
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const body = await request.json();
    const updates = updateLeadSchema.parse(body);

    // Get current lead to track changes
    const currentLead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!currentLead) {
      return NextResponse.json(
        { error: "Lead non trouvé" },
        { status: 404 }
      );
    }

    // Log status change event if statut is being changed
    const statusChanged = updates.statut && updates.statut !== currentLead.statut;
    const premiereActionAt =
      !currentLead.premiereActionAt && statusChanged
        ? new Date()
        : currentLead.premiereActionAt;

    // Update lead
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        ...updates,
        premiereActionAt,
      },
      include: {
        contact: true,
        showroom: true,
        commercial: true,
      },
    });

    // Create event for status change
    if (statusChanged) {
      await prisma.evenement.create({
        data: {
          leadId: id,
          contactId: currentLead.contactId,
          type: "CHANGEMENT_STATUT",
          description: `Statut changé: ${currentLead.statut} → ${updates.statut}`,
          auteurId: session.user.id,
          metadata: {
            ancien: currentLead.statut,
            nouveau: updates.statut,
          },
        },
      });
    }

    // Log other updates as NOTE events
    if (updates.notes || updates.priorite) {
      await prisma.evenement.create({
        data: {
          leadId: id,
          contactId: currentLead.contactId,
          type: "NOTE",
          description: updates.notes || `Priorité changée: ${updates.priorite}`,
          auteurId: session.user.id,
        },
      });
    }

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du lead:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Not allowed (leads shouldn't be deleted)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: "Les leads ne peuvent pas être supprimés" },
    { status: 405 }
  );
}
