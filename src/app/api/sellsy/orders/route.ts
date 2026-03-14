import { NextRequest, NextResponse } from "next/server";
import { listOrders, searchOrders, invalidateSellsyCache } from "@/lib/sellsy";
import { ordersCache } from "@/lib/api-cache";

// GET /api/sellsy/orders - Liste des bons de commande Sellsy
// Params: limit, offset, status, fresh
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fresh = searchParams.get("fresh") === "true";
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const status = searchParams.get("status") || "";

    const cacheKey = `ord_${limit}_${offset}_${status}`;

    if (!fresh) {
      const cached = ordersCache.get(cacheKey);
      if (cached) {
        return NextResponse.json({ ...cached, _fromCache: true });
      }
    } else {
      invalidateSellsyCache();
      ordersCache.invalidate();
    }

    let result;
    if (status) {
      result = await searchOrders({
        filters: { status: status.split(",") },
        limit, offset, order: "created", direction: "desc",
      });
    } else {
      result = await listOrders({ limit, offset, order: "created", direction: "desc" });
    }

    const responseData = {
      success: true,
      orders: result.data,
      pagination: result.pagination,
      _cache: { generatedAt: new Date().toISOString() },
    };

    ordersCache.set(cacheKey, responseData);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Erreur Sellsy orders:", error);
    const stale = ordersCache.getStale("ord_default");
    if (stale) return NextResponse.json({ ...stale.data, _stale: true });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
