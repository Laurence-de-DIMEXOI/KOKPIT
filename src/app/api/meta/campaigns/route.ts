import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const META_API_VERSION = "v19.0";
const META_API_URL = `https://graph.instagram.com/${META_API_VERSION}`;

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  daily_budget?: number;
  lifetime_budget?: number;
  start_time?: string;
  stop_time?: string;
  special_ad_categories?: string[];
  insights?: {
    data: Array<{
      spend: string;
      impressions: string;
      clicks: string;
      actions?: Array<{
        action_type: string;
        value: string;
      }>;
    }>;
  };
}

interface FetchResult {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED" | "DELETED";
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
    // Récupérer les comptes publicitaires - utiliser l'endpoint correct pour le token utilisateur
    const accountsRes = await fetch(
      `${META_API_URL}/me/adaccounts?fields=id,name,account_id&access_token=${accessToken}`
    );

    const accountsText = await accountsRes.text();

    if (!accountsRes.ok) {
      console.error("Meta API response:", accountsText);
      throw new Error(`Meta API error: ${accountsRes.statusText} - ${accountsText}`);
    }

    const accountsData = JSON.parse(accountsText);
    const accounts = accountsData.data || [];

    if (accounts.length === 0) {
      console.warn("Aucun compte publicitaire trouvé");
      return [];
    }

    const campaigns: FetchResult[] = [];

    // Pour chaque compte publicitaire
    for (const account of accounts) {
      const accountId = account.id;

      // Récupérer les campagnes
      const campaignsRes = await fetch(
        `${META_API_URL}/${accountId}/campaigns?fields=id,name,status,daily_budget,lifetime_budget,start_time,stop_time,insights.fields(spend,impressions,clicks,actions)&access_token=${accessToken}`
      );

      if (!campaignsRes.ok) continue;

      const campaignsData = await campaignsRes.json();
      const metaCampaigns = campaignsData.data || [];

      for (const campaign of metaCampaigns) {
        const insights = campaign.insights?.data?.[0];

        const spend = insights?.spend ? parseFloat(insights.spend) : 0;
        const impressions = insights?.impressions ? parseInt(insights.impressions) : 0;
        const clicks = insights?.clicks ? parseInt(insights.clicks) : 0;

        // Compter les conversions (peuvent être de plusieurs types)
        let conversions = 0;
        if (insights?.actions) {
          const purchaseAction = insights.actions.find(
            (a: any) => a.action_type === "purchase"
          );
          conversions = purchaseAction ? parseInt(purchaseAction.value) : 0;
        }

        // Calculer les métriques
        const cpc = clicks > 0 ? spend / clicks : 0;
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const roas = spend > 0 ? (conversions * 50) / spend : 0; // Estimation (ajuste selon ton AOV)

        campaigns.push({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          metaCampaignId: campaign.id,
          spend,
          impressions,
          clicks,
          conversions,
          roas: parseFloat(roas.toFixed(2)),
          budget: campaign.daily_budget || campaign.lifetime_budget,
          startDate: campaign.start_time,
          endDate: campaign.stop_time,
          cpc: parseFloat(cpc.toFixed(2)),
          ctr: parseFloat(ctr.toFixed(2)),
        });
      }
    }

    return campaigns;
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

    // Récupérer les campagnes depuis Meta
    const campaigns = await fetchMetaCampaigns(accessToken);

    // Synchroniser dans la base de données
    for (const campaign of campaigns) {
      // Find existing campaign by metaCampaignId
      const existing = await prisma.campagne.findFirst({
        where: { metaCampaignId: campaign.metaCampaignId },
      });

      if (existing) {
        // Update existing campaign
        await prisma.campagne.update({
          where: { id: existing.id },
          data: {
            nom: campaign.name,
            coutTotal: campaign.spend || 0,
            dateDebut: campaign.startDate ? new Date(campaign.startDate) : undefined,
            dateFin: campaign.endDate ? new Date(campaign.endDate) : undefined,
            actif: campaign.status === "ACTIVE",
          },
        });
      } else {
        // Create new campaign
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
