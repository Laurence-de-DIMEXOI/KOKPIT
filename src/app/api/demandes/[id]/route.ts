import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/demandes/[id]
 * Supprime une demande de prix (spam, doublon, etc.)
 * Supprime aussi le lead associé et le contact si orphelin.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Récupérer la demande avec son contact et leads
    const demande = await prisma.demandePrix.findUnique({
      where: { id },
      include: {
        contact: {
          include: {
            leads: true,
            demandesPrix: true,
          },
        },
      },
    });

    if (!demande) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }

    const contactId = demande.contactId;
    const contact = demande.contact;

    // Supprimer les leads associés au contact (liés à cette demande)
    if (contact.leads.length > 0) {
      await prisma.lead.deleteMany({
        where: { contactId },
      });
    }

    // Supprimer la demande
    await prisma.demandePrix.delete({
      where: { id },
    });

    // Si le contact n'a plus d'autres demandes, supprimer le contact aussi
    const otherDemandes = contact.demandesPrix.filter((d) => d.id !== id);
    if (otherDemandes.length === 0) {
      await prisma.contact.delete({
        where: { id: contactId },
      });
    }

    return NextResponse.json({
      success: true,
      deleted: {
        demandeId: id,
        leadsDeleted: contact.leads.length,
        contactDeleted: otherDemandes.length === 0,
      },
    });
  } catch (error: any) {
    console.error("DELETE /api/demandes/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
