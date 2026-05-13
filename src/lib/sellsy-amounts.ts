/**
 * Helpers de lecture des montants Sellsy.
 *
 * Convention KOKPIT (mai 2026) : **tout est en HT** côté reporting.
 *
 * Sellsy v2 expose plusieurs champs montant sur les BDC / Devis / Factures :
 *  - total_excl_tax / total_raw_excl_tax / total_after_discount_excl_tax → HT
 *  - total_incl_tax → TTC
 *  - total → variable selon endpoint (souvent TTC, parfois HT). À éviter pour les KPI.
 *
 * On centralise ici pour ne plus jamais avoir de régression HT/TTC.
 */

export interface SellsyAmountsLike {
  total?: string | number | null;
  total_incl_tax?: string | number | null;
  total_excl_tax?: string | number | null;
  total_raw_excl_tax?: string | number | null;
  total_after_discount_excl_tax?: string | number | null;
}

function toNum(v: unknown): number {
  if (v === null || v === undefined || v === "") return NaN;
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return isNaN(n) ? NaN : n;
}

/**
 * Montant HT du document. Fallback TTC seulement si aucun HT n'est exposé
 * (cas rare des BDC anciens où Sellsy ne renvoie que `total_incl_tax`).
 *
 * Accepte un row avec `amounts` faiblement typé (compatible avec tous les
 * types Sellsy maison : SellsyOrder, SellsyEstimate, raw API, etc.).
 */
export function getAmountHT(row: { amounts?: SellsyAmountsLike } | null | undefined): number {
  if (!row?.amounts) return 0;
  const a = row.amounts as SellsyAmountsLike;
  const candidates = [
    a.total_excl_tax,
    a.total_raw_excl_tax,
    a.total_after_discount_excl_tax,
    a.total,
    a.total_incl_tax,
  ];
  for (const c of candidates) {
    const n = toNum(c);
    if (!isNaN(n)) return n;
  }
  return 0;
}

/**
 * Montant TTC du document. À utiliser rarement (facturation, communication client).
 */
export function getAmountTTC(row: { amounts?: SellsyAmountsLike } | null | undefined): number {
  if (!row?.amounts) return 0;
  const a = row.amounts as SellsyAmountsLike;
  const candidates = [a.total_incl_tax, a.total];
  for (const c of candidates) {
    const n = toNum(c);
    if (!isNaN(n)) return n;
  }
  return 0;
}

/**
 * Variante qui prend directement l'objet `amounts` (sans le `row`).
 * Pratique pour les pages qui itèrent sur `Devis` / `Vente` locaux.
 */
export function getAmountHTFromAmounts(amounts: SellsyAmountsLike | null | undefined): number {
  return getAmountHT(amounts ? { amounts } : null);
}

/**
 * Alias de `getAmountHT` pour transition douce. Préférer le nom explicite.
 * @deprecated Utiliser `getAmountHT` directement.
 */
export const getAmount = getAmountHT;
