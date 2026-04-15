import { NextRequest, NextResponse } from "next/server";
import { listDeclinations, getItemV1Declinations } from "@/lib/sellsy";

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

    // On appelle v2 (structure propre) ET v1 (prix propres par déclinaison) en parallèle.
    // Les deux sont défensifs — si l'un échoue (rate limit Sellsy, scope manquant, etc.)
    // on continue avec ce qu'on a plutôt que de renvoyer 500.
    const [res, v1Decls] = await Promise.all([
      listDeclinations(id).catch((err) => {
        console.warn(`[decl item=${id}] v2 listDeclinations failed: ${err.message}`);
        return { data: [] as any[] };
      }),
      getItemV1Declinations(id),
    ]);

    // Index v1 par id (clé principale — c'est le declinationId Sellsy).
    // v1.name = référence Sellsy (ex. "EFWS 283R") → sert de fallback de matching.
    const v1ById = new Map<string, any>();
    const v1ByRef = new Map<string, any>();
    for (const v of v1Decls) {
      if (v.id) v1ById.set(String(v.id), v);
      if (v.name) v1ByRef.set(String(v.name), v);
    }

    if (res.data.length > 0) {
      console.log(`[decl list item=${id}] v2 first:`, JSON.stringify(res.data[0]).slice(0, 300));
      if (v1Decls.length > 0) {
        console.log(`[decl list item=${id}] v1 first:`, JSON.stringify(v1Decls[0]).slice(0, 300));
      }
    }

    const declinations = res.data.map((d: any) => {
      const v1 = v1ById.get(String(d.id)) || v1ByRef.get(String(d.reference));
      // v1.refPrice est HT si v1.refPriceTaxesFree === true (cas standard Sellsy).
      const v1HT = v1?.refPriceTaxesFree
        ? (v1?.refPrice ?? v1?.priceInc ?? null)
        : null;
      const v1TTCIfInc = !v1?.refPriceTaxesFree
        ? (v1?.priceInc ?? v1?.refPrice ?? null)
        : null;
      const ht = d.reference_price_taxes_exc ?? d.reference_price?.amount_taxes_exc ?? v1HT;
      const ttc = d.reference_price_taxes_inc ?? d.reference_price?.amount_taxes_inc ?? v1TTCIfInc;
      const purch = d.purchase_amount ?? (v1?.purchaseInc ?? null);
      return {
        id: d.id,
        reference: d.reference,
        name: d.name,
        reference_price_taxes_exc: ht,
        reference_price_taxes_inc: ttc,
        purchase_amount: purch,
        tax_id: d.tax_id,
      };
    });

    return NextResponse.json({ success: true, declinations });
  } catch (error: any) {
    console.error("Erreur Sellsy declinations:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
