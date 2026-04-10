import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listAllOrders } from "@/lib/sellsy";

const TYPES_COUT = [
  { value: "meta_ads", label: "Meta Ads" },
  { value: "google_ads", label: "Google Ads" },
  { value: "salon", label: "Salon / Événement" },
  { value: "agence", label: "Agence" },
  { value: "print", label: "Print / Flyer" },
  { value: "autre", label: "Autre" },
];

// Valeurs de champs de personnalisation Sellsy à exclure du CA
const EXCLUDED_CF_VALUES = ["SAV", "COMMANDE MAGASIN", "FOURNISSEUR"];

const META_API = "https://graph.facebook.com/v19.0";
const GADS_BASE = "https://googleads.googleapis.com/v20";

function isOrderExcluded(order: Awaited<ReturnType<typeof listAllOrders>>[number]): boolean {
  // Exclure les statuts annulés
  const status = (order.status || "").toLowerCase();
  if (status === "cancelled" || status.includes("annul")) return true;

  // Exclure si un champ de personnalisation a une valeur exclue
  const cfValues: Array<{ value: string | null }> = [
    ...(order.custom_fields_values || []),
    ...((order._embed?.custom_fields_values) || []),
  ];
  for (const cf of cfValues) {
    const val = (cf.value || "").trim().toUpperCase();
    if (EXCLUDED_CF_VALUES.includes(val)) return true;
  }

  return false;
}

// --- CA mensuel depuis Sellsy BDC ---
async function fetchCaSellsy(annee: string): Promise<{ caMensuel: Record<string, number>; nbOrders: number }> {
  try {
    // Fetch tous les BDC depuis début d'année (le filtre until n'est pas fiable côté Sellsy)
    const orders = await listAllOrders(`${annee}-01-01`);
    const caMensuel: Record<string, number> = {};
    let nbOrders = 0;

    for (const order of orders) {
      if (isOrderExcluded(order)) continue;

      const dateStr = order.date || order.created || "";
      if (!dateStr) continue;
      const moisKey = dateStr.substring(0, 7); // "2026-03"
      // Filtrer côté client pour l'année demandée
      if (!moisKey.startsWith(annee)) continue;

      const montant = order.amounts?.total_excl_tax ?? order.amounts?.total_raw_excl_tax ?? 0;
      const value = typeof montant === "string" ? parseFloat(montant) : (montant || 0);
      caMensuel[moisKey] = (caMensuel[moisKey] || 0) + value;
      nbOrders++;
    }

    return { caMensuel, nbOrders };
  } catch (err) {
    console.error("[ROI] Sellsy orders error — fallback ventes DB:", err);
    // Fallback : utiliser les ventes en base
    const ventes = await prisma.vente.findMany({
      where: {
        createdAt: {
          gte: new Date(`${annee}-01-01`),
          lt: new Date(`${parseInt(annee) + 1}-01-01`),
        },
      },
      select: { montant: true, createdAt: true },
    });
    const caMensuel: Record<string, number> = {};
    for (const v of ventes) {
      const mois = v.createdAt.toISOString().substring(0, 7);
      caMensuel[mois] = (caMensuel[mois] || 0) + v.montant;
    }
    return { caMensuel, nbOrders: ventes.length };
  }
}

// --- Meta Ads monthly spend ---
async function fetchMetaMonthlySpend(annee: string): Promise<Record<string, number>> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) return {};

  try {
    const accountsRes = await fetch(
      `${META_API}/me/adaccounts?fields=id&access_token=${accessToken}`
    );
    const accountsData = await accountsRes.json();
    const accounts = accountsData.data || [];
    if (accounts.length === 0) return {};

    const since = `${annee}-01-01`;
    const until = `${annee}-12-31`;
    const monthly: Record<string, number> = {};

    for (const account of accounts) {
      const url =
        `${META_API}/${account.id}/insights` +
        `?fields=spend` +
        `&time_range=${JSON.stringify({ since, until })}` +
        `&time_increment=monthly` +
        `&limit=50` +
        `&access_token=${accessToken}`;

      const res = await fetch(url);
      const data = await res.json();
      for (const row of (data.data || [])) {
        const monthKey = (row.date_start || "").substring(0, 7);
        if (!monthKey) continue;
        monthly[monthKey] = (monthly[monthKey] || 0) + parseFloat(row.spend || "0");
      }
    }

    for (const k in monthly) {
      monthly[k] = Math.round(monthly[k] * 100) / 100;
    }
    return monthly;
  } catch (err) {
    console.error("[ROI] Meta spend error:", err);
    return {};
  }
}

