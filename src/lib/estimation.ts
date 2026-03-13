/**
 * Matching déterministe — articles demande ↔ catalogue Sellsy
 *
 * Approche : dictionnaire métier DIMEXOI (abréviations mobilier)
 * + matching par mots-clés normalisés.
 * Pas d'IA, pas de LLM — correspondance déterministe reproductible.
 *
 * Logique partagée entre :
 * - Webhook (à l'arrivée d'une demande)
 * - Endpoint batch (pour toutes les demandes existantes)
 * - Endpoint unitaire GET /api/demandes/[id]/match-sellsy
 */

import { listAllItems, type SellsyItem } from "@/lib/sellsy";
import { prisma } from "@/lib/prisma";

// ===== TYPES =====

export interface ArticleDemande {
  nom: string;
  categorie?: string | null;
  finition?: string | null;
  quantite: number;
}

export interface MatchResult {
  articleDemande: ArticleDemande;
  bestMatch: {
    id: number;
    name: string;
    reference: string;
    prixHT: number;
    prixTTC: number;
    score: number;
  } | null;
  estimatedValueHT: number;
  estimatedValueTTC: number;
}

export interface EstimationResult {
  success: boolean;
  totalEstimatedHT: number;
  totalEstimatedTTC: number;
  matches: MatchResult[];
  catalogSize: number;
  error?: string;
}

// ===== DICTIONNAIRE METIER DIMEXOI =====
// Abréviations courantes dans les demandes de prix mobilier

const ABBREVIATIONS: Record<string, string> = {
  // Pièces
  "sam": "salle a manger",
  "sdm": "salle a manger",
  "sdb": "salle de bain",
  "sde": "salle d eau",
  "ch": "chambre",
  "chb": "chambre",
  "chs": "chambre",
  "sal": "salon",
  "sej": "sejour",
  "cuis": "cuisine",
  "bur": "bureau",
  "ent": "entree",
  "wc": "toilettes",
  "ext": "exterieur",
  "ter": "terrasse",
  "jar": "jardin",
  "bal": "balcon",
  "vrd": "veranda",

  // Meubles courants
  "canap": "canape",
  "tab": "table",
  "chse": "chaise",
  "lit": "lit",
  "arm": "armoire",
  "com": "commode",
  "buf": "buffet",
  "bib": "bibliotheque",
  "etag": "etagere",
  "tv": "meuble tv",
  "tlv": "meuble tv",
  "csl": "console",
  "bqt": "banquette",
  "faut": "fauteuil",
  "tbt": "tabouret",
  "mat": "matelas",
  "smr": "sommier",
  "cdt": "table de chevet",
  "chvt": "chevet",
  "dres": "dressing",
  "pdt": "table de repas",
  "bse": "table basse",

  // Finitions
  "bco": "blanc",
  "blc": "blanc",
  "nr": "noir",
  "grs": "gris",
  "nat": "naturel",
  "chne": "chene",
  "noy": "noyer",
  "wng": "wenge",
  "teck": "teck",
  "lac": "laque",
};

// Synonymes métier pour le matching : variantes possibles d'un même produit
const SYNONYMES: [string, string][] = [
  ["canape", "sofa"],
  ["table basse", "table de salon"],
  ["table de repas", "table a manger"],
  ["table a manger", "table salle a manger"],
  ["chevet", "table de chevet"],
  ["table de nuit", "chevet"],
  ["armoire", "penderie"],
  ["meuble tv", "meuble television"],
  ["buffet", "bahut"],
  ["etagere", "bibliotheque"],
  ["fauteuil", "siege"],
  ["banquette", "banc"],
  ["commode", "semainier"],
  ["lit", "couchage"],
  ["sommier", "literie"],
  ["matelas", "literie"],
  ["dressing", "placard"],
  ["meuble de rangement", "rangement"],
  ["meuble de salle de bain", "vasque"],
];

// ===== MATCHING HELPERS =====

