/**
 * Filtre standard "rapport commercial Laurence" — règle validée mai 2026.
 *
 * Inclut uniquement les BDC / Devis qui sont :
 *  - statut Sellsy ≠ cancelled / refused / expired
 *  - montant > 1 €
 *  - custom field "Etat des produit" IN :
 *      EN STOCK · SUR COMMANDE · ARRIVAGE M+1/2/3 · 1 PARTIE EN STOCK - 1 PARTIE SUR COMMANDE
 *
 * Cette règle reflète l'extraction manuelle Laurence dans Sellsy. Permet de
 * matcher les chiffres officiels du reporting mensuel.
 */

import type { Prisma } from "@prisma/client";

export const ETATS_PRODUIT_VALIDES = [
  "EN STOCK",
  "SUR COMMANDE",
  "ARRIVAGE M+1/2/3",
  "ARRIVAGE M+1",
  "ARRIVAGE M+2",
  "ARRIVAGE M+3",
  "1 PARTIE EN STOCK - 1 PARTIE SUR COMMANDE",
];

export const STATUTS_SELLSY_EXCLUS = ["cancelled", "canceled", "refused", "rejected", "expired"];

/** Where Prisma à appliquer aux requêtes Vente (BDC) pour le reporting mensuel. */
export function reportingFilterVente(): Prisma.VenteWhereInput {
  return {
    montant: { gt: 1 },
    AND: [
      {
        OR: [
          { statutSellsy: null },
          { statutSellsy: { notIn: STATUTS_SELLSY_EXCLUS } },
        ],
      },
      {
        // Si etatProduit pas encore renseigné on garde par tolérance ;
        // sinon on filtre strictement sur la liste valide.
        OR: [
          { etatProduit: null },
          { etatProduit: { in: ETATS_PRODUIT_VALIDES } },
        ],
      },
    ],
  };
}

/** Where Prisma à appliquer aux requêtes Devis pour le reporting mensuel. */
export function reportingFilterDevis(): Prisma.DevisWhereInput {
  return {
    montant: { gt: 1 },
    AND: [
      {
        OR: [
          { statutSellsy: null },
          { statutSellsy: { notIn: STATUTS_SELLSY_EXCLUS } },
        ],
      },
      {
        OR: [
          { etatProduit: null },
          { etatProduit: { in: ETATS_PRODUIT_VALIDES } },
        ],
      },
    ],
  };
}

/** Variante stricte (exige etatProduit renseigné — pour quand le backfill est complet). */
export function reportingFilterVenteStrict(): Prisma.VenteWhereInput {
  return {
    montant: { gt: 1 },
    statutSellsy: { notIn: STATUTS_SELLSY_EXCLUS },
    etatProduit: { in: ETATS_PRODUIT_VALIDES },
  };
}

export function reportingFilterDevisStrict(): Prisma.DevisWhereInput {
  return {
    montant: { gt: 1 },
    statutSellsy: { notIn: STATUTS_SELLSY_EXCLUS },
    etatProduit: { in: ETATS_PRODUIT_VALIDES },
  };
}
