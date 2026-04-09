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

function aggregateObject(obj: Record<string, any>) {
  const values = Object.values(obj) as any[];
  if (values.length === 0) return null;
  return values.reduce((acc: any, s: any) => ({
    sent: (acc.sent || 0) + (s.sent || 0),
    delivered: (acc.delivered || 0) + (s.delivered || 0),
    uniqueViews: (acc.uniqueViews || 0) + (s.uniqueViews || 0),
    uniqueClicks: (acc.uniqueClicks || 0) + (s.uniqueClicks || 0),
    unsubscriptions: (acc.unsubscriptions || 0) + (s.unsubscriptions || 0),
    hardBounces: (acc.hardBounces || 0) + (s.hardBounces || 0),
    softBounces: (acc.softBounces || 0) + (s.softBounces || 0),
  }), {});
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const listRes = await brevoFetch("/emailCampaigns?status=sent&limit=5&sort=desc&type=classic");
    const campaigns = listRes.campaigns || [];

    const results = await Promise.all(
      campaigns.map(async (c: any) => {
        let detail: any = null;
        let detailError: string | null = null;
        try {
          detail = await brevoFetch(`/emailCampaigns/${c.id}?excludeHtmlContent=true`);
        } catch (e: any) {
          detailError = e.message;
        }

        const stats = detail?.statistics || {};

        return {
          id: c.id,
          name: c.name,
          detailError,
          globalStats: stats.globalStats ?? null,
          campaignStatsCount: (stats.campaignStats || []).length,
          campaignStatsAggregate: (stats.campaignStats || []).length > 0
            ? (stats.campaignStats as any[]).reduce((acc: any, s: any) => ({
                sent: (acc.sent||0)+(s.sent||0),
                uniqueViews: (acc.uniqueViews||0)+(s.uniqueViews||0),
                uniqueClicks: (acc.uniqueClicks||0)+(s.uniqueClicks||0),
                unsubscriptions: (acc.unsubscriptions||0)+(s.unsubscriptions||0),
              }), {})
            : null,
          statsByDomainCount: Object.keys(stats.statsByDomain || {}).length,
          statsByDomainAggregate: aggregateObject(stats.statsByDomain || {}),
          statsByDeviceCount: Object.keys(stats.statsByDevice || {}).length,
          statsByDeviceAggregate: aggregateObject(stats.statsByDevice || {}),
          remaining: stats.remaining ?? null,
        };
      })
    );

    return NextResponse.json({ campaigns: results }, { headers: { "Cache-Control": "no-store" } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
