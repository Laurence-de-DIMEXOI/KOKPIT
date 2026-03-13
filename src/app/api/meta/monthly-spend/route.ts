import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const META_API = "https://graph.facebook.com/v19.0";
const CACHE_TTL = 30 * 60 * 1000; // 30 min — ne se met à jour que quand il y a des modifs

let cache: { data: unknown; timestamp: number } | null = null;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Retourner le cache si encore valide
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: "META_ACCESS_TOKEN manquant", months: [] }, { status: 503 });
  }

  try {
    // 1. Récupérer les ad accounts
    const accountsRes = await fetch(
      `${META_API}/me/adaccounts?fields=id,name&access_token=${accessToken}`
    );
    const accountsData = await accountsRes.json();

    if (accountsData.error) {
      return NextResponse.json({ error: accountsData.error.message, months: [] }, { status: 400 });
    }

    const accounts = accountsData.data || [];
    if (accounts.length === 0) {
      return NextResponse.json({ months: [], error: "Aucun compte publicitaire trouvé" });
    }

    // 2. Récupérer les insights mensuels sur 12 mois pour chaque compte
    const now = new Date();
    const since = new Date(now.getFullYear() - 1, now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const until = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const allMonths: Record<string, { spend: number; impressions: number; clicks: number; conversions: number }> = {};

    for (const account of accounts) {
      const insightsUrl =
        `${META_API}/${account.id}/insights` +
        `?fields=spend,impressions,clicks,actions` +
        `&time_range=${JSON.stringify({ since, until })}` +
        `&time_increment=monthly` +
        `&limit=50` +
        `&access_token=${accessToken}`;

      const insightsRes = await fetch(insightsUrl);
      const insightsData = await insightsRes.json();

      if (insightsData.error) {
        console.error("Meta monthly insights error:", insightsData.error);
        continue;
      }

      for (const row of insightsData.data || []) {
        // date_start est au format YYYY-MM-DD
        const monthKey = row.date_start.substring(0, 7); // "2025-04"
        if (!allMonths[monthKey]) {
          allMonths[monthKey] = { spend: 0, impressions: 0, clicks: 0, conversions: 0 };
        }
        allMonths[monthKey].spend += parseFloat(row.spend || "0");
        allMonths[monthKey].impressions += parseInt(row.impressions || "0", 10);
        allMonths[monthKey].clicks += parseInt(row.clicks || "0", 10);

        // Extraire les conversions (leads, purchases, etc.)
        const actions = row.actions || [];
        for (const action of actions) {
          if (
            ["lead", "offsite_conversion.fb_pixel_lead", "onsite_conversion.lead_grouped", "purchase"].includes(
              action.action_type
            )
          ) {
            allMonths[monthKey].conversions += parseInt(action.value || "0", 10);
          }
        }
      }
    }

    // 3. Construire le tableau trié par mois
    const months = Object.keys(allMonths)
      .sort()
      .map((key) => ({
        month: key,
        ...allMonths[key],
        spend: Math.round(allMonths[key].spend * 100) / 100,
      }));

    const result = {
      months,
      _cache: { generatedAt: new Date().toISOString() },
    };

    cache = { data: result, timestamp: Date.now() };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/meta/monthly-spend error:", error);
    return NextResponse.json({ error: error.message, months: [] }, { status: 500 });
  }
}
