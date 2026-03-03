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
  previewUrl?: string;
  insights: MetaInsight;
}

interface MetaAdSet {
  id: string;
  name: string;
  status: string;
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

const TIME_RANGE = JSON.stringify({
  since: "2024-01-01",
  until: new Date().toISOString().split("T")[0],
});

const INSIGHTS_FIELDS =
  "spend,impressions,clicks,actions,cost_per_action_type,cpc,ctr";

function parseInsight(data: any): MetaInsight {
  if (!data)
    return {
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      cpc: 0,
      ctr: 0,
      costPerResult: 0,
      actions: {},
    };

  const spend = parseFloat(data.spend || "0");
  const impressions = parseInt(data.impressions || "0", 10);
  const clicks = parseInt(data.clicks || "0", 10);
  const cpc = parseFloat(data.cpc || "0");
  const ctr = parseFloat(data.ctr || "0");

  // Parse toutes les actions
  const actions: Record<string, number> = {};
  let conversions = 0;

  if (data.actions) {
    for (const action of data.actions) {
      const val = parseInt(action.value || "0", 10);
      actions[action.action_type] = val;

      // Compter les conversions (lead, purchase, etc.)
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

  // Cost per result
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
  // Meta envoie en centimes si > 1000
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

// ===== FETCH HIERARCHY =====

async function fetchFullHierarchy(
  accessToken: string
): Promise<MetaCampaign[]> {
  // 1. Comptes publicitaires
  const accountsData = await metaFetch(
    `${META_API_URL}/me/adaccounts?fields=id,name,account_id`,
    accessToken
  );

  if (!accountsData?.data?.length) return [];

  const allCampaigns: MetaCampaign[] = [];

  for (const account of accountsData.data) {
    const accountId = account.id;

    // 2. Campagnes
    const campaignsData = await metaFetch(
      `${META_API_URL}/${accountId}/campaigns?fields=id,name,status,objective,buying_type,daily_budget,lifetime_budget,start_time,stop_time&limit=50`,
      accessToken
    );

    if (!campaignsData?.data) continue;

    for (const camp of campaignsData.data) {
      // 3. Insights campagne
      const campInsightsData = await metaFetch(
        `${META_API_URL}/${camp.id}/insights?fields=${INSIGHTS_FIELDS}&time_range=${encodeURIComponent(TIME_RANGE)}`,
        accessToken
      );
      const campInsights = parseInsight(campInsightsData?.data?.[0]);

      // 4. Ad Sets de cette campagne
      const adsetsData = await metaFetch(
        `${META_API_URL}/${camp.id}/adsets?fields=id,name,status,daily_budget,lifetime_budget,targeting,optimization_goal&limit=50`,
        accessToken
      );

      const adsets: MetaAdSet[] = [];

      if (adsetsData?.data) {
        for (const adset of adsetsData.data) {
          // 5. Insights adset
          const adsetInsightsData = await metaFetch(
            `${META_API_URL}/${adset.id}/insights?fields=${INSIGHTS_FIELDS}&time_range=${encodeURIComponent(TIME_RANGE)}`,
            accessToken
          );
          const adsetInsights = parseInsight(adsetInsightsData?.data?.[0]);

          // 6. Ads de cet adset
          const adsData = await metaFetch(
            `${META_API_URL}/${adset.id}/ads?fields=id,name,status,creative{id,thumbnail_url,effective_object_story_id}&limit=50`,
            accessToken
          );

          const ads: MetaAd[] = [];

          if (adsData?.data) {
            for (const ad of adsData.data) {
              // 7. Insights ad
              const adInsightsData = await metaFetch(
                `${META_API_URL}/${ad.id}/insights?fields=${INSIGHTS_FIELDS}&time_range=${encodeURIComponent(TIME_RANGE)}`,
                accessToken
              );
              const adInsights = parseInsight(adInsightsData?.data?.[0]);

              ads.push({
                id: ad.id,
                name: ad.name,
                status: ad.status,
                creativeId: ad.creative?.id,
                thumbnailUrl: ad.creative?.thumbnail_url || null,
                insights: adInsights,
              });
            }
          }

          // Targeting résumé
          let targetingSummary = "";
          if (adset.targeting) {
            const t = adset.targeting;
            const parts = [];
            if (t.age_min || t.age_max)
              parts.push(`${t.age_min || "?"}-${t.age_max || "?"}ans`);
            if (t.geo_locations?.countries)
              parts.push(t.geo_locations.countries.join(", "));
            if (t.genders?.length)
              parts.push(
                t.genders.includes(1)
                  ? "Hommes"
                  : t.genders.includes(2)
                  ? "Femmes"
                  : "Tous"
              );
            targetingSummary = parts.join(" · ");
          }

          adsets.push({
            id: adset.id,
            name: adset.name,
            status: adset.status,
            dailyBudget: parseBudget(adset.daily_budget),
            lifetimeBudget: parseBudget(adset.lifetime_budget),
            targeting: targetingSummary || undefined,
            optimization: adset.optimization_goal || undefined,
            insights: adsetInsights,
            ads,
          });
        }
      }

      // Si les insights campagne sont vides, agréger depuis les adsets
      if (campInsights.spend === 0 && adsets.length > 0) {
        campInsights.spend = adsets.reduce(
          (s, a) => s + a.insights.spend,
          0
        );
        campInsights.impressions = adsets.reduce(
          (s, a) => s + a.insights.impressions,
          0
        );
        campInsights.clicks = adsets.reduce(
          (s, a) => s + a.insights.clicks,
          0
        );
        campInsights.conversions = adsets.reduce(
          (s, a) => s + a.insights.conversions,
          0
        );
        if (campInsights.clicks > 0)
          campInsights.cpc = campInsights.spend / campInsights.clicks;
        if (campInsights.impressions > 0)
          campInsights.ctr =
            (campInsights.clicks / campInsights.impressions) * 100;
      }

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
        insights: campInsights,
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

    const campaigns = await fetchFullHierarchy(accessToken);

    // Sync en base (au niveau campagne pour le cache)
    for (const campaign of campaigns) {
      try {
        const metaInsights = {
          spend: campaign.insights.spend,
          impressions: campaign.insights.impressions,
          clicks: campaign.insights.clicks,
          conversions: campaign.insights.conversions,
          cpc: campaign.insights.cpc,
          ctr: campaign.insights.ctr,
          budget:
            campaign.dailyBudget || campaign.lifetimeBudget || 0,
          status: campaign.status,
          objective: campaign.objective,
          adsetsCount: campaign.adsets.length,
          adsCount: campaign.adsets.reduce(
            (s, a) => s + a.ads.length,
            0
          ),
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
    const totalSpend = campaigns.reduce(
      (s, c) => s + c.insights.spend,
      0
    );
    const totalImpressions = campaigns.reduce(
      (s, c) => s + c.insights.impressions,
      0
    );
    const totalClicks = campaigns.reduce(
      (s, c) => s + c.insights.clicks,
      0
    );
    const totalConversions = campaigns.reduce(
      (s, c) => s + c.insights.conversions,
      0
    );

    return NextResponse.json({
      success: true,
      campaigns,
      kpis: {
        totalCampaigns: campaigns.length,
        totalAdSets: campaigns.reduce(
          (s, c) => s + c.adsets.length,
          0
        ),
        totalAds: campaigns.reduce(
          (s, c) =>
            s + c.adsets.reduce((ss, a) => ss + a.ads.length, 0),
          0
        ),
        totalSpend: Math.round(totalSpend * 100) / 100,
        totalImpressions,
        totalClicks,
        totalConversions,
        globalCTR:
          totalImpressions > 0
            ? Math.round(
                (totalClicks / totalImpressions) * 10000
              ) / 100
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
