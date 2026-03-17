/**
 * Kit Contenu Anti-IA — 5 Formats Signatures DIMEXOI
 * Données statiques, pas de table Prisma.
 * Utilisé uniquement dans le PostModal quand label = VIDEO_REEL ou STORY.
 */

export type FormatAntiIA = {
  id: string;
  nom: string;
  label: "VIDEO_REEL" | "STORY";
  frequence: string;
  duree: string;
  plateforme: string;
  script: string[];
  titreSuggere: string;
  descriptionSuggeree: string;
};

export const FORMATS_ANTI_IA: FormatAntiIA[] = [
  {
    id: "le-grain",
    nom: "LE GRAIN",
    label: "VIDEO_REEL",
    frequence: "2x par mois",
    duree: "8-12 secondes",
    plateforme: "Reels Instagram + Story",
    script: [
      "Plan 1 (3s) — Vue d'ensemble du meuble, fixe",
      "Plan 2 (5s) — Gros plan main qui glisse sur le bois, lumière rasante",
      "Plan 3 (3s) — Zoom arrière lent, on voit le meuble entier",
      "→ Musique : instrumentale douce, pas de paroles",
      "→ Aucun texte à l'écran pendant la vidéo",
      "→ Légende : nom de la finition + hashtags",
    ],
    titreSuggere: "Réel — LE GRAIN",
    descriptionSuggeree:
      "Gros plan texture teck. Plan 1 : vue ensemble (3s). Plan 2 : main sur le bois lumière rasante (5s). Plan 3 : zoom arrière (3s). Musique instrumentale, aucune parole.",
  },
  {
    id: "la-visite",
    nom: "LA VISITE",
    label: "VIDEO_REEL",
    frequence: "1x par mois (alterner SUD / NORD)",
    duree: "20-25 secondes",
    plateforme: "Reels Instagram",
    script: [
      "Plan 1 (3s) — Entrée du showroom (extérieur → intérieur)",
      "Plan 2 (5s) — Panoramique lent sur la première pièce",
      "Plan 3 (5s) — Focus sur un meuble phare (SDB ou chambre)",
      "Plan 4 (4s) — Gros plan détail (finition, poignée, vasque)",
      "Plan 5 (5s) — Recul final, ambiance globale",
      "→ Musique : lo-fi ou jazz léger",
      '→ Texte : nom du showroom uniquement, 3 dernières secondes',
      '→ Légende : "Venez nous rendre visite 📍 [adresse]"',
    ],
    titreSuggere: "Réel — LA VISITE · Showroom [SUD/NORD]",
    descriptionSuggeree:
      "Visite guidée showroom. 5 plans : entrée → panoramique → meuble phare → détail → recul. 20-25s. Musique lo-fi. Alterner SUD et NORD chaque mois.",
  },
  {
    id: "la-question",
    nom: "LA QUESTION DU MOIS",
    label: "STORY",
    frequence: "1x par semaine",
    duree: "Story photo fixe",
    plateforme: "Story Instagram",
    script: [
      "Fond : photo d'un meuble ou pièce Dimexoi (pas de texte lourd)",
      "Ajouter sticker sondage OU question ouverte OU quiz",
      '"Teck miel ou cérusé ?", "Quelle pièce vous rend le plus fier ?"',
      "→ Republier les résultats en Story J+1 avec commentaire chaleureux",
    ],
    titreSuggere: "Story — LA QUESTION · [sujet]",
    descriptionSuggeree:
      "Story interactive avec sticker sondage ou question ouverte. Photo meuble en fond. Republier résultats J+1.",
  },
  {
    id: "la-recompense",
    nom: "LA RÉCOMPENSE",
    label: "STORY",
    frequence: "1x par mois ou à la demande",
    duree: "Post carrousel ou photo",
    plateforme: "Feed Instagram + Facebook",
    script: [
      "Photo principale : intérieur client avec meuble installé",
      "Légende ligne 1 : remerciement nominatif (Mme T., M. R., Famille B.)",
      "Légende ligne 2 : description courte (sur mesure / pièce / finition)",
      "Légende ligne 3 : CTA avis Google",
      "→ Toujours mentionner : sur mesure / teck / La Réunion",
    ],
    titreSuggere: "Post — LA RÉCOMPENSE · [prénom client]",
    descriptionSuggeree:
      "Photo client avec meuble installé. Remerciement nominatif + description projet + CTA avis Google. Mentionner : sur mesure, teck, La Réunion.",
  },
  {
    id: "le-teasing",
    nom: "LE TEASING",
    label: "STORY",
    frequence: "À chaque nouvelle arrivée / retour de stock",
    duree: "3-5 Stories ou 1 post mystère",
    plateforme: "Story + Feed Instagram",
    script: [
      "Story 1 : Photo très floue ou ombre portée du meuble",
      '  → Texte : "Il arrive… [date]"',
      "Story 2 (J+2) : Détail partiel sans montrer l'ensemble",
      '  → Texte : "Tu le reconnais ?"',
      "Story 3 (J+4) : Révélation complète",
      '  → Texte : "Le voilà. Disponible dès maintenant. 📍 SUD + NORD"',
      "→ Post feed le jour de la révélation",
    ],
    titreSuggere: "Teasing — [nom meuble] · Révélation [date]",
    descriptionSuggeree:
      "Teasing en 3 actes. Story 1 : photo floue (J). Story 2 : détail partiel (J+2). Story 3 : révélation (J+4). Post feed le jour de la révélation.",
  },
];
