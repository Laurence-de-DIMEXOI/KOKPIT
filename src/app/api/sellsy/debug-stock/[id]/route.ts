import { NextRequest, NextResponse } from "next/server";
import { getStockForItem } from "@/lib/sellsy";

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
  try {
    const stock = await getStockForItem(itemId);
    return NextResponse.json({
      itemId,
      keys: Object.keys(stock),
      entries: Object.entries(stock).map(([k, v]) => ({
        key: k,
        whid: (v as any)?.whid,
        declid: (v as any)?.declid,
        qt: (v as any)?.qt,
        bookedqt: (v as any)?.bookedqt,
      })),
      raw: stock,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
