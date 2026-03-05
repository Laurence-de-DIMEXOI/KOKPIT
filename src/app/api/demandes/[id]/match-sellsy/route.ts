import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listAllItems, type SellsyItem } from "@/lib/sellsy";

/**
 * GET /api/demandes/[id]/match-sellsy
 *
 * Cherche dans le catalogue Sellsy les produits correspondant
 * aux articles de la demande de prix pour estimer sa valeur.
 *
 * Utilise listAllItems() qui charge tous les produits et services
 * (non archivés, exclut shipping/packaging).
 *
 * Algorithme de matching :
 * 1. Recherche par nom exact
 * 2. Recherche par mots-clés du nom
 * 3. Recherche par référence
 * 4. Score de pertinence basé sur les correspondances
 */

interface MatchResult {
  articleDemande: {
    nom: string;
    categorie?: string | null;
    finition?: string | null;
    quantite: number;
  };
  matchesSellsy: {
    id: number;
    name: string;
    reference: string;
    prixHT: number;
    prixTTC: number;
    score: number; // 0-100
    matchType: "exact" | "partiel" | "categorie";
  }[];
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

function normalizeString(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function extractKeywords(name: string): string[] {
  const stopWords = new Set([
    "de", "du", "le", "la", "les", "un", "une", "des", "en", "et",
    "avec", "pour", "sur", "par", "dans", "aux", "au",
  ]);
  return normalizeString(name)
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

function scoreMatch(articleName: string | null | undefined, sellsyName: string | null | undefined): number {
  if (!articleName || !sellsyName) return 0;
  const normArticle = normalizeString(articleName);
  const normSellsy = normalizeString(sellsyName);
  if (!normArticle || !normSellsy) return 0;

  // Match exact
  if (normArticle === normSellsy) return 100;

  // L'un contient l'autre
  if (normSellsy.includes(normArticle)) return 90;
  if (normArticle.includes(normSellsy)) return 85;

  // Match par mots-clés
  const kwArticle = extractKeywords(articleName);
  const kwSellsy = extractKeywords(sellsyName);

  if (kwArticle.length === 0 || kwSellsy.length === 0) return 0;

  let matched = 0;
  for (const kw of kwArticle) {
    if (kwSellsy.some((s) => s.includes(kw) || kw.includes(s))) {
      matched++;
    }
  }

  const score = Math.round((matched / kwArticle.length) * 80);
  return score;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Récupérer la demande
    const demande = await prisma.demandePrix.findUnique({
      where: { id },
      include: { contact: true },
    });

    if (!demande) {
      return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 });
    }

    // Extraire les articles (JSON ou champ meuble simple)
    const articles: { nom: string; categorie?: string | null; finition?: string | null; quantite: number }[] = [];

    // Vérifier si articles contient un tableau JSON
    const articlesJson = (demande as any).articles;
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
      // Format standard : un seul meuble en string
      articles.push({
        nom: demande.meuble,
        categorie: null,
        finition: null,
        quantite: 1,
      });
    }

    if (articles.length === 0) {
      return NextResponse.json({
        success: true,
        matches: [],
        totalEstimatedHT: 0,
        totalEstimatedTTC: 0,
        message: "Aucun article à matcher",
      });
    }

    // Charger le catalogue Sellsy complet (product + service, non archivés)
    let allItems: SellsyItem[] = [];
    try {
      allItems = await listAllItems();
    } catch (err: any) {
      return NextResponse.json({
        success: false,
        error: `Erreur Sellsy: ${err.message}`,
        matches: [],
      }, { status: 502 });
    }

    // Matcher chaque article
    const matchResults: MatchResult[] = [];
    let totalEstimatedHT = 0;
    let totalEstimatedTTC = 0;

    for (const article of articles) {
      const matches: MatchResult["matchesSellsy"] = [];

      for (const item of allItems) {
        const itemName = item.name || item.reference || item.description || "";
        const prixHT = parseFloat(item.reference_price_taxes_exc || "0");
        const prixTTC = parseFloat(item.reference_price_taxes_inc || "0");

        // Score par nom
        let score = scoreMatch(article.nom, itemName);

        // Bonus si la référence contient un mot-clé
        if (score < 50 && item.reference) {
          const refScore = scoreMatch(article.nom, item.reference);
          score = Math.max(score, refScore * 0.8);
        }

        // Bonus si la description matche
        if (score < 50 && item.description && item.description !== itemName) {
          const descScore = scoreMatch(article.nom, item.description);
          score = Math.max(score, descScore * 0.7);
        }

        // Bonus catégorie si match partiel
        if (score > 20 && article.categorie) {
          const catScore = scoreMatch(article.categorie, itemName);
          if (catScore > 30) score = Math.min(100, score + 10);
        }

        if (score >= 30) {
          matches.push({
            id: item.id,
            name: itemName,
            reference: item.reference || "",
            prixHT,
            prixTTC,
            score: Math.round(score),
            matchType: score >= 85 ? "exact" : score >= 50 ? "partiel" : "categorie",
          });
        }
      }

      // Trier par score décroissant
      matches.sort((a, b) => b.score - a.score);
      const topMatches = matches.slice(0, 5);
      const bestMatch = topMatches[0] || null;

      const estimatedHT = bestMatch ? bestMatch.prixHT * article.quantite : 0;
      const estimatedTTC = bestMatch ? bestMatch.prixTTC * article.quantite : 0;

      totalEstimatedHT += estimatedHT;
      totalEstimatedTTC += estimatedTTC;

      matchResults.push({
        articleDemande: article,
        matchesSellsy: topMatches,
        bestMatch,
        estimatedValueHT: estimatedHT,
        estimatedValueTTC: estimatedTTC,
      });
    }

    return NextResponse.json({
      success: true,
      demandeId: id,
      contact: `${demande.contact.prenom} ${demande.contact.nom}`,
      matches: matchResults,
      totalEstimatedHT: Math.round(totalEstimatedHT * 100) / 100,
      totalEstimatedTTC: Math.round(totalEstimatedTTC * 100) / 100,
      catalogSize: allItems.length,
      message: totalEstimatedHT > 0
        ? `Estimation: ${totalEstimatedTTC.toFixed(2)}€ TTC`
        : "Aucune correspondance trouvée dans le catalogue Sellsy",
    });
  } catch (error: any) {
    console.error("Match Sellsy error:", error);
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}