function normalizeString(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

/**
 * Expanse les abréviations métier dans un texte normalisé.
 * Ex: "table sam chne" → "table salle a manger chene"
 */
function expandAbbreviations(text: string): string {
  const words = text.split(/\s+/);
  return words
    .map((w) => ABBREVIATIONS[w] || w)
    .join(" ");
}

function extractKeywords(name: string): string[] {
  const stopWords = new Set([
    "de", "du", "le", "la", "les", "un", "une", "des", "en", "et",
    "avec", "pour", "sur", "par", "dans", "aux", "au", "a", "l",
    "cm", "mm", "kg",
  ]);
  const expanded = expandAbbreviations(normalizeString(name));
  return expanded
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));
}

/**
 * Vérifie si deux termes sont synonymes métier.
 */
function areSynonyms(a: string, b: string): boolean {
  if (a === b) return true;
  for (const [s1, s2] of SYNONYMES) {
    if ((a.includes(s1) && b.includes(s2)) || (a.includes(s2) && b.includes(s1))) {
      return true;
    }
  }
  return false;
}

function scoreMatch(articleName: string | null | undefined, sellsyName: string | null | undefined): number {
  if (!articleName || !sellsyName) return 0;

  // Normaliser et expanser les abréviations
  const normArticle = expandAbbreviations(normalizeString(articleName));
  const normSellsy = expandAbbreviations(normalizeString(sellsyName));
  if (!normArticle || !normSellsy) return 0;

  // Match exact
  if (normArticle === normSellsy) return 100;

  // Inclusion complète
  if (normSellsy.includes(normArticle)) return 90;
  if (normArticle.includes(normSellsy)) return 85;

  // Match synonymes sur chaînes complètes
  if (areSynonyms(normArticle, normSellsy)) return 88;

  // Match par mots-clés
  const kwArticle = extractKeywords(articleName);
  const kwSellsy = extractKeywords(sellsyName);
  if (kwArticle.length === 0 || kwSellsy.length === 0) return 0;

  let matched = 0;
  let synonymMatched = 0;
  for (const kw of kwArticle) {
    if (kwSellsy.some((s) => s.includes(kw) || kw.includes(s))) {
      matched++;
    } else if (kwSellsy.some((s) => areSynonyms(kw, s))) {
      synonymMatched++;
    }
  }

  const directScore = (matched / kwArticle.length) * 80;
  const synonymScore = (synonymMatched / kwArticle.length) * 60;
  return Math.round(Math.min(directScore + synonymScore, 95));
}

// ===== ESTIMATION PRINCIPALE =====

/**
 * Estime la valeur d'une demande en matchant ses articles avec le catalogue Sellsy.
 * Matching déterministe : abréviations métier + synonymes + mots-clés.
 * Accepte un catalogue pré-chargé pour éviter les appels API multiples en batch.
 */
