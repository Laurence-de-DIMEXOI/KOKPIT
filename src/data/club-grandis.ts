/**
 * Club Grandis — Programme de fidélité Dimexoi
 *
 * 5 niveaux basés sur le CA TTC des commandes Sellsy (depuis début 2020).
 * Règle absolue : un client ne descend jamais de niveau.
 * Niv V (Le Tectona) = permanent, automatique à ≥ 20 000 € TTC.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ClubLevel {
  niveau: number; // 1–5
  slug: "ecorce" | "aubier" | "coeur" | "grain" | "tectona";
  nom: string; // "L'Écorce", etc.
  chiffre: string; // "I" | "II" | "III" | "IV" | "V"
  condition: string; // texte lisible
  remise: number; // 5, 10, 15, 20, 25
  minCommandes: number | null; // 1, 2, 3, null, null
  minMontant: number; // 500, 2000, 5000, 10000, 20000
  permanent: boolean; // false sauf niv V
  invitation: boolean; // true seulement niv V
  sellsyTag: string; // "CLUB - Niv 1" … "CLUB - Niv 5"
  brevoSegment: string; // "Club Grandis · I" … "Club Grandis · V"
  brevoListEnvKey: string; // "BREVO_CLUB_LIST_ID_1" … "_5"
  couleur: string; // couleur accent du niveau (nuances de #515712)
}

// ============================================================================
// CONSTANTES NIVEAUX
// ============================================================================

export const CLUB_LEVELS: ClubLevel[] = [
  {
    niveau: 1,
    slug: "ecorce",
    nom: "L'Écorce",
    chiffre: "I",
    condition: "1 commande ≥ 500 € TTC",
    remise: 5,
    minCommandes: 1,
    minMontant: 500,
    permanent: false,
    invitation: false,
    sellsyTag: "CLUB - Niv 1",
    brevoSegment: "Club Grandis · I",
    brevoListEnvKey: "BREVO_CLUB_LIST_ID_1",
    couleur: "#7a801e",
  },
  {
    niveau: 2,
    slug: "aubier",
    nom: "L'Aubier",
    chiffre: "II",
    condition: "≥ 2 000 € TTC",
    remise: 10,
    minCommandes: null,
    minMontant: 2000,
    permanent: false,
    invitation: false,
    sellsyTag: "CLUB - Niv 2",
    brevoSegment: "Club Grandis · II",
    brevoListEnvKey: "BREVO_CLUB_LIST_ID_2",
    couleur: "#6b7318",
  },
  {
    niveau: 3,
    slug: "coeur",
    nom: "Le Cœur",
    chiffre: "III",
    condition: "≥ 5 000 € TTC",
    remise: 15,
    minCommandes: null,
    minMontant: 5000,
    permanent: false,
    invitation: false,
    sellsyTag: "CLUB - Niv 3",
    brevoSegment: "Club Grandis · III",
    brevoListEnvKey: "BREVO_CLUB_LIST_ID_3",
    couleur: "#515712",
  },
  {
    niveau: 4,
    slug: "grain",
    nom: "Le Grain",
    chiffre: "IV",
    condition: "≥ 10 000 € TTC",
    remise: 20,
    minCommandes: null,
    minMontant: 10000,
    permanent: false,
    invitation: false,
    sellsyTag: "CLUB - Niv 4",
    brevoSegment: "Club Grandis · IV",
    brevoListEnvKey: "BREVO_CLUB_LIST_ID_4",
    couleur: "#3a3d0d",
  },
  {
    niveau: 5,
    slug: "tectona",
    nom: "Le Tectona",
    chiffre: "V",
    condition: "≥ 20 000 € TTC",
    remise: 25,
    minCommandes: null,
    minMontant: 20000,
    permanent: true,
    invitation: false,
    sellsyTag: "CLUB - Niv 5",
    brevoSegment: "Club Grandis · V",
    brevoListEnvKey: "BREVO_CLUB_LIST_ID_5",
    couleur: "#515712",
  },
];

// ============================================================================
// DA CUSTOM — Monochrome blanc + mousse #515712
// ============================================================================

export const CLUB_DA = {
  primary: "#515712", // mousse principale
  primaryHover: "#6b7318", // hover
  primaryDark: "#3a3d0d", // CTA hover foncé
  bg: "#ffffff", // fond page : blanc pur
  bgCard: "#ffffff", // fond cards : blanc pur
  text: "#515712", // texte : mousse
  textMuted: "rgba(81,87,18,0.50)", // texte discret
  border: "rgba(81,87,18,0.12)", // bordures subtiles
  accent: "#7a801e", // dots, accents légers
  // Titres : Perandory → Cormorant Garamond (fallback Google)
  fontDisplay: "'Perandory', 'Cormorant Garamond', serif",
  // Sous-titres / accents italiques : Burgues Script → Cormorant Garamond italic
  fontAccent: "'Burgues Script', 'Cormorant Garamond', serif",
  // Corps de texte : hérite de la police KOKPIT par défaut (Plus Jakarta Sans)
} as const;

// ============================================================================
// RÈGLES MÉTIER
// ============================================================================

/** Date de début fixe : 1er janvier 2020 */
export const DATE_DEBUT_CLUB = "2020-01-01";

/**
 * Calcule le niveau Club Grandis d'un client.
 *
 * @param nbCommandes - Nombre de commandes depuis début 2020
 * @param totalMontant - Montant total TTC des commandes depuis début 2020
 * @param niveauActuel - Niveau actuel en base (pour ne jamais descendre)
 * @returns Le niveau calculé (1–5), jamais inférieur à niveauActuel
 */
export function calculerNiveau(
  nbCommandes: number,
  totalMontant: number,
  niveauActuel: number = 0
): number {
  let niveau = 0;

  // Niv 1 : 1 commande ≥ 500 € TTC
  if (nbCommandes >= 1 && totalMontant >= 500) niveau = 1;

  // Niv 2 : ≥ 2 000 € TTC (montant seul)
  if (totalMontant >= 2000) niveau = Math.max(niveau, 2);

  // Niv 3 : ≥ 5 000 € TTC (montant seul)
  if (totalMontant >= 5000) niveau = Math.max(niveau, 3);

  // Niv 4 : ≥ 10 000 € TTC
  if (totalMontant >= 10000) niveau = Math.max(niveau, 4);

  // Niv 5 : ≥ 20 000 € TTC
  if (totalMontant >= 20000) niveau = Math.max(niveau, 5);

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
 * Retourne la date de début pour la récupération des commandes.
 * Fixe : 1er janvier 2020.
 */
export function getDebutFenetre(): Date {
  return new Date(DATE_DEBUT_CLUB);
}
