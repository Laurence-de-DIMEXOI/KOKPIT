import { NextRequest, NextResponse } from "next/server";
import { listItems, searchItems } from "@/lib/sellsy";

// GET /api/sellsy/items - Liste des produits
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const search = searchParams.get("search") || "";

    let result;
    if (search) {
      result = await searchItems({ name: search });
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
