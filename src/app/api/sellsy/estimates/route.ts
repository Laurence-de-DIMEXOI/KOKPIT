import { NextRequest, NextResponse } from "next/server";
import { listEstimates, searchEstimates } from "@/lib/sellsy";

// GET /api/sellsy/estimates - Liste des devis Sellsy
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const status = searchParams.get("status") || "";

    let result;
    if (status) {
      result = await searchEstimates({ status: status.split(",") });
    } else {
      result = await listEstimates({ limit, offset });
    }

    return NextResponse.json({
      success: true,
      estimates: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error("Erreur Sellsy estimates:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
