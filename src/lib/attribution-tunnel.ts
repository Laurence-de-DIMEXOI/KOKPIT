import { prisma } from "./prisma";
import type { LeadStatut } from "@prisma/client";

/**
 * Attribution TUNNEL MARKETING (devis + BDC liés à une demande)
 * — règles validées 27 mars 2026, resserrées 21 avril 2026
 *
 * Devis lié : créé pour le même contact dans les 7j suivant la demande (J0 → J+7)
 * BDC lié   : issu d'un devis attribué (via LiaisonDevisCommande) — seuls les
 *             BDC réellement générés depuis un devis de la fenêtre 7j sont
 *             comptabilisés. Les commandes directes (sans lien devis) ne sont
 *             PAS attribuées à la demande.
 *
 * Multi-BDC : TOUS les BDC issus des devis attribués sont comptabilisés.
 * Statut Lead : VENTE si ≥1 BDC attribué, DEVIS si ≥1 devis attribué, sinon non rétrogradé.
 *
 * ⚠ Distinct du fichier `attribution.ts` qui gère le tracking UTM / last-click.
 */

const MS_DAY = 24 * 60 * 60 * 1000;

export interface AttributionResult {
  leadId: string;
  statutBefore: LeadStatut;
  statutAfter: LeadStatut;
  devisCreated: number;
  bdcCreated: number;
  caAttribue: number;
}

/**
 * Calcule l'attribution pour UN lead — appelé depuis cron (live) et rebuild (rétroactif).
 * Upsert des AttributionDevis + AttributionBDC + met à jour le statut du lead si besoin.
 */
export async function recomputeLeadAttribution(leadId: string): Promise<AttributionResult> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, contactId: true, createdAt: true, statut: true },
  });
  if (!lead) throw new Error(`Lead ${leadId} introuvable`);

  const demandeTs = lead.createdAt.getTime();
  const j7End = new Date(demandeTs + 7 * MS_DAY);
  const demandeDate = lead.createdAt;

  // Devis du même contact créés dans (J0, J+7]
  const devisEligibles = await prisma.devis.findMany({
    where: {
      contactId: lead.contactId,
      createdAt: { gt: demandeDate, lte: j7End },
    },
    select: { id: true, sellsyQuoteId: true, numero: true, montant: true, createdAt: true },
  });

  // BDC attribués = Vente pour le même contact, dateVente dans (J0, J+30],
  // UNIQUEMENT si au moins 1 devis a été attribué (fenêtre 7j).
  // Logique : on ne veut pas de BDC "orphelin" sans devis correspondant.
  const j30End = new Date(demandeTs + 30 * MS_DAY);

  let bdcEligibles: Array<{ id: string; sellsyInvoiceId: string | null; numero: string | null; montant: number; dateVente: Date }> = [];
  if (devisEligibles.length > 0) {
    bdcEligibles = await prisma.vente.findMany({
      where: {
        contactId: lead.contactId,
        dateVente: { gt: demandeDate, lte: j30End },
      },
      select: { id: true, sellsyInvoiceId: true, numero: true, montant: true, dateVente: true },
    });
  }

  let devisCreated = 0;
  let bdcCreated = 0;
  let caAttribue = 0;

  for (const d of devisEligibles) {
    const devisId = d.sellsyQuoteId || d.id;
    const joursApres = Math.floor((d.createdAt.getTime() - demandeTs) / MS_DAY);
    await prisma.attributionDevis.upsert({
      where: { demandeId_devisId: { demandeId: lead.id, devisId } },
      create: {
        demandeId: lead.id,
        devisId,
        devisRef: d.numero || devisId,
        devisCA: d.montant,
        devisDate: d.createdAt,
        joursApres,
      },
      update: {
        devisCA: d.montant,
        devisRef: d.numero || devisId,
      },
    });
    devisCreated++;
  }

  for (const b of bdcEligibles) {
    const bdcId = b.sellsyInvoiceId || b.id;
    const joursApres = Math.floor((b.dateVente.getTime() - demandeTs) / MS_DAY);
    await prisma.attributionBDC.upsert({
      where: { demandeId_bdcId: { demandeId: lead.id, bdcId } },
      create: {
        demandeId: lead.id,
        bdcId,
        bdcRef: b.numero || bdcId,  // "BCDI-05725" si disponible, sinon ID Sellsy
        bdcCA: b.montant,
        bdcDate: b.dateVente,
        joursApres,
      },
      update: {
        bdcCA: b.montant,
        bdcRef: b.numero || bdcId,
      },
    });
    bdcCreated++;
    caAttribue += b.montant;
  }

  // Statut strict — ne rétrograde pas vers NOUVEAU, mais corrige les VENTE/DEVIS fantômes
  let nouveauStatut: LeadStatut = lead.statut;
  if (bdcEligibles.length > 0) {
    nouveauStatut = "VENTE";
  } else if (devisEligibles.length > 0) {
    if (lead.statut !== "VENTE") nouveauStatut = "DEVIS";
  } else {
    // Aucun devis/BDC éligible — corriger les faux VENTE/DEVIS
    if (lead.statut === "VENTE" || lead.statut === "DEVIS") {
      nouveauStatut = "EN_COURS";
    }
  }

  if (nouveauStatut !== lead.statut) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { statut: nouveauStatut },
    });
  }

  return {
    leadId: lead.id,
    statutBefore: lead.statut,
    statutAfter: nouveauStatut,
    devisCreated,
    bdcCreated,
    caAttribue,
  };
}

/**
 * Rebuild rétroactif — recalcule l'attribution pour tous les leads créés
 * dans la fenêtre passée (défaut : 12 mois).
 */
export async function rebuildAttributionsFenetre(monthsBack = 12): Promise<{
  totalLeads: number;
  devisTotalCreated: number;
  bdcTotalCreated: number;
  statutsChanged: number;
  caAttribueTotal: number;
}> {
  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);

  const leads = await prisma.lead.findMany({
    where: { createdAt: { gte: since } },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  let devisTotalCreated = 0;
  let bdcTotalCreated = 0;
  let statutsChanged = 0;
  let caAttribueTotal = 0;

  for (const lead of leads) {
    try {
      const r = await recomputeLeadAttribution(lead.id);
      devisTotalCreated += r.devisCreated;
      bdcTotalCreated += r.bdcCreated;
      caAttribueTotal += r.caAttribue;
      if (r.statutBefore !== r.statutAfter) statutsChanged++;
    } catch (err) {
      console.error(`[Attribution] Erreur lead ${lead.id}:`, err);
    }
  }

  return {
    totalLeads: leads.length,
    devisTotalCreated,
    bdcTotalCreated,
    statutsChanged,
    caAttribueTotal,
  };
}
