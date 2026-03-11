import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BREVO_API = "https://api.brevo.com/v3";
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

let cache: { data: unknown; timestamp: number } | null = null;

async function brevoFetch(path: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY manquante");

  const res = await fetch(`${BREVO_API}${path}`, {
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

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Check fresh param
  const { searchParams } = new URL(request.url);
  const fresh = searchParams.get("fresh") === "true";

  // Return cache if valid
  if (!fresh && cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    // Parallel: contacts count + 5 dernières campagnes envoyées
    const [contactsRes, campagnesRes] = await Promise.all([
      brevoFetch("/contacts?limit=1&offset=0"),
      brevoFetch("/emailCampaigns?status=sent&limit=5&sort=desc&type=classic"),
    ]);

    const totalContacts = contactsRes.count || 0;

    const campagnes = (campagnesRes.campaigns || []).map((c: any) => {
      const stats = c.statistics?.globalStats || {};
      const destinataires = stats.sent || c.statistics?.sent || 0;
      const ouvertures = stats.uniqueOpens || 0;
      const clics = stats.uniqueClicks || 0;
      const desabonnements = stats.unsubscriptions || 0;
      const bounces = (stats.hardBounces || 0) + (stats.softBounces || 0);

      return {
        id: c.id,
        nom: c.name || "Sans nom",
        dateEnvoi: c.sentDate || c.scheduledAt || c.createdAt,
        destinataires,
        tauxOuverture: destinataires > 0 ? Math.round((ouvertures / destinataires) * 1000) / 10 : 0,
        tauxClic: destinataires > 0 ? Math.round((clics / destinataires) * 1000) / 10 : 0,
        desabonnements,
        bounces,
      };
    });

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

    const result = {
      contacts: { total: totalContacts },
      dernieresCampagnes: campagnes,
      moyennes: {
        tauxOuvertureMoyen,
        tauxClicMoyen,
      },
      _cache: { generatedAt: new Date().toISOString() },
    };

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
