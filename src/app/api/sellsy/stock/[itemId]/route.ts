import { NextRequest, NextResponse } from "next/server";
import { getStockForItem, getWarehouses } from "@/lib/sellsy";

// GET /api/sellsy/stock/[itemId]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const id = parseInt(itemId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid itemId" }, { status: 400 });
    }

    const [stockData, warehouses] = await Promise.all([
      getStockForItem(id),
      getWarehouses(),
    ]);

    // Enrichir avec le nom de l'entrepôt
    const stock = Object.values(stockData).map((s) => ({
      warehouseId: s.whid,
      warehouseLabel: warehouses[s.whid]?.label || `Entrepôt #${s.whid}`,
      quantity: parseFloat(s.qt || "0"),
      booked: parseFloat(s.bookedqt || "0"),
      available: parseFloat(s.availableqt || "0"),
      isDefault: warehouses[s.whid]?.isdefault === "Y",
    }));

    const totalAvailable = stock.reduce((sum, s) => sum + s.available, 0);

    return NextResponse.json({
      success: true,
      stock,
      totalAvailable,
    });
  } catch (error: any) {
    console.error("Erreur Sellsy stock:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
