import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/clean-legacy
 *
 * Supprime les anciennes demandes (DemandePrix) et leads associés.
 * Garde UNIQUEMENT les demandes récentes venant du site web (avec articles ou créées aujourd'hui).
 * Les contacts restent intacts pour l'historique et les campagnes emailing.
 *
 * ⚠️ Route temporaire — à supprimer après utilisation
 */
export async function GET() {
  try {
    // 1. Compter avant nettoyage
    const totalDemandesBefore = await prisma.demandePrix.count();
    const totalLeadsBefore = await prisma.lead.count();

    // 2. Identifier les demandes récentes (du site web) à GARDER
    // Ce sont celles qui ont des articles (nouveau format v2)
    // ou créées aujourd'hui via le formulaire
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const demandesToKeep = await prisma.demandePrix.findMany({
      where: {
        OR: [
          { articles: { not: null } },           // Nouveau format avec articles
          { createdAt: { gte: today } },          // Créées aujourd'hui
        ],
      },
      select: { id: true, contactId: true },
    });

    const keepIds = demandesToKeep.map(d => d.id);
    const keepContactIds = [...new Set(demandesToKeep.map(d => d.contactId))];

    // 3. Supprimer les anciennes demandes (tout sauf celles à garder)
    const deletedDemandes = await prisma.demandePrix.deleteMany({
      where: {
        id: { notIn: keepIds },
      },
    });

    // 4. Supprimer les leads qui n'ont PAS de demande récente associée
    // (leads legacy créés par l'import)
    // On garde les leads dont le contactId correspond à une demande récente
    const deletedLeads = await prisma.lead.deleteMany({
      where: {
        contactId: { notIn: keepContactIds },
        source: "SITE_WEB",
      },
    });

    // 5. Supprimer les événements orphelins liés aux leads supprimés
    // (événements des anciens imports)
    const deletedEvenements = await prisma.evenement.deleteMany({
      where: {
        type: "CREATION_LEAD",
        contactId: { notIn: keepContactIds },
      },
    });

    // 6. Compter après nettoyage
    const totalDemandesAfter = await prisma.demandePrix.count();
    const totalLeadsAfter = await prisma.lead.count();
    const totalContacts = await prisma.contact.count();

    return NextResponse.json({
      success: true,
      message: "Nettoyage terminé",
      before: {
        demandes: totalDemandesBefore,
        leads: totalLeadsBefore,
      },
      deleted: {
        demandes: deletedDemandes.count,
        leads: deletedLeads.count,
        evenements: deletedEvenements.count,
      },
      after: {
        demandes: totalDemandesAfter,
        leads: totalLeadsAfter,
        contacts: totalContacts,
      },
      kept: {
        demandes: keepIds.length,
        description: "Demandes avec articles (site web v2) + demandes du jour",
      },
    });
  } catch (error: any) {
    console.error("Clean legacy error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
