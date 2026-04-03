import { NextRequest, NextResponse } from "next/server";
import { getStockForItem, getWarehouses } from "@/lib/sellsy";
import { stockCache } from "@/lib/api-cache";

// GET /api/sellsy/stock/[itemId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const id = parseInt(itemId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid itemId" }, { status: 400 });
    }

    const fresh = request.nextUrl.searchParams.get("fresh") === "true";
    const cacheKey = `item_${id}`;

    if (!fresh) {
      const cached = stockCache.get(cacheKey);
      if (cached) return NextResponse.json({ ...cached, _fromCache: true });
    }

    const [stockData, warehouses] = await Promise.all([
      getStockForItem(id),
      getWarehouses(),
    ]);

    const stock = Object.values(stockData).map((s) => ({
      warehouseId: s.whid,
      warehouseLabel: warehouses[s.whid]?.label || `Entrepôt #${s.whid}`,
      quantity: parseFloat(s.qt || "0"),
      booked: parseFloat(s.bookedqt || "0"),
      available: parseFloat(s.availableqt || "0"),
      isDefault: warehouses[s.whid]?.isdefault === "Y",
    }));

    const totalAvailable = stock.reduce((sum, s) => sum + s.available, 0);
    const responseData = { success: true, stock, totalAvailable };

    stockCache.set(cacheKey, responseData);

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Erreur Sellsy stock:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
