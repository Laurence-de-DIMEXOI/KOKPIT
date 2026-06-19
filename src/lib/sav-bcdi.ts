/**
 * Extraction des numéros de BCDI depuis le texte libre saisi dans un dossier SAV
 * (champ `sellsyBdcRef`). Michelle saisit des formats variés :
 *   "BCDI-05066 ET BCDI-05452", "BCDI-05065 + BCDI-05091",
 *   "BCDI-05083 / BC 11680", "BCDEI-05109" (typo), "BCDI-05358 " (espace).
 *
 * On tolère la faute "BCDEI", les séparateurs (ET / + / / , espaces) et on
 * normalise en "BCDI-XXXXX". Les références Bois d'Orient ("BC-xxxxx") et
 * factures ("FAPJ-xxxx") ne sont pas des commandes DIMEXOI → ignorées ici.
 */
export function parseBcdiRefs(text: string | null | undefined): string[] {
  if (!text) return [];
  const out: string[] = [];
  // BCDI ou BCDEI (typo), séparateur optionnel, 3 à 6 chiffres
  const re = /BCDE?I[\s-]?(\d{3,6})/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text.toUpperCase())) !== null) {
    out.push(`BCDI-${m[1]}`);
  }
  return Array.from(new Set(out));
}
