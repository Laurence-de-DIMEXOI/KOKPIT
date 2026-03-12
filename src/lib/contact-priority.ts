/**
 * Calcul de priorité contact
 *
 * Signaux :
 * - Devis envoyé >7j sans réponse : +30
 * - Devis expirant <5j : +25
 * - Commande <90j : +20
 * - Devis créé <30j : +20
 * - Inactif >60j (aucune activité) : +15
 * - Dormant >30j (pas de nouveau devis/commande) : +10
 *
 * Niveaux :
 * - 0-20 : Froid (gris)
 * - 21-50 : Tiède (#F4B400)
 * - 51-100 : Chaud (#E24A4A)
 */

export type PriorityLevel = "cold" | "warm" | "hot";

export interface PriorityResult {
  score: number;
  level: PriorityLevel;
  reasons: string[];
  color: string;
  label: string;
}

interface DevisInfo {
  statut: string;
  dateEnvoi: string | null;
  createdAt: string;
}

interface VenteInfo {
  dateVente: string | null;
  createdAt: string;
}

interface ContactInfo {
  lifecycleStage: string;
  createdAt: string;
  updatedAt?: string;
}

function daysBetween(d1: Date, d2: Date): number {
  return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
}

export function calculatePriority(
  contact: ContactInfo,
  devis: DevisInfo[],
  ventes: VenteInfo[]
): PriorityResult {
  let score = 0;
  const reasons: string[] = [];
  const now = new Date();

  // 1. Devis envoyé >7j sans réponse (statut "sent" ou "read")
  const pendingDevis = devis.filter(
    (d) => d.statut === "sent" || d.statut === "read" || d.statut === "ENVOYE"
  );
  for (const d of pendingDevis) {
    const sentDate = new Date(d.dateEnvoi || d.createdAt);
    const daysSince = daysBetween(now, sentDate);
    if (daysSince > 7) {
      score += 30;
      reasons.push(`Devis en attente depuis ${daysSince}j`);
      break; // Un seul bonus max
    }
  }

  // 2. Devis expirant <5j (statut sent/read, envoyé il y a ~25-30j)
  for (const d of pendingDevis) {
    const sentDate = new Date(d.dateEnvoi || d.createdAt);
    const daysSince = daysBetween(now, sentDate);
    if (daysSince >= 25 && daysSince <= 30) {
      score += 25;
      reasons.push("Devis bientôt expiré");
      break;
    }
  }

  // 3. Commande récente <90j
  const recentVente = ventes.find((v) => {
    const d = new Date(v.dateVente || v.createdAt);
    return daysBetween(now, d) <= 90;
  });
  if (recentVente) {
    score += 20;
    reasons.push("Commande récente (<90j)");
  }

  // 4. Devis créé <30j
  const recentDevis = devis.find((d) => {
    const created = new Date(d.createdAt);
    return daysBetween(now, created) <= 30;
  });
  if (recentDevis) {
    score += 20;
    reasons.push("Devis récent (<30j)");
  }

  // 5. Inactif >60j — ni devis ni commande depuis 60j
  const lastActivity = getLastActivityDate(devis, ventes);
  if (lastActivity) {
    const daysSinceActivity = daysBetween(now, lastActivity);
    if (daysSinceActivity > 60) {
      score += 15;
      reasons.push(`Inactif depuis ${daysSinceActivity}j`);
    } else if (daysSinceActivity > 30) {
      // 6. Dormant >30j
      score += 10;
      reasons.push(`Dormant depuis ${daysSinceActivity}j`);
    }
  } else {
    // Aucune activité → check la date de création
    const daysSinceCreation = daysBetween(now, new Date(contact.createdAt));
    if (daysSinceCreation > 60) {
      score += 15;
      reasons.push("Aucune activité commerciale");
    } else if (daysSinceCreation > 30) {
      score += 10;
      reasons.push("Contact récent sans activité");
    }
  }

  // Cap à 100
  score = Math.min(score, 100);

  // Déterminer le niveau
  let level: PriorityLevel;
  let color: string;
  let label: string;

  if (score >= 51) {
    level = "hot";
    color = "#E24A4A";
    label = "Chaud";
  } else if (score >= 21) {
    level = "warm";
    color = "#F4B400";
    label = "Tiède";
  } else {
    level = "cold";
    color = "#8592A3";
    label = "Froid";
  }

  return { score, level, reasons, color, label };
}

function getLastActivityDate(devis: DevisInfo[], ventes: VenteInfo[]): Date | null {
  const dates: Date[] = [];

  for (const d of devis) {
    dates.push(new Date(d.dateEnvoi || d.createdAt));
  }
  for (const v of ventes) {
    dates.push(new Date(v.dateVente || v.createdAt));
  }

  if (dates.length === 0) return null;
  return dates.reduce((latest, d) => (d > latest ? d : latest));
}
