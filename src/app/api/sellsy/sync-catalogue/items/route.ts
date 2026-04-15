import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listAllItems } from "@/lib/sellsy";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

// POST /api/sellsy/sync-catalogue/items?full=1 pour forcer resync Phase 2+3
export async function POST(req: NextRequest) {
  const full = new URL(req.url).searchParams.get("full") === "1";
  const syncLog = await prisma.sellsyCatalogueSync.create({
    data: { status: "running" },
  });

  try {
    if (full) {
      // Mode resync total : on oublie la progression des phases
      await prisma.sellsyItemCache.updateMany({
        data: { declSyncedAt: null, stockSyncedAt: null },
      });
    }
    const rawItems = await listAllItems();

    // Filtre : on ignore les items non déclinés à 0€ (inutiles, polluent la liste)
    const items = rawItems.filter((i) => {
      if (i.is_declined) return true; // parents déclinés = prix sur décl., garder
      const ht = parseFloat(i.reference_price_taxes_exc || "0");
      const ttc = parseFloat(i.reference_price_taxes_inc || "0");
      return ht > 0 || ttc > 0;
    });

    // Construction des rows à insérer
    const values = items.map((i) => [
      i.id,
      i.type || "product",
      i.reference || "",
      i.name,
      i.description || null,
      i.reference_price_taxes_exc ? parseFloat(i.reference_price_taxes_exc) : null,
      i.reference_price_taxes_inc ? parseFloat(i.reference_price_taxes_inc) : null,
      i.purchase_amount ? parseFloat(i.purchase_amount) : null,
      i.currency || null,
      i.category_id || null,
      i.standard_quantity ? parseFloat(i.standard_quantity) : null,
      i.is_archived || false,
      i.is_declined || false,
      i.created ? new Date(i.created) : null,
      i.updated ? new Date(i.updated) : null,
    ]);

    // Bulk upsert via raw SQL : ON CONFLICT DO UPDATE
    // Découpe en paquets de 500 pour éviter limite taille requête
    const CHUNK = 500;
    for (let i = 0; i < values.length; i += CHUNK) {
      const batch = values.slice(i, i + CHUNK);
      const placeholders = batch
        .map(
          (_, idx) =>
            `($${idx * 15 + 1}, $${idx * 15 + 2}, $${idx * 15 + 3}, $${idx * 15 + 4}, $${idx * 15 + 5}, $${idx * 15 + 6}, $${idx * 15 + 7}, $${idx * 15 + 8}, $${idx * 15 + 9}, $${idx * 15 + 10}, $${idx * 15 + 11}, $${idx * 15 + 12}, $${idx * 15 + 13}, $${idx * 15 + 14}, $${idx * 15 + 15})`
        )
        .join(",");
      const params = batch.flat();
      const sql = `
        INSERT INTO sellsy_item_cache
          (id, type, reference, name, description, "priceHT", "priceTTC", "purchaseAmount",
           currency, "categoryId", "standardQty", "isArchived", "isDeclined",
           "createdAtSellsy", "updatedAtSellsy")
        VALUES ${placeholders}
        ON CONFLICT (id) DO UPDATE SET
          type = EXCLUDED.type,
          reference = EXCLUDED.reference,
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          "priceHT" = EXCLUDED."priceHT",
          "priceTTC" = EXCLUDED."priceTTC",
          "purchaseAmount" = EXCLUDED."purchaseAmount",
          currency = EXCLUDED.currency,
          "categoryId" = EXCLUDED."categoryId",
          "standardQty" = EXCLUDED."standardQty",
          "isArchived" = EXCLUDED."isArchived",
          "isDeclined" = EXCLUDED."isDeclined",
          "createdAtSellsy" = EXCLUDED."createdAtSellsy",
          "updatedAtSellsy" = EXCLUDED."updatedAtSellsy",
          "syncedAt" = NOW()
      `;
      await prisma.$executeRawUnsafe(sql, ...params);
    }

    const declinedCount = items.filter((i) => i.is_declined).length;

    await prisma.sellsyCatalogueSync.update({
      where: { id: syncLog.id },
      data: {
        itemCount: items.length,
        status: "items_done",
      },
    });

    return NextResponse.json({
      success: true,
      syncId: syncLog.id,
      itemCount: items.length,
      declinedCount,
    });
  } catch (err: any) {
    console.error("[sync items] error:", err);
    await prisma.sellsyCatalogueSync.update({
      where: { id: syncLog.id },
      data: {
        finishedAt: new Date(),
        status: "error",
        error: err.message,
      },
    });
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
