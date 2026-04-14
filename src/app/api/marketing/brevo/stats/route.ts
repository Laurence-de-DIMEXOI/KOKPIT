import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BREVO_API = "https://api.brevo.com/v3";
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

let cache: { data: unknown; timestamp: number } | null = null;

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

  if (res.status === 429 && attempt < 3) {
    const retryAfter = res.headers.get("Retry-After");
    const delay = retryAfter
      ? Number(retryAfter) * 1000
      : Math.min(2000 * 2 ** attempt, 16000);
    await sleep(delay);
    return brevoFetch(path, attempt + 1);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo API ${res.status}: ${text}`);
  }

  return res.json();
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Check fresh param
  const { searchParams } = new URL(request.url);
  const fresh = searchParams.get("fresh") === "true";

  // Return cache if valid (fresh=true force-bypasse le cache)
  if (!fresh && cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  // Force-reset le cache si demandé
  if (fresh) cache = null;

  try {
    const debugMode = searchParams.get("debug") === "1";
    const debugInfo: any = {};

    // Validate API key by fetching account info
    let accountInfo: any = null;
    try {
      accountInfo = await brevoFetch("/account");
      if (debugMode) {
        debugInfo.account = {
          email: accountInfo.email,
          companyName: accountInfo.companyName,
          plan: accountInfo.plan?.[0]?.type || "unknown",
        };
      }
    } catch (err: any) {
      if (debugMode) {
        debugInfo.accountError = err.message;
      }
    }

    // Parallel: contacts count + sent campaigns + all campaigns (for drafts/scheduled)
    const [contactsRes, campagnesRes, allCampagnesRes] = await Promise.all([
      brevoFetch("/contacts?limit=1&offset=0"),
      brevoFetch("/emailCampaigns?status=sent&limit=20&sort=desc&type=classic"),
      brevoFetch("/emailCampaigns?limit=10&sort=desc&type=classic"),
    ]);

    const totalContacts = contactsRes.count || 0;

    if (debugMode) {
      debugInfo.totalContacts = totalContacts;
      debugInfo.sentCampaignsCount = campagnesRes.count || 0;
      debugInfo.allCampaignsCount = allCampagnesRes?.count || 0;
      debugInfo.allCampaignsStatuses = (allCampagnesRes?.campaigns || []).map((c: any) => ({
        id: c.id, name: c.name, status: c.status,
      }));
      if (campagnesRes.campaigns?.length > 0) {
        const first = campagnesRes.campaigns[0];
        debugInfo.sampleCampaign = {
          id: first.id,
          name: first.name,
          status: first.status,
          sentDate: first.sentDate,
          hasStats: !!first.statistics,
          globalStats: first.statistics?.globalStats,
          campaignStatsCount: (first.statistics?.campaignStats || []).length,
          campaignStats: first.statistics?.campaignStats,
          rawStatisticsKeys: first.statistics ? Object.keys(first.statistics) : [],
        };
        // Aussi fetcher le détail du premier pour comparer
        try {
          const detail = await brevoFetch(`/emailCampaigns/${first.id}`);
          debugInfo.sampleCampaignDetail = {
            globalStats: detail.statistics?.globalStats,
            campaignStatsCount: (detail.statistics?.campaignStats || []).length,
            rawStatisticsKeys: detail.statistics ? Object.keys(detail.statistics) : [],
          };
        } catch (e: any) {
          debugInfo.sampleCampaignDetailError = e.message;
        }
      }
    }

    // Extraire les stats depuis un objet campaign Brevo
    // IMPORTANT : globalStats retourne toujours 0 (bug Brevo API)
    // Les vraies données sont dans campaignStats (tableau par liste) → on les agrège
    function extractStats(c: any) {
      const campStats: any[] = c.statistics?.campaignStats || [];

      // Priorité : agréger campaignStats (données réelles)
      if (campStats.length > 0) {
        const agg = campStats.reduce(
          (acc: any, s: any) => ({
            sent: (acc.sent || 0) + (s.sent || 0),
            delivered: (acc.delivered || 0) + (s.delivered || 0),
            uniqueViews: (acc.uniqueViews || 0) + (s.uniqueViews || 0),
            uniqueClicks: (acc.uniqueClicks || 0) + (s.uniqueClicks || 0),
            unsubscriptions: (acc.unsubscriptions || 0) + (s.unsubscriptions || 0),
            hardBounces: (acc.hardBounces || 0) + (s.hardBounces || 0),
            softBounces: (acc.softBounces || 0) + (s.softBounces || 0),
          }),
          {}
        );
        return {
          destinataires: agg.sent || agg.delivered || 0,
          ouvertures: agg.uniqueViews || 0,
          clics: agg.uniqueClicks || 0,
          desabonnements: agg.unsubscriptions || 0,
          bounces: (agg.hardBounces || 0) + (agg.softBounces || 0),
        };
      }

      // Fallback : globalStats (souvent 0 côté Brevo, mais on essaie)
      const gs = c.statistics?.globalStats || {};
      return {
        destinataires: gs.sent || gs.delivered || 0,
        ouvertures: gs.uniqueViews || 0,
        clics: gs.uniqueClicks || 0,
        desabonnements: gs.unsubscriptions || 0,
        bounces: (gs.hardBounces || 0) + (gs.softBounces || 0),
      };
    }

    // Pour chaque campagne envoyée : toujours fetcher les stats individuelles
    // Le listing Brevo ne retourne pas toujours les statistics complètes
    const rawCampaigns = campagnesRes.campaigns || [];
    const campagnes = await Promise.all(
      rawCampaigns.map(async (c: any) => {
        // Partir des stats du listing (souvent vides)
        let { destinataires, ouvertures, clics, desabonnements, bounces } = extractStats(c);

        // Pour les campagnes envoyées : forcer un appel individuel
        // ?excludeHtmlContent=true = pas de HTML dans la réponse (perf)
        let detail: any = null;
        if (c.status === "sent") {
          try {
            detail = await brevoFetch(
              `/emailCampaigns/${c.id}?excludeHtmlContent=true`
            );
            const extracted = extractStats(detail);
            // Utiliser les stats individuelles si elles ont plus de données
            if (extracted.destinataires >= destinataires) {
              ({ destinataires, ouvertures, clics, desabonnements, bounces } = extracted);
            }
          } catch {
            // Silently fallback to listing data
          }
        }

        // Détecter les campagnes envoyées par segment uniquement (pas de listes)
        // L'API Brevo ne retourne pas les stats pour ce cas → indiquer à l'UI
        const recipients = detail?.recipients || c.recipients || {};
        const sentToSegmentsOnly =
          destinataires === 0 &&
          (recipients.lists?.length ?? 0) === 0 &&
          (recipients.segments?.length ?? 0) > 0;

        return {
          id: c.id,
          nom: c.name || "Sans nom",
          dateEnvoi: c.sentDate || c.scheduledAt || c.createdAt,
          destinataires,
          tauxOuverture: destinataires > 0 ? Math.round((ouvertures / destinataires) * 1000) / 10 : 0,
          tauxClic: destinataires > 0 ? Math.round((clics / destinataires) * 1000) / 10 : 0,
          desabonnements,
          bounces,
          statsIndisponibles: sentToSegmentsOnly,
          // Segments IDs pour recalcul via /contacts/{email}/campaignStats
          segments: sentToSegmentsOnly ? (recipients.segments || []) : undefined,
        };
      })
    );

    // Moyennes
    const campagnesAvecDonnees = campagnes.filter((c: any) => c.destinataires > 0);
    const tauxOuvertureMoyen =
      campagnesAvecDonnees.length > 0
        ? Math.round(
            (campagnesAvecDonnees.reduce((s: number, c: any) => s + c.tauxOuverture, 0) /
              campagnesAvecDonnees.length) *
              10
          ) / 10
        : 0;
    const tauxClicMoyen =
      campagnesAvecDonnees.length > 0
        ? Math.round(
            (campagnesAvecDonnees.reduce((s: number, c: any) => s + c.tauxClic, 0) /
              campagnesAvecDonnees.length) *
              10
          ) / 10
        : 0;

    // Campagnes en préparation (draft, queued, scheduled)
    const campagnesEnCours = (allCampagnesRes?.campaigns || [])
      .filter((c: any) => ["draft", "queued", "scheduled"].includes(c.status))
      .map((c: any) => ({
        id: c.id,
        nom: c.name || "Sans nom",
        status: c.status,
        dateCreation: c.createdAt,
        scheduledAt: c.scheduledAt,
      }));

    const result: any = {
      contacts: { total: totalContacts },
      dernieresCampagnes: campagnes,
      campagnesEnCours,
      moyennes: {
        tauxOuvertureMoyen,
        tauxClicMoyen,
      },
      _avertissement: campagnesAvecDonnees.length === 0 && campagnes.length > 0
        ? "Les campagnes envoyées n'ont aucune statistique (listes de destinataires vides ou stats en cours de chargement)."
        : undefined,
      _cache: { generatedAt: new Date().toISOString() },
    };

    if (debugMode) {
      result.debug = debugInfo;
    }

    cache = { data: result, timestamp: Date.now() };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/marketing/brevo/stats error:", error);

    // Si BREVO_API_KEY absente ou API inaccessible
    return NextResponse.json(
      {
        error: error.message || "Brevo indisponible",
        contacts: { total: 0 },
        dernieresCampagnes: [],
        moyennes: { tauxOuvertureMoyen: 0, tauxClicMoyen: 0 },
        _cache: null,
      },
      { status: error.message?.includes("manquante") ? 503 : 500 }
    );
  }
}
