import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStockForItem, getStockForDeclination, getWarehouses } from "@/lib/sellsy";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// POST /api/sellsy/sync-catalogue/stock
// Resume mode + boucle interne (jusqu'à 270s) pour maximiser le débit.
// Paramètres : concurrency (default 5), batchSize (taille logs 30), syncId.
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const concurrency = Math.min(parseInt(searchParams.get("concurrency") || "5", 10), 10);
  const batchSize = Math.min(parseInt(searchParams.get("batchSize") || "30", 10), 50);
  const maxDurationMs = Math.min(parseInt(searchParams.get("maxMs") || "270000", 10), 285000);
  const syncId = searchParams.get("syncId") || undefined;

  const startedAt = Date.now();
  let processedCount = 0;

  try {
    const totalItems = await prisma.sellsyItemCache.count({ where: { isArchived: false } });
    const warehouses = await getWarehouses().catch(() => ({} as any));

    type Agg = {
      physical: number; reserved: number; available: number;
      byWh: Array<{ whId: number; name: string; physical: number; reserved: number; available: number }>;
    };

    // Boucle interne : on continue à piocher tant qu'il reste des items et du temps
    while (Date.now() - startedAt < maxDurationMs) {
      const batch = await prisma.sellsyItemCache.findMany({
        where: { isArchived: false, stockSyncedAt: null },
        select: { id: true, isDeclined: true },
        orderBy: { id: "asc" },
        take: batchSize,
      });

      if (batch.length === 0) {
        if (syncId) {
          await prisma.sellsyCatalogueSync.update({
            where: { id: syncId },
            data: { status: "stock_done", finishedAt: new Date() },
          }).catch(() => {});
        }
        const stockDoneTotal = await prisma.sellsyItemCache.count({
          where: { isArchived: false, stockSyncedAt: { not: null } },
        });
        return NextResponse.json({
          success: true,
          processed: processedCount,
          synced: stockDoneTotal,
          total: totalItems,
          done: true,
          elapsedMs: Date.now() - startedAt,
        });
      }

      const itemAggs: Map<number, Agg> = new Map();
      const declAggs: Map<number, Agg> = new Map();
      // Parents pour lesquels au moins une décl a échoué : on ne marque PAS
      // stockSyncedAt pour qu'ils repassent au prochain appel.
      const failedItems: Set<number> = new Set();

      const toAgg = (values: any[]): Agg => {
        const agg: Agg = { physical: 0, reserved: 0, available: 0, byWh: [] };
        for (const w of values) {
          const qt = parseFloat(w.qt || "0");
          const booked = parseFloat(w.bookedqt || "0");
          const avail = parseFloat(w.availableqt || String(qt - booked));
          const whId = parseInt(w.whid, 10);
          const whName = warehouses[String(whId)]?.label || `Entrepôt ${whId}`;
          agg.physical += qt;
          agg.reserved += booked;
          agg.available += avail;
          agg.byWh.push({ whId, name: whName, physical: qt, reserved: booked, available: avail });
        }
        return agg;
      };

      const processItem = async (item: typeof batch[number]) => {
        try {
          if (!item.isDeclined) {
            try {
              const stock = await getStockForItem(item.id);
              itemAggs.set(item.id, toAgg(Object.values(stock)));
            } catch (e) {
              // Erreur Sellsy V1 : on ne touche PAS les données existantes et
              // on ne marque pas stockSyncedAt → re-tentative au prochain passage.
              console.warn(`[sync stock] skip simple ${item.id}: ${(e as Error).message}`);
              failedItems.add(item.id);
            }
            return;
          }
          // Item décliné : une requête par déclinaison
          const decls = await prisma.sellsyDeclinationCache.findMany({
            where: { itemId: item.id },
            select: { id: true },
          });
          const parentAgg: Agg = { physical: 0, reserved: 0, available: 0, byWh: [] };
          // Aggregation des entrepôts au niveau parent : somme par whId des byWh de chaque déclinaison
          const parentWhMap = new Map<number, { whId: number; name: string; physical: number; reserved: number; available: number }>();
          let declErrors = 0;
          let declSuccess = 0;
          for (const d of decls) {
            try {
              const stock = await getStockForDeclination(item.id, d.id);
              const agg = toAgg(Object.values(stock));
              declAggs.set(d.id, agg);
              parentAgg.physical += agg.physical;
              parentAgg.reserved += agg.reserved;
              parentAgg.available += agg.available;
              for (const w of agg.byWh) {
                const existing = parentWhMap.get(w.whId);
                if (existing) {
                  existing.physical += w.physical;
                  existing.reserved += w.reserved;
                  existing.available += w.available;
                } else {
                  parentWhMap.set(w.whId, { ...w });
                }
              }
              declSuccess++;
            } catch (e) {
              declErrors++;
              console.warn(`[sync stock] decl ${d.id}: ${(e as Error).message}`);
            }
            await new Promise((r) => setTimeout(r, 40));
          }
          // On n'écrit le parent QUE si au moins une décl a répondu ET aucune n'a échoué.
          // Sinon on risque d'écrire des zéros qui écrasent des données valides.
          if (declSuccess > 0 && declErrors === 0) {
            parentAgg.byWh = Array.from(parentWhMap.values());
            itemAggs.set(item.id, parentAgg);
          } else if (declErrors > 0) {
            console.warn(`[sync stock] skip parent ${item.id}: ${declErrors}/${decls.length} decl errors`);
            // Bloque aussi la màj du stockSyncedAt pour ce parent (sera rebuilt au prochain run)
            failedItems.add(item.id);
          }
        } catch (e) {
          console.warn(`[sync stock] skip item ${item.id}: ${(e as Error).message}`);
        }
      };

      for (let i = 0; i < batch.length; i += concurrency) {
        const group = batch.slice(i, i + concurrency);
        await Promise.all(group.map((it) => processItem(it)));
        await new Promise((r) => setTimeout(r, 80));
      }

      // Flush: écriture parallèle
      await Promise.all([
        ...Array.from(itemAggs.entries()).map(([id, a]) =>
          prisma.sellsyItemCache.update({
            where: { id },
            data: {
              stockPhysical: a.physical,
              stockReserved: a.reserved,
              stockAvailable: a.available,
              stockByWarehouse: a.byWh as any,
            },
          }).catch(() => {})
        ),
        ...Array.from(declAggs.entries()).map(([id, a]) =>
          prisma.sellsyDeclinationCache.update({
            where: { id },
            data: {
              stockPhysical: a.physical,
              stockReserved: a.reserved,
              stockAvailable: a.available,
              stockByWarehouse: a.byWh as any,
            },
          }).catch(() => {})
        ),
      ]);

      // Ne marque stockSyncedAt QUE sur les items sans échec — les autres
      // seront re-tentés au prochain passage.
      const syncedIds = batch.map((b) => b.id).filter((id) => !failedItems.has(id));
      if (syncedIds.length > 0) {
        await prisma.sellsyItemCache.updateMany({
          where: { id: { in: syncedIds } },
          data: { stockSyncedAt: new Date() },
        });
      }

      processedCount += batch.length;
    }

    // Timeout atteint : le client rappelle pour continuer
    const stockDoneTotal = await prisma.sellsyItemCache.count({
      where: { isArchived: false, stockSyncedAt: { not: null } },
    });
    return NextResponse.json({
      success: true,
      processed: processedCount,
      synced: stockDoneTotal,
      total: totalItems,
      done: false,
      elapsedMs: Date.now() - startedAt,
    });
  } catch (err: any) {
    console.error("[sync stock] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
