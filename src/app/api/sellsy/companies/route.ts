import { NextRequest, NextResponse } from "next/server";
import { listCompanies, searchCompanies } from "@/lib/sellsy";

// GET /api/sellsy/companies - Liste des entreprises Sellsy
// Params: limit, offset, created_start, created_end
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const createdStart = searchParams.get("created_start") || "";
    const createdEnd = searchParams.get("created_end") || "";

    const needsSearch = !!(createdStart || createdEnd);

    let result;

    if (needsSearch) {
      const filters: any = {};
      if (createdStart || createdEnd) {
        filters.created = {};
        if (createdStart) filters.created.start = createdStart;
        if (createdEnd) filters.created.end = createdEnd;
      }

      result = await searchCompanies({
        filters,
        limit,
        offset,
        order: "created",
        direction: "desc",
      });
    } else {
      result = await listCompanies({
        limit,
        offset,
        order: "created",
        direction: "desc",
      });
    }

    return NextResponse.json({
      success: true,
      companies: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error("Erreur Sellsy companies:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
