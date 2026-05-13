import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/commercial/etat-stock-stats?start=ISO&end=ISO
 *
 * Stats du champ perso Sellsy "Etat des produit" pour la période :
 *  - En stock      : EN STOCK + ARRIVAGE M+1/2/3 (+ M+1, M+2, M+3)
 *  - Sur commande  : SUR COMMANDE
 *  - Mixte         : 1 PARTIE EN STOCK - 1 PARTIE SUR COMMANDE
 *  - Autre         : tout autre etatProduit (SAV, RETOUR, etc.)
 *  - Non renseigné : etatProduit = NULL
 *
 * Source : tables locales Vente / Devis (alimentées par refresh-etat-produit + webhook).
 */

const EN_STOCK_VALUES = ["EN STOCK", "ARRIVAGE M+1/2/3", "ARRIVAGE M+1", "ARRIVAGE M+2", "ARRIVAGE M+3"];
const SUR_COMMANDE_VALUES = ["SUR COMMANDE"];
const MIXTE_VALUES = ["1 PARTIE EN STOCK - 1 PARTIE SUR COMMANDE"];

type Bucket = "enStock" | "surCommande" | "mixte" | "autre" | "nonRenseigne";

function bucket(etat: string | null): Bucket {
  if (!etat) return "nonRenseigne";
  if (EN_STOCK_VALUES.includes(etat)) return "enStock";
  if (SUR_COMMANDE_VALUES.includes(etat)) return "surCommande";
  if (MIXTE_VALUES.includes(etat)) return "mixte";
  return "autre";
}

interface BucketStat {
  count: number;
  amount: number;
}

interface Stats {
  total: number;
  enStock: BucketStat;
  surCommande: BucketStat;
  mixte: BucketStat;
  autre: BucketStat;
  nonRenseigne: BucketStat;
}

function emptyStats(): Stats {
  return {
    total: 0,
    enStock: { count: 0, amount: 0 },
    surCommande: { count: 0, amount: 0 },
    mixte: { count: 0, amount: 0 },
    autre: { count: 0, amount: 0 },
    nonRenseigne: { count: 0, amount: 0 },
  };
}

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
    // BDC sur la période, hors annulés
    const ventes = await prisma.vente.findMany({
      where: {
        dateVente: { gte: startDate, lte: endDate },
        OR: [
          { statutSellsy: null },
          { statutSellsy: { notIn: ["cancelled", "canceled", "refused", "rejected", "expired"] } },
        ],
      },
      select: { montant: true, etatProduit: true },
    });

    const orderStats = emptyStats();
    orderStats.total = ventes.length;
    for (const v of ventes) {
      const b = bucket(v.etatProduit);
      orderStats[b].count++;
      orderStats[b].amount += v.montant;
    }

    // Devis sur la période — priorité dateDevisSellsy, fallback dateEnvoi, sinon createdAt.
    const devis = await prisma.devis.findMany({
      where: {
        OR: [
          { dateDevisSellsy: { gte: startDate, lte: endDate } },
          { AND: [{ dateDevisSellsy: null }, { dateEnvoi: { gte: startDate, lte: endDate } }] },
          { AND: [{ dateDevisSellsy: null }, { dateEnvoi: null }, { createdAt: { gte: startDate, lte: endDate } }] },
        ],
      },
      select: { montant: true, etatProduit: true, statutSellsy: true },
    });
    const devisActif = devis.filter(
      (d) =>
        !d.statutSellsy ||
        !["cancelled", "canceled", "refused", "rejected", "expired"].includes(d.statutSellsy)
    );

    const estimateStats = emptyStats();
    estimateStats.total = devisActif.length;
    for (const d of devisActif) {
      const b = bucket(d.etatProduit);
      estimateStats[b].count++;
      estimateStats[b].amount += d.montant;
    }

    return NextResponse.json({
      success: true,
      orders: orderStats,
      estimates: estimateStats,
    });
  } catch (error) {
    console.error("[etat-stock-stats]", error);
    return NextResponse.json({ error: "Erreur calcul" }, { status: 500 });
  }
}
