import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sellsyFetch, getItemV1Declinations } from "@/lib/sellsy";

/**
 * GET /api/sellsy/items/debug-price?ref=EFWS+162R
 *
 * Diagnostic complet d'un produit/déclinaison Sellsy pour comprendre les
 * écarts de prix entre KOKPIT et Sellsy. Retourne :
 *  - Recherche V2 par référence
 *  - Détails de l'item parent
 *  - Toutes les déclinaisons V2 (avec prix HT/TTC)
 *  - Toutes les déclinaisons V1 (prix anciens)
 *  - Grilles tarifaires (/declinations/{id}/prices) si dispo
 *  - Comparaison côte-à-côte
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const url = new URL(req.url);
  const ref = url.searchParams.get("ref")?.trim() || "EFWS 162R";

  try {
    // ===== 1a. Search par reference (items parents) =====
    const searchByRef = await sellsyFetch<{ data: any[] }>(
      `/items/search?limit=20`,
      {
        method: "POST",
        body: JSON.stringify({ filters: { reference: ref } }),
      }
    ).catch((e) => ({ data: [], error: (e as Error).message }));

    // ===== 1b. Search par name (au cas où la ref est dans le name) =====
    const searchByName = await sellsyFetch<{ data: any[] }>(
      `/items/search?limit=20`,
      {
        method: "POST",
        body: JSON.stringify({ filters: { name: ref } }),
      }
    ).catch((e) => ({ data: [], error: (e as Error).message }));

    // ===== 1c. Search direct côté déclinaisons =====
    const searchDecl = await sellsyFetch<{ data: any[] }>(
      `/items/declinations/search?limit=20`,
      {
        method: "POST",
        body: JSON.stringify({ filters: { reference: ref } }),
      }
    ).catch((e) => ({ data: [], error: (e as Error).message }));

    // Fusionner les résultats : items parents trouvés + parents des déclinaisons
    const itemIdsToProbe = new Set<number>();
    for (const it of (searchByRef as any).data || []) itemIdsToProbe.add(it.id);
    for (const it of (searchByName as any).data || []) itemIdsToProbe.add(it.id);
    for (const d of (searchDecl as any).data || []) {
      if (d.item_id) itemIdsToProbe.add(d.item_id);
    }

    // Si toujours rien, fallback : scanner tous les items déclinés et chercher
    // une déclinaison qui matche la ref (lent mais exhaustif).
    let scannedAll = false;
    if (itemIdsToProbe.size === 0) {
      scannedAll = true;
      try {
        const all = await sellsyFetch<{ data: any[]; pagination?: any }>(
          `/items/search?limit=100&offset=0`,
          {
            method: "POST",
            body: JSON.stringify({ filters: { is_archived: false, type: ["product"] } }),
          }
        );
        // Pour optimiser, on ne va pas itérer 1700 items : on cherche d'abord les items
        // dont la ref ressemble (ex. "EFWS").
        const refPrefix = ref.split(/\s+/)[0];
        const candidates = (all.data || []).filter(
          (i: any) =>
            (i.reference || "").toUpperCase().includes(refPrefix.toUpperCase()) ||
            (i.name || "").toUpperCase().includes(refPrefix.toUpperCase())
        );
        for (const c of candidates) itemIdsToProbe.add(c.id);
      } catch (e) {
        console.warn("Fallback search failed:", e);
      }
    }

    const searchRes = {
      data: Array.from(itemIdsToProbe).map((id) => ({ id })),
      _byRef: (searchByRef as any).data?.length || 0,
      _byName: (searchByName as any).data?.length || 0,
      _byDecl: (searchDecl as any).data?.length || 0,
      _scannedAll: scannedAll,
    };

    // ===== 2. Pour chaque match, récupérer ses détails complets =====
    const enrichedItems: any[] = [];
    for (const stub of searchRes.data) {
      const detailRes: any = await sellsyFetch<{ data: any }>(`/items/${stub.id}`).catch(
        (e) => ({ error: (e as Error).message })
      );
      const item = detailRes?.data || stub;
      const detail = detailRes;

      // Si l'item est décliné, fetch ses déclinaisons V2 + V1
      let declinations: any = null;
      let v1Declinations: any = null;
      if (item.is_declined) {
        const v2 = await sellsyFetch<{ data: any[] }>(
          `/items/${item.id}/declinations?limit=100`
        ).catch((e) => ({ data: [], error: (e as Error).message }));
        declinations = v2;
        try {
          v1Declinations = await getItemV1Declinations(item.id);
        } catch (e) {
          v1Declinations = { error: (e as Error).message };
        }
      }

      // Cherche la déclinaison qui matche notre ref (ou l'item lui-même)
      const declMatch = (declinations?.data || []).find(
        (d: any) =>
          d.reference?.trim().toUpperCase() === ref.toUpperCase()
      );

      // Si on a trouvé une déclinaison qui matche, récupérer aussi sa grille tarifaire
      let priceGrid: any = null;
      if (declMatch) {
        priceGrid = await sellsyFetch<{ data: any[] }>(
          `/items/${item.id}/declinations/${declMatch.id}/prices?limit=20`
        ).catch((e) => ({ data: [], error: (e as Error).message }));
      } else if (!item.is_declined) {
        // Item non décliné → grille tarifaire au niveau item
        priceGrid = await sellsyFetch<{ data: any[] }>(
          `/items/${item.id}/prices?limit=20`
        ).catch((e) => ({ data: [], error: (e as Error).message }));
      }

      // V1 details pour la décli matchée (prix par showroom, etc.)
      let v1Match: any = null;
      if (Array.isArray(v1Declinations)) {
        v1Match = v1Declinations.find(
          (v: any) =>
            String(v.name || "").toUpperCase() === ref.toUpperCase() ||
            (declMatch && String(v.id) === String(declMatch.id))
        );
      }

      enrichedItems.push({
        item: {
          id: item.id,
          name: item.name,
          reference: item.reference,
          is_declined: item.is_declined,
          tax_id: item.tax_id,
          reference_price_taxes_exc: item.reference_price_taxes_exc,
          reference_price_taxes_inc: item.reference_price_taxes_inc,
        },
        detail: (detail as any).data || detail,
        declinations: declinations,
        v1Declinations: v1Declinations,
        declMatchV2: declMatch,
        v1Match,
        priceGrid,
      });
    }

    return NextResponse.json({
      ref,
      searchSummary: {
        byReference: searchRes._byRef,
        byName: searchRes._byName,
        byDeclination: searchRes._byDecl,
        scannedFullCatalog: searchRes._scannedAll,
        itemsToInspect: searchRes.data.length,
      },
      hint:
        "Comparer les prix dans : item.reference_price_taxes_exc/inc, declinations.data[].reference_price_taxes_exc/inc, v1Declinations[].refPrice/priceInc, priceGrid.data[].price_taxes_exc/inc",
      items: enrichedItems,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, stack: error.stack?.split("\n").slice(0, 5) },
      { status: 500 }
    );
  }
}
