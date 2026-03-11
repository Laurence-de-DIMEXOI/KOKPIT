import { NextRequest, NextResponse } from "next/server";
import { searchItems, listAllItems, invalidateSellsyCache } from "@/lib/sellsy";

// GET /api/sellsy/items - Liste des produits (exclut shipping/packaging et archivés)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("fresh") === "true") invalidateSellsyCache();
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = searchParams.get("offset") || "0";
    const search = searchParams.get("search") || "";
    const all = searchParams.get("all") === "true";

    // Si on veut tout charger (pour le catalogue complet)
    if (all) {
      const items = await listAllItems();
      return NextResponse.json({
        success: true,
        items,
        pagination: { total: items.length, count: items.length, limit: items.length, offset: 0 },
      });
    }

    // Sinon, recherche paginée avec filtres
    const filters: {
      name?: string;
      type?: string[];
      is_archived?: boolean;
    } = {
      type: ["product", "service"],
      is_archived: false,
    };

    if (search) {
      filters.name = search;
    }

    const result = await searchItems({ filters, limit, offset });

    return NextResponse.json({
      success: true,
      items: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error("Erreur Sellsy items:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
