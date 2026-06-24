export type Univers =
  | "SDB"
  | "CHAMBRE"
  | "SEJOUR"
  | "CUISINE"
  | "BUREAU"
  | "EXTERIEUR"
  | "DECO"
  | "AUTRE";

export const UNIVERS_LABELS: Record<Univers, string> = {
  SDB: "Salle de bains",
  CHAMBRE: "Chambre",
  SEJOUR: "Séjour",
  CUISINE: "Cuisine",
  BUREAU: "Bureau",
  EXTERIEUR: "Extérieur",
  DECO: "Décoration",
  AUTRE: "Autre",
};

const CATEGORY_UNIVERS: Record<number, Univers> = {
  // Salle de bains
  77163: "SDB",    // Colonnes SDB
  77401: "SDB",    // Vasques
  237630: "SDB",   // Étagères SDB

  // Chambre
  77621: "CHAMBRE", // Lits
  77622: "CHAMBRE", // Armoires chambre
  77639: "CHAMBRE", // Tables de nuit
  77623: "CHAMBRE", // Coiffeuses

  // Séjour
  77612: "SEJOUR",  // Tables basses
  77611: "SEJOUR",  // Tables à manger
  77403: "SEJOUR",  // Buffets
  77615: "SEJOUR",  // Meubles TV
  218960: "SEJOUR", // Buffets Evolia / gamme récente
  179450: "SEJOUR", // Consoles
  179449: "SEJOUR", // Bonnetières / cabinets
  77624: "SEJOUR",  // Bibliothèques
  77619: "SEJOUR",  // Canapés / fauteuils

  // Bureau
  77613: "BUREAU",  // Bureaux / pieds de table
  77638: "BUREAU",  // Bureaux pro / collectivité

  // Extérieur / Jardin
  77617: "EXTERIEUR", // Bancs
  77644: "EXTERIEUR", // Bancs extérieur

  // Décoration
  77684: "DECO",    // Miroirs / cadres
  77634: "DECO",    // Abat-jour / luminaires

  // Collectivité / sur-mesure
  310016: "AUTRE",  // Armoires porte-bagages (hôtellerie)
  179457: "AUTRE",  // Bâtis métalliques
};

export function getUniversByCategoryId(categoryId: number | null | undefined): Univers | null {
  if (!categoryId) return null;
  return CATEGORY_UNIVERS[categoryId] ?? null;
}

export function getUniversFromDescription(description: string): Univers | null {
  const d = description.toLowerCase();
  if (d.includes("vasque") || d.includes("salle de bain") || d.includes("colonne") && d.includes("porte")) return "SDB";
  if (d.includes("lit ") || d.includes("table de nuit") || d.includes("armoire") || d.includes("coiffeuse")) return "CHAMBRE";
  if (d.includes("cuisine")) return "CUISINE";
  if (d.includes("table basse") || d.includes("buffet") || d.includes("meuble tv") || d.includes("bibliothèque") || d.includes("console")) return "SEJOUR";
  if (d.includes("bureau")) return "BUREAU";
  if (d.includes("banc") || d.includes("jardin")) return "EXTERIEUR";
  if (d.includes("miroir") || d.includes("abat-jour") || d.includes("lampe")) return "DECO";
  return null;
}

export function computeDevisUnivers(lignesUnivers: (string | null)[]): Univers | null {
  const counts: Record<string, number> = {};
  for (const u of lignesUnivers) {
    if (u) counts[u] = (counts[u] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (sorted[0]?.[0] as Univers) ?? null;
}
