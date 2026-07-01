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
  delaiTotalMois: 8,
  delaiBateauMois: 1.5,
};

// États produit Sellsy (custom field "Etat des produit") qui composent le réservoir
// = commandes encore à fabriquer / pas encore dans un IMP.
// EN STOCK (reçu) et ARRIVAGE M+1/2/3 (déjà sur un container en mer) sont exclus.
export const RESERVOIR_ETATS = ["SUR COMMANDE", "SAV", "COMMANDE MAGASIN"];

/** Normalise un n° de commande/carte vers une clé comparable (digits, sans zéros
 *  de tête) — tolère "BCDI-04411", "BDCI-04411", "BCDI4411"… → "4411". */
export function normalizeBcdiKey(name: string | null | undefined): string | null {
  if (!name) return null;
  const m = name.match(/B[CD]DI[\s-]?0*(\d{2,6})/i);
  if (m) return String(parseInt(m[1], 10));
  return null;
}

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
  "Pending BCDI",
];

// Cartes physiquement prêtes / quasi prêtes à charger (priorité container).
export const TRELLO_READY_LISTS = ["In Warehouse", "Finishing", "Ready to Sent"];

// "Problems on furniture" exclu : cartes bloquées (défaut), pas à planifier.
export const TRELLO_EXCLUDED_LISTS = ["Sent", "Cancelled BCDI", "Problems on furniture"];

// ── Calendrier de départs (40ft HC toutes les 6 semaines) ──────────────────
// IMP-618 est parti le 14 juin 2026 ; un départ toutes les 6 semaines ensuite.
export const DEPART_BASE_ISO = "2026-06-14"; // IMP-618 (slot 0)
export const DEPART_FIRST_GAP_DAYS = 14; // 1er départ = 2 semaines après l'IMP-618
export const DEPART_INTERVAL_DAYS = 42; // puis toutes les 6 semaines
export const CONTAINER_CAPACITY_MEUBLES = 130; // ~130 meubles client par container

/**
 * Génère `count` dates de départ : i=0 = base (IMP-618, 14 juin), i=1 = base + 2
 * semaines (1er container à planifier), puis tous les 42 jours (6 semaines).
 */
export function departures(count: number): Date[] {
  const base = new Date(`${DEPART_BASE_ISO}T00:00:00Z`);
  const out: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    const offset = i === 0 ? 0 : DEPART_FIRST_GAP_DAYS + (i - 1) * DEPART_INTERVAL_DAYS;
    d.setUTCDate(d.getUTCDate() + offset);
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

/** Arrivée cible = date commande + délai total (ex. 8 mois) → date à laquelle
 *  la commande doit être arrivée en Réunion pour tenir le délai promis. */
export function dateArriveeCible(
  dateCommande: Date,
  p: ReservoirParams = DEFAULT_RESERVOIR_PARAMS
): Date {
  const whole = Math.floor(p.delaiTotalMois);
  const fracDays = Math.round((p.delaiTotalMois - whole) * 30);
  const d = new Date(dateCommande);
  d.setMonth(d.getMonth() + whole);
  d.setDate(d.getDate() + fracDays);
  return d;
}

/** Arrivée estimée d'un départ quand l'arrivée réelle MSC est inconnue
 *  = date de départ + délai bateau. */
export function dateArriveeEstimee(
  dateDepart: Date,
  p: ReservoirParams = DEFAULT_RESERVOIR_PARAMS
): Date {
  const whole = Math.floor(p.delaiBateauMois);
  const fracDays = Math.round((p.delaiBateauMois - whole) * 30);
  const d = new Date(dateDepart);
  d.setMonth(d.getMonth() + whole);
  d.setDate(d.getDate() + fracDays);
  return d;
}

export type RetardStatut = "ok" | "attention" | "retard";

/** Compare l'arrivée du container à l'arrivée cible, avec une marge tolérée :
 *  - arrivée ≤ cible            → "ok"        (à l'heure ou en avance)
 *  - arrivée dans le mois cible
 *    OU ≤ cible + 15 jours      → "attention" (léger dépassement, acceptable)
 *  - au-delà                    → "retard"    (vrai retard). */
export const MARGE_RETARD_JOURS = 15;
export function classerRetard(arrivee: Date, cible: Date): RetardStatut {
  if (arrivee.getTime() <= cible.getTime()) return "ok";
  const limite = new Date(cible);
  limite.setDate(limite.getDate() + MARGE_RETARD_JOURS);
  const memeMois =
    arrivee.getUTCFullYear() === cible.getUTCFullYear() &&
    arrivee.getUTCMonth() === cible.getUTCMonth();
  if (memeMois || arrivee.getTime() <= limite.getTime()) return "attention";
  return "retard";
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
