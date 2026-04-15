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
  const url = new URL(_req.url);
  const declIdParam = url.searchParams.get("decl");
  const declId = declIdParam ? parseInt(declIdParam, 10) : null;

  const variants = [
    { name: "itemid", params: { itemid: itemId } },
    ...(declId ? [
      { name: "itemid+declid", params: { itemid: itemId, declid: declId } },
      { name: "declid-only", params: { itemid: declId } }, // test : et si on passe l'id décl. comme itemid ?
    ] : []),
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
