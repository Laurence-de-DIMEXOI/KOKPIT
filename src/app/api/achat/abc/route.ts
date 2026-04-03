import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listItems, sellsyFetch, searchOrders, getStockForItem, getWarehouses } from "@/lib/sellsy";
import { calculerClassificationABC, type RefABC, type StockEntrepot } from "@/lib/calcul-abc";

export const maxDuration = 300; // 5 min pour le POST (recalcul)

// ============================================================================
// HELPERS
// ============================================================================

async function fetchOrdersWithRows(sinceISO: string) {
  const pageSize = 100;
  const allOrderIds: number[] = [];

  let offset = 0;
  let total = 0;
  do {
    try {
      const page = await searchOrders({
        filters: { date: { start: sinceISO } },
        limit: pageSize,
        offset,
      });
      const orders = page.data || [];
      total = page.pagination?.total || 0;
      allOrderIds.push(...orders.map((o: any) => o.id));
      offset += pageSize;
    } catch (err: any) {
      console.warn(`[ABC] Erreur search offset=${offset}:`, err.message);
      break;
    }
    await new Promise((r) => setTimeout(r, 100));
  } while (offset < total);

  console.log(`[ABC] ${allOrderIds.length} commandes identifiées, fetch détails...`);

  const allOrders: any[] = [];
  for (let i = 0; i < allOrderIds.length; i += 10) {
    const batch = allOrderIds.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map((id) => sellsyFetch<any>(`/orders/${id}`))
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) allOrders.push(r.value);
    }
    if ((i + 10) % 100 === 0 || i + 10 >= allOrderIds.length) {
      console.log(`[ABC] Détails: ${Math.min(i + 10, allOrderIds.length)}/${allOrderIds.length}`);
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`[ABC] ${allOrders.length} commandes avec rows récupérées`);
  return allOrders;
}

