import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Import Google Ads data from a public Google Sheet
// The sheet must be published as CSV (File > Share > Publish to web > CSV)
// URL format: https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&sheet={TAB_NAME}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (ch === "\n" || (ch === "\r" && text[i + 1] === "\n")) {
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f !== "")) rows.push(currentRow);
        currentRow = [];
        currentField = "";
        if (ch === "\r") i++;
      } else {
        currentField += ch;
      }
    }
  }
  // Last row
  currentRow.push(currentField.trim());
  if (currentRow.some((f) => f !== "")) rows.push(currentRow);

  return rows;
}

async function fetchSheetCSV(sheetId: string, tabName: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Impossible de lire le sheet "${tabName}": ${res.status}`);
  }
  const text = await res.text();
  return parseCSV(text);
}

export async function GET(request: NextRequest) {
  try {
    const sheetId = process.env.GOOGLE_ADS_SHEET_ID;
    if (!sheetId) {
      return NextResponse.json({
        error: "GOOGLE_ADS_SHEET_ID non configuré",
        help: "Ajoute GOOGLE_ADS_SHEET_ID dans les variables d'environnement Vercel. C'est l'ID du Google Sheet (la partie entre /d/ et /edit dans l'URL).",
      }, { status: 400 });
    }

    // Fetch all 3 tabs
    const [campaignsData, groupsData, adsData] = await Promise.all([
      fetchSheetCSV(sheetId, "Campagnes").catch(() => []),
      fetchSheetCSV(sheetId, "Groupes").catch(() => []),
      fetchSheetCSV(sheetId, "Annonces").catch(() => []),
    ]);

    // Parse campaigns (skip header row)
    const campaigns = campaignsData.slice(1).map((row) => ({
      campaignId: row[0] || "",
      name: row[1] || "",
      status: row[2] || "",
      type: row[3] || "",
      startDate: row[4] || null,
      endDate: row[5] || null,
      dailyBudget: parseFloat(row[6] || "0"),
      impressions: parseInt(row[7] || "0", 10),
      clicks: parseInt(row[8] || "0", 10),
      cost: parseFloat(row[9] || "0"),
      conversions: parseFloat(row[10] || "0"),
      conversionValue: parseFloat(row[11] || "0"),
      ctr: parseFloat(row[12] || "0"),
      cpc: parseFloat(row[13] || "0"),
      costPerConversion: parseFloat(row[14] || "0"),
      exportDate: row[15] || "",
    }));

    // Parse ad groups
    const adGroups = groupsData.slice(1).map((row) => ({
      adGroupId: row[0] || "",
      name: row[1] || "",
      campaignId: row[2] || "",
      campaignName: row[3] || "",
      status: row[4] || "",
      impressions: parseInt(row[5] || "0", 10),
      clicks: parseInt(row[6] || "0", 10),
      cost: parseFloat(row[7] || "0"),
      conversions: parseFloat(row[8] || "0"),
      ctr: parseFloat(row[9] || "0"),
      cpc: parseFloat(row[10] || "0"),
    }));

    // Parse ads
    const ads = adsData.slice(1).map((row) => ({
      adId: row[0] || "",
      name: row[1] || "",
      adGroupId: row[2] || "",
      campaignId: row[3] || "",
      campaignName: row[4] || "",
      type: row[5] || "",
      status: row[6] || "",
      headline: row[7] || "",
      description: row[9] || "",
      finalUrl: row[10] || "",
      impressions: parseInt(row[11] || "0", 10),
      clicks: parseInt(row[12] || "0", 10),
      cost: parseFloat(row[13] || "0"),
      conversions: parseFloat(row[14] || "0"),
      ctr: parseFloat(row[15] || "0"),
      cpc: parseFloat(row[16] || "0"),
    }));

    // Index ad groups by campaign
    const groupsByCampaign = new Map<string, typeof adGroups>();
    for (const g of adGroups) {
      if (!groupsByCampaign.has(g.campaignId)) groupsByCampaign.set(g.campaignId, []);
      groupsByCampaign.get(g.campaignId)!.push(g);
    }

    // Index ads by ad group
    const adsByGroup = new Map<string, typeof ads>();
    for (const a of ads) {
      if (!adsByGroup.has(a.adGroupId)) adsByGroup.set(a.adGroupId, []);
      adsByGroup.get(a.adGroupId)!.push(a);
    }

    // Build hierarchy + sync to DB
    const hierarchy = [];
    let synced = 0;

    for (const camp of campaigns) {
      const campGroups = groupsByCampaign.get(camp.campaignId) || [];

      const adsets = campGroups.map((g) => {
        const groupAds = adsByGroup.get(g.adGroupId) || [];
        return {
          id: g.adGroupId,
          name: g.name,
          status: g.status,
          insights: {
            spend: g.cost, impressions: g.impressions, clicks: g.clicks,
            conversions: g.conversions, cpc: g.cpc, ctr: g.ctr * 100,
          },
          ads: groupAds.map((a) => ({
            id: a.adId,
            name: a.name || a.headline,
            status: a.status,
            headline: a.headline,
            description: a.description,
            finalUrl: a.finalUrl,
            insights: {
              spend: a.cost, impressions: a.impressions, clicks: a.clicks,
              conversions: a.conversions, cpc: a.cpc, ctr: a.ctr * 100,
            },
          })),
        };
      });

      const campaignObj = {
        id: camp.campaignId,
        name: camp.name,
        status: camp.status,
        type: camp.type,
        startDate: camp.startDate,
        endDate: camp.endDate,
        dailyBudget: camp.dailyBudget,
        insights: {
          spend: camp.cost, impressions: camp.impressions, clicks: camp.clicks,
          conversions: camp.conversions, conversionValue: camp.conversionValue,
          cpc: camp.cpc, ctr: camp.ctr * 100, costPerConversion: camp.costPerConversion,
        },
        adsets,
      };

      hierarchy.push(campaignObj);

      // Sync to DB
      try {
        const metaInsights = {
          spend: camp.cost, impressions: camp.impressions, clicks: camp.clicks,
          conversions: camp.conversions, cpc: camp.cpc, ctr: camp.ctr * 100,
          budget: camp.dailyBudget, status: camp.status, objective: camp.type,
          adsetsCount: adsets.length,
          adsCount: adsets.reduce((s, a) => s + a.ads.length, 0),
          adsets: adsets.map((as) => ({
            id: as.id, name: as.name, status: as.status,
            insights: as.insights,
            ads: as.ads.map((ad) => ({
              id: ad.id, name: ad.name, status: ad.status,
              insights: ad.insights,
            })),
          })),
          syncedAt: new Date().toISOString(),
          source: "google_ads",
        };

        const googleCampaignId = `google_${camp.campaignId}`;
        const existing = await prisma.campagne.findFirst({
          where: { metaCampaignId: googleCampaignId },
        });

        if (existing) {
          await prisma.campagne.update({
            where: { id: existing.id },
            data: {
              nom: camp.name,
              coutTotal: camp.cost,
              dateDebut: camp.startDate ? new Date(camp.startDate) : undefined,
              dateFin: camp.endDate ? new Date(camp.endDate) : undefined,
              actif: camp.status === "ENABLED",
              metaInsights,
            },
          });
        } else {
          await prisma.campagne.create({
            data: {
              nom: camp.name,
              plateforme: "GOOGLE",
              coutTotal: camp.cost,
              dateDebut: camp.startDate ? new Date(camp.startDate) : undefined,
              dateFin: camp.endDate ? new Date(camp.endDate) : undefined,
              metaCampaignId: googleCampaignId,
              actif: camp.status === "ENABLED",
              metaInsights,
            },
          });
        }
        synced++;
      } catch (err) {
        console.error(`Sync Google campaign ${camp.campaignId}:`, err);
      }
    }

    // KPIs
    const totalSpend = campaigns.reduce((s, c) => s + c.cost, 0);
    const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
    const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
    const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);

    return NextResponse.json({
      success: true,
      source: "google_ads_sheet",
      campaigns: hierarchy,
      kpis: {
        totalCampaigns: campaigns.length,
        totalAdGroups: adGroups.length,
        totalAds: ads.length,
        totalSpend: Math.round(totalSpend * 100) / 100,
        totalImpressions, totalClicks,
        totalConversions: Math.round(totalConversions * 10) / 10,
      },
      synced,
      exportDate: campaigns[0]?.exportDate || null,
    });
  } catch (error: any) {
    console.error("Google Ads import error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
