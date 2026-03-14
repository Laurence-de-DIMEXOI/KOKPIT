import { NextRequest, NextResponse } from "next/server";
import { searchItems, listAllItems, invalidateSellsyCache } from "@/lib/sellsy";
import { itemsCache } from "@/lib/api-cache";

// GET /api/sellsy/items - Liste des produits (exclut shipping/packaging et archivés)
// Cache 1h — les produits ne changent quasiment jamais
// Param fresh=true pour forcer le refresh
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fresh = searchParams.get("fresh") === "true";
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = searchParams.get("offset") || "0";
    const search = searchParams.get("search") || "";
    const all = searchParams.get("all") === "true";

    const cacheKey = all ? "items_all" : `items_${limit}_${offset}_${search}`;

    // Vérifier le cache (1h TTL — produits stables)
    if (!fresh) {
      const cached = itemsCache.get(cacheKey);
      if (cached) {
        return NextResponse.json({ ...cached, _fromCache: true });
      }
    } else {
      invalidateSellsyCache();
      itemsCache.invalidate();
    }

    if (all) {
      const items = await listAllItems();
      const responseData = {
        success: true,
        items,
        pagination: { total: items.length, count: items.length, limit: items.length, offset: 0 },
        _cache: { generatedAt: new Date().toISOString() },
      };
      itemsCache.set(cacheKey, responseData);
      return NextResponse.json(responseData);
    }

    const filters: { name?: string; type?: string[]; is_archived?: boolean } = {
      type: ["product", "service"],
      is_archived: false,
    };
    if (search) filters.name = search;

    const result = await searchItems({ filters, limit, offset });
    const responseData = {
      success: true,
      items: result.data,
      pagination: result.pagination,
      _cache: { generatedAt: new Date().toISOString() },
    };
    itemsCache.set(cacheKey, responseData);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Erreur Sellsy items:", error);
    // Retourner stale data si dispo
    const stale = itemsCache.getStale("items_all");
    if (stale) return NextResponse.json({ ...stale.data, _stale: true });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
