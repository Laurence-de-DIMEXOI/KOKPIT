import { NextRequest, NextResponse } from "next/server";
import { getItem } from "@/lib/sellsy";

// GET /api/sellsy/items/[itemId] — Récupère un item Sellsy par son ID
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const result = await getItem(Number(itemId));
    // getItem retourne { data: SellsyItem } ou directement SellsyItem selon la version de l'API
    const item = (result as any).data ?? result;
    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
