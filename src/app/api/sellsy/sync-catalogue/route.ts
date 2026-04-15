import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listAllItems, listDeclinations, getItemV1Declinations } from "@/lib/sellsy";

export const maxDuration = 300; // 5 min max (Vercel Pro)
export const dynamic = "force-dynamic";

// POST /api/sellsy/sync-catalogue
// Sync complet Sellsy → Supabase : items + déclinaisons avec leurs prix propres (v1).
// Peut être déclenché manuellement (bouton Rafraîchir) ou via cron.
export async function POST(_req: NextRequest) {
  const syncLog = await prisma.sellsyCatalogueSync.create({
    data: { status: "running" },
  });

  try {
    // 1) Récupère tous les items depuis Sellsy v2
    const items = await listAllItems();
    console.log(`[sync] ${items.length} items récupérés depuis Sellsy v2`);

    // 2) Upsert des items
    const itemChunks = chunk(items, 100);
    for (const batch of itemChunks) {
      await Promise.all(
        batch.map((item) =>
          prisma.sellsyItemCache.upsert({
            where: { id: item.id },
            create: {
              id: item.id,
              type: item.type,
              reference: item.reference || "",
              name: item.name,
              description: item.description || null,
              priceHT: parseNum(item.reference_price_taxes_exc),
              priceTTC: parseNum(item.reference_price_taxes_inc),
              purchaseAmount: parseNum(item.purchase_amount),
              currency: item.currency || null,
              categoryId: item.category_id || null,
              standardQty: parseNum(item.standard_quantity),
              isArchived: item.is_archived || false,
              isDeclined: item.is_declined || false,
              createdAtSellsy: item.created ? new Date(item.created) : null,
              updatedAtSellsy: item.updated ? new Date(item.updated) : null,
            },
            update: {
              type: item.type,
              reference: item.reference || "",
              name: item.name,
              description: item.description || null,
              priceHT: parseNum(item.reference_price_taxes_exc),
              priceTTC: parseNum(item.reference_price_taxes_inc),
              purchaseAmount: parseNum(item.purchase_amount),
              currency: item.currency || null,
              categoryId: item.category_id || null,
              standardQty: parseNum(item.standard_quantity),
              isArchived: item.is_archived || false,
              isDeclined: item.is_declined || false,
              createdAtSellsy: item.created ? new Date(item.created) : null,
              updatedAtSellsy: item.updated ? new Date(item.updated) : null,
              syncedAt: new Date(),
            },
          })
        )
      );
    }
    console.log(`[sync] ${items.length} items upsertés en DB`);

    // 3) Récupère les déclinaisons (v2 pour structure + v1 pour vrais prix) — en batch de 10
    const declinedItems = items.filter((i) => i.is_declined);
    console.log(`[sync] ${declinedItems.length} items déclinés à traiter`);

    let totalDecls = 0;
    const BATCH = 10;
    for (let i = 0; i < declinedItems.length; i += BATCH) {
      const batch = declinedItems.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map(async (item) => {
          const [v2, v1] = await Promise.all([
            listDeclinations(item.id).catch(() => ({ data: [] as any[] })),
            getItemV1Declinations(item.id),
          ]);
          return { itemId: item.id, parent: item, v2: v2.data, v1 };
        })
      );

      for (const r of results) {
        if (r.v2.length === 0) continue;

        const v1ById = new Map<string, any>();
        const v1ByName = new Map<string, any>();
        for (const v of r.v1) {
          if (v.id) v1ById.set(String(v.id), v);
          if (v.name) v1ByName.set(String(v.name), v);
        }

        const parentHT = parseFloat(r.parent.reference_price_taxes_exc || "0");
        const parentTTC = parseFloat(r.parent.reference_price_taxes_inc || "0");
        const tvaMult = parentHT > 0 && parentTTC > parentHT ? parentTTC / parentHT : 1.085;

        for (const d of r.v2) {
          const v1 = v1ById.get(String(d.id)) || v1ByName.get(String(d.reference));
          // v1 refPrice est HT si refPriceTaxesFree=true (cas standard Sellsy)
          const v1HT = v1?.refPriceTaxesFree ? (v1?.refPrice ?? v1?.priceInc ?? null) : null;
          const v1TTCInc = !v1?.refPriceTaxesFree ? (v1?.priceInc ?? v1?.refPrice ?? null) : null;

          const ht = parseNum(d.reference_price_taxes_exc) ?? parseNum(v1HT);
          let ttc = parseNum(d.reference_price_taxes_inc) ?? parseNum(v1TTCInc);
          if (!ttc && ht) ttc = +(Number(ht) * tvaMult).toFixed(4);
          const purch = parseNum(d.purchase_amount) ?? parseNum(v1?.purchaseInc);

          await prisma.sellsyDeclinationCache.upsert({
            where: { id: d.id },
            create: {
              id: d.id,
              itemId: r.itemId,
              reference: d.reference || "",
              name: d.name,
              priceHT: ht,
              priceTTC: ttc,
              purchaseAmount: purch,
            },
            update: {
              itemId: r.itemId,
              reference: d.reference || "",
              name: d.name,
              priceHT: ht,
              priceTTC: ttc,
              purchaseAmount: purch,
              syncedAt: new Date(),
            },
          });
          totalDecls++;
        }
      }

      if ((i / BATCH) % 5 === 0) {
        console.log(`[sync] progress ${i + BATCH}/${declinedItems.length} items déclinés`);
      }
    }

    await prisma.sellsyCatalogueSync.update({
      where: { id: syncLog.id },
      data: {
        finishedAt: new Date(),
        itemCount: items.length,
        declCount: totalDecls,
        status: "success",
      },
    });

    return NextResponse.json({
      success: true,
      items: items.length,
      declinations: totalDecls,
      syncId: syncLog.id,
    });
  } catch (err: any) {
    console.error("[sync-catalogue] error:", err);
    await prisma.sellsyCatalogueSync.update({
      where: { id: syncLog.id },
      data: {
        finishedAt: new Date(),
        status: "error",
        error: err.message,
      },
    });
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// GET /api/sellsy/sync-catalogue — renvoie le dernier sync
export async function GET() {
  const latest = await prisma.sellsyCatalogueSync.findFirst({
    orderBy: { startedAt: "desc" },
  });
  const itemCount = await prisma.sellsyItemCache.count();
  const declCount = await prisma.sellsyDeclinationCache.count();
  return NextResponse.json({ latest, itemCount, declCount });
}

function parseNum(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n)) return null;
  return n;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
