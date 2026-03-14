import { NextRequest, NextResponse } from "next/server";
import { listEstimates, searchEstimates, invalidateSellsyCache } from "@/lib/sellsy";
import { estimatesCache } from "@/lib/api-cache";

// GET /api/sellsy/estimates - Liste des devis Sellsy
// Params: limit, offset, status, created_start, created_end, fresh
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fresh = searchParams.get("fresh") === "true";
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const status = searchParams.get("status") || "";
    const createdStart = searchParams.get("created_start") || "";
    const createdEnd = searchParams.get("created_end") || "";

    // Clé de cache unique basée sur les paramètres
    const cacheKey = `est_${limit}_${offset}_${status}_${createdStart}_${createdEnd}`;

    // Vérifier le cache (sauf si fresh=true)
    if (!fresh) {
      const cached = estimatesCache.get(cacheKey);
      if (cached) {
        return NextResponse.json({ ...cached, _fromCache: true });
      }
    } else {
      invalidateSellsyCache();
      estimatesCache.invalidate();
    }

    const needsSearch = !!(status || createdStart || createdEnd);
    let result;

    if (needsSearch) {
      const filters: any = {};
      if (status) filters.status = status.split(",");
      if (createdStart || createdEnd) {
        filters.created = {};
        if (createdStart) filters.created.start = createdStart;
        if (createdEnd) filters.created.end = createdEnd;
      }
      result = await searchEstimates({ filters, limit, offset, order: "created", direction: "desc" });
    } else {
      result = await listEstimates({ limit, offset, order: "created", direction: "desc" });
    }

    const responseData = {
      success: true,
      estimates: result.data,
      pagination: result.pagination,
      _cache: { generatedAt: new Date().toISOString() },
    };

    estimatesCache.set(cacheKey, responseData);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Erreur Sellsy estimates:", error);
    // Retourner les données stale si dispo
    const stale = estimatesCache.getStale("est_default");
    if (stale) return NextResponse.json({ ...stale.data, _stale: true });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
