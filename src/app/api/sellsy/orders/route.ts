import { NextRequest, NextResponse } from "next/server";
import { listOrders, searchOrders } from "@/lib/sellsy";

// GET /api/sellsy/orders - Liste des bons de commande Sellsy
// Params: limit, offset, status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const status = searchParams.get("status") || "";

    let result;
    if (status) {
      result = await searchOrders({
        filters: { status: status.split(",") },
        limit,
        offset,
      });
    } else {
      result = await listOrders({ limit, offset });
    }

    return NextResponse.json({
      success: true,
      orders: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error("Erreur Sellsy orders:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
