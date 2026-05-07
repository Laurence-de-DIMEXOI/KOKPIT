import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/commercial/sur-mesure-stats?start=ISO&end=ISO
 *
 * Renvoie les stats Sur-mesure (champ perso Sellsy) pour la période :
 * - BDC : count + montant HT total split par surMesure (true / false / null)
 * - Devis : idem
 *
 * Source : tables locales Vente / Devis (alimentées par refresh-etat-produit + webhook).
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json({ error: "Paramètres start et end requis" }, { status: 400 });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  try {
    // BDC (Vente) sur la période, en excluant les annulés
    const ventes = await prisma.vente.findMany({
      where: {
        dateVente: { gte: startDate, lte: endDate },
        OR: [
          { statutSellsy: null },
          { statutSellsy: { notIn: ["cancelled", "canceled", "refused", "rejected", "expired"] } },
        ],
      },
      select: { montant: true, surMesure: true },
    });

    const orderStats = {
      total: ventes.length,
      surMesure: { count: 0, amount: 0 },
      standard: { count: 0, amount: 0 },
      unknown: { count: 0, amount: 0 },
    };
    for (const v of ventes) {
      if (v.surMesure === true) {
        orderStats.surMesure.count++;
        orderStats.surMesure.amount += v.montant;
      } else if (v.surMesure === false) {
        orderStats.standard.count++;
        orderStats.standard.amount += v.montant;
      } else {
        orderStats.unknown.count++;
        orderStats.unknown.amount += v.montant;
      }
    }

    // Devis sur la période — on filtre par dateEnvoi prioritaire, sinon createdAt
    // (rappel : la table Devis n'a pas de date Sellsy native, dateEnvoi posé seulement
    //  quand status="sent" → on tolère createdAt en fallback).
    const devis = await prisma.devis.findMany({
      where: {
        OR: [
          { dateEnvoi: { gte: startDate, lte: endDate } },
          {
            AND: [
              { dateEnvoi: null },
              { createdAt: { gte: startDate, lte: endDate } },
            ],
          },
        ],
      },
      select: { montant: true, surMesure: true, statutSellsy: true },
    });
    const devisActif = devis.filter(
      (d) =>
        !d.statutSellsy ||
        !["cancelled", "canceled", "refused", "rejected", "expired"].includes(d.statutSellsy)
    );

    const estimateStats = {
      total: devisActif.length,
      surMesure: { count: 0, amount: 0 },
      standard: { count: 0, amount: 0 },
      unknown: { count: 0, amount: 0 },
    };
    for (const d of devisActif) {
      if (d.surMesure === true) {
        estimateStats.surMesure.count++;
        estimateStats.surMesure.amount += d.montant;
      } else if (d.surMesure === false) {
        estimateStats.standard.count++;
        estimateStats.standard.amount += d.montant;
      } else {
        estimateStats.unknown.count++;
        estimateStats.unknown.amount += d.montant;
      }
    }

    // Coverage : combien de docs ont surMesure renseigné (= source fiable)
    const orderCoverage = ventes.length > 0
      ? Math.round(((orderStats.surMesure.count + orderStats.standard.count) / ventes.length) * 100)
      : 0;
    const estimateCoverage = devisActif.length > 0
      ? Math.round(((estimateStats.surMesure.count + estimateStats.standard.count) / devisActif.length) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      orders: orderStats,
      estimates: estimateStats,
      coverage: { orders: orderCoverage, estimates: estimateCoverage },
    });
  } catch (error) {
    console.error("[sur-mesure-stats]", error);
    return NextResponse.json(
      { error: "Erreur calcul stats sur-mesure" },
      { status: 500 }
    );
  }
}
