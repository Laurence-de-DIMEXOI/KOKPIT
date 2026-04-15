import { NextRequest, NextResponse } from "next/server";
import { getStockForItem, sellsyV1Call } from "@/lib/sellsy";

export const dynamic = "force-dynamic";

// GET /api/sellsy/debug-stock/[id]
// Renvoie la réponse parsée de Stock.getForItem pour diagnostiquer le format.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const itemId = parseInt(id, 10);
  if (isNaN(itemId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  // Tester 4 variantes d'appel pour cerner le bon format
  const variants = [
    { name: "itemid", params: { itemid: itemId } },
    { name: "declid", params: { declid: itemId } },
    { name: "id+type=item", params: { id: itemId, type: "item" } },
    { name: "id only", params: { id: itemId } },
  ];
  const results: Record<string, any> = {};
  for (const v of variants) {
    try {
      const raw = await sellsyV1Call("Stock.getForItem", v.params);
      results[v.name] = raw;
    } catch (e: any) {
      results[v.name] = { error: e.message };
    }
  }
  return NextResponse.json({ itemId, results, parsed: await getStockForItem(itemId) });
}