// --- Google Ads monthly spend ---
async function fetchGoogleMonthlySpend(annee: string): Promise<Record<string, number>> {
  const required = [
    "GOOGLE_ADS_DEVELOPER_TOKEN",
    "GOOGLE_ADS_CUSTOMER_ID",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REFRESH_TOKEN",
  ];
  if (required.some((k) => !process.env[k])) return {};

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
        grant_type: "refresh_token",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return {};

    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!;

    const query = `
      SELECT segments.month, metrics.cost_micros
      FROM campaign
      WHERE campaign.status != 'REMOVED'
        AND segments.date BETWEEN '${annee}-01-01' AND '${annee}-12-31'
      ORDER BY segments.month ASC
    `;

    const res = await fetch(`${GADS_BASE}/customers/${customerId}/googleAds:search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      console.error("[ROI] Google Ads API error:", res.status);
      return {};
    }

    const data = await res.json();
    const monthly: Record<string, number> = {};

    for (const row of (data.results || [])) {
      const rawMonth: string = row.segments?.month || "";
      const monthKey = rawMonth.substring(0, 7); // "2026-01"
      if (!monthKey) continue;
      const spend = Math.round((Number(row.metrics?.costMicros || 0) / 1_000_000) * 100) / 100;
      monthly[monthKey] = (monthly[monthKey] || 0) + spend;
    }

    return monthly;
  } catch (err) {
    console.error("[ROI] Google Ads spend error:", err);
    return {};
  }
}

// GET /api/marketing/roi — Dashboard ROI avec CA Sellsy (BDC) + dépenses
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const annee = req.nextUrl.searchParams.get("annee") || String(new Date().getFullYear());

    // Fetch en parallèle
    const [couts, { caMensuel, nbOrders }, metaMonthly, googleMonthly, guideDownloads] = await Promise.all([
      prisma.coutMarketing.findMany({
        where: { periode: { startsWith: annee } },
        include: { createdBy: { select: { nom: true, prenom: true } } },
        orderBy: { periode: "asc" },
      }),
      fetchCaSellsy(annee),
      fetchMetaMonthlySpend(annee),
      fetchGoogleMonthlySpend(annee),
      prisma.evenement.count({
        where: {
          type: "NOTE",
          description: { contains: "Téléchargement guide PDF" },
          createdAt: {
            gte: new Date(`${annee}-01-01`),
            lt: new Date(`${parseInt(annee) + 1}-01-01`),
          },
        },
      }),
    ]);

    const totalMetaSpend = Object.values(metaMonthly).reduce((s, v) => s + v, 0);
    const totalGoogleSpend = Object.values(googleMonthly).reduce((s, v) => s + v, 0);

    // Tableau mensuel
    const mois = [];
    for (let m = 1; m <= 12; m++) {
      const periode = `${annee}-${String(m).padStart(2, "0")}`;
      const ca = Math.round(caMensuel[periode] || 0);

      // Dépenses manuelles ce mois (sans meta/google si APIs actives)
      let depensesManuellesMois = 0;
      for (const c of couts) {
        if (c.periode !== periode) continue;
        if (c.type === "meta_ads" && totalMetaSpend > 0) continue;
        if (c.type === "google_ads" && totalGoogleSpend > 0) continue;
        depensesManuellesMois += c.montant;
      }

      const metaSpend = Math.round((metaMonthly[periode] || 0) * 100) / 100;
      const googleSpend = Math.round((googleMonthly[periode] || 0) * 100) / 100;
      const depenses = Math.round((depensesManuellesMois + metaSpend + googleSpend) * 100) / 100;
      const roi = depenses > 0 ? Math.round(((ca - depenses) / depenses) * 100) : 0;

      mois.push({ periode, ca, depenses, metaSpend, googleSpend, roi });
    }

    // Totaux
    const totalCA = Math.round(Object.values(caMensuel).reduce((s, v) => s + v, 0));
    const totalDepensesManuellesHorsAds = couts
      .filter((c) => {
        if (c.type === "meta_ads" && totalMetaSpend > 0) return false;
        if (c.type === "google_ads" && totalGoogleSpend > 0) return false;
        return true;
      })
      .reduce((s, c) => s + c.montant, 0);
    const totalDepenses = Math.round((totalDepensesManuellesHorsAds + totalMetaSpend + totalGoogleSpend) * 100) / 100;
    const roiAnnuel = totalDepenses > 0 ? Math.round(((totalCA - totalDepenses) / totalDepenses) * 100) : 0;
    const cac = nbOrders > 0 && totalDepenses > 0 ? Math.round(totalDepenses / nbOrders) : 0;

    const depensesParTypeManuel: Record<string, number> = {};
    for (const c of couts) {
      depensesParTypeManuel[c.type] = (depensesParTypeManuel[c.type] || 0) + c.montant;
    }

    const depensesParType = TYPES_COUT.map((t) => {
      let montant = 0;
      if (t.value === "meta_ads") {
        montant = totalMetaSpend > 0 ? totalMetaSpend : (depensesParTypeManuel["meta_ads"] || 0);
      } else if (t.value === "google_ads") {
        montant = totalGoogleSpend > 0 ? totalGoogleSpend : (depensesParTypeManuel["google_ads"] || 0);
      } else {
        montant = depensesParTypeManuel[t.value] || 0;
      }
      return { type: t.value, label: t.label, montant: Math.round(montant) };
    });

    return NextResponse.json({
      annee,
      kpis: {
        totalCA,
        totalDepenses,
        roiAnnuel,
        cac,
        nbVentes: nbOrders,
        guideDownloads,
      },
      mois,
      depensesParType,
      couts,
      typesCout: TYPES_COUT,
      meta: { available: totalMetaSpend > 0 },
      google: { available: totalGoogleSpend > 0 },
    });
  } catch (error: any) {
    console.error("Erreur GET ROI:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/marketing/roi — Ajouter un coût marketing
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["ADMIN", "DIRECTION", "MARKETING"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const { periode, type, libelle, montant } = body;

  if (!periode || !type || !libelle || montant === undefined) {
    return NextResponse.json({ error: "Champs requis : periode, type, libelle, montant" }, { status: 400 });
  }

  const cout = await prisma.coutMarketing.create({
    data: {
      periode,
      type,
      libelle,
      montant: parseFloat(montant),
      createdById: (session.user as any).id,
    },
  });

  return NextResponse.json(cout, { status: 201 });
}

// DELETE /api/marketing/roi — Supprimer un coût
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["ADMIN", "DIRECTION"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  await prisma.coutMarketing.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
