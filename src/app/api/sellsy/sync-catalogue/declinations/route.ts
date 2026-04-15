import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getItemV1Declinations } from "@/lib/sellsy";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// POST /api/sellsy/sync-catalogue/declinations?limit=M&syncId=...
// Phase 2 : sync un batch en mode RESUME.
// Pioche les items déclinés sans declSyncedAt (ou plus ancien que le dernier sync),
// les traite, les marque. Idempotent : re-déclenchable même onglet fermé.
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 50);
  const concurrency = Math.min(parseInt(searchParams.get("concurrency") || "5", 10), 10);
  const syncId = searchParams.get("syncId") || undefined;

  try {
    // Total items déclinés (pour barre de progression)
    const totalDeclined = await prisma.sellsyItemCache.count({
      where: { isDeclined: true, isArchived: false },
    });

    // Items pas encore synchro (declSyncedAt NULL)
    const batch = await prisma.sellsyItemCache.findMany({
      where: { isDeclined: true, isArchived: false, declSyncedAt: null },
      select: { id: true, priceHT: true, priceTTC: true },
      orderBy: { id: "asc" },
      take: limit,
    });

    const alreadyDone = totalDeclined - (await prisma.sellsyItemCache.count({
      where: { isDeclined: true, isArchived: false, declSyncedAt: null },
    }));

    if (batch.length === 0) {
      // Terminé
      if (syncId) {
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
        processed: 0,
        added: 0,
        synced: totalDeclined,
        total: totalDeclined,
        done: true,
      });
    }

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
      await new Promise((r) => setTimeout(r, 100));
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

    // Marque les items traités (même si 0 déclinaisons renvoyées — on ne veut pas les re-piocher)
    const processedIds = batch.map((b) => b.id);
    await prisma.sellsyItemCache.updateMany({
      where: { id: { in: processedIds } },
      data: { declSyncedAt: new Date() },
    });

    const syncedNow = alreadyDone + batch.length;
    const done = syncedNow >= totalDeclined;

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
      added: rows.length,
      synced: syncedNow,
      total: totalDeclined,
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