export async function estimateDemande(
  articles: ArticleDemande[],
  preloadedCatalogue?: SellsyItem[]
): Promise<EstimationResult> {
  if (articles.length === 0) {
    return {
      success: true,
      totalEstimatedHT: 0,
      totalEstimatedTTC: 0,
      matches: [],
      catalogSize: 0,
    };
  }

  let catalogue: SellsyItem[];
  try {
    catalogue = preloadedCatalogue || await listAllItems();
  } catch (err: any) {
    return {
      success: false,
      totalEstimatedHT: 0,
      totalEstimatedTTC: 0,
      matches: [],
      catalogSize: 0,
      error: `Erreur Sellsy: ${err.message}`,
    };
  }

  const matchResults: MatchResult[] = [];
  let totalHT = 0;
  let totalTTC = 0;

  for (const article of articles) {
    let bestScore = 0;
    let bestItem: SellsyItem | null = null;

    for (const item of catalogue) {
      const itemName = item.name || item.reference || item.description || "";
      let score = scoreMatch(article.nom, itemName);

      // Fallback sur référence si score faible
      if (score < 50 && item.reference) {
        score = Math.max(score, scoreMatch(article.nom, item.reference) * 0.8);
      }
      // Fallback sur description
      if (score < 50 && item.description && item.description !== itemName) {
        score = Math.max(score, scoreMatch(article.nom, item.description) * 0.7);
      }
      // Bonus catégorie
      if (score > 20 && article.categorie) {
        const catScore = scoreMatch(article.categorie, itemName);
        if (catScore > 30) score = Math.min(100, score + 10);
      }
      // Bonus/malus finition — quand la finition est précisée, on préfère le bon coloris
      if (score > 30 && article.finition) {
        const finNorm = expandAbbreviations(normalizeString(article.finition));
        const itemNorm = expandAbbreviations(normalizeString(itemName));
        const descNorm = expandAbbreviations(normalizeString(item.description || ""));
        if (itemNorm.includes(finNorm) || descNorm.includes(finNorm)) {
          score = Math.min(100, score + 8); // Match finition → bonus
        } else if (score < 85) {
          score = Math.max(0, score - 5); // Finition demandée mais non trouvée → malus léger
        }
      }

      if (score > bestScore && score >= 45) {
        bestScore = score;
        bestItem = item;
      }
    }

    const prixHT = bestItem ? parseFloat(bestItem.reference_price_taxes_exc || "0") : 0;
    const prixTTC = bestItem ? parseFloat(bestItem.reference_price_taxes_inc || "0") : 0;
    const estimatedHT = prixHT * article.quantite;
    const estimatedTTC = prixTTC * article.quantite;

    totalHT += estimatedHT;
    totalTTC += estimatedTTC;

    matchResults.push({
      articleDemande: article,
      bestMatch: bestItem
        ? {
            id: bestItem.id,
            name: bestItem.name || bestItem.reference || `#${bestItem.id}`,
            reference: bestItem.reference || "",
            prixHT,
            prixTTC,
            score: Math.round(bestScore),
          }
        : null,
      estimatedValueHT: estimatedHT,
      estimatedValueTTC: estimatedTTC,
    });
  }

  return {
    success: true,
    totalEstimatedHT: Math.round(totalHT * 100) / 100,
    totalEstimatedTTC: Math.round(totalTTC * 100) / 100,
    matches: matchResults,
    catalogSize: catalogue.length,
  };
}

// ===== EXTRACTION ARTICLES =====

/**
 * Extrait les articles d'une demande de prix (JSON ou meuble simple).
 */
export function extractArticles(demande: {
  articles?: any;
  meuble?: string;
}): ArticleDemande[] {
  const articles: ArticleDemande[] = [];

  const articlesJson = demande.articles;
  if (articlesJson && Array.isArray(articlesJson)) {
    for (const a of articlesJson) {
      articles.push({
        nom: a.nom || a.name || "Inconnu",
        categorie: a.categorie || a.category || null,
        finition: a.finition || a.finish || null,
        quantite: Number(a.quantite || a.quantity || 1),
      });
    }
  } else if (demande.meuble && demande.meuble !== "Non spécifié") {
    articles.push({
      nom: demande.meuble,
      categorie: null,
      finition: null,
      quantite: 1,
    });
  }

  return articles;
}

// ===== SAUVEGARDE EN BASE =====

/**
 * Estime et sauvegarde l'estimation d'une demande de prix.
 */
export async function estimateAndSave(
  demandeId: string,
  preloadedCatalogue?: SellsyItem[]
): Promise<EstimationResult> {
  const demande = await prisma.demandePrix.findUnique({
    where: { id: demandeId },
  });

  if (!demande) {
    return {
      success: false,
      totalEstimatedHT: 0,
      totalEstimatedTTC: 0,
      matches: [],
      catalogSize: 0,
      error: "Demande non trouvée",
    };
  }

  const articles = extractArticles(demande);
  const result = await estimateDemande(articles, preloadedCatalogue);

  if (result.success && result.totalEstimatedTTC > 0) {
    await prisma.demandePrix.update({
      where: { id: demandeId },
      data: {
        estimationHT: result.totalEstimatedHT,
        estimationTTC: result.totalEstimatedTTC,
        estimationDetails: result as any,
      },
    });
  }

  return result;
}
