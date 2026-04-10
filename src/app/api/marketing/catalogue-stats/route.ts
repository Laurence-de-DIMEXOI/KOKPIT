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
  const lt = new Date(`${parseInt(annee) + 1}-01-01`);

  const [views, clicks, topReferrers, topSources] = await Promise.all([
    prisma.catalogueStat.count({ where: { type: "view", createdAt: { gte, lt } } }),
    prisma.catalogueStat.count({ where: { type: "click", createdAt: { gte, lt } } }),
    // Top referrers (groupBy non disponible facilement sans raw — on récupère les 200 derniers)
    prisma.catalogueStat.findMany({
      where: { type: "view", createdAt: { gte, lt }, referrer: { not: null } },
      select: { referrer: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.catalogueStat.findMany({
      where: { type: "view", createdAt: { gte, lt }, utmSource: { not: null } },
      select: { utmSource: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  // Compter les referrers
  const referrerCount: Record<string, number> = {};
  for (const r of topReferrers) {
    if (!r.referrer) continue;
    try {
      const domain = new URL(r.referrer).hostname.replace("www.", "");
      referrerCount[domain] = (referrerCount[domain] || 0) + 1;
    } catch {
      referrerCount[r.referrer] = (referrerCount[r.referrer] || 0) + 1;
    }
  }

  const sourceCount: Record<string, number> = {};
  for (const s of topSources) {
    if (!s.utmSource) continue;
    sourceCount[s.utmSource] = (sourceCount[s.utmSource] || 0) + 1;
  }

  const referrers = Object.entries(referrerCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([domain, count]) => ({ domain, count }));

  const sources = Object.entries(sourceCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([source, count]) => ({ source, count }));

  const tauxClic = views > 0 ? Math.round((clicks / views) * 100) : 0;

  return NextResponse.json({ views, clicks, tauxClic, referrers, sources });
}
