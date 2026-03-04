import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/clean-legacy
 * Supprime toutes les DemandePrix et Leads.
 * Les contacts restent intacts.
 */
export async function GET() {
  try {
    const before = {
      demandes: await prisma.demandePrix.count(),
      leads: await prisma.lead.count(),
      contacts: await prisma.contact.count(),
    };

    // Supprimer les événements CREATION_LEAD
    await prisma.evenement.deleteMany({ where: { type: "CREATION_LEAD" } });

    // Supprimer TOUS les leads
    await prisma.lead.deleteMany();

    // Supprimer TOUTES les demandes de prix
    await prisma.demandePrix.deleteMany();

    const after = {
      demandes: await prisma.demandePrix.count(),
      leads: await prisma.lead.count(),
      contacts: await prisma.contact.count(),
    };

    return NextResponse.json({
      success: true,
      message: "Toutes les demandes et leads ont été supprimés. Contacts intacts.",
      before,
      after,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
