/**
 * Club Grandis — Programme de fidélité Dimexoi
 *
 * 5 niveaux basés sur l'historique de commandes Sellsy (fenêtre glissante 36 mois).
 * Règle absolue : un client ne descend jamais de niveau.
 * Niv v (Le Tectona) = permanent + sur invitation uniquement.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ClubLevel {
  niveau: number; // 1–5
  slug: "ecorce" | "aubier" | "coeur" | "grain" | "tectona";
  nom: string; // "L'Écorce", etc.
  chiffre: string; // "i" | "ii" | "iii" | "iv" | "v"
  condition: string; // texte lisible
  remise: number; // 5, 10, 15, 20, 25
  minCommandes: number | null; // 1, 2, 3, null, null
  minMontant: number; // 500, 2000, 5000, 10000, 20000
  permanent: boolean; // false sauf niv v
  invitation: boolean; // true seulement niv v
  sellsyTag: string; // "CLUB - Niv 1" … "CLUB - Niv 5"
  brevoSegment: string; // "Club Grandis · i" … "Club Grandis · v"
  brevoListEnvKey: string; // "BREVO_CLUB_LIST_ID_1" … "_5"
  couleur: string; // couleur accent du niveau
}

// ============================================================================
// CONSTANTES NIVEAUX
// ============================================================================

export const CLUB_LEVELS: ClubLevel[] = [
  {
    niveau: 1,
    slug: "ecorce",
    nom: "L'Écorce",
    chiffre: "i",
    condition: "1 commande ≥ 500 €",
    remise: 5,
    minCommandes: 1,
    minMontant: 500,
    permanent: false,
    invitation: false,
    sellsyTag: "CLUB - Niv 1",
    brevoSegment: "Club Grandis · i",
    brevoListEnvKey: "BREVO_CLUB_LIST_ID_1",
    couleur: "#8B9A2B",
  },
  {
    niveau: 2,
    slug: "aubier",
    nom: "L'Aubier",
    chiffre: "ii",
    condition: "2 commandes ou ≥ 2 000 €",
    remise: 10,
    minCommandes: 2,
    minMontant: 2000,
    permanent: false,
    invitation: false,
    sellsyTag: "CLUB - Niv 2",
    brevoSegment: "Club Grandis · ii",
    brevoListEnvKey: "BREVO_CLUB_LIST_ID_2",
    couleur: "#6B7A1A",
  },
  {
    niveau: 3,
    slug: "coeur",
    nom: "Le Cœur",
    chiffre: "iii",
    condition: "3 commandes ou ≥ 5 000 €",
    remise: 15,
    minCommandes: 3,
    minMontant: 5000,
    permanent: false,
    invitation: false,
    sellsyTag: "CLUB - Niv 3",
    brevoSegment: "Club Grandis · iii",
    brevoListEnvKey: "BREVO_CLUB_LIST_ID_3",
    couleur: "#515712",
  },
  {
    niveau: 4,
    slug: "grain",
    nom: "Le Grain",
    chiffre: "iv",
    condition: "≥ 10 000 €",
    remise: 20,
    minCommandes: null,
    minMontant: 10000,
    permanent: false,
    invitation: false,
    sellsyTag: "CLUB - Niv 4",
    brevoSegment: "Club Grandis · iv",
    brevoListEnvKey: "BREVO_CLUB_LIST_ID_4",
    couleur: "#3A3D0E",
  },
  {
    niveau: 5,
    slug: "tectona",
    nom: "Le Tectona",
    chiffre: "v",
    condition: "≥ 20 000 € + invitation",
    remise: 25,
    minCommandes: null,
    minMontant: 20000,
    permanent: true,
    invitation: true,
    sellsyTag: "CLUB - Niv 5",
    brevoSegment: "Club Grandis · v",
    brevoListEnvKey: "BREVO_CLUB_LIST_ID_5",
    couleur: "#1E2008",
  },
];

// ============================================================================
// DA CUSTOM (hors tokens KÒKPIT)
// ============================================================================

export const CLUB_DA = {
  primary: "#515712", // mousse
  primaryLight: "#7a8018",
  bg: "#fafbf2", // ivoire chaud
  bgCard: "#f5f6ec",
  text: "#3a3d0e", // mousse foncé
  textMuted: "#6b7040",
  border: "#d4d9a8",
  accent: "#7a8018",
  fontDisplay: "'Cormorant Garamond', serif",
  fontBody: "'Cormorant Garamond', serif",
} as const;

// ============================================================================
// RÈGLES MÉTIER
// ============================================================================

/** Fenêtre glissante en mois pour le calcul du niveau */
export const FENETRE_GLISSANTE_MOIS = 36;

/**
 * Calcule le niveau Club Grandis d'un client.
 *
 * @param nbCommandes - Nombre de commandes dans la fenêtre 36 mois
 * @param totalMontant - Montant total HT des commandes dans la fenêtre
 * @param niveauActuel - Niveau actuel en base (pour ne jamais descendre)
 * @returns Le niveau calculé (1–5), jamais inférieur à niveauActuel
 */
export function calculerNiveau(
  nbCommandes: number,
  totalMontant: number,
  niveauActuel: number = 0
): number {
  let niveau = 0;

  // Niv 1 : 1 commande ≥ 500 €
  if (nbCommandes >= 1 && totalMontant >= 500) niveau = 1;

  // Niv 2 : 2 commandes OU ≥ 2 000 €
  if (nbCommandes >= 2 || totalMontant >= 2000) niveau = Math.max(niveau, 2);

  // Niv 3 : 3 commandes OU ≥ 5 000 €
  if (nbCommandes >= 3 || totalMontant >= 5000) niveau = Math.max(niveau, 3);

  // Niv 4 : ≥ 10 000 €
  if (totalMontant >= 10000) niveau = Math.max(niveau, 4);

  // Niv 5 : ≥ 20 000 € (+ invitation manuelle — vérifiée côté UI)
  // Note : le passage au niv 5 nécessite aussi une invitation,
  // donc on ne passe PAS automatiquement au niv 5 ici.
  // Le niv 5 n'est attribué que manuellement via l'admin.

  // Règle absolue : ne jamais descendre
  return Math.max(niveau, niveauActuel);
}

/**
 * Retourne la config du niveau par son numéro (1–5).
 */
export function getNiveauConfig(niveau: number): ClubLevel | undefined {
  return CLUB_LEVELS.find((l) => l.niveau === niveau);
}

/**
 * Retourne la date de début de la fenêtre glissante (36 mois avant aujourd'hui).
 */
export function getDebutFenetre(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - FENETRE_GLISSANTE_MOIS);
  return d;
}
