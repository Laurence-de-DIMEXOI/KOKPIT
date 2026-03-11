import { NextRequest, NextResponse } from "next/server";
import { listEstimates, searchEstimates, invalidateSellsyCache } from "@/lib/sellsy";

// GET /api/sellsy/estimates - Liste des devis Sellsy
// Params: limit, offset, status, created_start, created_end, fresh
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("fresh") === "true") invalidateSellsyCache();
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const status = searchParams.get("status") || "";
    const createdStart = searchParams.get("created_start") || "";
    const createdEnd = searchParams.get("created_end") || "";

    const needsSearch = !!(status || createdStart || createdEnd);

    let result;

    if (needsSearch) {
      const filters: any = {};

      if (status) {
        filters.status = status.split(",");
      }
      if (createdStart || createdEnd) {
        filters.created = {};
        if (createdStart) filters.created.start = createdStart;
        if (createdEnd) filters.created.end = createdEnd;
      }

      result = await searchEstimates({
        filters,
        limit,
        offset,
        order: "created",
        direction: "desc",
      });
    } else {
      result = await listEstimates({
        limit,
        offset,
        order: "created",
        direction: "desc",
      });
    }

    return NextResponse.json({
      success: true,
      estimates: result.data,
      pagination: result.pagination,
      _cache: { generatedAt: new Date().toISOString() },
    });
  } catch (error: any) {
    console.error("Erreur Sellsy estimates:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
