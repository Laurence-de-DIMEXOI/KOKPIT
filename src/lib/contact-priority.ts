/**
 * Scoring de priorité contact DIMEXOI
 *
 * Score sur 100 points, 3 composantes :
 *   Intention (0-50) + Historique (0-30) + Fraîcheur (0-20)
 *
 * 4 niveaux :
 *   Froid    (0-25)   — Gris    — Pas de priorité
 *   Tiède    (26-55)  — Jaune   — À surveiller
 *   Chaud    (56-80)  — Orange  — À contacter cette semaine
 *   Brûlant  (81-100) — Rouge   — À contacter aujourd'hui
 */

export type PriorityLevel = "cold" | "warm" | "hot" | "burning";

export interface PriorityResult {
  score: number;
  level: PriorityLevel;
  reasons: string[];
  color: string;
  label: string;
}

interface DevisInfo {
  statut: string;
  montant?: number;
  dateEnvoi: string | null;
  createdAt: string;
}

interface VenteInfo {
  montant?: number;
  dateVente: string | null;
  createdAt: string;
}

interface DemandeInfo {
  dateDemande?: string | null;
  createdAt: string;
}

interface ContactInfo {
  lifecycleStage: string;
  createdAt: string;
}

function daysSince(dateStr: string | null | undefined): number {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return Infinity;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================
// COMPOSANTE 1 : INTENTION (0-50)
// ============================
function scoreIntention(
  devis: DevisInfo[],
  demandes: DemandeInfo[]
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // A demandé un devis dans les 7 derniers jours (★★★★★ = +20)
  const demandeRecente = demandes.find((d) => {
    const days = daysSince(d.dateDemande || d.createdAt);
    return days <= 7;
  });
  if (demandeRecente) {
    const days = daysSince(demandeRecente.dateDemande || demandeRecente.createdAt);
    score += 20;
    reasons.push(`Demande il y a ${days}j`);
  }

  // Devis ENVOYÉ ou EN_ATTENTE dans les 30 derniers jours (actif commercialement)
  const devisEnCours = devis.filter(
    (d) =>
      (d.statut === "ENVOYE" || d.statut === "EN_ATTENTE") &&
      daysSince(d.dateEnvoi || d.createdAt) <= 30
  );

  // Devis envoyé 8-30j sans réponse → relance nécessaire (★★★ = +15)
  const devisARelancer = devisEnCours.find((d) => {
    const days = daysSince(d.dateEnvoi || d.createdAt);
    return days >= 8 && days <= 30 && d.statut === "ENVOYE";
  });
  if (devisARelancer) {
    const days = daysSince(devisARelancer.dateEnvoi || devisARelancer.createdAt);
    score += 15;
    reasons.push(`Devis sans réponse (${days}j)`);
  }

  // Devis expirant dans < 5 jours (envoyé il y a ~25-30j) (★★★★ = +15)
  const devisExpirant = devisEnCours.find((d) => {
    const days = daysSince(d.dateEnvoi || d.createdAt);
    return days >= 25;
  });
  if (devisExpirant) {
    score += 15;
    reasons.push("Devis bientôt expiré");
  }

  // Devis récent (<7j) = intention très fraîche (bonus +10 si pas déjà demande)
  if (!demandeRecente) {
    const devisTresFrais = devis.find(
      (d) => daysSince(d.createdAt) <= 7
    );
    if (devisTresFrais) {
      score += 10;
      reasons.push("Devis créé cette semaine");
    }
  }

  return { score: Math.min(score, 50), reasons };
}

// ============================
// COMPOSANTE 2 : HISTORIQUE (0-30)
// ============================
function scoreHistorique(
  devis: DevisInfo[],
  ventes: VenteInfo[]
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const nbVentes = ventes.length;
  const nbDevis = devis.length;

  // 2+ commandes → client fidèle (★★★★★ = +15)
  if (nbVentes >= 2) {
    score += 15;
    reasons.push(`Client fidèle (${nbVentes} commandes)`);
  }
  // 1 commande → a déjà acheté (★★★★ = +10)
  else if (nbVentes === 1) {
    score += 10;
    reasons.push("A déjà commandé");
  }

  // Panier moyen élevé (> 2000€ HT) (★★★ = +8)
  if (nbVentes > 0) {
    const totalVentes = ventes.reduce((sum, v) => sum + (v.montant || 0), 0);
    const panierMoyen = totalVentes / nbVentes;
    if (panierMoyen > 2000) {
      score += 8;
      reasons.push(`Panier moyen ${Math.round(panierMoyen).toLocaleString("fr-FR")} €`);
    }
  }

  // Beaucoup de devis sans commande → tire-kicker (★ = -5, malus)
  if (nbDevis >= 3 && nbVentes === 0) {
    score -= 5;
    reasons.push(`${nbDevis} devis sans commande`);
  }

  // Client inactif >12 mois qui revient (★★★ = +7)
  if (nbVentes > 0) {
    const dernierAchat = ventes.reduce((latest, v) => {
      const d = daysSince(v.dateVente || v.createdAt);
      return d < latest ? d : latest;
    }, Infinity);
    if (dernierAchat > 365) {
      // Mais s'il a un devis récent → il revient !
      const devisRecent = devis.find((d) => daysSince(d.createdAt) <= 60);
      if (devisRecent) {
        score += 7;
        reasons.push("Client de retour après >1 an");
      }
    }
  }

  return { score: Math.max(Math.min(score, 30), 0), reasons };
}

// ============================
// COMPOSANTE 3 : FRAÎCHEUR (0-20)
// ============================
function scoreFraicheur(
  contact: ContactInfo,
  devis: DevisInfo[],
  ventes: VenteInfo[],
  demandes: DemandeInfo[]
): { score: number; reasons: string[] } {
  const reasons: string[] = [];

  // Trouver la date de la dernière activité (demande, devis, ou vente)
  let lastActivityDays = Infinity;

  for (const d of demandes) {
    const days = daysSince(d.dateDemande || d.createdAt);
    if (days < lastActivityDays) lastActivityDays = days;
  }
  for (const d of devis) {
    const days = daysSince(d.dateEnvoi || d.createdAt);
    if (days < lastActivityDays) lastActivityDays = days;
  }
  for (const v of ventes) {
    const days = daysSince(v.dateVente || v.createdAt);
    if (days < lastActivityDays) lastActivityDays = days;
  }

  // Si aucune activité, utiliser la date de création du contact
  if (lastActivityDays === Infinity) {
    lastActivityDays = daysSince(contact.createdAt);
  }

  // Score de fraîcheur décroissant avec le temps
  let score: number;

  if (lastActivityDays <= 3) {
    score = 20;
    reasons.push("Actif dans les 3 derniers jours");
  } else if (lastActivityDays <= 7) {
    score = 16;
    reasons.push("Actif cette semaine");
  } else if (lastActivityDays <= 14) {
    score = 12;
    reasons.push("Actif ces 2 dernières semaines");
  } else if (lastActivityDays <= 30) {
    score = 8;
    reasons.push("Actif ce mois-ci");
  } else if (lastActivityDays <= 60) {
    score = 4;
    reasons.push(`Dernier contact il y a ${lastActivityDays}j`);
  } else {
    score = 0;
    if (lastActivityDays < Infinity) {
      reasons.push(`Inactif depuis ${lastActivityDays}j`);
    } else {
      reasons.push("Aucune activité");
    }
  }

  // Devis expiré sans suite → signal éteint (-5)
  const devisExpire = devis.find(
    (d) => d.statut === "EXPIRE" || d.statut === "REFUSE"
  );
  if (devisExpire && !devis.find((d) => d.statut === "ENVOYE" || d.statut === "EN_ATTENTE")) {
    score = Math.max(score - 5, 0);
    reasons.push("Dernier devis expiré/refusé");
  }

  return { score: Math.min(score, 20), reasons };
}

// ============================
// CALCUL PRINCIPAL
// ============================
export function calculatePriority(
  contact: ContactInfo,
  devis: DevisInfo[],
  ventes: VenteInfo[],
  demandes: DemandeInfo[] = []
): PriorityResult {
  const intention = scoreIntention(devis, demandes);
  const historique = scoreHistorique(devis, ventes);
  const fraicheur = scoreFraicheur(contact, devis, ventes, demandes);

  const totalScore = Math.max(0, Math.min(100,
    intention.score + historique.score + fraicheur.score
  ));

  const reasons = [
    ...intention.reasons,
    ...historique.reasons,
    ...fraicheur.reasons,
  ];

  // Déterminer le niveau
  let level: PriorityLevel;
  let color: string;
  let label: string;

  if (totalScore >= 81) {
    level = "burning";
    color = "#D32F2F";
    label = "Brûlant";
  } else if (totalScore >= 56) {
    level = "hot";
    color = "#E65100";
    label = "Chaud";
  } else if (totalScore >= 26) {
    level = "warm";
    color = "#F4B400";
    label = "Tiède";
  } else {
    level = "cold";
    color = "#8592A3";
    label = "Froid";
  }

  return { score: totalScore, level, reasons, color, label };
}
