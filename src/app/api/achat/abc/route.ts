import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listItems, sellsyFetch } from "@/lib/sellsy";
import { calculerClassificationABC, type RefABC } from "@/lib/calcul-abc";

export const maxDuration = 60;

// Cache simple en mémoire (1h)
let cachedResult: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000;

/**
 * Récupère TOUTES les commandes des 12 derniers mois AVEC les lignes (rows embeddées).
 */
async function fetchOrdersWithRows(sinceISO: string) {
  const pageSize = 100;
  const allOrders: any[] = [];

  // Page 1
  const qs1 = `limit=${pageSize}&offset=0&embed[]=rows`;
  const page1 = await sellsyFetch<any>(`/orders/search?${qs1}`, {
    method: "POST",
    body: JSON.stringify({ filters: { date: { start: sinceISO } } }),
  });

  allOrders.push(...(page1.data || []));
  const total = page1.pagination?.total || 0;

  // Pages suivantes
  for (let offset = pageSize; offset < total; offset += pageSize) {
    const qs = `limit=${pageSize}&offset=${offset}&embed[]=rows`;
    try {
      const page = await sellsyFetch<any>(`/orders/search?${qs}`, {
        method: "POST",
        body: JSON.stringify({ filters: { date: { start: sinceISO } } }),
      });
      allOrders.push(...(page.data || []));
    } catch (err: any) {
      console.warn(`[ABC] Erreur page offset=${offset}:`, err.message);
    }
    // Petite pause anti rate-limit
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`[ABC] ${allOrders.length} commandes récupérées (total API: ${total})`);
  return allOrders;
}

/**
 * GET /api/achat/abc
 * ?mode=stats | alertes
 * ?seuilA=80&seuilB=95
 * ?fresh=true pour forcer le recalcul
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["ACHAT", "ADMIN", "DIRECTION", "MARKETING"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const mode = req.nextUrl.searchParams.get("mode");
  const seuilAParam = req.nextUrl.searchParams.get("seuilA");
  const seuilBParam = req.nextUrl.searchParams.get("seuilB");
  const fresh = req.nextUrl.searchParams.get("fresh") === "true";

  try {
    const config = await prisma.configABC.findFirst();
    const seuilA = seuilAParam ? parseFloat(seuilAParam) : (config?.seuilA ?? 80);
    const seuilB = seuilBParam ? parseFloat(seuilBParam) : (config?.seuilB ?? 95);

    // Cache
    if (!fresh && !seuilAParam && !seuilBParam && cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
      if (mode === "stats") return NextResponse.json(cachedResult.data.stats);
      if (mode === "alertes") return NextResponse.json(cachedResult.data.alertes);
      return NextResponse.json(cachedResult.data);
    }

    // 1. Catalogue Sellsy
    const catalogueRes = await listItems({ limit: 500 });
    const items = catalogueRes.data || [];

    // 2. Commandes 12 mois AVEC lignes
    const dateDebut = new Date();
    dateDebut.setFullYear(dateDebut.getFullYear() - 1);
    const sinceISO = dateDebut.toISOString().split("T")[0];
    const orders = await fetchOrdersWithRows(sinceISO);

    // 3. Map catalogue par ID
    const catalogueMap = new Map<string, { name: string; reference: string }>();
    for (const item of items) {
      if (item.is_archived) continue;
      catalogueMap.set(String(item.id), { name: item.name || "Sans nom", reference: item.reference || "" });
    }

    // 4. Agréger le CA par produit via les lignes de commande
    const refMap = new Map<string, RefABC>();

    for (const order of orders) {
      // Chercher les lignes dans _embed.rows ou rows
      const rows = order._embed?.rows || order.rows || [];

      if (Array.isArray(rows) && rows.length > 0) {
        for (const row of rows) {
          // Identifier le produit : item_id, related_id, ou item.id
          const itemId = String(row.item_id || row.related_id || row.item?.id || "");
          if (!itemId || itemId === "undefined" || itemId === "null") continue;

          // Montant HT de cette ligne
          const qty = Number(row.quantity) || 1;
          const unitPrice = Number(row.unit_amount_excl_tax || row.unit_amount || 0);
          const totalRow = Number(row.total_amount_excl_tax) || (unitPrice * qty);
          if (totalRow <= 0) continue;

          const existing = refMap.get(itemId);
          if (existing) {
            existing.caAnnuel += totalRow;
            existing.nbCommandes += 1;
          } else {
            const cat = catalogueMap.get(itemId);
            refMap.set(itemId, {
              sellsyRefId: itemId,
              designation: row.name || row.description || cat?.name || "Produit #" + itemId,
              reference: row.reference || cat?.reference || "",
              caAnnuel: totalRow,
              nbCommandes: 1,
              stockActuel: null,
            });
          }
        }
      }
    }

    console.log(`[ABC] ${refMap.size} produits identifiés dans les lignes de commande`);

    // 5. Calcul ABC
    const refsAvecCA = Array.from(refMap.values()).filter((r) => r.caAnnuel > 0);
    const classees = calculerClassificationABC(refsAvecCA, seuilA, seuilB);

    // 6. Enrichir avec seuils
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
      };
    });

    // Stats
    const nbA = enrichies.filter((r) => r.classe === "A").length;
    const nbB = enrichies.filter((r) => r.classe === "B").length;
    const nbC = enrichies.filter((r) => r.classe === "C").length;
    const caTotal = enrichies.reduce((s, r) => s + r.caAnnuel, 0);
    const caA = enrichies.filter((r) => r.classe === "A").reduce((s, r) => s + r.caAnnuel, 0);
    const alertesActives = enrichies.filter((r) => r.classe === "A" && r.sousSeuilAlerte).length;

    const stats = {
      nbA,
      nbB,
      nbC,
      totalRefs: enrichies.length,
      caTotal: Math.round(caTotal),
      couvertureCaA: caTotal > 0 ? Math.round((caA / caTotal) * 100) : 0,
      alertesActives,
      seuilA,
      seuilB,
    };

    const alertes = enrichies.filter((r) => r.sousSeuilAlerte);

    const result = {
      refs: enrichies,
      stats,
      alertes,
      lastSync: new Date().toISOString(),
    };

    // Cache
    if (!seuilAParam && !seuilBParam) {
      cachedResult = { data: result, timestamp: Date.now() };
    }

    if (mode === "stats") return NextResponse.json(stats);
    if (mode === "alertes") return NextResponse.json({ alertes, stats });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[ABC] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur calcul ABC" },
      { status: 500 }
    );
  }
}
