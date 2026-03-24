/**
 * Segmentation RFM — 5 segments pour export Brevo
 *
 * Basé sur les scores R (1-5), F (1-5), M (1-5) calculés dans src/lib/rfm.ts
 */

export interface RfmSegment {
  id: string;
  label: string;
  description: string;
  action: string;
  brevoListName: string;
  couleur: string;
  match: (r: number, f: number, m: number) => boolean;
}

export const RFM_SEGMENTS: RfmSegment[] = [
  {
    id: "champions",
    label: "Champions",
    description: "Récent, fréquent, gros panier",
    action: "Invitation événement VIP",
    brevoListName: "RFM · Champions",
    couleur: "#10B981", // vert
    match: (r, f, m) => r >= 4 && f >= 3 && m >= 3,
  },
  {
    id: "loyaux",
    label: "Clients loyaux",
    description: "Achats réguliers, bon montant",
    action: "Cross-sell bain → cuisine",
    brevoListName: "RFM · Clients loyaux",
    couleur: "#3B82F6", // bleu
    match: (r, f, m) => f >= 2 && m >= 2 && r >= 2,
  },
  {
    id: "nouveaux",
    label: "Nouveaux clients",
    description: "1 commande récente",
    action: "Séquence post-achat Brevo",
    brevoListName: "RFM · Nouveaux",
    couleur: "#8B5CF6", // violet
    match: (r, f, _m) => r >= 4 && f === 1,
  },
  {
    id: "a_risque",
    label: "À risque",
    description: "Bonne fidélité passée, plus actif",
    action: "Campagne réactivation urgente",
    brevoListName: "RFM · À risque",
    couleur: "#F59E0B", // ambre
    match: (r, f, m) => r <= 2 && (f >= 2 || m >= 2),
  },
  {
    id: "perdus",
    label: "Perdus",
    description: "Inactifs depuis longtemps",
    action: "Campagne 'on pense à vous'",
    brevoListName: "RFM · Perdus",
    couleur: "#EF4444", // rouge
    match: (r, f, _m) => r <= 1 && f <= 1,
  },
];

/**
 * Détermine le segment RFM d'un contact.
 * Les segments sont testés dans l'ordre — le premier match gagne.
 */
export function getSegment(
  recence: number,
  frequence: number,
  montant: number
): RfmSegment {
  for (const segment of RFM_SEGMENTS) {
    if (segment.match(recence, frequence, montant)) {
      return segment;
    }
  }
  // Fallback : "perdus" si aucun match
  return RFM_SEGMENTS[4];
}
