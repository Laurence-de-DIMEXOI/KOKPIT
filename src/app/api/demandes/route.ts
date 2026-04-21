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

    // Récupérer les demandes de prix avec contact + tous ses leads + attributions strictes
    const [demandesPrix, totalDemandesPrix] = await Promise.all([
      prisma.demandePrix.findMany({
        where: whereClause,
        include: {
          contact: {
            include: {
              // Tous les leads du contact + attributions (fenêtres 7j/30j)
              leads: {
                orderBy: { createdAt: "desc" },
                include: {
                  commercial: { select: { id: true, nom: true, email: true } },
                  attributionsDevis: {
                    orderBy: { devisDate: "asc" },
                    select: { devisId: true, devisRef: true, devisCA: true, devisDate: true, joursApres: true },
                  },
                  attributionsBDC: {
                    orderBy: { bdcDate: "asc" },
                    select: { bdcId: true, bdcRef: true, bdcCA: true, bdcDate: true, joursApres: true },
                  },
                },
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

    // Pour chaque demande, trouver le lead le plus proche (même jour idéalement)
    // et ne remonter que les devis/BDC strictement attribués à ce lead.
    const formattedDemandesPrix = demandesPrix.map((demande) => {
      const demandeTs = demande.createdAt.getTime();

      // Choisir le lead le plus proche temporellement (fusion garantit 1 lead/jour/contact)
      const leadsSorted = [...(demande.contact.leads || [])].sort(
        (a, b) =>
          Math.abs(a.createdAt.getTime() - demandeTs) -
          Math.abs(b.createdAt.getTime() - demandeTs)
      );
      const lead = leadsSorted[0] || null;

      // Attributions STRICTES (7j devis / 30j BDC) de ce lead uniquement
      const attrDevis = lead?.attributionsDevis || [];
      const attrBDC = lead?.attributionsBDC || [];

      const premierDevis = attrDevis[0] || null;
      const premierBDC = attrBDC[0] || null;

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
        // Lead associé (proche de la demande, pas forcément le dernier)
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
        // ==== DEVIS ATTRIBUÉS (fenêtre 7j, via AttributionDevis) ====
        devisRef: premierDevis?.devisRef || null,
        devisId: premierDevis?.devisId || null,
        devisCount: attrDevis.length,
        devisMontant: premierDevis?.devisCA || null,
        devisList: attrDevis.map((a) => ({
          id: a.devisId,
          numero: a.devisRef,
          montant: a.devisCA,
          statut: null as string | null,
          createdAt: a.devisDate?.toISOString() || null,
          joursApres: a.joursApres,
        })),
        // ==== BDC ATTRIBUÉS (fenêtre 30j, via AttributionBDC) ====
        venteId: premierBDC?.bdcId || null,
        venteCount: attrBDC.length,
        venteMontant: premierBDC?.bdcCA || null,
        venteMontantTotal: attrBDC.reduce((s, a) => s + a.bdcCA, 0),
        ventesList: attrBDC.map((a) => ({
          id: a.bdcId,
          reference: a.bdcRef,
          montant: a.bdcCA,
          dateVente: a.bdcDate?.toISOString() || null,
          createdAt: a.bdcDate?.toISOString() || null,
          joursApres: a.joursApres,
        })),
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

    // Stats — basés sur le statut Lead (rebuild strict 7j/30j) + CA attribué réel
    const caAttribueTotal = formattedDemandesPrix.reduce((s, d) => s + (d.venteMontantTotal || 0), 0);
    const caDevisTotal = formattedDemandesPrix.reduce(
      (s, d) => s + (d.devisList || []).reduce((ss, dv) => ss + (dv.montant || 0), 0),
      0
    );
    const stats = {
      total: totalDemandesPrix,
      nouveau: formattedDemandesPrix.filter((d) => d.statut === "NOUVEAU").length,
      enCours: formattedDemandesPrix.filter((d) => d.statut === "EN_COURS").length,
      devis: formattedDemandesPrix.filter((d) => d.statut === "DEVIS").length,
      vente: formattedDemandesPrix.filter((d) => d.statut === "VENTE").length,
      perdu: formattedDemandesPrix.filter((d) => d.statut === "PERDU").length,
      caAttribue: Math.round(caAttribueTotal * 100) / 100,
      caDevis: Math.round(caDevisTotal * 100) / 100,
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
