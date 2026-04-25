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
    // ===== 1. Lister TOUS les items + déclinaisons (cache 1h) =====
    const { listAllItems, listDeclinations } = await import("@/lib/sellsy");
    const allItems = await listAllItems();
    const refUpper = ref.trim().toUpperCase();
    const refPrefix = refUpper.split(/\s+/)[0]; // "EFWS"

    // 1a. Cherche dans les items parents : référence OU nom contient la ref complète
    const itemMatches = allItems.filter((i: any) => {
      const r = (i.reference || "").toUpperCase();
      const n = (i.name || "").toUpperCase();
      return r === refUpper || n === refUpper || r.includes(refUpper) || n.includes(refUpper);
    });

    // 1b. Pour les items déclinés dont la ref/nom contient le préfixe ("EFWS"),
    //     scanner leurs déclinaisons.
    const declinedCandidates = allItems.filter(
      (i: any) =>
        i.is_declined &&
        ((i.reference || "").toUpperCase().includes(refPrefix) ||
          (i.name || "").toUpperCase().includes(refPrefix))
    );

    const declMatches: Array<{ parentId: number; parentName: string | null; decl: any }> = [];
    for (const parent of declinedCandidates) {
      try {
        const declRes = await listDeclinations(parent.id);
        for (const d of declRes.data || []) {
          const dRef = (d.reference || "").toUpperCase();
          const dName = ((d as any).name || "").toUpperCase();
          if (dRef === refUpper || dName === refUpper || dRef.includes(refUpper)) {
            declMatches.push({ parentId: parent.id, parentName: parent.name, decl: d });
          }
        }
      } catch {
        /* skip */
      }
    }

    // Fusionner : items parents qui matchent + parents des déclinaisons matchées
    const itemIdsToProbe = new Set<number>();
    for (const it of itemMatches) itemIdsToProbe.add(it.id);
    for (const m of declMatches) itemIdsToProbe.add(m.parentId);

    const searchRes = {
      data: Array.from(itemIdsToProbe).map((id) => ({ id })),
      _byItem: itemMatches.length,
      _byDecl: declMatches.length,
      _scannedDeclinedItems: declinedCandidates.length,
      _totalCatalogItems: allItems.length,
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
        itemMatches: searchRes._byItem,
        declinationMatches: searchRes._byDecl,
        scannedDeclinedItems: searchRes._scannedDeclinedItems,
        totalCatalogItems: searchRes._totalCatalogItems,
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
