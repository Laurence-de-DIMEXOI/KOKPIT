import { NextRequest, NextResponse } from "next/server";
import { listDeclinations } from "@/lib/sellsy";

// GET /api/sellsy/items/[itemId]/declinations
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const id = parseInt(itemId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid itemId" }, { status: 400 });
    }

    const res = await listDeclinations(id);
    const declinations = res.data.map((d) => ({
      id: d.id,
      reference: d.reference,
      name: d.name,
      reference_price_taxes_exc: d.reference_price_taxes_exc,
      purchase_amount: d.purchase_amount,
    }));

    return NextResponse.json({ success: true, declinations });
  } catch (error: any) {
    console.error("Erreur Sellsy declinations:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
