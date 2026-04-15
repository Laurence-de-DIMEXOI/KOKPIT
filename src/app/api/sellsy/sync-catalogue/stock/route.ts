import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStockForItem, getWarehouses } from "@/lib/sellsy";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// POST /api/sellsy/sync-catalogue/stock?limit=M&syncId=...
// Phase 3 en mode RESUME. Pour chaque item (déclinés inclus), un seul appel
// Stock.getForItem ramène les stocks de toutes les déclinaisons.
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 50);
  const concurrency = Math.min(parseInt(searchParams.get("concurrency") || "5", 10), 10);
  const syncId = searchParams.get("syncId") || undefined;

  try {
    const totalItems = await prisma.sellsyItemCache.count({
      where: { isArchived: false },
    });

    const batch = await prisma.sellsyItemCache.findMany({
      where: { isArchived: false, stockSyncedAt: null },
      select: { id: true, isDeclined: true },
      orderBy: { id: "asc" },
      take: limit,
    });

    const alreadyDone = totalItems - (await prisma.sellsyItemCache.count({
      where: { isArchived: false, stockSyncedAt: null },
    }));

    if (batch.length === 0) {
      if (syncId) {
        await prisma.sellsyCatalogueSync.update({
          where: { id: syncId },
          data: { status: "stock_done" },
        }).catch(() => {});
      }
      return NextResponse.json({
        success: true,
        processed: 0,
        synced: totalItems,
        total: totalItems,
        done: true,
      });
    }

    // Map warehouseId -> label (cache singleton dans lib/sellsy)
    const warehouses = await getWarehouses().catch(() => ({} as any));

    type Agg = {
      physical: number;
      reserved: number;
      available: number;
      byWh: Array<{ whId: number; name: string; physical: number; reserved: number; available: number }>;
    };

    const itemAggs: Map<number, Agg> = new Map();
    const declAggs: Map<number, Agg> = new Map();

    // Traitement par groupes parallèles
    const processItem = async (item: typeof batch[number]) => {
      try {
        const stock = await getStockForItem(item.id);
        const values = Object.values(stock);

        // Groupement
        const itemAgg: Agg = { physical: 0, reserved: 0, available: 0, byWh: [] };
        const declBuckets: Map<number, Agg> = new Map();

        for (const w of values) {
          const qt = parseFloat(w.qt || "0");
          const booked = parseFloat(w.bookedqt || "0");
          const avail = parseFloat(w.availableqt || String(qt - booked));
          const whId = parseInt(w.whid, 10);
          const whName = warehouses[String(whId)]?.label || `Entrepôt ${whId}`;
          const declId = parseInt(w.declid || "0", 10);

          const whEntry = { whId, name: whName, physical: qt, reserved: booked, available: avail };

          if (item.isDeclined && declId > 0) {
            let bucket = declBuckets.get(declId);
            if (!bucket) {
              bucket = { physical: 0, reserved: 0, available: 0, byWh: [] };
              declBuckets.set(declId, bucket);
            }
            bucket.physical += qt;
            bucket.reserved += booked;
            bucket.available += avail;
            bucket.byWh.push(whEntry);
          } else {
            itemAgg.physical += qt;
            itemAgg.reserved += booked;
            itemAgg.available += avail;
            itemAgg.byWh.push(whEntry);
          }
        }

        if (!item.isDeclined) {
          itemAggs.set(item.id, itemAgg);
        } else {
          // Agrège aussi au niveau parent (somme de toutes les décl.)
          const parentAgg: Agg = { physical: 0, reserved: 0, available: 0, byWh: [] };
          for (const b of declBuckets.values()) {
            parentAgg.physical += b.physical;
            parentAgg.reserved += b.reserved;
            parentAgg.available += b.available;
          }
          itemAggs.set(item.id, parentAgg);
          for (const [declId, agg] of declBuckets.entries()) {
            declAggs.set(declId, agg);
          }
        }
      } catch (e) {
        console.warn(`[sync stock] skip item ${item.id}: ${(e as Error).message}`);
      }
    };

    for (let i = 0; i < batch.length; i += concurrency) {
      const group = batch.slice(i, i + concurrency);
      await Promise.all(group.map((it) => processItem(it)));
      await new Promise((r) => setTimeout(r, 100));
    }

    // Écriture items
    for (const [id, a] of itemAggs.entries()) {
      await prisma.sellsyItemCache.update({
        where: { id },
        data: {
          stockPhysical: a.physical,
          stockReserved: a.reserved,
          stockAvailable: a.available,
          stockByWarehouse: a.byWh as any,
        },
      }).catch((e) => console.warn(`[sync stock] update item ${id}: ${e.message}`));
    }

    // Écriture déclinaisons
    for (const [id, a] of declAggs.entries()) {
      await prisma.sellsyDeclinationCache.update({
        where: { id },
        data: {
          stockPhysical: a.physical,
          stockReserved: a.reserved,
          stockAvailable: a.available,
          stockByWarehouse: a.byWh as any,
        },
      }).catch(() => {}); // décl. peut-être pas en cache si filtrée à 0€
    }

    // Marque les items traités
    await prisma.sellsyItemCache.updateMany({
      where: { id: { in: batch.map((b) => b.id) } },
      data: { stockSyncedAt: new Date() },
    });

    const syncedNow = alreadyDone + batch.length;
    const done = syncedNow >= totalItems;

    if (done && syncId) {
      await prisma.sellsyCatalogueSync.update({
        where: { id: syncId },
        data: { status: "stock_done", finishedAt: new Date() },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      processed: batch.length,
      synced: syncedNow,
      total: totalItems,
      done,
    });
  } catch (err: any) {
    console.error("[sync stock] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
