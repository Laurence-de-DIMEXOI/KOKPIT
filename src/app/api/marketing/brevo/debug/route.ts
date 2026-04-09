import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BREVO_API = "https://api.brevo.com/v3";

async function brevoFetch(path: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY manquante");

  const res = await fetch(`${BREVO_API}${path}`, {
    cache: "no-store",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo API ${res.status}: ${text}`);
  }

  return res.json();
}

// GET /api/marketing/brevo/debug — dump brut des campagnes pour diagnostic
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Listing des campagnes envoyées
    const listRes = await brevoFetch("/emailCampaigns?status=sent&limit=5&sort=desc&type=classic");
    const campaigns = listRes.campaigns || [];

    const results = await Promise.all(
      campaigns.map(async (c: any) => {
        // Détail individuel sans HTML
        let detail: any = null;
        let detailError: string | null = null;
        try {
          detail = await brevoFetch(`/emailCampaigns/${c.id}?excludeHtmlContent=true`);
        } catch (e: any) {
          detailError = e.message;
        }

        return {
          id: c.id,
          name: c.name,
          status: c.status,
          sentDate: c.sentDate,
          // Stats dans le listing
          listingStatisticsKeys: c.statistics ? Object.keys(c.statistics) : null,
          listingGlobalStats: c.statistics?.globalStats ?? "ABSENT",
          listingCampaignStats: c.statistics?.campaignStats ?? "ABSENT",
          // Stats dans le détail individuel
          detailError,
          detailStatisticsKeys: detail?.statistics ? Object.keys(detail.statistics) : null,
          detailGlobalStats: detail?.statistics?.globalStats ?? "ABSENT",
          detailCampaignStatsLength: detail?.statistics?.campaignStats?.length ?? "ABSENT",
          detailCampaignStatsFirst: detail?.statistics?.campaignStats?.[0] ?? "ABSENT",
        };
      })
    );

    return NextResponse.json({ campaigns: results }, { headers: { "Cache-Control": "no-store" } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
