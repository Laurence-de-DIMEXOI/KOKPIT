import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listAllEstimates, listAllOrders, invalidateSellsyCache, getDocumentParent } from "@/lib/sellsy";

// Cache dédié traçabilité — 5 min (lourd à recalculer)
const CACHE_TTL = 5 * 60 * 1000;
let traceCache: { data: unknown; timestamp: number } | null = null;

// Max V1 calls per request (éviter de surcharger l'API)
const MAX_V1_CALLS_PER_REQUEST = 20;

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

// GET — Traçabilité via API Sellsy V1 (liaisons réelles parentid)
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
    // 1. Charger en parallèle : données Sellsy V2 + cache V1 local
    const [estimates, orders, existingV1Links] = await Promise.all([
      listAllEstimates(),
      listAllOrders(),
      prisma.liaisonDocumentaire.findMany({
        where: { enfantType: "order" },
      }),
    ]);

    // Maps pour lookup rapide
    const estimateMap = new Map(estimates.map((e) => [String(e.id), e]));

    // Set des orders déjà vérifiés via V1 (en cache local)
    const checkedOrderIds = new Set(existingV1Links.map((l) => l.enfantSellsyId));

    // 2. Résoudre les liaisons V1 pour les orders non encore vérifiés
    const uncheckedOrders = orders.filter((o) => !checkedOrderIds.has(String(o.id)));
    const toCheck = uncheckedOrders.slice(0, MAX_V1_CALLS_PER_REQUEST);
    let newLinksCreated = 0;

    for (const order of toCheck) {
      try {
        const parentInfo = await getDocumentParent("order", String(order.id));

        const hasParent = parentInfo?.parentid && parentInfo.parentid !== "0";

        // Sauvegarder en cache permanent (même si pas de parent → évite de re-call V1)
        await prisma.liaisonDocumentaire.upsert({
          where: {
            enfantType_enfantSellsyId: {
              enfantType: "order",
              enfantSellsyId: String(order.id),
            },
          },
          update: {
            parentType: hasParent ? (parentInfo!.linkedtype || "estimate") : "none",
            parentSellsyId: hasParent ? parentInfo!.parentid! : "0",
          },
          create: {
            enfantType: "order",
            enfantSellsyId: String(order.id),
            enfantNumero: order.number || "",
            parentType: hasParent ? (parentInfo!.linkedtype || "estimate") : "none",
            parentSellsyId: hasParent ? parentInfo!.parentid! : "0",
            parentNumero: "",
          },
        });

        // Si parent estimate trouvé → créer la liaison devis-commande automatiquement
        if (hasParent && (parentInfo!.linkedtype === "estimate" || !parentInfo!.linkedtype)) {
          const estimateId = parseInt(parentInfo!.parentid!, 10);
          if (!isNaN(estimateId)) {
            await prisma.liaisonDevisCommande.upsert({
              where: {
                estimateId_orderId: {
                  estimateId,
                  orderId: order.id,
                },
              },
              update: {},
              create: {
                estimateId,
                orderId: order.id,
                createdById: userId,
              },
            }).catch(() => {}); // Ignorer si doublon
            newLinksCreated++;
          }
        }
      } catch (err) {
        console.warn(`V1 check failed for order ${order.id}:`, err);
      }
    }

    // 3. Recharger les liaisons après les V1 calls
    const [allV1Links, allLiaisons] = await Promise.all([
      prisma.liaisonDocumentaire.findMany({
        where: { enfantType: "order" },
      }),
      prisma.liaisonDevisCommande.findMany(),
    ]);

    const linkedEstimateIds = new Set(allLiaisons.map((l) => l.estimateId));
    const linkedOrderIds = new Set(allLiaisons.map((l) => l.orderId));
    const allCheckedOrderIds = new Set(allV1Links.map((l) => l.enfantSellsyId));

    // 4. Construire les résultats

    // 4a. Devis convertis (liaison confirmée par V1)
    const devisConvertis = allLiaisons
      .map((l) => {
        const estimate = estimateMap.get(String(l.estimateId));
        const order = orders.find((o) => o.id === l.orderId);
        if (!estimate || !order) return null;
        const montantDevis = getAmountHT(estimate.amounts);
        const montantCommande = getAmountHT(order.amounts);
        const ecart = montantDevis > 0
          ? ((montantCommande - montantDevis) / montantDevis) * 100
          : 0;
        return {
          liaisonId: l.id,
          source: "v1" as const,
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
          ecart: Math.round(ecart * 10) / 10,
        };
      })
      .filter(Boolean);

    // 4b. Commandes directes (V1 a confirmé : pas de parent devis)
    const commandesSansDevis = orders
      .filter((o) => {
        if (linkedOrderIds.has(o.id)) return false;
        return allCheckedOrderIds.has(String(o.id));
      })
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

    // 4c. Nombre de commandes en attente de vérification V1
    const commandesEnAttenteV1 = orders
      .filter((o) => !linkedOrderIds.has(o.id) && !allCheckedOrderIds.has(String(o.id)))
      .length;

    // 4d. Devis non convertis
    const devisNonConvertis = estimates
      .filter((e) => !linkedEstimateIds.has(e.id))
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
    const tauxConversion = totalDevis > 0
      ? Math.round((nbDevisConvertis / totalDevis) * 1000) / 10
      : 0;

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
      },
      v1Progress: {
        checked: allCheckedOrderIds.size,
        total: orders.length,
        newLinksCreated,
        complete: commandesEnAttenteV1 === 0,
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
