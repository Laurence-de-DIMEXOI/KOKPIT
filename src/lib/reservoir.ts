/**
 * Réservoir prévisionnel — BCDI en attente d'arrivage (Trello × Sellsy).
 *
 * Le Trello "BCDI" suit la production : une carte par commande (BCDI-XXXXX Client)
 * répartie dans un pipeline. Tout ce qui n'est PAS "Sent"/"Cancelled" = réservoir
 * à planifier dans les prochains containers.
 *
 * ⚠ Le Trello est INDICATIF (saisie manuelle Indonésie) — Sellsy reste la source
 * des dates/montants. On croise par n° BCDI.
 *
 * Rétroplanning : une commande doit arriver `delaiTotalMois` après la commande,
 * dont `delaiBateauMois` de bateau → elle doit être CHARGÉE à
 *   date commande + (delaiTotalMois − delaiBateauMois).
 * Le "mois de chargement" sert à regrouper les commandes par container.
 */

export interface ReservoirParams {
  delaiTotalMois: number; // délai cible commande → arrivée Réunion
  delaiBateauMois: number; // durée bateau
}

export const DEFAULT_RESERVOIR_PARAMS: ReservoirParams = {
  delaiTotalMois: 6,
  delaiBateauMois: 1.5,
};

// Listes Trello = réservoir (pas encore expédié). "Sent" et "Cancelled BCDI" exclus.
export const TRELLO_RESERVOIR_LISTS = [
  "BCDI",
  "Questions Asked",
  "Check 1 @Carpenter",
  "Check 2 @Carpenter",
  "Check 3 @Carpenter",
  "In Warehouse",
  "Finishing",
  "Ready to Sent",
  "Problems on furniture",
  "Pending BCDI",
];

// Cartes physiquement prêtes / quasi prêtes à charger (priorité container).
export const TRELLO_READY_LISTS = ["In Warehouse", "Finishing", "Ready to Sent"];

export const TRELLO_EXCLUDED_LISTS = ["Sent", "Cancelled BCDI"];

// ── Calendrier de départs (40ft HC toutes les 6 semaines) ──────────────────
// IMP-618 est parti le 14 juin 2026 ; un départ toutes les 6 semaines ensuite.
export const DEPART_BASE_ISO = "2026-06-14";
export const DEPART_INTERVAL_DAYS = 42; // 6 semaines
export const CONTAINER_CAPACITY_MEUBLES = 130; // ~130 meubles client par container

/** Génère `count` dates de départ depuis la base, tous les 42 jours. */
export function departures(count: number): Date[] {
  const base = new Date(`${DEPART_BASE_ISO}T00:00:00Z`);
  const out: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + i * DEPART_INTERVAL_DAYS);
    out.push(d);
  }
  return out;
}

export function departureKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

/** Date de chargement cible = date commande + (total − bateau) mois. */
export function dateChargement(
  dateCommande: Date,
  p: ReservoirParams = DEFAULT_RESERVOIR_PARAMS
): Date {
  const prodMois = Math.max(0, p.delaiTotalMois - p.delaiBateauMois);
  const whole = Math.floor(prodMois);
  const fracDays = Math.round((prodMois - whole) * 30);
  const d = new Date(dateCommande);
  d.setMonth(d.getMonth() + whole);
  d.setDate(d.getDate() + fracDays);
  return d;
}

/** Clé "YYYY-MM" du mois de chargement. */
export function moisChargementKey(
  dateCommande: Date,
  p: ReservoirParams = DEFAULT_RESERVOIR_PARAMS
): string {
  const d = dateChargement(dateCommande, p);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Extrait "BCDI-05799" et le client depuis un nom de carte Trello. */
export function parseTrelloCard(name: string): { bcdi: string | null; client: string } {
  const m = name.match(/\bBCDI-?(\d{3,6})\b/i);
  const bcdi = m ? `BCDI-${m[1]}` : null;
  let client = name;
  if (m) client = name.slice(m.index! + m[0].length).replace(/^[\s:.-]+/, "").trim();
  return { bcdi, client };
}
