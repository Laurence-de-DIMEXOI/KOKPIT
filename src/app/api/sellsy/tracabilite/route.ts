import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listAllEstimates, listAllOrders, invalidateSellsyCache } from "@/lib/sellsy";

// Cache dédié traçabilité — 5 min
const CACHE_TTL = 5 * 60 * 1000;
let traceCache: { data: unknown; timestamp: number } | null = null;

function getAmountHT(amounts?: Record<string, any>): number {
  if (!amounts) return 0;
  const val = amounts.total_excl_tax ?? amounts.total ?? 0;
  return typeof val === "number" ? val : parseFloat(val) || 0;
}

function daysBetween(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/** Jours entre deux dates (conversion devis → commande) */
function daysBetweenDates(dateA: string | null, dateB: string | null): number | null {
  if (!dateA || !dateB) return null;
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Extrait le suffixe numérique d'un document Sellsy.
 * Ex: "DEPI-07935" → "07935", "BCDI-05394" → "05394"
 */
function extractDocNumber(docNumber: string): string | null {
  const match = docNumber?.match(/[-_](\d{4,})/);
  return match ? match[1] : null;
}

/**
 * Normalise un nom de contact pour comparaison.
 * "M Damien RIETSCH" → "damien rietsch"
 */
function normalizeContactName(name: string | undefined | null): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/^(m|mme|mr|mrs|mlle)\s+/i, "")
    .trim();
}

