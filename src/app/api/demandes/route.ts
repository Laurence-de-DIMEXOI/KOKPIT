import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/demandes
 * Récupère les demandes de prix avec détails contact + lead associé
 *
 * Query params:
 * - limit: nombre de résultats (défaut: 100)
 * - offset: pagination (défaut: 0)
 * - statut: filtrer par statut lead (NOUVEAU, EN_COURS, DEVIS, VENTE, PERDU)
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);
    const statutFilter = url.searchParams.get("statut");

    // Filtrer : uniquement les demandes ayant un Lead associé (créées par le webhook)
    // Les anciennes demandes (import legacy) restent en base pour l'historique contact
    const whereClause = {
      contact: {
        leads: {
          some: {},
        },
      },
    };

    // Récupérer les demandes de prix avec contact
    const [demandesPrix, totalDemandesPrix] = await Promise.all([
      prisma.demandePrix.findMany({
        where: whereClause,
        include: {
          contact: {
            include: {
              leads: {
                orderBy: { createdAt: "desc" },
                take: 1,
                include: {
                  commercial: { select: { id: true, nom: true, email: true } },
                },
              },
              // Devis via CONTACT (pas via lead — leadId souvent null)
              devis: {
                orderBy: { createdAt: "desc" },
                take: 3,
                select: { id: true, sellsyQuoteId: true, numero: true, montant: true, statut: true },
              },
              // Ventes/BDC via CONTACT
              ventes: {
                orderBy: { createdAt: "desc" },
                take: 3,
                select: { id: true, sellsyInvoiceId: true, montant: true, dateVente: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.demandePrix.count({ where: whereClause }),
    ]);

    // Formater les demandes de prix
    const formattedDemandesPrix = demandesPrix.map((demande) => {
      const lead = demande.contact.leads?.[0] || null;
      return {
        id: demande.id,
        type: "DEMANDE_PRIX" as const,
        // Contact
        contactId: demande.contactId,
        nom: demande.contact.nom,
        prenom: demande.contact.prenom,
        email: demande.contact.email,
        telephone: demande.contact.telephone,
        // Demande
        meuble: demande.meuble,
        message: demande.message,
        showroom: demande.showroom,
        modePaiement: demande.modePaiement,
        budget: demande.budget || null,
        articles: demande.articles || null,
        // Estimation IA
        estimationHT: (demande as any).estimationHT || null,
        estimationTTC: (demande as any).estimationTTC || null,
        // Lead associé
        leadId: lead?.id || null,
        statut: lead?.statut || "NOUVEAU",
        source: lead?.source || "GLIDE",
        priorite: lead?.priorite || "NORMALE",
        slaDeadline: lead?.slaDeadline?.toISOString() || null,
        notes: lead?.notes || null,
        // Assignation
        assigneA: lead?.commercial?.nom || "Non assigné",
        assigneEmail: lead?.commercial?.email || null,
        commercialId: lead?.commercialId || null,
        // Devis liés au contact (stockés en base via sync-sellsy)
        devisRef: demande.contact.devis?.[0]?.numero || demande.contact.devis?.[0]?.sellsyQuoteId || null,
        devisId: demande.contact.devis?.[0]?.sellsyQuoteId || null,
        devisCount: demande.contact.devis?.length || 0,
        devisMontant: demande.contact.devis?.[0]?.montant || null,
        // Ventes/BDC liés au contact
        venteId: demande.contact.ventes?.[0]?.sellsyInvoiceId || null,
        venteCount: demande.contact.ventes?.length || 0,
        venteMontant: demande.contact.ventes?.[0]?.montant || null,
        // Dates
        dateCreation: demande.createdAt.toISOString(),
        dateDemande: demande.dateDemande?.toISOString() || null,
        glideRowId: demande.glideRowId,
      };
    });

    // Filtre statut côté serveur
    const filtered = statutFilter
      ? formattedDemandesPrix.filter((d) => d.statut === statutFilter)
      : formattedDemandesPrix;

    // Stats
    const stats = {
      total: totalDemandesPrix,
      nouveau: formattedDemandesPrix.filter((d) => d.statut === "NOUVEAU").length,
      enCours: formattedDemandesPrix.filter((d) => d.statut === "EN_COURS").length,
      devis: formattedDemandesPrix.filter((d) => d.statut === "DEVIS").length,
      vente: formattedDemandesPrix.filter((d) => d.statut === "VENTE").length,
      perdu: formattedDemandesPrix.filter((d) => d.statut === "PERDU").length,
    };

    return NextResponse.json({
      success: true,
      data: filtered,
      pagination: {
        total: totalDemandesPrix,
        limit,
        offset,
        count: filtered.length,
      },
      stats,
    });
  } catch (error: any) {
    console.error("GET /api/demandes error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/demandes
 * Met à jour le statut d'un lead associé à une demande
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, statut, commercialId, notes } = body;

    if (!leadId) {
      return NextResponse.json({ error: "leadId requis" }, { status: 400 });
    }

    const updateData: any = {};
    if (statut) updateData.statut = statut;
    if (commercialId !== undefined) updateData.commercialId = commercialId;
    if (notes !== undefined) updateData.notes = notes;

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
      include: {
        commercial: { select: { id: true, nom: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        statut: lead.statut,
        commercialId: lead.commercialId,
        assigneA: lead.commercial?.nom || "Non assigné",
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/demandes error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
