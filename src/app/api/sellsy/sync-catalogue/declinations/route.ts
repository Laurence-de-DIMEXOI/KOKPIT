import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listDeclinations, getItemV1Declinations } from "@/lib/sellsy";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// POST /api/sellsy/sync-catalogue/declinations?offset=N&limit=M
// Phase 2 : sync un batch de déclinaisons (client appelle en boucle jusqu'à done=true).
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  // Limite à 10 max pour respecter le rate limit Sellsy (2 appels v1+v2 par item)
  const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 10);
  const syncId = searchParams.get("syncId") || undefined;

  try {
    // Liste tous les items déclinés (triés par id pour pagination stable)
    const allDeclined = await prisma.sellsyItemCache.findMany({
      where: { isDeclined: true, isArchived: false },
      select: { id: true, priceHT: true, priceTTC: true },
      orderBy: { id: "asc" },
    });
    const total = allDeclined.length;
    const batch = allDeclined.slice(offset, offset + limit);
    let added = 0;

    // Séquentialise v2 puis v1 par item pour ménager le rate limit Sellsy.
    // Échec individuel = item skippé (pas de plantage du batch).
    const results: Array<{ item: typeof batch[number]; v2: any[]; v1: any[] }> = [];
    for (const item of batch) {
      try {
        const v2 = await listDeclinations(item.id).catch(() => ({ data: [] as any[] }));
        const v1 = await getItemV1Declinations(item.id);
        results.push({ item, v2: v2.data, v1 });
      } catch (e) {
        console.warn(`[sync decls] skip item ${item.id}: ${(e as Error).message}`);
      }
      // Petit délai entre items pour éviter la saturation
      await new Promise((r) => setTimeout(r, 150));
    }

    // Construit les rows à insérer
    type Row = [number, number, string, string | null, number | null, number | null, number | null];
    const rows: Row[] = [];
    for (const r of results) {
      if (r.v2.length === 0) continue;
      const v1ById = new Map<string, any>();
      const v1ByName = new Map<string, any>();
      for (const v of r.v1) {
        if (v.id) v1ById.set(String(v.id), v);
        if (v.name) v1ByName.set(String(v.name), v);
      }
      const parentHT = r.item.priceHT ? Number(r.item.priceHT) : 0;
      const parentTTC = r.item.priceTTC ? Number(r.item.priceTTC) : 0;
      const tvaMult = parentHT > 0 && parentTTC > parentHT ? parentTTC / parentHT : 1.085;

      for (const d of r.v2) {
        const v1 = v1ById.get(String(d.id)) || v1ByName.get(String(d.reference));
        const v1HT = v1?.refPriceTaxesFree ? (v1?.refPrice ?? v1?.priceInc ?? null) : null;
        const v1TTCInc = !v1?.refPriceTaxesFree ? (v1?.priceInc ?? v1?.refPrice ?? null) : null;
        const ht = parseNum(d.reference_price_taxes_exc) ?? parseNum(v1HT);
        let ttc = parseNum(d.reference_price_taxes_inc) ?? parseNum(v1TTCInc);
        if (!ttc && ht) ttc = +(ht * tvaMult).toFixed(4);
        const purch = parseNum(d.purchase_amount) ?? parseNum(v1?.purchaseInc);
        rows.push([d.id, r.item.id, d.reference || "", d.name ?? null, ht, ttc, purch]);
      }
    }

    if (rows.length > 0) {
      const placeholders = rows
        .map(
          (_, idx) =>
            `($${idx * 7 + 1}, $${idx * 7 + 2}, $${idx * 7 + 3}, $${idx * 7 + 4}, $${idx * 7 + 5}, $${idx * 7 + 6}, $${idx * 7 + 7})`
        )
        .join(",");
      const params = rows.flat();
      const sql = `
        INSERT INTO sellsy_declination_cache
          (id, "itemId", reference, name, "priceHT", "priceTTC", "purchaseAmount")
        VALUES ${placeholders}
        ON CONFLICT (id) DO UPDATE SET
          "itemId" = EXCLUDED."itemId",
          reference = EXCLUDED.reference,
          name = EXCLUDED.name,
          "priceHT" = EXCLUDED."priceHT",
          "priceTTC" = EXCLUDED."priceTTC",
          "purchaseAmount" = EXCLUDED."purchaseAmount",
          "syncedAt" = NOW()
      `;
      await prisma.$executeRawUnsafe(sql, ...params);
      added = rows.length;
    }

    const nextOffset = offset + batch.length;
    const done = nextOffset >= total;

    if (done && syncId) {
      const totalDecls = await prisma.sellsyDeclinationCache.count();
      await prisma.sellsyCatalogueSync.update({
        where: { id: syncId },
        data: {
          declCount: totalDecls,
          finishedAt: new Date(),
          status: "success",
        },
      });
    }

    return NextResponse.json({
      success: true,
      processed: batch.length,
      added,
      offset: nextOffset,
      total,
      done,
    });
  } catch (err: any) {
    console.error("[sync decls] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

function parseNum(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  if (isNaN(n)) return null;
  return n;
}
