import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/catalogue — lit le catalogue depuis Supabase (cache local synchronisé depuis Sellsy).
// Renvoie items + toutes les déclinaisons. Rapide (ms), pas d'appels Sellsy.
export async function GET() {
  const [items, declinations, latestSync] = await Promise.all([
    prisma.sellsyItemCache.findMany({
      where: { isArchived: false },
      orderBy: { name: "asc" },
    }),
    prisma.sellsyDeclinationCache.findMany(),
    prisma.sellsyCatalogueSync.findFirst({
      orderBy: { startedAt: "desc" },
    }),
  ]);

  // Format compatible avec l'ancien endpoint /api/sellsy/items
  const itemsFormatted = items.map((i) => ({
    id: i.id,
    type: i.type,
    name: i.name,
    reference: i.reference,
    description: i.description || "",
    reference_price_taxes_exc: i.priceHT?.toString() || "0",
    reference_price_taxes_inc: i.priceTTC?.toString() || "0",
    purchase_amount: i.purchaseAmount?.toString() || "0",
    currency: i.currency || "EUR",
    standard_quantity: i.standardQty?.toString() || "1",
    category_id: i.categoryId || 0,
    is_archived: i.isArchived,
    is_declined: i.isDeclined,
    created: i.createdAtSellsy?.toISOString() || "",
    updated: i.updatedAtSellsy?.toISOString() || "",
    stock_physical: i.stockPhysical ? Number(i.stockPhysical) : null,
    stock_reserved: i.stockReserved ? Number(i.stockReserved) : null,
    stock_available: i.stockAvailable ? Number(i.stockAvailable) : null,
    stock_by_warehouse: (i as any).stockByWarehouse || null,
  }));

  const declsByItemId: Record<number, any[]> = {};
  for (const d of declinations) {
    // Masque les déclinaisons à 0€ (HT et TTC nuls ou absents)
    const ht = d.priceHT ? Number(d.priceHT) : 0;
    const ttc = d.priceTTC ? Number(d.priceTTC) : 0;
    if (ht <= 0 && ttc <= 0) continue;
    if (!declsByItemId[d.itemId]) declsByItemId[d.itemId] = [];
    declsByItemId[d.itemId].push({
      id: d.id,
      reference: d.reference,
      name: d.name,
      reference_price_taxes_exc: d.priceHT?.toString() || null,
      reference_price_taxes_inc: d.priceTTC?.toString() || null,
      purchase_amount: d.purchaseAmount?.toString() || null,
      stock_physical: d.stockPhysical ? Number(d.stockPhysical) : null,
      stock_reserved: d.stockReserved ? Number(d.stockReserved) : null,
      stock_available: d.stockAvailable ? Number(d.stockAvailable) : null,
      stock_by_warehouse: (d as any).stockByWarehouse || null,
    });
  }

  // Masque aussi les parents déclinés qui n'ont plus aucune décl. visible
  const itemsFinal = itemsFormatted.filter((i) => {
    if (!i.is_declined) return true;
    return (declsByItemId[i.id]?.length ?? 0) > 0;
  });

  return NextResponse.json({
    success: true,
    items: itemsFinal,
    declinations: declsByItemId,
    lastSync: latestSync?.finishedAt || null,
    syncStatus: latestSync?.status || "never",
  });
}
