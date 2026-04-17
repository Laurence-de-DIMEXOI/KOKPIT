import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/marketing/catalogue-stats?annee=2026
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const annee = req.nextUrl.searchParams.get("annee") || String(new Date().getFullYear());
  const gte = new Date(`${annee}-01-01`);
  const lt  = new Date(`${parseInt(annee) + 1}-01-01`);

  const stats = await prisma.catalogueStat.findMany({
    where: { createdAt: { gte, lt } },
    select: { type: true, referrer: true, utmSource: true, utmMedium: true, utmCampaign: true, createdAt: true },
  });

  const views  = stats.filter((s) => s.type === "view").length;
  const clicks = stats.filter((s) => s.type === "click").length;
  const tauxClic = views > 0 ? Math.round((clicks / views) * 1000) / 10 : 0;

  // Referrers (domaine uniquement)
  const referrerMap: Record<string, number> = {};
  for (const s of stats) {
    if (!s.referrer) continue;
    let domain = s.referrer;
    try { domain = new URL(s.referrer).hostname.replace(/^www\./, ""); } catch {}
    referrerMap[domain] = (referrerMap[domain] || 0) + 1;
  }
  const referrers = Object.entries(referrerMap)
    .sort((a, b) => b[1] - a[1])
    .map(([domain, count]) => ({ domain, count }));

  // Sources UTM (source / medium / campaign)
  const sourceMap: Record<string, number> = {};
  for (const s of stats) {
    const parts = [s.utmSource, s.utmMedium, s.utmCampaign].filter(Boolean);
    const key = parts.length > 0 ? parts.join(" / ") : "Direct";
    sourceMap[key] = (sourceMap[key] || 0) + 1;
  }
  const sources = Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => ({ source, count }));

  // Par mois
  const moisMap: Record<string, { views: number; clicks: number }> = {};
  for (const s of stats) {
    const mois = s.createdAt.toISOString().substring(0, 7);
    if (!moisMap[mois]) moisMap[mois] = { views: 0, clicks: 0 };
    if (s.type === "view") moisMap[mois].views++;
    else moisMap[mois].clicks++;
  }
  const parMois = Object.entries(moisMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mois, v]) => ({ mois, ...v }));

  return NextResponse.json({ views, clicks, tauxClic, referrers, sources, parMois });
}
