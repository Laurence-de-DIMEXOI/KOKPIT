/**
 * Lecture des lignes de commande Sellsy pour le réservoir :
 *  - nettoyage du HTML des descriptions
 *  - détection "Cuisine" (mot clé ou réf EFKS = Kitchen Set)
 *  - estimation du cubage (m³) à partir des dimensions "LxlxH cm" du libellé
 */

export interface LigneCommande {
  ref: string | null;
  desc: string;
  qty: number;
}

/** Retire le HTML et normalise les espaces d'un libellé Sellsy. */
export function cleanLigne(html: string | null | undefined): string {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CUISINE_KW = /kitchen|cuisine|\boven\b|\bfour\b|dishwasher|lave.?vaisselle|microwave|micro.?ondes|\bsink\b|[ée]vier|\bspice\b|\bhoven\b/i;
const DRESSING_KW = /wardrobe|dressing|penderie|armoire|hanging|closet/i;

/** Nombre d'éléments distincts "Element A/B/C…" (meuble modulaire = cuisine ou dressing). */
export function countElements(lignes: LigneCommande[]): number {
  const set = new Set<string>();
  for (const l of lignes) {
    const m = l.desc.match(/\bELEMENT\s+([A-Z])\b/i);
    if (m) set.add(m[1].toUpperCase());
  }
  return set.size;
}

/**
 * Classe une commande : cuisine et/ou dressing.
 * - cuisine : mot clé cuisine (oven, dishwasher, sink…) ou réf EFKS.
 * - dressing : mot clé dressing/wardrobe, réf EFWR, ou meuble modulaire
 *   (≥2 "Element A/B/C…") qui n'est pas une cuisine.
 */
export function classifyLignes(lignes: LigneCommande[]): { isCuisine: boolean; isDressing: boolean } {
  const text = lignes.map((l) => `${l.ref || ""} ${l.desc}`).join(" ");
  const isCuisine = CUISINE_KW.test(text) || lignes.some((l) => /^EFKS/i.test((l.ref || "").trim()));
  const modular = countElements(lignes) >= 2;
  const isDressing =
    !isCuisine &&
    (DRESSING_KW.test(text) || lignes.some((l) => /^EFWR/i.test((l.ref || "").trim())) || modular);
  return { isCuisine, isDressing };
}

/** Compat : une commande est "Cuisine". */
export function isCuisineLignes(lignes: LigneCommande[]): boolean {
  return classifyLignes(lignes).isCuisine;
}

/**
 * Volume unitaire estimé (m³) d'une ligne à partir des 3 dimensions en cm
 * trouvées dans le libellé (ex "76x60x88cm", "147x50/56x88 cm", "160 X 200 CM").
 * Renvoie 0 si aucune dimension à 3 nombres n'est trouvée.
 */
export function estimateUnitVolumeM3(desc: string): number {
  const s = (desc || "").replace(/,/g, ".");
  const m = s.match(
    /(\d{2,3})(?:\/\d{2,3})?\s*[xX]\s*(\d{2,3})(?:\/\d{2,3})?\s*[xX]\s*(\d{2,3})(?:\/\d{2,3})?/
  );
  if (!m) return 0;
  const a = Number(m[1]) / 100;
  const b = Number(m[2]) / 100;
  const c = Number(m[3]) / 100;
  const v = a * b * c;
  return v > 0 && v < 20 ? Number(v.toFixed(3)) : 0; // garde-fou anti aberration
}

/** Volume total estimé (m³) d'une commande = Σ qty × volume unitaire. */
export function estimateVolumeM3(lignes: LigneCommande[]): number {
  const v = lignes.reduce((s, l) => s + (l.qty || 0) * estimateUnitVolumeM3(l.desc), 0);
  return Number(v.toFixed(2));
}