// GET — Traçabilité via matching numéro + contact/montant (instantané)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  const { searchParams } = new URL(request.url);
  const fresh = searchParams.get("fresh") === "true";

  // Return cache if valid
  if (!fresh && traceCache && Date.now() - traceCache.timestamp < CACHE_TTL) {
    return NextResponse.json(traceCache.data);
  }

  if (fresh) invalidateSellsyCache();

  try {
    // 1. Charger devis + commandes V2 en parallèle
    const [estimates, orders] = await Promise.all([
      listAllEstimates(),
      listAllOrders(),
    ]);

    // Charger liaisons existantes en BDD
    const existingLiaisons = await prisma.liaisonDevisCommande.findMany();
    const alreadyLinkedOrderIds = new Set(existingLiaisons.map((l) => l.orderId));
    const alreadyLinkedEstimateIds = new Set(existingLiaisons.map((l) => l.estimateId));

    // ===== NIVEAU 1 : MATCHING PAR SUFFIXE NUMÉRIQUE =====
    // Index inversé : suffixe numérique → estimate
    const estimateBySuffix = new Map<string, typeof estimates[0]>();
    for (const est of estimates) {
      const suffix = extractDocNumber(est.number);
      if (suffix) estimateBySuffix.set(suffix, est);
    }

    let linksFromNumber = 0;
    for (const order of orders) {
      if (alreadyLinkedOrderIds.has(order.id)) continue;

      const suffix = extractDocNumber(order.number);
      if (!suffix) continue;

      const matchedEstimate = estimateBySuffix.get(suffix);
      if (!matchedEstimate) continue;

      // Sécurité : vérifier même entreprise si disponible
      if (
        matchedEstimate.company_name &&
        order.company_name &&
        matchedEstimate.company_name !== order.company_name
      ) {
        continue;
      }

      try {
        await prisma.liaisonDevisCommande.upsert({
          where: {
            estimateId_orderId: {
              estimateId: matchedEstimate.id,
              orderId: order.id,
            },
          },
          update: {},
          create: {
            estimateId: matchedEstimate.id,
            orderId: order.id,
            createdById: userId,
          },
        });
        alreadyLinkedOrderIds.add(order.id);
        alreadyLinkedEstimateIds.add(matchedEstimate.id);
        linksFromNumber++;
      } catch {
        // Doublon — ignorer
      }
    }

    // ===== NIVEAU 2 : MATCHING PAR CONTACT + MONTANT =====
    // Pour les commandes non encore liées, chercher un devis avec :
    // - même nom de contact (normalisé)
    // - même montant HT (à 1€ près)
    // - devis antérieur ou même date que la commande
    let linksFromContact = 0;

    // Index : "nom_normalisé::montant_arrondi" → estimate[]
    const estimatesByContactAmount = new Map<string, typeof estimates[0][]>();
    for (const est of estimates) {
      if (alreadyLinkedEstimateIds.has(est.id)) continue;
      const name = normalizeContactName(est.company_name);
      if (!name) continue;
      const amount = Math.round(getAmountHT(est.amounts));
      const key = `${name}::${amount}`;
      const list = estimatesByContactAmount.get(key) || [];
      list.push(est);
      estimatesByContactAmount.set(key, list);
    }

    for (const order of orders) {
      if (alreadyLinkedOrderIds.has(order.id)) continue;

      const name = normalizeContactName(order.company_name);
      if (!name) continue;
      const amount = Math.round(getAmountHT(order.amounts));
      const key = `${name}::${amount}`;

      const candidates = estimatesByContactAmount.get(key);
      if (!candidates || candidates.length === 0) continue;

      // Prendre le devis le plus récent antérieur à la commande
      const orderDate = order.date ? new Date(order.date) : null;
      let bestEstimate: typeof estimates[0] | null = null;

      for (const est of candidates) {
        if (alreadyLinkedEstimateIds.has(est.id)) continue;
        const estDate = est.date ? new Date(est.date) : null;

        // Le devis doit être antérieur ou même jour que la commande
        if (orderDate && estDate && estDate > orderDate) continue;

        // Prendre le plus proche en date
        if (!bestEstimate) {
          bestEstimate = est;
        } else {
          const bestDate = bestEstimate.date ? new Date(bestEstimate.date) : null;
          if (estDate && bestDate && estDate > bestDate) {
            bestEstimate = est;
          }
        }
      }

      if (!bestEstimate) continue;

      try {
        await prisma.liaisonDevisCommande.upsert({
          where: {
            estimateId_orderId: {
              estimateId: bestEstimate.id,
              orderId: order.id,
            },
          },
          update: {},
          create: {
            estimateId: bestEstimate.id,
            orderId: order.id,
            createdById: userId,
          },
        });
        alreadyLinkedOrderIds.add(order.id);
        alreadyLinkedEstimateIds.add(bestEstimate.id);
        linksFromContact++;
      } catch {
        // Doublon — ignorer
      }
    }

    // 3. Recharger toutes les liaisons après matching
    const allLiaisons = await prisma.liaisonDevisCommande.findMany();
    const estimateMap = new Map(estimates.map((e) => [String(e.id), e]));
    const linkedEstimateIdsFinal = new Set(allLiaisons.map((l) => l.estimateId));
    const linkedOrderIdsFinal = new Set(allLiaisons.map((l) => l.orderId));

    // 4. Construire les résultats

    // 4a. Devis convertis avec temps de conversion
    const devisConvertis = allLiaisons
      .map((l) => {
        const estimate = estimateMap.get(String(l.estimateId));
        const order = orders.find((o) => o.id === l.orderId);
        if (!estimate || !order) return null;
        const montantDevis = getAmountHT(estimate.amounts);
        const montantCommande = getAmountHT(order.amounts);
        const tempsConversion = daysBetweenDates(estimate.date, order.date);
        return {
          liaisonId: l.id,
          estimate: {
            id: estimate.id,
            number: estimate.number,
            subject: estimate.subject,
            date: estimate.date,
            company_name: estimate.company_name,
            contact_id: estimate.contact_id,
            amounts: estimate.amounts,
          },
          order: {
            id: order.id,
            number: order.number,
            subject: order.subject,
            date: order.date,
            company_name: order.company_name,
            contact_id: order.contact_id,
            amounts: order.amounts,
          },
          montantDevis,
          montantCommande,
          tempsConversion, // jours entre devis et commande
        };
      })
      .filter(Boolean);

    // 4b. Commandes sans devis lié
    const commandesSansDevis = orders
      .filter((o) => !linkedOrderIdsFinal.has(o.id))
      .map((o) => ({
        id: o.id,
        number: o.number,
        subject: o.subject,
        status: o.status,
        date: o.date,
        company_name: o.company_name,
        contact_id: o.contact_id,
        amounts: o.amounts,
      }));

    // 4c. Devis non convertis
    const devisNonConvertis = estimates
      .filter((e) => !linkedEstimateIdsFinal.has(e.id))
      .map((e) => ({
        id: e.id,
        number: e.number,
        subject: e.subject,
        status: e.status,
        date: e.date,
        company_name: e.company_name,
        contact_id: e.contact_id,
        amounts: e.amounts,
        ageJours: daysBetween(e.date || e.created),
      }));

    // 5. Stats
    const totalDevis = estimates.length;
    const totalCommandes = orders.length;
    const nbDevisConvertis = devisConvertis.length;
    const nbCommandesDirectes = commandesSansDevis.length;
    const nbDevisEnAttente = devisNonConvertis.length;
    const nbDevisExpires = devisNonConvertis.filter((e) => e.ageJours > 60).length;
    const tauxConversion =
      totalDevis > 0
        ? Math.round((nbDevisConvertis / totalDevis) * 1000) / 10
        : 0;

    // Temps de conversion moyen
    const conversions = devisConvertis
      .map((d) => (d as any)?.tempsConversion)
      .filter((t): t is number => t !== null && t !== undefined && t >= 0);
    const tempsConversionMoyen =
      conversions.length > 0
        ? Math.round((conversions.reduce((a, b) => a + b, 0) / conversions.length) * 10) / 10
        : null;

    const result = {
      devisConvertis,
      commandesSansDevis,
      devisNonConvertis,
      stats: {
        totalDevis,
        totalCommandes,
        devisConvertis: nbDevisConvertis,
        commandesDirectes: nbCommandesDirectes,
        tauxConversion,
        devisEnAttente: nbDevisEnAttente,
        devisExpires: nbDevisExpires,
        tempsConversionMoyen,
      },
      matching: {
        linksFromNumber,
        linksFromContact,
        newLinksCreated: linksFromNumber + linksFromContact,
      },
      _cache: { generatedAt: new Date().toISOString() },
    };

    traceCache = { data: result, timestamp: Date.now() };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/sellsy/tracabilite error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
