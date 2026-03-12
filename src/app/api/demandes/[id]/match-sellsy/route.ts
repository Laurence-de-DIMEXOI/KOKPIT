import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listAllItems } from "@/lib/sellsy";
import { extractArticles, estimateDemande } from "@/lib/estimation";

/**
 * GET /api/demandes/[id]/match-sellsy
 *
 * Cherche dans le catalogue Sellsy les produits correspondant
 * aux articles de la demande de prix pour estimer sa valeur.
 *
 * Matching déterministe : abréviations métier DIMEXOI + synonymes + mots-clés.
 */

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
    const articles = extractArticles(demande);

    if (articles.length === 0) {
      return NextResponse.json({
        success: true,
        matches: [],
        totalEstimatedHT: 0,
        totalEstimatedTTC: 0,
        message: "Aucun article à matcher",
      });
    }

    // Charger le catalogue Sellsy complet (utilise le cache)
    let catalogue;
    try {
      catalogue = await listAllItems();
    } catch (err: any) {
      return NextResponse.json({
        success: false,
        error: `Erreur Sellsy: ${err.message}`,
        matches: [],
      }, { status: 502 });
    }

    // Utiliser le matching déterministe partagé
    const result = await estimateDemande(articles, catalogue);

    return NextResponse.json({
      success: result.success,
      demandeId: id,
      contact: `${demande.contact.prenom} ${demande.contact.nom}`,
      matches: result.matches,
      totalEstimatedHT: result.totalEstimatedHT,
      totalEstimatedTTC: result.totalEstimatedTTC,
      catalogSize: result.catalogSize,
      message: result.totalEstimatedHT > 0
        ? `Estimation: ${result.totalEstimatedTTC.toFixed(2)}€ TTC`
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
