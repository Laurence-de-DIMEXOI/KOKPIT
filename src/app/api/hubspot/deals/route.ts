import { NextRequest, NextResponse } from "next/server";
import { listDeals, getDealPipelines } from "@/lib/hubspot";

/**
 * GET /api/hubspot/deals
 *
 * Récupère les deals HubSpot avec pipeline info.
 * Query params:
 * - limit: nombre de résultats (défaut: 100)
 * - after: cursor pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const after = searchParams.get("after") || undefined;

    // Récupérer deals + pipelines en parallèle
    const [dealsRes, pipelinesRes] = await Promise.all([
      listDeals({ limit, after }),
      getDealPipelines().catch(() => ({ results: [] })),
    ]);

    // Index des stages par ID
    const stageMap = new Map<
      string,
      { label: string; pipeline: string }
    >();
    for (const pipeline of pipelinesRes.results) {
      for (const stage of pipeline.stages) {
        stageMap.set(stage.id, {
          label: stage.label,
          pipeline: pipeline.label,
        });
      }
    }

    // Formater les deals
    const deals = dealsRes.results.map((d) => {
      const stageInfo = stageMap.get(d.properties.dealstage || "");
      return {
        id: d.id,
        hubspotId: d.id,
        nom: d.properties.dealname || "",
        stage: d.properties.dealstage || "",
        stageLabel: stageInfo?.label || d.properties.dealstage || "",
        pipeline: d.properties.pipeline || "",
        pipelineLabel: stageInfo?.pipeline || "",
        montant: parseFloat(d.properties.amount || "0"),
        dateClose: d.properties.closedate || null,
        source: d.properties.hs_analytics_source || null,
        createdAt: d.properties.createdate || d.createdAt,
        updatedAt: d.properties.lastmodifieddate || d.updatedAt,
      };
    });

    // KPIs
    const totalMontant = deals.reduce((s, d) => s + d.montant, 0);
    const dealsAvecMontant = deals.filter((d) => d.montant > 0);
    const dealsClosed = deals.filter(
      (d) =>
        d.stageLabel.toLowerCase().includes("gagn") ||
        d.stageLabel.toLowerCase().includes("won") ||
        d.stageLabel.toLowerCase().includes("clos")
    );
    const caClosed = dealsClosed.reduce((s, d) => s + d.montant, 0);

    return NextResponse.json({
      success: true,
      deals,
      kpis: {
        totalDeals: deals.length,
        totalMontant: Math.round(totalMontant * 100) / 100,
        dealsAvecMontant: dealsAvecMontant.length,
        dealsClosed: dealsClosed.length,
        caClosed: Math.round(caClosed * 100) / 100,
      },
      pipelines: pipelinesRes.results.map((p) => ({
        id: p.id,
        label: p.label,
        stages: p.stages.map((s) => ({
          id: s.id,
          label: s.label,
        })),
      })),
      pagination: {
        count: deals.length,
        next: dealsRes.paging?.next?.after || null,
      },
    });
  } catch (error: any) {
    console.error("GET /api/hubspot/deals error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
