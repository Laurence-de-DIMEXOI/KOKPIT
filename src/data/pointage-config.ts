/**
 * Pointage — Configuration et calculs
 *
 * Horaires DIMEXOI : 9h-17h, 1h pause, 7h travail effectif/jour.
 * Weekend : dimanche (0) + lundi (1).
 */

// ============================================================================
// CONSTANTES
// ============================================================================

export const HEURES_THEORIQUES_JOUR = 7;
export const PAUSE_DEFAUT_HEURES = 1;

// ============================================================================
// ÉTATS DU BOUTON
// ============================================================================

export const POINTAGE_ETATS = {
  NON_ARRIVE: {
    label: "Pointer mon arrivée",
    couleur: "yellow",
    disabled: false,
    action: "arrivee",
  },
  ARRIVE: {
    label: "Partir en pause",
    couleur: "outline",
    disabled: false,
    action: "debutPause",
  },
  EN_PAUSE: {
    label: "Reprendre le travail",
    couleur: "active",
    disabled: false,
    action: "finPause",
  },
  RETOUR_PAUSE: {
    label: "Pointer mon départ",
    couleur: "outline",
    disabled: false,
    action: "depart",
  },
  JOURNEE_FINIE: {
    label: "Journée terminée ✓",
    couleur: "green",
    disabled: true,
    action: "",
  },
} as const;

export type PointageEtat = keyof typeof POINTAGE_ETATS;

// ============================================================================
// FONCTIONS
// ============================================================================

/** Détermine l'état actuel du pointage */
export function getPointageEtat(pointage: {
  arrivee: string | Date | null;
  debutPause: string | Date | null;
  finPause: string | Date | null;
  depart: string | Date | null;
} | null): PointageEtat {
  if (!pointage || !pointage.arrivee) return "NON_ARRIVE";
  if (!pointage.debutPause) return "ARRIVE";
  if (!pointage.finPause) return "EN_PAUSE";
  if (!pointage.depart) return "RETOUR_PAUSE";
  return "JOURNEE_FINIE";
}

/** Calcule les heures travaillées et supplémentaires */
export function calculerHeuresTravaillees(
  arrivee: Date,
  depart: Date,
  debutPause: Date | null,
  finPause: Date | null,
  pauseDefaut: number = PAUSE_DEFAUT_HEURES
): { heuresTravaillees: number; heuresSupp: number } {
  const totalMs = depart.getTime() - arrivee.getTime();

  let pauseMs: number;
  if (debutPause && finPause) {
    pauseMs = finPause.getTime() - debutPause.getTime();
    // Borner entre 0 et 3h
    pauseMs = Math.max(0, Math.min(pauseMs, 3 * 3600 * 1000));
  } else {
    pauseMs = pauseDefaut * 3600 * 1000;
  }

  const travailMs = Math.max(0, totalMs - pauseMs);
  const heuresTravaillees = Math.round((travailMs / 3600000) * 100) / 100;
  const heuresSupp =
    Math.round((heuresTravaillees - HEURES_THEORIQUES_JOUR) * 100) / 100;

  return { heuresTravaillees, heuresSupp };
}

/** Formate une durée en heures → "+2h30" ou "-0h45" */
export function formatDuree(heures: number): string {
  const signe = heures >= 0 ? "+" : "-";
  const abs = Math.abs(heures);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `${signe}${h}h${String(m).padStart(2, "0")}`;
}

/** Formate un DateTime en HH:MM (fuseau La Réunion UTC+4) */
export function formatHeure(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Indian/Reunion",
  });
}

/** Vérifie si un jour est travaillé (mardi-samedi) */
export function isJourTravaille(date: Date): boolean {
  const day = date.getDay();
  return day >= 2 && day <= 6; // 2=mardi … 6=samedi
}

/** Types de statut pour l'affichage équipe */
export const STATUT_BADGES = {
  TERMINE: { label: "Terminé", couleur: "bg-green-500", emoji: "✅" },
  AU_TRAVAIL: { label: "Au travail", couleur: "bg-blue-500", emoji: "🔵" },
  EN_PAUSE: { label: "En pause", couleur: "bg-yellow-500", emoji: "🟡" },
  ABSENT: { label: "Absent", couleur: "bg-gray-400", emoji: "⚪" },
  INCOMPLET: { label: "Incomplet", couleur: "bg-red-500", emoji: "🔴" },
} as const;

/** Détermine le statut badge pour l'affichage équipe */
export function getStatutBadge(pointage: {
  arrivee: string | Date | null;
  debutPause: string | Date | null;
  finPause: string | Date | null;
  depart: string | Date | null;
} | null) {
  if (!pointage || !pointage.arrivee) return STATUT_BADGES.ABSENT;
  if (pointage.depart) return STATUT_BADGES.TERMINE;
  if (pointage.debutPause && !pointage.finPause) return STATUT_BADGES.EN_PAUSE;
  return STATUT_BADGES.AU_TRAVAIL;
}
