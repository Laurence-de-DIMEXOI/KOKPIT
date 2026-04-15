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
    // Log pour diagnostic — voir ce que Sellsy renvoie vraiment
    if (res.data.length > 0) {
      console.log(`[decl list item=${id}] first decl raw:`, JSON.stringify(res.data[0]).slice(0, 400));
    }
    const declinations = res.data.map((d: any) => ({
      id: d.id,
      reference: d.reference,
      name: d.name,
      reference_price_taxes_exc: d.reference_price_taxes_exc ?? d.reference_price?.amount_taxes_exc ?? null,
      reference_price_taxes_inc: d.reference_price_taxes_inc ?? d.reference_price?.amount_taxes_inc ?? null,
      purchase_amount: d.purchase_amount,
      tax_id: d.tax_id,
    }));

    return NextResponse.json({ success: true, declinations });
  } catch (error: any) {
    console.error("Erreur Sellsy declinations:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
