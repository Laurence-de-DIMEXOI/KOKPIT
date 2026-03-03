import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const META_API_VERSION = "v19.0";
const META_API_URL = `https://graph.facebook.com/${META_API_VERSION}`;

// ===== TYPES =====

interface MetaInsight {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cpc: number;
  ctr: number;
  costPerResult: number;
  actions: Record<string, number>;
}

interface MetaAd {
  id: string;
  name: string;
  status: string;
  creativeId?: string;
  thumbnailUrl?: string;
  insights: MetaInsight;
}

interface MetaAdSet {
  id: string;
  name: string;
  status: string;
  campaignId: string;
  dailyBudget: number;
  lifetimeBudget: number;
  targeting?: string;
  optimization?: string;
  insights: MetaInsight;
  ads: MetaAd[];
}

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  buyingType?: string;
  dailyBudget: number;
  lifetimeBudget: number;
  startDate?: string;
  endDate?: string;
  insights: MetaInsight;
  adsets: MetaAdSet[];
}

// ===== HELPERS =====

// Plage large pour couvrir toutes les campagnes (même 2023)
const TIME_RANGE = JSON.stringify({
  since: "2023-01-01",
  until: new Date().toISOString().split("T")[0],
});

const INSIGHTS_FIELDS =
  "spend,impressions,clicks,actions,cost_per_action_type,cpc,ctr";

const EMPTY_INSIGHT: MetaInsight = {
  spend: 0,
  impressions: 0,
  clicks: 0,
  conversions: 0,
  cpc: 0,
  ctr: 0,
  costPerResult: 0,
  actions: {},
};

function parseInsight(data: any): MetaInsight {
  if (!data) return { ...EMPTY_INSIGHT };

  const spend = parseFloat(data.spend || "0");
  const impressions = parseInt(data.impressions || "0", 10);
  const clicks = parseInt(data.clicks || "0", 10);
  const cpc = parseFloat(data.cpc || "0");
  const ctr = parseFloat(data.ctr || "0");

  const actions: Record<string, number> = {};
  let conversions = 0;

  if (data.actions) {
    for (const action of data.actions) {
      const val = parseInt(action.value || "0", 10);
      actions[action.action_type] = val;

      if (
        [
          "lead",
          "purchase",
          "complete_registration",
          "offsite_conversion.fb_pixel_purchase",
          "offsite_conversion.fb_pixel_lead",
          "onsite_conversion.messaging_first_reply",
          "contact_total",
          "submit_application_total",
        ].includes(action.action_type)
      ) {
        conversions += val;
      }
    }
  }

  let costPerResult = 0;
  if (data.cost_per_action_type) {
    for (const cpa of data.cost_per_action_type) {
      if (cpa.action_type === "lead" || cpa.action_type === "purchase") {
        costPerResult = parseFloat(cpa.value || "0");
        break;
      }
    }
  }

  return { spend, impressions, clicks, conversions, cpc, ctr, costPerResult, actions };
}

function parseBudget(raw: any): number {
  if (!raw) return 0;
  const val = parseFloat(raw);
  return val > 1000 ? val / 100 : val;
}

async function metaFetch(url: string, accessToken: string): Promise<any> {
  const separator = url.includes("?") ? "&" : "?";
  const res = await fetch(`${url}${separator}access_token=${accessToken}`);
  if (!res.ok) {
    const text = await res.text();
    console.error(`Meta API error: ${res.status}`, text);
    return null;
  }
  return res.json();
}

// Fetch all pages of a paginated Meta endpoint
async function metaFetchAll(url: string, accessToken: string): Promise<any[]> {
  const all: any[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const data = await metaFetch(nextUrl, accessToken);
    if (!data?.data) break;
    all.push(...data.data);
    nextUrl = data.paging?.next || null;
    // Safety limit
    if (all.length > 500) break;
  }

  return all;
}

// ===== BATCH FETCH (optimized: ~6 requests instead of 200+) =====

