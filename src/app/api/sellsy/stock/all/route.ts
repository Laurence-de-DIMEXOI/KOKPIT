import { NextRequest, NextResponse } from "next/server";
import { getStockForItem, getWarehouses, listAllItems } from "@/lib/sellsy";
import { dbStockCache } from "@/lib/db-cache";

export const maxDuration = 120; // 2 min max

// GET /api/sellsy/stock/all — charge le stock de tous les produits
// Cache 30 min côté serveur
export async function GET(request: NextRequest) {
  try {
    const fresh = request.nextUrl.searchParams.get("fresh") === "true";

    if (!fresh) {
      const cached = await dbStockCache.get("all");
      if (cached) {
        return NextResponse.json({ ...(cached as any), _fromCache: true });
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

    // Batch de 5 avec 1,2s de délai = ~4 appels/s = ~250/min, sous le rate limit Sellsy V1
    const BATCH = 5;
    const DELAY_MS = 1200;

    const fetchOneItem = async (item: { id: number }) => {
      try {
        const sd = await getStockForItem(item.id);
        return { itemId: item.id, sd };
      } catch (err: any) {
        if (err?.message?.includes("429") || err?.message?.includes("E_LIMIT")) {
          await new Promise((r) => setTimeout(r, 3000));
          const sd = await getStockForItem(item.id);
          return { itemId: item.id, sd };
        }
        throw err;
      }
    };

    for (let i = 0; i < products.length; i += BATCH) {
      const batch = products.slice(i, i + BATCH);
      const results = await Promise.allSettled(batch.map(fetchOneItem));

      for (const r of results) {
        if (r.status === "fulfilled") {
          const { itemId, sd } = r.value;
          const entries = Object.values(sd).map((s) => ({
            warehouseId: s.whid,
            warehouseLabel: warehouses[s.whid]?.label || `Entrepôt #${s.whid}`,
            quantity: parseFloat(s.qt || "0"),
            booked: parseFloat(s.bookedqt || "0"),
            available: parseFloat(s.availableqt || "0"),
            isDefault: warehouses[s.whid]?.isdefault === "Y",
          }));
          const totalAvailable = entries.reduce((sum, s) => sum + s.available, 0);
          stockMap[itemId] = { stock: entries, totalAvailable };
        }
      }

      if ((i + BATCH) % 50 === 0 || i + BATCH >= products.length) {
        console.log(`[Stock/all] ${Math.min(i + BATCH, products.length)}/${products.length}`);
      }

      // Pause entre chaque batch pour respecter le rate limit Sellsy V1
      if (i + BATCH < products.length) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }

    const responseData = {
      success: true,
      stockMap,
      count: Object.keys(stockMap).length,
      _generatedAt: new Date().toISOString(),
    };

    await dbStockCache.set("all", responseData);
    console.log(`[Stock/all] Terminé: ${Object.keys(stockMap).length} items avec stock`);

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("[Stock/all] Erreur:", error);
    const stale = await dbStockCache.getStale("all");
    if (stale) return NextResponse.json({ ...(stale.data as any), _stale: true });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
