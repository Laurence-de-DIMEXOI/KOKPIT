import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listItems, listAllOrders } from "@/lib/sellsy";
import { calculerClassificationABC, type RefABC } from "@/lib/calcul-abc";

export const maxDuration = 60;

// Cache simple en mémoire (1h)
let cachedResult: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1h

/**
 * GET /api/achat/abc
 * Calcul classification ABC complet.
 * ?seuilA=80&seuilB=95 pour preview custom
 * ?mode=stats pour KPIs seulement
 * ?mode=alertes pour références sous seuil uniquement
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

  const mode = req.nextUrl.searchParams.get("mode"); // "stats" | "alertes" | null
  const seuilAParam = req.nextUrl.searchParams.get("seuilA");
  const seuilBParam = req.nextUrl.searchParams.get("seuilB");

  try {
    // Config ABC
    const config = await prisma.configABC.findFirst();
    const seuilA = seuilAParam ? parseFloat(seuilAParam) : (config?.seuilA ?? 80);
    const seuilB = seuilBParam ? parseFloat(seuilBParam) : (config?.seuilB ?? 95);

    // Check cache (sauf si custom seuils)
    if (!seuilAParam && !seuilBParam && cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
      if (mode === "stats") return NextResponse.json(cachedResult.data.stats);
      if (mode === "alertes") return NextResponse.json(cachedResult.data.alertes);
      return NextResponse.json(cachedResult.data);
    }

    // 1. Récupérer le catalogue Sellsy
    const catalogueRes = await listItems({ limit: 500 });
    const items = catalogueRes.data || [];

    // 2. Récupérer les commandes des 12 derniers mois
    const dateDebut = new Date();
    dateDebut.setFullYear(dateDebut.getFullYear() - 1);
    const sinceISO = dateDebut.toISOString().split("T")[0];
    const orders = await listAllOrders(sinceISO);

    // 3. Agréger le CA par produit (via les lignes de commande)
    const refMap = new Map<string, RefABC>();

    // Initialiser avec le catalogue
    for (const item of items) {
      if (item.is_archived) continue;
      refMap.set(String(item.id), {
        sellsyRefId: String(item.id),
        designation: item.name || "Sans nom",
        reference: item.reference || "",
        caAnnuel: 0,
        nbCommandes: 0,
        stockActuel: null, // Sellsy V2 ne retourne pas le stock dans /items
      });
    }

    // Agréger les commandes par produit (via related items)
    for (const order of orders) {
      const montant = Number(order.amounts?.total_excl_tax) || 0;
      if (montant <= 0) continue;

      // Si l'order a des lignes avec des items
      const rows = (order as any).rows || (order as any)._embed?.rows || [];
      if (rows.length > 0) {
        for (const row of rows) {
          const itemId = String(row.item_id || row.related_id || "");
          if (!itemId || itemId === "undefined") continue;

          const existing = refMap.get(itemId);
          const rowAmount = Number(row.total_amount_excl_tax || row.unit_amount_excl_tax || 0) * (Number(row.quantity) || 1);

          if (existing) {
            existing.caAnnuel += rowAmount > 0 ? rowAmount : 0;
            existing.nbCommandes += 1;
          }
        }
      } else {
        // Fallback : attribuer le montant total au related
        const related = order.related?.[0];
        if (related) {
          // On ne peut pas lier à un produit spécifique, skip
        }
      }
    }

    // Filtrer les refs avec CA > 0
    const refsAvecCA = Array.from(refMap.values()).filter((r) => r.caAnnuel > 0);

    // 4. Calculer ABC
    const classees = calculerClassificationABC(refsAvecCA, seuilA, seuilB);

    // 5. Enrichir avec les seuils de stock
    const seuils = await prisma.seuilStockAchat.findMany();
    const seuilMap = new Map(seuils.map((s) => [s.sellsyRefId, s]));

    const enrichies = classees.map((ref) => {
      const seuil = seuilMap.get(ref.sellsyRefId);
      return {
        ...ref,
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

    // Mettre en cache
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
