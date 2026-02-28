import { NextRequest, NextResponse } from "next/server";
import { listItems, searchItems } from "@/lib/sellsy";

// GET /api/sellsy/items - Liste des produits
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "500", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const search = searchParams.get("search") || "";
    const isArchived = searchParams.get("is_archived") || "false";

    let result;
    if (search || isArchived === "false") {
      const filters: any = {};
      if (search) filters.name = search;
      if (isArchived === "false") filters.is_archived = false;
      result = await searchItems(filters);
    } else {
      result = await listItems({ limit, offset });
    }

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
