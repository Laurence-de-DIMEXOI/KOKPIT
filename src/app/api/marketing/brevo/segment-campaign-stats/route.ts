import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BREVO_API = "https://api.brevo.com/v3";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function brevoFetch(path: string, attempt = 0): Promise<any> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY manquante");

  const res = await fetch(`${BREVO_API}${path}`, {
    cache: "no-store",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
  });

  // Retry on 429 (rate limit) with exponential backoff
  if (res.status === 429 && attempt < 4) {
    const retryAfter = res.headers.get("Retry-After");
    const delay = retryAfter
      ? Number(retryAfter) * 1000
      : Math.min(1000 * 2 ** attempt, 16000);
    await sleep(delay);
    return brevoFetch(path, attempt + 1);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo API ${res.status}: ${text}`);
  }

  return res.json();
}

// Récupère tous les emails des contacts d'un segment (paginé)
async function getSegmentEmails(segmentId: number): Promise<string[]> {
  const emails: string[] = [];
  let offset = 0;
  const limit = 500;

  while (true) {
    const res = await brevoFetch(
      `/contacts?segmentId=${segmentId}&limit=${limit}&offset=${offset}`
    );
    const contacts: any[] = res.contacts || [];
    for (const c of contacts) {
      if (c.email) emails.push(c.email);
    }
    if (contacts.length < limit) break;
    offset += limit;
  }

  return emails;
}

// Cache en mémoire (les stats d'une campagne passée ne changent plus)
const segmentStatsCache = new Map<
  string,
  { data: unknown; timestamp: number }
>();
const CACHE_TTL = 60 * 60 * 1000; // 1 heure

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const campaignId = Number(searchParams.get("campaignId"));
  const segmentsStr = searchParams.get("segments") || "";
  const sentDate = searchParams.get("sentDate") || "";

  if (!campaignId || !segmentsStr) {
    return NextResponse.json(
      { error: "Paramètres manquants: campaignId et segments requis" },
      { status: 400 }
    );
  }

  const cacheKey = `${campaignId}_${segmentsStr}`;
  const cached = segmentStatsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const segmentIds = segmentsStr
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0);

  try {
    // Délai pour laisser la route /stats finir ses appels Brevo avant de saturer le rate limit
    await sleep(5000);

    // Récupérer tous les emails des segments (séquentiellement pour éviter le rate limit)
    const emailArrays: string[][] = [];
    for (const segId of segmentIds) {
      emailArrays.push(await getSegmentEmails(segId));
    }
    const allEmails = [...new Set(emailArrays.flat())];

    if (allEmails.length === 0) {
      return NextResponse.json({
        campaignId,
        destinataires: 0,
        ouvertures: 0,
        clics: 0,
        tauxOuverture: 0,
        tauxClic: 0,
        desabonnements: 0,
        bounces: 0,
        totalContactsSegments: 0,
      });
    }

    // Fenêtre de dates : envoi ± 7 jours (les ouvertures/clics arrivent vite)
    const d = sentDate ? new Date(sentDate) : new Date();
    const startDate = d.toISOString().slice(0, 10);
    const endDate = new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    // Appels séquentiels par 10, avec pause entre chaque batch pour respecter le rate limit Brevo
    const BATCH = 10;
    const BATCH_DELAY = 800; // ms entre batches
    let sent = 0,
      opened = 0,
      clicked = 0,
      unsubscribed = 0,
      bounced = 0;

    for (let i = 0; i < allEmails.length; i += BATCH) {
      if (i > 0) await sleep(BATCH_DELAY);
      const batch = allEmails.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map((email) =>
          brevoFetch(
            `/contacts/${encodeURIComponent(email)}/campaignStats?startDate=${startDate}&endDate=${endDate}`
          ).catch(() => null)
        )
      );

      for (const stats of results) {
        if (!stats) continue;

        const hasCampaign = (arr: any[]) =>
          (arr || []).some((e: any) => e.campaignId === campaignId);

        if (hasCampaign(stats.messagesSent)) sent++;
        if (hasCampaign(stats.opened)) opened++;
        if (hasCampaign(stats.clicked)) clicked++;
        if (hasCampaign(stats.softBounces)) bounced++;
        if (hasCampaign(stats.hardBounces)) bounced++;
        if (hasCampaign(stats.unsubscriptions?.userUnsubscription || []))
          unsubscribed++;
      }
    }

    const tauxOuverture =
      sent > 0 ? Math.round((opened / sent) * 1000) / 10 : 0;
    const tauxClic = sent > 0 ? Math.round((clicked / sent) * 1000) / 10 : 0;

    const result = {
      campaignId,
      destinataires: sent,
      ouvertures: opened,
      clics: clicked,
      tauxOuverture,
      tauxClic,
      desabonnements: unsubscribed,
      bounces: bounced,
      totalContactsSegments: allEmails.length,
    };

    segmentStatsCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/marketing/brevo/segment-campaign-stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
