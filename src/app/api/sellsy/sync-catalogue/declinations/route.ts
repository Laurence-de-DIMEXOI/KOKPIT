import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getItemV1Declinations } from "@/lib/sellsy";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// POST /api/sellsy/sync-catalogue/declinations
// Resume mode + boucle interne (jusqu'à 270s).
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const concurrency = Math.min(parseInt(searchParams.get("concurrency") || "5", 10), 10);
  const batchSize = Math.min(parseInt(searchParams.get("batchSize") || "30", 10), 50);
  const maxDurationMs = Math.min(parseInt(searchParams.get("maxMs") || "270000", 10), 285000);
  const syncId = searchParams.get("syncId") || undefined;

  const startedAt = Date.now();
  let processedCount = 0;

  try {
    const totalDeclined = await prisma.sellsyItemCache.count({
      where: { isDeclined: true, isArchived: false },
    });

    while (Date.now() - startedAt < maxDurationMs) {
      const batch = await prisma.sellsyItemCache.findMany({
        where: { isDeclined: true, isArchived: false, declSyncedAt: null },
        select: { id: true, priceHT: true, priceTTC: true },
        orderBy: { id: "asc" },
        take: batchSize,
      });

      if (batch.length === 0) {
        if (syncId) {
          const totalDecls = await prisma.sellsyDeclinationCache.count();
          await prisma.sellsyCatalogueSync.update({
            where: { id: syncId },
            data: { declCount: totalDecls, finishedAt: new Date(), status: "success" },
          }).catch(() => {});
        }
        const doneTotal = await prisma.sellsyItemCache.count({
          where: { isDeclined: true, isArchived: false, declSyncedAt: { not: null } },
        });
        return NextResponse.json({
          success: true,
          processed: processedCount,
          synced: doneTotal,
          total: totalDeclined,
          done: true,
          elapsedMs: Date.now() - startedAt,
        });
      }

      // Fetch v1 en parallèle par groupes
      const results: Array<{ item: typeof batch[number]; v1: any[] }> = [];
      for (let i = 0; i < batch.length; i += concurrency) {
        const group = batch.slice(i, i + concurrency);
        const groupResults = await Promise.all(
          group.map(async (item) => {
            try {
              const v1 = await getItemV1Declinations(item.id);
              return { item, v1 };
            } catch (e) {
              console.warn(`[sync decls] skip item ${item.id}: ${(e as Error).message}`);
              return { item, v1: [] as any[] };
            }
          })
        );
        results.push(...groupResults);
        await new Promise((r) => setTimeout(r, 80));
      }

      type Row = [number, number, string, string | null, number | null, number | null, number | null];
      const rows: Row[] = [];
      for (const r of results) {
        if (r.v1.length === 0) continue;
        const parentHT = r.item.priceHT ? Number(r.item.priceHT) : 0;
        const parentTTC = r.item.priceTTC ? Number(r.item.priceTTC) : 0;
        const tvaMult = parentHT > 0 && parentTTC > parentHT ? parentTTC / parentHT : 1.085;
        for (const v of r.v1) {
          const id = parseInt(String(v.id), 10);
          if (isNaN(id)) continue;
          const isTaxFree = v.refPriceTaxesFree === true || String(v.refPriceTaxesFree) === "true";
          const htRaw = isTaxFree ? (v.refPrice ?? v.priceInc) : null;
          const ttcRaw = !isTaxFree ? (v.priceInc ?? v.refPrice) : null;
          const ht = parseNum(htRaw);
          let ttc = parseNum(ttcRaw);
          if (!ttc && ht) ttc = +(ht * tvaMult).toFixed(4);
          const purch = parseNum(v.purchaseInc);
          rows.push([id, r.item.id, v.name ?? "", v.tradename ?? v.name ?? null, ht, ttc, purch]);
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
      }

      await prisma.sellsyItemCache.updateMany({
        where: { id: { in: batch.map((b) => b.id) } },
        data: { declSyncedAt: new Date() },
      });

      processedCount += batch.length;
    }

    const doneTotal = await prisma.sellsyItemCache.count({
      where: { isDeclined: true, isArchived: false, declSyncedAt: { not: null } },
    });
    return NextResponse.json({
      success: true,
      processed: processedCount,
      synced: doneTotal,
      total: totalDeclined,
      done: false,
      elapsedMs: Date.now() - startedAt,
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
