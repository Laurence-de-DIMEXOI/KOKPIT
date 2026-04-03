import { NextRequest, NextResponse } from "next/server";
import { getStockForItem, getWarehouses, listAllItems } from "@/lib/sellsy";
import { stockCache } from "@/lib/api-cache";

export const maxDuration = 120; // 2 min max

// GET /api/sellsy/stock/all — charge le stock de tous les produits
// Cache 30 min côté serveur
export async function GET(request: NextRequest) {
  try {
    const fresh = request.nextUrl.searchParams.get("fresh") === "true";

    if (!fresh) {
      const cached = stockCache.get("all");
      if (cached) {
        return NextResponse.json({ ...cached, _fromCache: true });
      }
    }

    const [items, warehouses] = await Promise.all([
      listAllItems(),
      getWarehouses(),
    ]);

    // Seuls les produits (pas services) ont du stock
    const products = items.filter((i) => i.type === "product");
    console.log(`[Stock/all] ${products.length} produits à charger...`);

    const stockMap: Record<number, {
      stock: Array<{
        warehouseId: string;
        warehouseLabel: string;
        quantity: number;
        booked: number;
        available: number;
        isDefault: boolean;
      }>;
      totalAvailable: number;
    }> = {};

    const BATCH = 20;
    for (let i = 0; i < products.length; i += BATCH) {
      const batch = products.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map(async (item) => {
          const stockData = await getStockForItem(item.id);
          const entries = Object.values(stockData).map((s) => ({
            warehouseId: s.whid,
            warehouseLabel: warehouses[s.whid]?.label || `Entrepôt #${s.whid}`,
            quantity: parseFloat(s.qt || "0"),
            booked: parseFloat(s.bookedqt || "0"),
            available: parseFloat(s.availableqt || "0"),
            isDefault: warehouses[s.whid]?.isdefault === "Y",
          }));
          const totalAvailable = entries.reduce((sum, s) => sum + s.available, 0);
          return { itemId: item.id, stock: entries, totalAvailable };
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled") {
          stockMap[r.value.itemId] = {
            stock: r.value.stock,
            totalAvailable: r.value.totalAvailable,
          };
        }
      }

      if ((i + BATCH) % 100 === 0 || i + BATCH >= products.length) {
        console.log(`[Stock/all] ${Math.min(i + BATCH, products.length)}/${products.length}`);
      }
    }

    const responseData = {
      success: true,
      stockMap,
      count: Object.keys(stockMap).length,
      _generatedAt: new Date().toISOString(),
    };

    stockCache.set("all", responseData);
    console.log(`[Stock/all] Terminé: ${Object.keys(stockMap).length} items avec stock`);

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("[Stock/all] Erreur:", error);
    const stale = stockCache.getStale("all");
    if (stale) return NextResponse.json({ ...stale.data, _stale: true });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