async function fetchBatchHierarchy(
  accessToken: string
): Promise<MetaCampaign[]> {
  // 1. Get ad accounts
  const accountsData = await metaFetch(
    `${META_API_URL}/me/adaccounts?fields=id,name,account_id`,
    accessToken
  );

  if (!accountsData?.data?.length) return [];

  const allCampaigns: MetaCampaign[] = [];

  for (const account of accountsData.data) {
    const accountId = account.id;

    // 2. Fetch ALL data in parallel (batch approach)
    const [
      campaignsRaw,
      adsetsRaw,
      adsRaw,
      campaignInsightsRaw,
      adsetInsightsRaw,
      adInsightsRaw,
    ] = await Promise.all([
      // All campaigns
      metaFetchAll(
        `${META_API_URL}/${accountId}/campaigns?fields=id,name,status,objective,buying_type,daily_budget,lifetime_budget,start_time,stop_time&limit=100`,
        accessToken
      ),
      // All adsets
      metaFetchAll(
        `${META_API_URL}/${accountId}/adsets?fields=id,name,status,campaign_id,daily_budget,lifetime_budget,targeting,optimization_goal&limit=100`,
        accessToken
      ),
      // All ads with creative thumbnails
      metaFetchAll(
        `${META_API_URL}/${accountId}/ads?fields=id,name,status,adset_id,creative{id,thumbnail_url}&limit=100`,
        accessToken
      ),
      // All insights at campaign level (1 request)
      metaFetchAll(
        `${META_API_URL}/${accountId}/insights?fields=campaign_id,${INSIGHTS_FIELDS}&level=campaign&time_range=${encodeURIComponent(TIME_RANGE)}&limit=200`,
        accessToken
      ),
      // All insights at adset level (1 request)
      metaFetchAll(
        `${META_API_URL}/${accountId}/insights?fields=adset_id,${INSIGHTS_FIELDS}&level=adset&time_range=${encodeURIComponent(TIME_RANGE)}&limit=500`,
        accessToken
      ),
      // All insights at ad level (1 request)
      metaFetchAll(
        `${META_API_URL}/${accountId}/insights?fields=ad_id,${INSIGHTS_FIELDS}&level=ad&time_range=${encodeURIComponent(TIME_RANGE)}&limit=500`,
        accessToken
      ),
    ]);

    // 3. Index insights by ID for O(1) lookup
    const campaignInsightsMap = new Map<string, any>();
    for (const row of campaignInsightsRaw) {
      if (row.campaign_id) campaignInsightsMap.set(row.campaign_id, row);
    }

    const adsetInsightsMap = new Map<string, any>();
    for (const row of adsetInsightsRaw) {
      if (row.adset_id) adsetInsightsMap.set(row.adset_id, row);
    }

    const adInsightsMap = new Map<string, any>();
    for (const row of adInsightsRaw) {
      if (row.ad_id) adInsightsMap.set(row.ad_id, row);
    }

    // 4. Index adsets by campaign_id
    const adsetsByCampaign = new Map<string, any[]>();
    for (const adset of adsetsRaw) {
      const cid = adset.campaign_id;
      if (!adsetsByCampaign.has(cid)) adsetsByCampaign.set(cid, []);
      adsetsByCampaign.get(cid)!.push(adset);
    }

    // 5. Index ads by adset_id
    const adsByAdSet = new Map<string, any[]>();
    for (const ad of adsRaw) {
      const asid = ad.adset_id;
      if (!adsByAdSet.has(asid)) adsByAdSet.set(asid, []);
      adsByAdSet.get(asid)!.push(ad);
    }

    // 6. Build hierarchy
    for (const camp of campaignsRaw) {
      const campInsights = parseInsight(campaignInsightsMap.get(camp.id));

      const campAdsets = adsetsByCampaign.get(camp.id) || [];
      const adsets: MetaAdSet[] = [];

      for (const adset of campAdsets) {
        const adsetInsights = parseInsight(adsetInsightsMap.get(adset.id));

        const adsetAds = adsByAdSet.get(adset.id) || [];
        const ads: MetaAd[] = adsetAds.map((ad: any) => ({
          id: ad.id,
          name: ad.name,
          status: ad.status,
          creativeId: ad.creative?.id,
          thumbnailUrl: ad.creative?.thumbnail_url || null,
          insights: parseInsight(adInsightsMap.get(ad.id)),
        }));

        // Targeting summary
        let targetingSummary = "";
        if (adset.targeting) {
          const t = adset.targeting;
          const parts: string[] = [];
          if (t.age_min || t.age_max)
            parts.push(`${t.age_min || "?"}-${t.age_max || "?"}ans`);
          if (t.geo_locations?.countries)
            parts.push(t.geo_locations.countries.join(", "));
          if (t.genders?.length)
            parts.push(
              t.genders.includes(1) ? "Hommes" : t.genders.includes(2) ? "Femmes" : "Tous"
            );
          targetingSummary = parts.join(" · ");
        }

        adsets.push({
          id: adset.id,
          name: adset.name,
          status: adset.status,
          campaignId: camp.id,
          dailyBudget: parseBudget(adset.daily_budget),
          lifetimeBudget: parseBudget(adset.lifetime_budget),
          targeting: targetingSummary || undefined,
          optimization: adset.optimization_goal || undefined,
          insights: adsetInsights,
          ads,
        });
      }

      // If campaign insights empty, aggregate from adsets
      const finalInsights = campInsights.spend > 0
        ? campInsights
        : adsets.length > 0
        ? {
            spend: adsets.reduce((s, a) => s + a.insights.spend, 0),
            impressions: adsets.reduce((s, a) => s + a.insights.impressions, 0),
            clicks: adsets.reduce((s, a) => s + a.insights.clicks, 0),
            conversions: adsets.reduce((s, a) => s + a.insights.conversions, 0),
            cpc: adsets.reduce((s, a) => s + a.insights.clicks, 0) > 0
              ? adsets.reduce((s, a) => s + a.insights.spend, 0) / adsets.reduce((s, a) => s + a.insights.clicks, 0)
              : 0,
            ctr: adsets.reduce((s, a) => s + a.insights.impressions, 0) > 0
              ? (adsets.reduce((s, a) => s + a.insights.clicks, 0) / adsets.reduce((s, a) => s + a.insights.impressions, 0)) * 100
              : 0,
            costPerResult: 0,
            actions: {},
          }
        : campInsights;

      allCampaigns.push({
        id: camp.id,
        name: camp.name,
        status: camp.status,
        objective: camp.objective,
        buyingType: camp.buying_type,
        dailyBudget: parseBudget(camp.daily_budget),
        lifetimeBudget: parseBudget(camp.lifetime_budget),
        startDate: camp.start_time,
        endDate: camp.stop_time,
        insights: finalInsights,
        adsets,
      });
    }
  }

  return allCampaigns;
}

