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
    where: { createdAt: { gte, lt } },
    select: { source: true, createdAt: true },
  });

  // Totaux par source
  const parSource: Record<string, number> = {};
  // Par mois par source
  const parMois: Record<string, Record<string, number>> = {};

  for (const l of leads) {
    const src = l.source as string;
    const mois = l.createdAt.toISOString().substring(0, 7);

    parSource[src] = (parSource[src] || 0) + 1;
    if (!parMois[mois]) parMois[mois] = {};
    parMois[mois][src] = (parMois[mois][src] || 0) + 1;
  }

  // Sources triées par volume
  const sources = Object.entries(parSource)
    .sort((a, b) => b[1] - a[1])
    .map(([source, total]) => ({
      source,
      label: SOURCE_LABELS[source] || source,
      total,
    }));

  // Tableau mensuel : un objet par mois avec count par source
  const moisList = Array.from({ length: 12 }, (_, i) =>
    `${annee}-${String(i + 1).padStart(2, "0")}`
  );
  const tableau = moisList.map((mois) => ({
    mois,
    ...Object.fromEntries(
      sources.map((s) => [s.source, (parMois[mois] || {})[s.source] || 0])
    ),
    total: sources.reduce((sum, s) => sum + ((parMois[mois] || {})[s.source] || 0), 0),
  }));

  return NextResponse.json({
    total: leads.length,
    sources,
    tableau,
  });
}
