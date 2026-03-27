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
 * Récupère les IDs des commandes 12 mois via search,
 * puis fetch chaque détail (qui inclut les rows) par batch de 10.
 */
async function fetchOrdersWithRows(sinceISO: string) {
  const pageSize = 100;
  const allOrderIds: number[] = [];

  // 1. Récupérer les IDs via search (sans rows — search ne les supporte pas)
  let offset = 0;
  let total = 0;
  do {
    try {
      const page = await sellsyFetch<any>(`/orders/search?limit=${pageSize}&offset=${offset}`, {
        method: "POST",
        body: JSON.stringify({ filters: { date: { start: sinceISO } } }),
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

  console.log(`[ABC] ${allOrderIds.length} commandes identifiées, fetch détails avec rows...`);

  // 2. Fetch détails par batch de 10 (le détail inclut automatiquement les rows)
  const allOrders: any[] = [];
  for (let i = 0; i < allOrderIds.length; i += 10) {
    const batch = allOrderIds.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map((id) => sellsyFetch<any>(`/orders/${id}`))
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) allOrders.push(r.value);
    }
    // Log progress
    if ((i + 10) % 100 === 0 || i + 10 >= allOrderIds.length) {
      console.log(`[ABC] Détails: ${Math.min(i + 10, allOrderIds.length)}/${allOrderIds.length}`);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`[ABC] ${allOrders.length} commandes avec rows récupérées`);
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
      const rows = order.rows || [];

      if (Array.isArray(rows) && rows.length > 0) {
        for (const row of rows) {
          // Utiliser la référence produit comme clé (c'est ce qu'on a dans les rows)
          const ref = (row.reference || "").trim();
          if (!ref) continue;

          // Montant HT de cette ligne
          const totalRow = Number(row.amount_tax_exc) || 0;
          const qty = Number(row.quantity) || 0;
          if (totalRow <= 0) continue;

          // Nettoyer la description (enlever HTML)
          const desc = (row.description || ref).replace(/<[^>]+>/g, "").trim().slice(0, 120);

          const existing = refMap.get(ref);
          if (existing) {
            existing.caAnnuel += totalRow;
            existing.nbCommandes += 1;
            existing.quantiteVendue = (existing.quantiteVendue || 0) + qty;
          } else {
            refMap.set(ref, {
              sellsyRefId: ref,
              designation: desc,
              reference: ref,
              caAnnuel: totalRow,
              nbCommandes: 1,
              quantiteVendue: qty,
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