// ===== ROUTE =====

export async function GET(request: NextRequest) {
  try {
    const accessToken = process.env.META_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { error: "META_ACCESS_TOKEN non configuré" },
        { status: 400 }
      );
    }

    const campaigns = await fetchBatchHierarchy(accessToken);

    // Sync en base (stocker la hiérarchie complète dans metaInsights)
    for (const campaign of campaigns) {
      try {
        const metaInsights = {
          spend: campaign.insights.spend,
          impressions: campaign.insights.impressions,
          clicks: campaign.insights.clicks,
          conversions: campaign.insights.conversions,
          cpc: campaign.insights.cpc,
          ctr: campaign.insights.ctr,
          budget: campaign.dailyBudget || campaign.lifetimeBudget || 0,
          status: campaign.status,
          objective: campaign.objective,
          adsetsCount: campaign.adsets.length,
          adsCount: campaign.adsets.reduce((s, a) => s + a.ads.length, 0),
          // Store full hierarchy for cache
          adsets: campaign.adsets.map((as) => ({
            id: as.id,
            name: as.name,
            status: as.status,
            dailyBudget: as.dailyBudget,
            lifetimeBudget: as.lifetimeBudget,
            targeting: as.targeting,
            optimization: as.optimization,
            insights: {
              spend: as.insights.spend,
              impressions: as.insights.impressions,
              clicks: as.insights.clicks,
              conversions: as.insights.conversions,
              cpc: as.insights.cpc,
              ctr: as.insights.ctr,
            },
            ads: as.ads.map((ad) => ({
              id: ad.id,
              name: ad.name,
              status: ad.status,
              thumbnailUrl: ad.thumbnailUrl,
              insights: {
                spend: ad.insights.spend,
                impressions: ad.insights.impressions,
                clicks: ad.insights.clicks,
                conversions: ad.insights.conversions,
                cpc: ad.insights.cpc,
                ctr: ad.insights.ctr,
              },
            })),
          })),
          syncedAt: new Date().toISOString(),
        };

        const existing = await prisma.campagne.findFirst({
          where: { metaCampaignId: campaign.id },
        });

        if (existing) {
          await prisma.campagne.update({
            where: { id: existing.id },
            data: {
              nom: campaign.name,
              coutTotal: campaign.insights.spend,
              dateDebut: campaign.startDate
                ? new Date(campaign.startDate)
                : undefined,
              dateFin: campaign.endDate
                ? new Date(campaign.endDate)
                : undefined,
              actif: campaign.status === "ACTIVE",
              metaInsights,
            },
          });
        } else {
          await prisma.campagne.create({
            data: {
              nom: campaign.name,
              plateforme: "META",
              coutTotal: campaign.insights.spend,
              dateDebut: campaign.startDate
                ? new Date(campaign.startDate)
                : undefined,
              dateFin: campaign.endDate
                ? new Date(campaign.endDate)
                : undefined,
              metaCampaignId: campaign.id,
              actif: campaign.status === "ACTIVE",
              metaInsights,
            },
          });
        }
      } catch (err) {
        console.error(`Sync campagne ${campaign.id}:`, err);
      }
    }

    // KPIs globaux
    const totalSpend = campaigns.reduce((s, c) => s + c.insights.spend, 0);
    const totalImpressions = campaigns.reduce((s, c) => s + c.insights.impressions, 0);
    const totalClicks = campaigns.reduce((s, c) => s + c.insights.clicks, 0);
    const totalConversions = campaigns.reduce((s, c) => s + c.insights.conversions, 0);

    return NextResponse.json({
      success: true,
      campaigns,
      kpis: {
        totalCampaigns: campaigns.length,
        totalAdSets: campaigns.reduce((s, c) => s + c.adsets.length, 0),
        totalAds: campaigns.reduce(
          (s, c) => s + c.adsets.reduce((ss, a) => ss + a.ads.length, 0),
          0
        ),
        totalSpend: Math.round(totalSpend * 100) / 100,
        totalImpressions,
        totalClicks,
        totalConversions,
        globalCTR:
          totalImpressions > 0
            ? Math.round((totalClicks / totalImpressions) * 10000) / 100
            : 0,
        globalCPC:
          totalClicks > 0
            ? Math.round((totalSpend / totalClicks) * 100) / 100
            : 0,
      },
      synced: campaigns.length,
    });
  } catch (error: any) {
    console.error("GET /api/meta/campaigns error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
