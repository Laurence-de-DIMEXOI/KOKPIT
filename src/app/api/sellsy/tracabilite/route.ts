import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listAllEstimates, listAllOrders, invalidateSellsyCache } from "@/lib/sellsy";

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

// GET — Données traçabilité complètes
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Récupérer en parallèle : Sellsy data + liaisons locales
    const [estimates, orders, liaisons] = await Promise.all([
      listAllEstimates(),
      listAllOrders(),
      prisma.liaisonDevisCommande.findMany(),
    ]);

    // Maps pour lookup rapide
    const estimateMap = new Map(estimates.map((e) => [e.id, e]));
    const orderMap = new Map(orders.map((o) => [o.id, o]));

    // Sets des IDs liés
    const linkedEstimateIds = new Set(liaisons.map((l) => l.estimateId));
    const linkedOrderIds = new Set(liaisons.map((l) => l.orderId));

    // 1. Devis convertis (avec liaison)
    const devisConvertis = liaisons
      .map((l) => {
        const estimate = estimateMap.get(l.estimateId);
        const order = orderMap.get(l.orderId);
        if (!estimate || !order) return null;
        const montantDevis = getAmountHT(estimate.amounts);
        const montantCommande = getAmountHT(order.amounts);
        const ecart = montantDevis > 0
          ? ((montantCommande - montantDevis) / montantDevis) * 100
          : 0;
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
            pdf_link: (estimate as any).pdf_link,
          },
          order: {
            id: order.id,
            number: order.number,
            subject: order.subject,
            date: order.date,
            company_name: order.company_name,
            contact_id: order.contact_id,
            amounts: order.amounts,
            pdf_link: (order as any).pdf_link,
          },
          montantDevis,
          montantCommande,
          ecart: Math.round(ecart * 10) / 10,
        };
      })
      .filter(Boolean);

    // 2. Commandes sans devis lié
    const commandesSansDevis = orders
      .filter((o) => !linkedOrderIds.has(o.id))
      .map((o) => ({
        id: o.id,
        number: o.number,
        subject: o.subject,
        status: o.status,
        date: o.date,
        company_name: o.company_name,
        contact_id: o.contact_id,
        amounts: o.amounts,
        pdf_link: (o as any).pdf_link,
      }));

    // 3. Devis non convertis
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
        pdf_link: (e as any).pdf_link,
        ageJours: daysBetween(e.date || e.created),
      }));

    // 4. Auto-suggestions : même contact_id, montant ±20%
    const suggestions: any[] = [];
    for (const order of commandesSansDevis) {
      if (!order.contact_id) continue;
      const orderAmount = getAmountHT(order.amounts);

      const candidateEstimates = devisNonConvertis.filter((e) => {
        if (e.contact_id !== order.contact_id) return false;
        const estAmount = getAmountHT(e.amounts);
        if (orderAmount === 0 && estAmount === 0) return true;
        if (orderAmount === 0 || estAmount === 0) return false;
        const ratio = Math.abs(orderAmount - estAmount) / Math.max(orderAmount, estAmount);
        return ratio <= 0.2;
      });

      for (const est of candidateEstimates) {
        const estAmount = getAmountHT(est.amounts);
        const amountDiff = orderAmount > 0
          ? 1 - Math.abs(orderAmount - estAmount) / Math.max(orderAmount, estAmount)
          : 0.5;
        const dateDiff = Math.abs(daysBetween(order.date || "") - daysBetween(est.date || ""));
        const dateScore = Math.max(0, 1 - dateDiff / 180);
        const score = Math.round((amountDiff * 0.7 + dateScore * 0.3) * 100) / 100;

        suggestions.push({
          estimate: est,
          order,
          score,
        });
      }
    }
    suggestions.sort((a, b) => b.score - a.score);

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

    return NextResponse.json({
      devisConvertis,
      commandesSansDevis,
      devisNonConvertis,
      suggestions: suggestions.slice(0, 20),
      stats: {
        totalDevis,
        totalCommandes,
        devisConvertis: nbDevisConvertis,
        commandesDirectes: nbCommandesDirectes,
        tauxConversion,
        devisEnAttente: nbDevisEnAttente,
        devisExpires: nbDevisExpires,
      },
      _cache: { generatedAt: new Date().toISOString() },
    });
  } catch (error: any) {
    console.error("GET /api/sellsy/tracabilite error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
