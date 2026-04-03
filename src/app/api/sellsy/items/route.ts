import { NextRequest, NextResponse } from "next/server";
import { searchItems, listAllItems, listDeclinations, invalidateSellsyCache } from "@/lib/sellsy";
import { itemsCache } from "@/lib/api-cache";

// GET /api/sellsy/items - Liste des produits (exclut shipping/packaging et archivés)
// Cache 1h — les produits ne changent quasiment jamais
// Param fresh=true pour forcer le refresh
// Param withDeclinations=true pour inclure les déclinaisons
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fresh = searchParams.get("fresh") === "true";
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = searchParams.get("offset") || "0";
    const search = searchParams.get("search") || "";
    const all = searchParams.get("all") === "true";
    const withDecl = searchParams.get("withDeclinations") === "true";

    const cacheKey = all
      ? withDecl ? "items_all_decl" : "items_all"
      : `items_${limit}_${offset}_${search}`;

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

      // Si demandé, récupérer les déclinaisons pour les items déclinés
      let declinations: Record<number, Array<{
        id: number;
        reference: string;
        name: string | null;
        reference_price_taxes_exc: string | null;
        purchase_amount: string | null;
      }>> = {};

      if (withDecl) {
        const declinedItems = items.filter((i) => i.is_declined);
        // Batch par 5 pour ne pas surcharger l'API
        const BATCH = 5;
        for (let i = 0; i < declinedItems.length; i += BATCH) {
          const batch = declinedItems.slice(i, i + BATCH);
          const results = await Promise.all(
            batch.map(async (item) => {
              try {
                const res = await listDeclinations(item.id);
                return { itemId: item.id, data: res.data };
              } catch {
                return { itemId: item.id, data: [] };
              }
            })
          );
          for (const r of results) {
            if (r.data.length > 0) {
              declinations[r.itemId] = r.data.map((d) => ({
                id: d.id,
                reference: d.reference,
                name: d.name,
                reference_price_taxes_exc: d.reference_price_taxes_exc,
                purchase_amount: d.purchase_amount,
              }));
            }
          }
        }
      }

      const responseData = {
        success: true,
        items,
        declinations: withDecl ? declinations : undefined,
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
