import { NextRequest, NextResponse } from "next/server";
import { getDeclinationPrices } from "@/lib/sellsy";

// GET /api/sellsy/items/[itemId]/declinations/[declId]/prices
// Retourne les prix par grille tarifaire d'une déclinaison (endpoint v2 officiel)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string; declId: string }> }
): Promise<NextResponse> {
  try {
    const { itemId, declId } = await params;
    const iId = Number(itemId);
    const dId = Number(declId);
    if (isNaN(iId) || isNaN(dId)) {
      return NextResponse.json({ success: false, error: "Invalid ids" }, { status: 400 });
    }
    const res = await getDeclinationPrices(iId, dId);
    return NextResponse.json({ success: true, prices: res.data });
  } catch (error: any) {
    console.error(`[decl-prices] ERROR:`, error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
