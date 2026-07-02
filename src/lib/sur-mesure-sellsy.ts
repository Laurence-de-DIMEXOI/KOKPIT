import { prisma } from "@/lib/prisma";

// Statuts Sellsy → issue du projet
const WON = new Set(["accepted", "advanced", "invoiced", "partialinvoiced"]);
const LOST = new Set(["refused", "cancelled", "expired"]);

// Ordre des colonnes (pour ne jamais faire régresser un projet)
const ORDER = [
  "DEMANDE", "DESSIN_DEMANDE", "RDV_CLIENT", "DESSIN_EN_COURS",
  "PLANS_PRETS", "NEED_PRICE", "PRIX_RECU", "PRESENTE_CLIENT", "GAGNE", "PERDU",
];
const idx = (s: string) => ORDER.indexOf(s);

export type SyncResult = {
  ok: boolean;
  montant?: number | null;
  statutSellsy?: string | null;
  statutAvant?: string;
  statutApres?: string;
  reason?: string;
};

/**
 * Synchronise UN projet sur-mesure avec Sellsy + fait avancer sa colonne :
 *  - Devis/commande accepté·e (ou converti·e) → GAGNE ; refusé·e/expiré·e/annulé·e → PERDU
 *  - Need Price lié passé en PRIX_RECU → colonne « Prix reçu »
 *  - Récupère le montant (devis ou commande) → montantSellsy
 * Lecture seule depuis la DB locale (Vente/Devis synchronisés par le cron Sellsy 2h).
 */
export async function syncProjetSellsy(projetId: string): Promise<SyncResult> {
  const projet = await prisma.projetSurMesure.findFirst({
    where: { id: projetId, deletedAt: null },
    select: { id: true, numeroSellsy: true, statut: true, needPrice: { select: { statut: true } } },
  });
  if (!projet) return { ok: false, reason: "introuvable" };

  let montant: number | null = null;
  let statutSellsy: string | null = null;
  let statutConversion: string | null = null;
  let typeSellsy: "DEVIS" | "BON_COMMANDE" | null = null;

  const numero = (projet.numeroSellsy || "").toUpperCase().trim();
  if (numero.startsWith("BCDI")) {
    typeSellsy = "BON_COMMANDE";
    const vente = await prisma.vente.findFirst({
      where: { numero: { equals: projet.numeroSellsy!, mode: "insensitive" } },
      select: { montant: true, statutSellsy: true },
    });
    if (vente) { montant = vente.montant; statutSellsy = vente.statutSellsy; statutConversion = "converti"; }
  } else if (numero.startsWith("DEPI")) {
    typeSellsy = "DEVIS";
    const devis = await prisma.devis.findFirst({
      where: { numero: { equals: projet.numeroSellsy!, mode: "insensitive" } },
      select: { montant: true, statutSellsy: true, sellsyQuoteId: true },
    });
    if (devis) {
      montant = devis.montant;
      statutSellsy = devis.statutSellsy;
      if (devis.sellsyQuoteId) {
        const liaison = await prisma.liaisonDevisCommande.findFirst({ where: { estimateId: Number(devis.sellsyQuoteId) } });
        statutConversion = liaison ? "converti" : "non_converti";
      } else {
        statutConversion = "non_converti";
      }
    }
  }

  const st = (statutSellsy || "").toLowerCase();
  const won = statutConversion === "converti" || WON.has(st);
  const lost = LOST.has(st);

  // Colonne cible — sans régression
  let statutApres = projet.statut as string;
  if (projet.needPrice?.statut === "PRIX_RECU" && idx(statutApres) < idx("PRIX_RECU")) statutApres = "PRIX_RECU";
  if (lost) statutApres = "PERDU";
  else if (won) statutApres = "GAGNE";

  const data: Record<string, unknown> = {};
  if (statutApres !== projet.statut) data.statut = statutApres;
  if (montant !== null) {
    data.montantSellsy = montant;
    data.statutConversion = statutConversion;
    data.typeSellsy = typeSellsy;
    data.montantSyncedAt = new Date();
  }
  if (Object.keys(data).length > 0) {
    await prisma.projetSurMesure.update({ where: { id: projet.id }, data: data as never });
  }

  return { ok: true, montant, statutSellsy, statutAvant: projet.statut, statutApres };
}
