import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/demandes
 * Récupère toutes les demandes: Leads + DemandePrix avec infos de contact
 *
 * Query params:
 * - source: "GLIDE" | "ALL" (défaut: "ALL")
 * - statut: "NOUVEAU" | "EN_COURS" | "DEVIS" | "VENTE" | "PERDU"
 * - limit: nombre de résultats (défaut: 100)
 * - offset: pagination (défaut: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const source = url.searchParams.get("source") || "ALL";
    const statut = url.searchParams.get("statut");
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    // Récupérer les leads
    const leadsQuery: any = {};
    if (source === "GLIDE") {
      leadsQuery.source = "GLIDE";
    }
    if (statut) {
      leadsQuery.statut = statut;
    }

    const [leads, totalLeads] = await Promise.all([
      prisma.lead.findMany({
        where: leadsQuery,
        include: {
          contact: true,
          commercial: {
            select: {
              id: true,
              email: true,
              nom: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.lead.count({ where: leadsQuery }),
    ]);

    // Récupérer les demandes de prix sans Lead associé (non converties)
    const [demandesPrix, totalDemandesPrix] = await Promise.all([
      prisma.demandePrix.findMany({
        where: {
          // Exclure les demandes qui ont déjà un lead associé
          NOT: {
            lead: {
              some: {},
            },
          },
        },
        include: {
          contact: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.demandePrix.count({
        where: {
          NOT: {
            lead: {
              some: {},
            },
          },
        },
      }),
    ]);

    // Formater les réponses
    const formattedLeads = leads.map((lead) => ({
      id: lead.id,
      type: "LEAD",
      nom: lead.contact.nom,
      prenom: lead.contact.prenom,
      email: lead.contact.email,
      telephone: lead.contact.telephone,
      source: lead.source,
      statut: lead.statut,
      notes: lead.notes,
      meuble: lead.notes?.split(":")?.[1]?.trim() || "Non spécifié",
      message: null,
      showroom: null,
      modePaiement: null,
      assigneA: lead.commercial?.nom || "Non assigné",
      assigneEmail: lead.commercial?.email || null,
      dateCreation: lead.createdAt.toISOString(),
      dateDemande: null,
      glideRowId: null,
    }));

    const formattedDemandesPrix = demandesPrix.map((demande) => ({
      id: demande.id,
      type: "DEMANDE_PRIX",
      nom: demande.contact.nom,
      prenom: demande.contact.prenom,
      email: demande.contact.email,
      telephone: demande.contact.telephone,
      source: "GLIDE",
      statut: "NOUVEAU",
      meuble: demande.meuble,
      message: demande.message,
      showroom: demande.showroom,
      modePaiement: demande.modePaiement,
      assigneA: "Non assigné",
      assigneEmail: null,
      dateCreation: demande.createdAt.toISOString(),
      dateDemande: demande.dateDemande?.toISOString() || null,
      glideRowId: demande.glideRowId,
    }));

    // Combiner et trier par date de création décroissante
    const toutes = [...formattedLeads, ...formattedDemandesPrix].sort(
      (a, b) =>
        new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
    );

    return NextResponse.json({
      success: true,
      data: toutes,
      pagination: {
        total: totalLeads + totalDemandesPrix,
        limit,
        offset,
        count: toutes.length,
      },
      stats: {
        totalLeads,
        totalDemandesPrix,
        totalDemandes: totalLeads + totalDemandesPrix,
      },
    });
  } catch (error: any) {
    console.error("GET /api/demandes error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
