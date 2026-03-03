import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const META_API_VERSION = "v19.0";
const META_API_URL = `https://graph.facebook.com/${META_API_VERSION}`;

interface FetchResult {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED" | "DELETED";
  channel: "META" | "GOOGLE_ADS" | "OFFLINE" | "OTHER";
  spend?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  roas?: number;
  budget?: number;
  startDate?: string;
  endDate?: string;
  cpc?: number;
  ctr?: number;
  metaCampaignId: string;
  metaAdsetId?: string;
  metaAdId?: string;
}

async function fetchMetaCampaigns(accessToken: string): Promise<FetchResult[]> {
  try {
    // 1. Récupérer les comptes publicitaires
    const accountsRes = await fetch(
      `${META_API_URL}/me/adaccounts?fields=id,name,account_id&access_token=${accessToken}`
    );

    const accountsText = await accountsRes.text();
    if (!accountsRes.ok) {
      console.error("Meta API accounts response:", accountsText);
      throw new Error(`Meta API error: ${accountsRes.statusText} - ${accountsText}`);
    }

    const accountsData = JSON.parse(accountsText);
    const accounts = accountsData.data || [];

    if (accounts.length === 0) {
      console.warn("Aucun compte publicitaire trouvé");
      return [];
    }

    const results: FetchResult[] = [];

    for (const account of accounts) {
      const accountId = account.id;

      // 2. Récupérer les campagnes (métadonnées seulement, PAS les insights inline)
      const campaignsRes = await fetch(
        `${META_API_URL}/${accountId}/campaigns?fields=id,name,status,daily_budget,lifetime_budget,start_time,stop_time&limit=50&access_token=${accessToken}`
      );
      if (!campaignsRes.ok) {
        console.error("Erreur campagnes:", await campaignsRes.text());
        continue;
      }

      const campaignsData = await campaignsRes.json();
      const metaCampaigns = campaignsData.data || [];

      // 3. Pour chaque campagne, récupérer les insights avec time_range lifetime
      //    ET les insights au niveau adset pour fallback
      for (const campaign of metaCampaigns) {
        let spend = 0;
        let impressions = 0;
        let clicks = 0;
        let conversions = 0;

        // 3a. Insights au niveau campagne avec time_range (toute la durée)
        const timeRange = JSON.stringify({
          since: "2024-01-01",
          until: new Date().toISOString().split("T")[0],
        });

        try {
          const insightsRes = await fetch(
            `${META_API_URL}/${campaign.id}/insights?fields=spend,impressions,clicks,actions,date_start,date_stop&time_range=${encodeURIComponent(timeRange)}&access_token=${accessToken}`
          );

          if (insightsRes.ok) {
            const insightsData = await insightsRes.json();
            const insight = insightsData.data?.[0];

            if (insight) {
              spend = insight.spend ? parseFloat(insight.spend) : 0;
              impressions = insight.impressions ? parseInt(insight.impressions) : 0;
              clicks = insight.clicks ? parseInt(insight.clicks) : 0;

              // Conversions : chercher purchase, lead, complete_registration, etc.
              if (insight.actions) {
                for (const action of insight.actions) {
                  if (
                    action.action_type === "purchase" ||
                    action.action_type === "lead" ||
                    action.action_type === "complete_registration" ||
                    action.action_type === "offsite_conversion.fb_pixel_purchase"
                  ) {
                    conversions += parseInt(action.value) || 0;
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error(`Insights campagne ${campaign.id}:`, err);
        }

        // 3b. Si pas de données au niveau campagne, essayer au niveau ad sets
        if (spend === 0 && impressions === 0) {
          try {
            const adsetsRes = await fetch(
              `${META_API_URL}/${campaign.id}/adsets?fields=id,name,insights.time_range(${encodeURIComponent(timeRange)}).fields(spend,impressions,clicks,actions)&limit=50&access_token=${accessToken}`
            );

            if (adsetsRes.ok) {
              const adsetsData = await adsetsRes.json();
              const adsets = adsetsData.data || [];

              for (const adset of adsets) {
                const adsetInsight = adset.insights?.data?.[0];
                if (adsetInsight) {
                  spend += adsetInsight.spend ? parseFloat(adsetInsight.spend) : 0;
                  impressions += adsetInsight.impressions ? parseInt(adsetInsight.impressions) : 0;
                  clicks += adsetInsight.clicks ? parseInt(adsetInsight.clicks) : 0;

                  if (adsetInsight.actions) {
                    for (const action of adsetInsight.actions) {
                      if (
                        action.action_type === "purchase" ||
                        action.action_type === "lead" ||
                        action.action_type === "complete_registration"
                      ) {
                        conversions += parseInt(action.value) || 0;
                      }
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.error(`Adsets campagne ${campaign.id}:`, err);
          }
        }

        // 3c. Si toujours rien, essayer au niveau ads directement
        if (spend === 0 && impressions === 0) {
          try {
            const adsRes = await fetch(
              `${META_API_URL}/${campaign.id}/ads?fields=id,insights.time_range(${encodeURIComponent(timeRange)}).fields(spend,impressions,clicks,actions)&limit=50&access_token=${accessToken}`
            );

            if (adsRes.ok) {
              const adsData = await adsRes.json();
              const ads = adsData.data || [];

              for (const ad of ads) {
                const adInsight = ad.insights?.data?.[0];
                if (adInsight) {
                  spend += adInsight.spend ? parseFloat(adInsight.spend) : 0;
                  impressions += adInsight.impressions ? parseInt(adInsight.impressions) : 0;
                  clicks += adInsight.clicks ? parseInt(adInsight.clicks) : 0;

                  if (adInsight.actions) {
                    for (const action of adInsight.actions) {
                      if (
                        action.action_type === "purchase" ||
                        action.action_type === "lead" ||
                        action.action_type === "complete_registration"
                      ) {
                        conversions += parseInt(action.value) || 0;
                      }
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.error(`Ads campagne ${campaign.id}:`, err);
          }
        }

        // 4. Calculer les métriques dérivées
        const cpc = clicks > 0 ? spend / clicks : 0;
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const roas = spend > 0 && conversions > 0 ? (conversions * 50) / spend : 0;

        // Budget en centimes → euros (Meta envoie en centimes)
        const rawBudget = campaign.daily_budget || campaign.lifetime_budget || 0;
        const budget = rawBudget > 1000 ? rawBudget / 100 : rawBudget;

        results.push({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          channel: "META",
          metaCampaignId: campaign.id,
          spend: parseFloat(spend.toFixed(2)),
          impressions,
          clicks,
          conversions,
          roas: parseFloat(roas.toFixed(2)),
          budget: parseFloat(budget.toFixed(2)),
          startDate: campaign.start_time,
          endDate: campaign.stop_time,
          cpc: parseFloat(cpc.toFixed(2)),
          ctr: parseFloat(ctr.toFixed(2)),
        });
      }
    }

    return results;
  } catch (error: any) {
    console.error("Erreur lors de la récupération des campagnes Meta:", error);
    throw error;
  }
}

// GET /api/meta/campaigns — Récupérer et synchroniser les campagnes
export async function GET(request: NextRequest) {
  try {
    const accessToken = process.env.META_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { error: "META_ACCESS_TOKEN non configuré" },
        { status: 400 }
      );
    }

    const campaigns = await fetchMetaCampaigns(accessToken);

    // Synchroniser dans la base de données
    for (const campaign of campaigns) {
      const existing = await prisma.campagne.findFirst({
        where: { metaCampaignId: campaign.metaCampaignId },
      });

      const metaInsights = {
        spend: campaign.spend || 0,
        impressions: campaign.impressions || 0,
        clicks: campaign.clicks || 0,
        conversions: campaign.conversions || 0,
        roas: campaign.roas || 0,
        cpc: campaign.cpc || 0,
        ctr: campaign.ctr || 0,
        budget: campaign.budget || 0,
        status: campaign.status,
        syncedAt: new Date().toISOString(),
      };

      if (existing) {
        await prisma.campagne.update({
          where: { id: existing.id },
          data: {
            nom: campaign.name,
            coutTotal: campaign.spend || 0,
            dateDebut: campaign.startDate ? new Date(campaign.startDate) : undefined,
            dateFin: campaign.endDate ? new Date(campaign.endDate) : undefined,
            actif: campaign.status === "ACTIVE",
            metaInsights,
          },
        });
      } else {
        await prisma.campagne.create({
          data: {
            nom: campaign.name,
            plateforme: "META",
            coutTotal: campaign.spend || 0,
            dateDebut: campaign.startDate ? new Date(campaign.startDate) : undefined,
            dateFin: campaign.endDate ? new Date(campaign.endDate) : undefined,
            metaCampaignId: campaign.metaCampaignId,
            metaAdsetId: campaign.metaAdsetId,
            metaAdId: campaign.metaAdId,
            actif: campaign.status === "ACTIVE",
            metaInsights,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      campaigns,
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
