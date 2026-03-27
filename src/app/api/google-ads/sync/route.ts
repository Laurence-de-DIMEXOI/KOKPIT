import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

// ─── Env vars requis ───────────────────────────────────────────────────────
// GOOGLE_ADS_DEVELOPER_TOKEN  : Google Ads → Outils → Centre API
// GOOGLE_ADS_CUSTOMER_ID      : ID compte sans tirets (ex: 1234567890)
// GOOGLE_CLIENT_ID            : Google Cloud Console → OAuth 2.0
// GOOGLE_CLIENT_SECRET        : idem
// GOOGLE_REFRESH_TOKEN        : via OAuth Playground (accounts.google.com/o/oauth2/playground)
// ──────────────────────────────────────────────────────────────────────────

const GADS_BASE = "https://googleads.googleapis.com/v20";

const PERIOD_MAP: Record<string, string> = {
  today:      "TODAY",
  yesterday:  "YESTERDAY",
  last_7d:    "LAST_7_DAYS",
  last_30d:   "LAST_30_DAYS",
  this_month: "THIS_MONTH",
  last_month: "LAST_MONTH",
  this_year:  "THIS_YEAR",
  last_year:  "LAST_YEAR",
  maximum:    "ALL_TIME",
};

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`OAuth error: ${data.error_description || JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function gadsSearch(accessToken: string, customerId: string, query: string) {
  const res = await fetch(`${GADS_BASE}/customers/${customerId}/googleAds:search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Ads API ${res.status}: ${err.substring(0, 300)}`);
  }
  const data = await res.json();
  return data.results || [];
}

function dateClause(period: string, since?: string, until?: string): string {
  if (period === "custom" && since && until) {
    return `AND segments.date BETWEEN '${since}' AND '${until}'`;
  }
  const gaql = PERIOD_MAP[period] || "THIS_MONTH";
  if (gaql === "ALL_TIME") return "";
  return `AND segments.date DURING ${gaql}`;
}

function micros(v: any): number {
  return Math.round((Number(v || 0) / 1_000_000) * 100) / 100;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const required = ["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CUSTOMER_ID", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"];
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length > 0) {
      return NextResponse.json({
        error: "Variables d'environnement manquantes",
        missing,
        help: "Configure ces variables dans Vercel → Settings → Environment Variables",
      }, { status: 400 });
    }

    const { searchParams } = req.nextUrl;
    const period = searchParams.get("period") || "this_month";
    const since = searchParams.get("since") || "";
    const until = searchParams.get("until") || "";
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!;

    const accessToken = await getAccessToken();
    const dc = dateClause(period, since, until);

    // ── 1. Campagnes ──────────────────────────────────────────────────────
    const campRows = await gadsSearch(accessToken, customerId, `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign.start_date,
        campaign.end_date,
        campaign_budget.amount_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc,
        metrics.cost_per_conversion
      FROM campaign
      WHERE campaign.status != 'REMOVED'
      ${dc}
      ORDER BY metrics.cost_micros DESC
    `);

    // ── 2. Groupes d'annonces ──────────────────────────────────────────────
    const groupRows = await gadsSearch(accessToken, customerId, `
      SELECT
        ad_group.id,
        ad_group.name,
        ad_group.status,
        campaign.id,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc
      FROM ad_group
      WHERE campaign.status != 'REMOVED'
      ${dc}
    `);

    // ── 3. Annonces ───────────────────────────────────────────────────────
    const adRows = await gadsSearch(accessToken, customerId, `
      SELECT
        ad_group_ad.ad.id,
        ad_group_ad.ad.name,
        ad_group_ad.status,
        ad_group_ad.ad.final_urls,
        ad_group.id,
        campaign.id,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc
      FROM ad_group_ad
      WHERE campaign.status != 'REMOVED'
      ${dc}
    `);

    // ── Mapping ───────────────────────────────────────────────────────────
    const statusMap: Record<string, string> = { ENABLED: "ACTIVE", PAUSED: "PAUSED", REMOVED: "DELETED" };

    // Index groupes par campagne
    const groupsByCamp = new Map<string, any[]>();
    for (const r of groupRows) {
      const cid = r.campaign?.id;
      if (!cid) continue;
      if (!groupsByCamp.has(cid)) groupsByCamp.set(cid, []);
      groupsByCamp.get(cid)!.push({
        id: r.adGroup?.id,
        name: r.adGroup?.name,
        status: statusMap[r.adGroup?.status] || "PAUSED",
        insights: {
          impressions: Number(r.metrics?.impressions || 0),
          clicks: Number(r.metrics?.clicks || 0),
          spend: micros(r.metrics?.costMicros),
          conversions: Number(r.metrics?.conversions || 0),
          ctr: Math.round((Number(r.metrics?.ctr || 0) * 100) * 100) / 100,
          cpc: micros(r.metrics?.averageCpc),
        },
        ads: [],
      });
    }

    // Index annonces par groupe
    const adsByGroup = new Map<string, any[]>();
    for (const r of adRows) {
      const gid = r.adGroup?.id;
      if (!gid) continue;
      if (!adsByGroup.has(gid)) adsByGroup.set(gid, []);
      adsByGroup.get(gid)!.push({
        id: r.adGroupAd?.ad?.id,
        name: r.adGroupAd?.ad?.name || `Annonce ${r.adGroupAd?.ad?.id}`,
        status: statusMap[r.adGroupAd?.status] || "PAUSED",
        finalUrl: r.adGroupAd?.ad?.finalUrls?.[0] || "",
        insights: {
          impressions: Number(r.metrics?.impressions || 0),
          clicks: Number(r.metrics?.clicks || 0),
          spend: micros(r.metrics?.costMicros),
          conversions: Number(r.metrics?.conversions || 0),
          ctr: Math.round((Number(r.metrics?.ctr || 0) * 100) * 100) / 100,
          cpc: micros(r.metrics?.averageCpc),
        },
      });
    }

    // Assembler + sync DB
    const campaigns = [];
    let synced = 0;

    for (const r of campRows) {
      const cid = String(r.campaign?.id);
      const groups = (groupsByCamp.get(cid) || []).map((g: any) => ({
        ...g,
        ads: adsByGroup.get(String(g.id)) || [],
      }));

      const camp = {
        id: cid,
        name: r.campaign?.name || "",
        status: statusMap[r.campaign?.status] || "PAUSED",
        type: r.campaign?.advertisingChannelType || "",
        startDate: r.campaign?.startDate || null,
        endDate: r.campaign?.endDate || null,
        dailyBudget: micros(r.campaignBudget?.amountMicros),
        insights: {
          impressions: Number(r.metrics?.impressions || 0),
          clicks: Number(r.metrics?.clicks || 0),
          spend: micros(r.metrics?.costMicros),
          conversions: Number(r.metrics?.conversions || 0),
          ctr: Math.round((Number(r.metrics?.ctr || 0) * 100) * 100) / 100,
          cpc: micros(r.metrics?.averageCpc),
          costPerConversion: micros(r.metrics?.costPerConversion),
        },
        adsets: groups,
      };

      campaigns.push(camp);

      // Sync DB
      try {
        const googleId = `google_${cid}`;
        const metaInsights = {
          spend: camp.insights.spend,
          impressions: camp.insights.impressions,
          clicks: camp.insights.clicks,
          conversions: camp.insights.conversions,
          cpc: camp.insights.cpc,
          ctr: camp.insights.ctr,
          budget: camp.dailyBudget,
          status: camp.status,
          objective: camp.type,
          adsetsCount: groups.length,
          adsCount: groups.reduce((s: number, g: any) => s + g.ads.length, 0),
          adsets: groups.map((g: any) => ({
            id: g.id, name: g.name, status: g.status, insights: g.insights,
            ads: g.ads.map((a: any) => ({ id: a.id, name: a.name, status: a.status, insights: a.insights })),
          })),
          period,
          syncedAt: new Date().toISOString(),
          source: "google_ads_api",
        };

        const existing = await prisma.campagne.findFirst({ where: { metaCampaignId: googleId } });
        if (existing) {
          await prisma.campagne.update({
            where: { id: existing.id },
            data: {
              nom: camp.name,
              coutTotal: camp.insights.spend,
              dateDebut: camp.startDate ? new Date(camp.startDate) : undefined,
              dateFin: camp.endDate ? new Date(camp.endDate) : undefined,
              actif: camp.status === "ACTIVE",
              metaInsights,
            },
          });
        } else {
          await prisma.campagne.create({
            data: {
              nom: camp.name,
              plateforme: "GOOGLE",
              coutTotal: camp.insights.spend,
              dateDebut: camp.startDate ? new Date(camp.startDate) : undefined,
              dateFin: camp.endDate ? new Date(camp.endDate) : undefined,
              metaCampaignId: googleId,
              actif: camp.status === "ACTIVE",
              metaInsights,
            },
          });
        }
        synced++;
      } catch (err) {
        console.error(`Sync Google campaign ${cid}:`, err);
      }
    }

    const totalSpend = campaigns.reduce((s, c) => s + c.insights.spend, 0);
    const totalImpressions = campaigns.reduce((s, c) => s + c.insights.impressions, 0);
    const totalClicks = campaigns.reduce((s, c) => s + c.insights.clicks, 0);
    const totalConversions = campaigns.reduce((s, c) => s + c.insights.conversions, 0);

    return NextResponse.json({
      success: true,
      campaigns,
      kpis: {
        totalCampaigns: campaigns.length,
        totalAdGroups: groupRows.length,
        totalAds: adRows.length,
        totalSpend: Math.round(totalSpend * 100) / 100,
        totalImpressions,
        totalClicks,
        totalConversions: Math.round(totalConversions * 10) / 10,
      },
      synced,
      period,
    });
  } catch (error: any) {
    console.error("Google Ads sync error:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
