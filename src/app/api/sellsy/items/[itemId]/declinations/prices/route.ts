import { NextRequest, NextResponse } from "next/server";
import { getItemDeclinationPrices } from "@/lib/sellsy";

// GET /api/sellsy/items/[itemId]/declinations/prices
// Retourne les prix (HT + TTC) de toutes les déclinaisons d'un item en un seul appel
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
): Promise<NextResponse> {
  try {
    const { itemId } = await params;
    const id = Number(itemId);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid itemId" }, { status: 400 });
    }
    const res = await getItemDeclinationPrices(id);
    // Log pour diagnostic : format exact de la réponse Sellsy
    console.log(`[decl-prices/${id}] raw response:`, JSON.stringify(res).slice(0, 500));
    return NextResponse.json({ success: true, prices: res.data, _raw: res });
  } catch (error: any) {
    console.error(`[decl-prices] ERROR:`, error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
