import * as XLSX from "xlsx";

export interface LigneImport {
  bcdiReference: string;
  moisClient: string;
  refSellsy: string | null;
  designation: string;
  quantite: number;
  prixFournisseur: number | null;
}

export interface ArrivageImport {
  dateLabel: string;
  lignes: LigneImport[];
}

// Structure des 6 arrivages côte à côte dans le fichier Elaury
const ARRIVAGE_OFFSETS = [
  { start: 1, dateCol: 4 },
  { start: 8, dateCol: 11 },
  { start: 15, dateCol: 18 },
  { start: 22, dateCol: 25 },
  { start: 29, dateCol: 32 },
  { start: 36, dateCol: 39 },
];

export function parseExcelPrevisionnel(buffer: ArrayBuffer): ArrivageImport[] {
  const wb = XLSX.read(buffer, { type: "array" });

  // Préférer la feuille "Prévisionnel OK Valorisé", sinon la première
  const sheetName =
    wb.SheetNames.find((n) => n.toLowerCase().includes("pr")) ||
    wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
  }) as any[][];

  const arrivages: ArrivageImport[] = [];

  for (const offset of ARRIVAGE_OFFSETS) {
    // La date est en ligne 4 (index 4), colonne dateCol
    const dateLabel = rows[4]?.[offset.dateCol];
    if (!dateLabel || typeof dateLabel !== "string") continue;

    const lignes: LigneImport[] = [];

    // Les données commencent à la ligne 5 (index 5)
    for (let rowIdx = 5; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      const bcdi = row?.[offset.start];

      if (!bcdi || typeof bcdi !== "string" || !bcdi.startsWith("BCDI-"))
        continue;

      const mois = row?.[offset.start + 1] ?? "";
      const ref = row?.[offset.start + 2];
      const desc = row?.[offset.start + 3] ?? "";
      const qte = row?.[offset.start + 4];
      const prix = row?.[offset.start + 5];

      lignes.push({
        bcdiReference: bcdi.trim(),
        moisClient: String(mois).trim(),
        refSellsy: ref && ref !== "-" ? String(ref).trim() : null,
        designation: String(desc).replace(/\n/g, " ").trim(),
        quantite:
          typeof qte === "number" ? qte : parseInt(String(qte)) || 1,
        prixFournisseur:
          typeof prix === "number" && !isNaN(prix) ? prix : null,
      });
    }

    if (lignes.length > 0) {
      arrivages.push({ dateLabel: dateLabel.trim(), lignes });
    }
  }

  return arrivages;
}

/**
 * Tente de parser "06 APRIL" → Date JS
 * Retourne null si non parseable
 */
export function parseDateLabel(label: string): Date | null {
  if (!label) return null;
  const months: Record<string, number> = {
    JANUARY: 0, FEBRUARY: 1, MARCH: 2, APRIL: 3, MAY: 4, JUNE: 5,
    JUNI: 5, JULY: 6, AUGUST: 7, SEPTEMBER: 8, OCTOBER: 9, NOVEMBER: 10, DECEMBER: 11,
    JANVIER: 0, FEVRIER: 1, MARS: 2, AVRIL: 3, MAI: 4, JUIN: 5,
    JUILLET: 6, AOUT: 7, SEPTEMBRE: 8, OCTOBRE: 9, NOVEMBRE: 10, DECEMBRE: 11,
  };
  const parts = label.toUpperCase().trim().split(/\s+/);
  if (parts.length < 2) return null;

  const day = parseInt(parts[0]);
  const monthKey = parts[1];
  const monthIdx = months[monthKey];

  if (isNaN(day) || monthIdx === undefined) return null;

  const year = new Date().getFullYear();
  const d = new Date(year, monthIdx, day, 12, 0, 0);
  // Si la date est déjà passée de plus de 6 mois, on prend l'année suivante
  if (d < new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)) {
    d.setFullYear(year + 1);
  }
  return d;
}
