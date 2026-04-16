import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchAdsForPage, isMetaAdLibraryConfigured, type AdLibraryAd } from "@/lib/meta-ad-library";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ALLOWED_ROLES = new Set(["ADMIN", "MARKETING", "DIRECTION"]);

/**
 * Auth : soit cron (Bearer CRON_SECRET), soit session admin/marketing.
 * Retourne { ok: true } si autorisé, sinon payload d'erreur.
 */
async function requireCronOrAdmin(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || process.env.CRON_API_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader === `Bearer ${cronSecret}`) {
      return { ok: true as const, source: "cron" as const };
    }
  }
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { ok: false as const, status: 401, error: "Non autorisé" };
  }
  const role = (session.user as { role?: string }).role;
  if (!role || !ALLOWED_ROLES.has(role)) {
    return { ok: false as const, status: 403, error: "Accès refusé" };
  }
  return { ok: true as const, source: "user" as const };
}

// GET /api/veille/sync            → sync de tous les concurrents actifs
// GET /api/veille/sync?id=xxx     → sync d'un seul concurrent (manuel UI)
export async function GET(req: NextRequest) {
  const access = await requireCronOrAdmin(req);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  if (!isMetaAdLibraryConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error:
          "META_APP_ID et META_APP_SECRET non configurés sur Vercel — impossible de synchroniser.",
      },
      { status: 503 },
    );
  }

  const onlyId = req.nextUrl.searchParams.get("id");
  const where = onlyId
    ? { id: onlyId, actif: true, pageId: { not: null } }
    : { actif: true, pageId: { not: null } };

  const concurrents = await prisma.concurrent.findMany({ where });

  if (concurrents.length === 0) {
    return NextResponse.json({
      success: true,
      message: onlyId
        ? "Concurrent introuvable, inactif, ou sans pageId"
        : "Aucun concurrent actif avec pageId — résoudre les Page IDs d'abord",
      concurrents: 0,
      pubsNew: 0,
      pubsUpdated: 0,
    });
  }

  let pubsNew = 0;
  let pubsUpdated = 0;
  const errors: Array<{ concurrent: string; error: string }> = [];

  for (const c of concurrents) {
    if (!c.pageId) continue; // safety (où est déjà filtré mais TS)
    try {
      const ads = await fetchAdsForPage({
        pageId: c.pageId,
        countries: ["FR", "RE"],
        sinceISO: "2025-01-01",
        activeStatus: "ALL",
        limit: 100,
        maxPages: 10,
      });

      for (const ad of ads) {
        const upsertRes = await upsertAd(c.id, ad);
        if (upsertRes === "created") pubsNew++;
        else if (upsertRes === "updated") pubsUpdated++;
      }

      await prisma.concurrent.update({
        where: { id: c.id },
        data: { derniereSync: new Date() },
      });

      console.log(`[veille sync] ${c.nom}: ${ads.length} pubs traitées`);
    } catch (e) {
      const msg = (e as Error).message;
      console.error(`[veille sync] ${c.nom} error:`, msg);
      errors.push({ concurrent: c.nom, error: msg });
    }
  }

  return NextResponse.json({
    success: true,
    concurrents: concurrents.length,
    pubsNew,
    pubsUpdated,
    errors,
    source: access.source,
  });
}

async function upsertAd(
  concurrentId: string,
  ad: AdLibraryAd,
): Promise<"created" | "updated" | "skipped"> {
  if (!ad.id || !ad.ad_snapshot_url || !ad.ad_delivery_start_time) return "skipped";

  const dateDebut = new Date(ad.ad_delivery_start_time);
  const dateFin = ad.ad_delivery_stop_time ? new Date(ad.ad_delivery_stop_time) : null;
  const active = !dateFin || dateFin > new Date();

  const data = {
    concurrentId,
    adArchiveId: ad.id,
    snapshotUrl: ad.ad_snapshot_url,
    texte: ad.ad_creative_bodies?.[0] || null,
    titre: ad.ad_creative_link_titles?.[0] || null,
    caption: ad.ad_creative_link_captions?.[0] || null,
    plateformes: ad.publisher_platforms || [],
    dateDebut,
    dateFin,
    active,
  };

  const existing = await prisma.pubConcurrent.findUnique({
    where: { adArchiveId: ad.id },
    select: { id: true, dateFin: true, active: true },
  });

  if (existing) {
    // Update uniquement si un champ important a changé (dateFin/active)
    if (
      (existing.dateFin?.getTime() ?? null) !== (dateFin?.getTime() ?? null) ||
      existing.active !== active
    ) {
      await prisma.pubConcurrent.update({
        where: { adArchiveId: ad.id },
        data: { dateFin, active },
      });
      return "updated";
    }
    return "skipped";
  }

  await prisma.pubConcurrent.create({ data });
  return "created";
}
