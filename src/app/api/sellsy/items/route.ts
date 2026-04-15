import { NextRequest, NextResponse } from "next/server";
import { searchItems, listAllItems, listDeclinations, getItemV1Declinations, invalidateSellsyCache } from "@/lib/sellsy";
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
        reference_price_taxes_inc?: string | null;
        purchase_amount: string | null;
      }>> = {};

      if (withDecl) {
        const declinedItems = items.filter((i) => i.is_declined);
        // Batch par 20 — bon compromis vitesse / rate limit Sellsy.
        // Pour chaque item on appelle v2 (structure) ET v1 (prix propres) en parallèle.
        const BATCH = 20;
        for (let i = 0; i < declinedItems.length; i += BATCH) {
          const batch = declinedItems.slice(i, i + BATCH);
          const results = await Promise.all(
            batch.map(async (item) => {
              try {
                const [res, v1Decls] = await Promise.all([
                  listDeclinations(item.id),
                  getItemV1Declinations(item.id),
                ]);
                return { itemId: item.id, data: res.data, v1: v1Decls };
              } catch {
                return { itemId: item.id, data: [], v1: [] };
              }
            })
          );
          for (const r of results) {
            if (r.data.length > 0) {
              const v1ById = new Map<string, any>();
              const v1ByRef = new Map<string, any>();
              for (const v of r.v1 || []) {
                if (v.id) v1ById.set(String(v.id), v);
                if (v.name) v1ByRef.set(String(v.name), v);
              }
              declinations[r.itemId] = r.data.map((d: any) => {
                const v1 = v1ById.get(String(d.id)) || v1ByRef.get(String(d.reference));
                const v1HT = v1?.refPriceTaxesFree ? (v1?.refPrice ?? v1?.priceInc ?? null) : null;
                const v1TTCIfInc = !v1?.refPriceTaxesFree ? (v1?.priceInc ?? v1?.refPrice ?? null) : null;
                return {
                  id: d.id,
                  reference: d.reference,
                  name: d.name,
                  reference_price_taxes_exc: d.reference_price_taxes_exc ?? v1HT,
                  reference_price_taxes_inc: d.reference_price_taxes_inc ?? v1TTCIfInc,
                  purchase_amount: d.purchase_amount ?? (v1?.purchaseInc ?? null),
                };
              });
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
