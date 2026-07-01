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

/** Une commande est "Cuisine" si une ligne mentionne kitchen/cuisine ou a une réf EFKS. */
export function isCuisineLignes(lignes: LigneCommande[]): boolean {
  return lignes.some(
    (l) =>
      /kitchen|cuisine/i.test(l.desc) ||
      /^EFKS/i.test((l.ref || "").trim())
  );
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
