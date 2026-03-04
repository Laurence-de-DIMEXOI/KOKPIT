import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/clean-legacy
 *
 * Supprime TOUTES les demandes de prix et leads associés.
 * Garde les contacts intacts pour l'historique et les campagnes emailing.
 *
 * ⚠️ Route temporaire — à supprimer après utilisation
 */
export async function GET() {
  try {
    // 1. Compter avant nettoyage
    const totalDemandesBefore = await prisma.demandePrix.count();
    const totalLeadsBefore = await prisma.lead.count();
    const totalContacts = await prisma.contact.count();

    // 2. Supprimer tous les événements liés aux leads
    const deletedEvenements = await prisma.evenement.deleteMany({
      where: { type: "CREATION_LEAD" },
    });

    // 3. Supprimer TOUS les leads
    const deletedLeads = await prisma.lead.deleteMany({});

    // 4. Supprimer TOUTES les demandes de prix
    const deletedDemandes = await prisma.demandePrix.deleteMany({});

    // 5. Supprimer aussi les contacts "Test Test" (contacts de test)
    const deletedTestContacts = await prisma.contact.deleteMany({
      where: {
        OR: [
          { nom: "Test", prenom: "Test" },
          { email: { contains: "test" } },
          { email: { contains: "example.com" } },
          { email: { contains: "debug" } },
        ],
      },
    });

    // 6. Compter après nettoyage
    const totalDemandesAfter = await prisma.demandePrix.count();
    const totalLeadsAfter = await prisma.lead.count();
    const totalContactsAfter = await prisma.contact.count();

    return NextResponse.json({
      success: true,
      message: "Nettoyage complet terminé",
      before: {
        demandes: totalDemandesBefore,
        leads: totalLeadsBefore,
        contacts: totalContacts,
      },
      deleted: {
        demandes: deletedDemandes.count,
        leads: deletedLeads.count,
        evenements: deletedEvenements.count,
        testContacts: deletedTestContacts.count,
      },
      after: {
        demandes: totalDemandesAfter,
        leads: totalLeadsAfter,
        contacts: totalContactsAfter,
      },
    });
  } catch (error: any) {
    console.error("Clean legacy error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
