import { NextRequest, NextResponse } from "next/server";
import { listOrders, searchOrders, invalidateSellsyCache } from "@/lib/sellsy";

// GET /api/sellsy/orders - Liste des bons de commande Sellsy
// Params: limit, offset, status, fresh
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("fresh") === "true") invalidateSellsyCache();
    const limit = parseInt(searchParams.get("limit") || "500", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const status = searchParams.get("status") || "";

    let result;
    if (status) {
      result = await searchOrders({
        filters: { status: status.split(",") },
        limit,
        offset,
        order: "created",
        direction: "desc",
      });
    } else {
      result = await listOrders({
        limit,
        offset,
        order: "created",
        direction: "desc",
      });
    }

    return NextResponse.json({
      success: true,
      orders: result.data,
      pagination: result.pagination,
      _cache: { generatedAt: new Date().toISOString() },
    });
  } catch (error: any) {
    console.error("Erreur Sellsy orders:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
