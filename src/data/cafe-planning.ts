/**
 * Planning lavage machine à café 2026
 * Rotation hebdomadaire : Daniella, Elaury, Laurence, Michelle
 * Semaine = mardi au samedi (repos dimanche + lundi)
 */

// Chaque entrée : [mois (1-12), jour du mardi de début de semaine, prénom responsable]
const PLANNING_2026: [number, number, string][] = [
  // Janvier
  [1, 1, "Daniella"],   // S1 (commence jeudi 1er)
  [1, 6, "Elaury"],     // S2
  [1, 13, "Laurence"],  // S3
  [1, 20, "Michelle"],  // S4
  [1, 27, "Daniella"],  // S5
  // Février
  [2, 3, "Elaury"],
  [2, 10, "Laurence"],
  [2, 17, "Michelle"],
  [2, 24, "Daniella"],
  // Mars
  [3, 3, "Elaury"],
  [3, 10, "Laurence"],
  [3, 17, "Michelle"],
  [3, 24, "Daniella"],
  [3, 31, "Elaury"],
  // Avril
  [4, 7, "Laurence"],
  [4, 14, "Michelle"],
  [4, 21, "Daniella"],
  [4, 28, "Elaury"],
  // Mai
  [5, 5, "Laurence"],
  [5, 12, "Michelle"],
  [5, 19, "Daniella"],
  [5, 26, "Elaury"],
  // Juin
  [6, 2, "Laurence"],
  [6, 9, "Michelle"],
  [6, 16, "Daniella"],
  [6, 23, "Elaury"],
  [6, 30, "Laurence"],
  // Juillet
  [7, 7, "Michelle"],
  [7, 14, "Daniella"],
  [7, 21, "Elaury"],
  [7, 28, "Laurence"],
  // Août
  [8, 4, "Michelle"],
  [8, 11, "Daniella"],
  [8, 18, "Elaury"],
  [8, 25, "Laurence"],
  // Septembre
  [9, 1, "Michelle"],
  [9, 8, "Daniella"],
  [9, 15, "Elaury"],
  [9, 22, "Laurence"],
  [9, 29, "Michelle"],
  // Octobre
  [10, 6, "Daniella"],
  [10, 13, "Elaury"],
  [10, 20, "Laurence"],
  [10, 27, "Michelle"],
  // Novembre
  [11, 3, "Daniella"],
  [11, 10, "Elaury"],
  [11, 17, "Laurence"],
  [11, 24, "Michelle"],
  // Décembre
  [12, 1, "Daniella"],
  [12, 8, "Elaury"],
  [12, 15, "Laurence"],
  [12, 22, "Michelle"],
  [12, 29, "Daniella"],
];

/**
 * Vérifie si c'est la semaine café d'un utilisateur.
 * @param prenom - Prénom de l'utilisateur
 * @param date - Date à vérifier (défaut: aujourd'hui)
 * @returns Le prénom du responsable café de la semaine, ou null
 */
export function getResponsableCafe(date?: Date): string | null {
  const d = date || new Date();
  const mois = d.getMonth() + 1;
  const jour = d.getDate();

  // Trouver la semaine qui contient cette date
  // On cherche la dernière entrée dont le jour de début est <= au jour actuel dans le même mois
  // ou le mois précédent si on est en début de mois
  let responsable: string | null = null;

  for (const [m, j, prenom] of PLANNING_2026) {
    const debutSemaine = new Date(2026, m - 1, j);
    const finSemaine = new Date(2026, m - 1, j + 6); // samedi = mardi + 4, mais on prend large

    if (d >= debutSemaine && d <= finSemaine) {
      responsable = prenom;
    }
  }

  // Fallback: trouver la semaine la plus récente avant la date
  if (!responsable) {
    let bestMatch: string | null = null;
    let bestDate = new Date(0);
    for (const [m, j, prenom] of PLANNING_2026) {
      const debutSemaine = new Date(2026, m - 1, j);
      if (debutSemaine <= d && debutSemaine > bestDate) {
        bestDate = debutSemaine;
        bestMatch = prenom;
      }
    }
    responsable = bestMatch;
  }

  return responsable;
}

/**
 * Vérifie si c'est la semaine café d'un utilisateur donné.
 */
export function estSemaineCafe(prenom: string, date?: Date): boolean {
  const responsable = getResponsableCafe(date);
  if (!responsable) return false;
  return responsable.toLowerCase() === prenom.toLowerCase();
}

/** Messages fun pour le popup café */
export const MESSAGES_CAFE = [
  "C'est ta semaine café ! La machine compte sur toi.",
  "Alerte café ! Cette semaine, la machine est sous ta responsabilité.",
  "Mission de la semaine : garder la machine à café au top !",
  "Rappel : la machine à café t'attend pour son nettoyage hebdomadaire.",
  "Cette semaine, tu es le gardien du café. Fais-nous honneur !",
  "Le café, c'est sacré. Et cette semaine, c'est toi le boss de la machine !",
  "Semaine café activée ! Tes collègues comptent sur toi pour un café impeccable.",
];

/** Retourne un message café aléatoire */
export function getMessageCafe(): string {
  return MESSAGES_CAFE[Math.floor(Math.random() * MESSAGES_CAFE.length)];
}
