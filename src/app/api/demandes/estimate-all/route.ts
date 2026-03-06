import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listAllItems } from "@/lib/sellsy";
import { estimateAndSave } from "@/lib/estimation";

/**
 * POST /api/demandes/estimate-all
 *
 * Charge le catalogue Sellsy une seule fois, puis estime toutes les demandes
 * qui n'ont pas encore d'estimation. Sauvegarde les résultats en base.
 *
 * Query params:
 * - force=true : recalculer même celles déjà estimées
 * - limit=N : limiter le nombre (défaut: 50, max: 100)
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const force = url.searchParams.get("force") === "true";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

    // Charger le catalogue une seule fois
    const catalogue = await listAllItems();

    // Trouver les demandes à estimer
    const demandes = await prisma.demandePrix.findMany({
      where: force
        ? {}
        : { estimationTTC: null },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, meuble: true },
    });

    if (demandes.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Toutes les demandes sont déjà estimées",
        estimated: 0,
        catalogSize: catalogue.length,
      });
    }

    // Estimer chaque demande avec le catalogue pré-chargé
    let estimated = 0;
    let errors = 0;
    const results: { id: string; estimationTTC: number; error?: string }[] = [];

    for (const demande of demandes) {
      try {
        const result = await estimateAndSave(demande.id, catalogue);
        if (result.success) {
          estimated++;
          results.push({
            id: demande.id,
            estimationTTC: result.totalEstimatedTTC,
          });
        } else {
          errors++;
          results.push({
            id: demande.id,
            estimationTTC: 0,
            error: result.error,
          });
        }
      } catch (err: any) {
        errors++;
        results.push({
          id: demande.id,
          estimationTTC: 0,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      estimated,
      errors,
      total: demandes.length,
      catalogSize: catalogue.length,
      results,
    });
  } catch (error: any) {
    console.error("Estimate-all error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
