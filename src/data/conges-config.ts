// Jours fériés La Réunion 2026
export const JOURS_FERIES_2026: string[] = [
  "2026-01-01", // Jour de l'An
  "2026-04-06", // Lundi de Pâques
  "2026-05-01", // Fête du travail
  "2026-05-08", // Victoire 1945
  "2026-05-14", // Ascension
  "2026-05-25", // Lundi de Pentecôte
  "2026-07-14", // Fête nationale
  "2026-08-15", // Assomption
  "2026-11-01", // Toussaint
  "2026-11-11", // Armistice
  "2026-12-20", // Abolition de l'esclavage (La Réunion)
  "2026-12-25", // Noël
];

// Périodes non autorisées (zones rouges visuelles sur le calendrier)
export const PERIODES_NON_AUTORISEES_2026: { debut: string; fin: string; label: string }[] = [
  { debut: "2026-02-07", fin: "2026-03-06", label: "Soldes d'été" },
  { debut: "2026-04-27", fin: "2026-05-10", label: "Salon de la maison" },
  { debut: "2026-09-05", fin: "2026-10-02", label: "Soldes d'hiver" },
  { debut: "2026-11-24", fin: "2026-11-28", label: "Black Friday" },
  { debut: "2026-12-15", fin: "2026-12-31", label: "Fêtes et inventaire" },
];

// Types de congés
export const TYPES_CONGE = [
  { value: "conge_paye", label: "Congé payé" },
  { value: "rtt", label: "RTT" },
  { value: "sans_solde", label: "Sans solde" },
  { value: "maladie", label: "Maladie" },
] as const;

// Statuts
export const STATUTS_CONGE = [
  { value: "en_attente", label: "En attente", color: "#F59E0B", bg: "bg-amber-100 text-amber-700" },
  { value: "approuve", label: "Approuvé", color: "#10B981", bg: "bg-green-100 text-green-700" },
  { value: "modifie", label: "Modifié", color: "#3B82F6", bg: "bg-blue-100 text-blue-700" },
  { value: "refuse", label: "Refusé", color: "#EF4444", bg: "bg-red-100 text-red-700" },
] as const;

// Solde CP annuel par défaut
export const SOLDE_CP_ANNUEL = 25;

// Durée max consécutive (en jours ouvrés)
export const DUREE_MAX_CONSECUTIVE = 15; // 3 semaines

/**
 * Calcule le nombre de jours ouvrés entre deux dates (hors repos et fériés).
 * DIMEXOI travaille du mardi au samedi. Repos = dimanche + lundi.
 */
export function calculerJoursOuvres(debut: Date, fin: Date, feries: string[] = JOURS_FERIES_2026): number {
  let jours = 0;
  const current = new Date(debut);
  while (current <= fin) {
    const day = current.getDay();
    const dateStr = current.toISOString().split("T")[0];
    // Repos : dimanche (0) + lundi (1)
    if (day !== 0 && day !== 1 && !feries.includes(dateStr)) {
      jours++;
    }
    current.setDate(current.getDate() + 1);
  }
  return jours;
}

/**
 * Vérifie si une période chevauche une période non autorisée
 */
export function chevauchePeriodesNonAutorisees(
  debut: string,
  fin: string,
  periodes: typeof PERIODES_NON_AUTORISEES_2026 = PERIODES_NON_AUTORISEES_2026
): string[] {
  const alertes: string[] = [];
  for (const p of periodes) {
    if (debut <= p.fin && fin >= p.debut) {
      alertes.push(p.label);
    }
  }
  return alertes;
}
