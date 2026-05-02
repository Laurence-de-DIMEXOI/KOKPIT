/**
 * Jours fériés Réunion (973 → fériés métropole + Abolition de l'esclavage 20 décembre)
 * Calcul dynamique : Pâques (algo Butcher) + dates fixes.
 */

function paques(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=mars, 4=avril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmtDate(d: Date): string {
  return `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getFullYear()}`;
}

export interface FerieItem {
  date: Date;
  nom: string;
}

/** Jours fériés à La Réunion pour une année donnée. */
export function feriesReunion(year: number): FerieItem[] {
  const p = paques(year);
  return [
    { date: new Date(year, 0, 1), nom: "Jour de l'an" },
    { date: addDays(p, 1), nom: "Lundi de Pâques" },
    { date: new Date(year, 4, 1), nom: "Fête du Travail" },
    { date: new Date(year, 4, 8), nom: "Victoire 1945" },
    { date: addDays(p, 39), nom: "Ascension" },
    { date: addDays(p, 50), nom: "Lundi de Pentecôte" },
    { date: new Date(year, 6, 14), nom: "Fête nationale" },
    { date: new Date(year, 7, 15), nom: "Assomption" },
    { date: new Date(year, 10, 1), nom: "Toussaint" },
    { date: new Date(year, 10, 11), nom: "Armistice 1918" },
    { date: new Date(year, 11, 20), nom: "Abolition de l'esclavage (Réunion)" },
    { date: new Date(year, 11, 25), nom: "Noël" },
  ].sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Renvoie le prochain jour férié à venir (à partir d'aujourd'hui inclus). */
export function prochainFerie(now = new Date()): FerieItem | null {
  const candidates = [
    ...feriesReunion(now.getFullYear()),
    ...feriesReunion(now.getFullYear() + 1),
  ];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return candidates.find((f) => f.date.getTime() >= today.getTime()) || null;
}

/** Format français : "lundi 9 juin 2026" */
export function formatFerieFR(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// helper exporté pour tests éventuels
export { fmtDate };