async function computeABC(seuilA: number, seuilB: number) {
  // 1. Catalogue Sellsy
  const items: any[] = [];
  let itemOffset = 0;
  let itemTotal = 0;
  do {
    const res = await listItems({ limit: 100, offset: itemOffset });
    items.push(...(res.data || []));
    itemTotal = res.pagination?.total || 0;
    itemOffset += 100;
  } while (itemOffset < itemTotal);
  console.log(`[ABC] ${items.length} items catalogue`);

  // Map référence → itemId pour pouvoir récupérer le stock
  const refToItemId = new Map<string, number>();
  for (const item of items) {
    if (item.reference) refToItemId.set(item.reference.trim(), item.id);
  }

  // 2. Commandes 12 mois
  const dateDebut = new Date();
  dateDebut.setFullYear(dateDebut.getFullYear() - 1);
  const orders = await fetchOrdersWithRows(dateDebut.toISOString().split("T")[0]);

  // 3. Agréger par référence
  const refMap = new Map<string, RefABC>();
  for (const order of orders) {
    for (const row of (order.rows || [])) {
      const ref = (row.reference || "").trim();
      if (!ref) continue;
      const totalRow = Number(row.amount_tax_exc) || 0;
      const qty = Number(row.quantity) || 0;
      if (totalRow <= 0) continue;
      const desc = (row.description || ref).replace(/<[^>]+>/g, "").trim().slice(0, 120);

      const existing = refMap.get(ref);
      if (existing) {
        existing.caAnnuel += totalRow;
        existing.nbCommandes += 1;
        existing.quantiteVendue = (existing.quantiteVendue || 0) + qty;
      } else {
        refMap.set(ref, {
          sellsyRefId: ref, sellsyItemId: refToItemId.get(ref) || null, reference: ref, designation: desc,
          caAnnuel: totalRow, nbCommandes: 1, quantiteVendue: qty, stockActuel: null, stockDetail: null,
        });
      }
    }
  }
  console.log(`[ABC] ${refMap.size} produits identifiés`);

  // 4. Classification
  const classees = calculerClassificationABC(
    Array.from(refMap.values()).filter((r) => r.caAnnuel > 0),
    seuilA, seuilB
  );

  // 4b. Récupérer le stock réel par entrepôt (V1 API)
  const warehouses = await getWarehouses();
  const itemsWithId = classees.filter((r) => r.sellsyItemId !== null);
  console.log(`[ABC] Récupération stock pour ${itemsWithId.length} items...`);

  const STOCK_BATCH = 10;
  for (let i = 0; i < itemsWithId.length; i += STOCK_BATCH) {
    const batch = itemsWithId.slice(i, i + STOCK_BATCH);
    const results = await Promise.allSettled(
      batch.map(async (ref) => {
        const stockData = await getStockForItem(ref.sellsyItemId!);
        const detail: StockEntrepot[] = Object.values(stockData).map((s) => ({
          warehouseId: s.whid,
          warehouseLabel: warehouses[s.whid]?.label || `Entrepôt #${s.whid}`,
          quantity: parseFloat(s.qt || "0"),
          booked: parseFloat(s.bookedqt || "0"),
          available: parseFloat(s.availableqt || "0"),
          isDefault: warehouses[s.whid]?.isdefault === "Y",
        }));
        const totalAvailable = detail.reduce((sum, s) => sum + s.available, 0);
        return { ref: ref.sellsyRefId, detail, totalAvailable };
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled") {
        const item = classees.find((c) => c.sellsyRefId === r.value.ref);
        if (item) {
          item.stockActuel = r.value.totalAvailable;
          item.stockDetail = r.value.detail;
        }
      }
    }
    if ((i + STOCK_BATCH) % 50 === 0 || i + STOCK_BATCH >= itemsWithId.length) {
      console.log(`[ABC] Stock: ${Math.min(i + STOCK_BATCH, itemsWithId.length)}/${itemsWithId.length}`);
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  // 5. Enrichir avec seuils
  const seuils = await prisma.seuilStockAchat.findMany();
  const seuilMap = new Map(seuils.map((s) => [s.sellsyRefId, s]));

  const enrichies = classees.map((ref) => {
    const seuil = seuilMap.get(ref.sellsyRefId);
    return {
      ...ref,
      caAnnuel: Math.round(ref.caAnnuel * 100) / 100,
      seuilAlerte: seuil?.seuilAlerte ?? null,
      sousSeuilAlerte: seuil ? (ref.stockActuel !== null && ref.stockActuel < seuil.seuilAlerte) : false,
      noteSeuil: seuil?.note ?? null,
      stockActuel: ref.stockActuel,
      stockDetail: ref.stockDetail,
    };
  });

  const nbA = enrichies.filter((r) => r.classe === "A").length;
  const nbB = enrichies.filter((r) => r.classe === "B").length;
  const nbC = enrichies.filter((r) => r.classe === "C").length;
  const caTotal = enrichies.reduce((s, r) => s + r.caAnnuel, 0);
  const caA = enrichies.filter((r) => r.classe === "A").reduce((s, r) => s + r.caAnnuel, 0);

  return {
    refs: enrichies,
    stats: {
      nbA, nbB, nbC,
      totalRefs: enrichies.length,
      caTotal: Math.round(caTotal),
      couvertureCaA: caTotal > 0 ? Math.round((caA / caTotal) * 100) : 0,
      alertesActives: enrichies.filter((r) => r.classe === "A" && r.sousSeuilAlerte).length,
      seuilA, seuilB,
    },
    alertes: enrichies.filter((r) => r.sousSeuilAlerte),
    lastSync: new Date().toISOString(),
  };
}

// ============================================================================
// GET — Lit le cache DB (instantané)
// ============================================================================

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["ACHAT", "ADMIN", "DIRECTION", "MARKETING"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const mode = req.nextUrl.searchParams.get("mode");

  try {
    // Lire le cache en base
    const cache = await prisma.$queryRawUnsafe<any[]>(
      `SELECT data, "calculatedAt" FROM "CacheABC" WHERE id = 'current' LIMIT 1`
    );

    if (!cache || cache.length === 0) {
      return NextResponse.json({
        refs: [], stats: { nbA: 0, nbB: 0, nbC: 0, totalRefs: 0, caTotal: 0, couvertureCaA: 0, alertesActives: 0, seuilA: 80, seuilB: 95 },
        alertes: [], lastSync: null, needsCalculation: true,
      });
    }

    const result = cache[0].data as any;
    result.lastSync = cache[0].calculatedAt;

    if (mode === "stats") return NextResponse.json(result.stats);
    if (mode === "alertes") return NextResponse.json({ alertes: result.alertes, stats: result.stats });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[ABC GET] Erreur:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// POST — Lance le recalcul (long, stocke en base)
// ============================================================================

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["ACHAT", "ADMIN", "DIRECTION"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const config = await prisma.configABC.findFirst();
    const seuilA = config?.seuilA ?? 80;
    const seuilB = config?.seuilB ?? 95;

    console.log("[ABC] Début recalcul...");
    const result = await computeABC(seuilA, seuilB);
    console.log(`[ABC] Recalcul terminé : ${result.stats.totalRefs} refs, ${result.stats.nbA}A/${result.stats.nbB}B/${result.stats.nbC}C`);

    // Stocker en base
    await prisma.$executeRawUnsafe(
      `INSERT INTO "CacheABC" (id, data, "calculatedAt") VALUES ('current', $1::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET data = $1::jsonb, "calculatedAt" = NOW()`,
      JSON.stringify(result)
    );

    return NextResponse.json({
      success: true,
      stats: result.stats,
      message: `${result.stats.totalRefs} références classées (${result.stats.nbA}A / ${result.stats.nbB}B / ${result.stats.nbC}C)`,
    });
  } catch (error: any) {
    console.error("[ABC POST] Erreur:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
