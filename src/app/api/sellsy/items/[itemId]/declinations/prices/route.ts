import { NextRequest, NextResponse } from "next/server";
import { getItemDeclinationPrices } from "@/lib/sellsy";

// GET /api/sellsy/items/[itemId]/declinations/prices
// Retourne les prix (HT + TTC) de toutes les déclinaisons d'un item en un seul appel
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const id = Number(itemId);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid itemId" }, { status: 400 });
    }
    const res = await getItemDeclinationPrices(id);
    return NextResponse.json({ success: true, prices: res.data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
