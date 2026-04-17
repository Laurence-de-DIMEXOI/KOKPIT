import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SOURCE_LABELS: Record<string, string> = {
  META_ADS:   "Meta Ads",
  GOOGLE_ADS: "Google Ads",
  SITE_WEB:   "Site web",
  FORMULAIRE: "Formulaire",
  DIRECT:     "Direct",
  SALON:      "Salon / Événement",
  GLIDE:      "Glide (app)",
};

function buildKey(l: { source: string; utmSource: string | null; utmMedium: string | null; utmCampaign: string | null }): string {
  if (l.utmSource) {
    const parts = [l.utmSource, l.utmMedium, l.utmCampaign].filter(Boolean);
    return parts.join(" / ");
  }
  return l.source;
}

function buildLabel(key: string, l: { source: string; utmSource: string | null; utmMedium: string | null; utmCampaign: string | null }): string {
  if (l.utmSource) return key; // déjà lisible (utm_source / medium / campaign)
  return SOURCE_LABELS[l.source] || l.source;
}

// GET /api/marketing/demandes-sources?annee=2026
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const annee = req.nextUrl.searchParams.get("annee") || String(new Date().getFullYear());
  const gte = new Date(`${annee}-01-01`);
  const lt  = new Date(`${parseInt(annee) + 1}-01-01`);

  const leads = await prisma.lead.findMany({
    where: {
      createdAt: { gte, lt },
      // Exclure les téléchargements de guide PDF (utmMedium = 'guide_pdf')
      // Les leads sans UTM (NULL) doivent être inclus
      OR: [
        { utmMedium: null },
        { utmMedium: { not: "guide_pdf" } },
      ],
    },
    select: { source: true, utmSource: true, utmMedium: true, utmCampaign: true, createdAt: true },
  });

  // Totaux par clé source
  const parSource: Record<string, { label: string; total: number }> = {};
  // Par mois par clé source
  const parMois: Record<string, Record<string, number>> = {};

  for (const l of leads) {
    const key = buildKey(l as any);
    const label = buildLabel(key, l as any);
    const mois = l.createdAt.toISOString().substring(0, 7);

    if (!parSource[key]) parSource[key] = { label, total: 0 };
    parSource[key].total++;

    if (!parMois[mois]) parMois[mois] = {};
    parMois[mois][key] = (parMois[mois][key] || 0) + 1;
  }

  // Sources triées par volume
  const sources = Object.entries(parSource)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([key, { label, total }]) => ({ key, label, total }));

  const total = leads.length;

  // Tableau mensuel
  const moisList = Array.from({ length: 12 }, (_, i) =>
    `${annee}-${String(i + 1).padStart(2, "0")}`
  );
  const tableau = moisList.map((mois) => ({
    mois,
    ...Object.fromEntries(
      sources.map((s) => [s.key, (parMois[mois] || {})[s.key] || 0])
    ),
    total: sources.reduce((sum, s) => sum + ((parMois[mois] || {})[s.key] || 0), 0),
  }));

  return NextResponse.json({ total, sources, tableau });
}
