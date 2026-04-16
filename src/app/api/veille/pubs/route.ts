import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["ADMIN", "MARKETING", "DIRECTION"]);

// GET /api/veille/pubs
// Query : concurrentId?, plateforme?, active? (true/false), dateMin?, search?, limit, offset
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (!role || !ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const concurrentId = sp.get("concurrentId") || undefined;
  const plateforme = sp.get("plateforme") || undefined;
  const activeParam = sp.get("active");
  const dateMinParam = sp.get("dateMin");
  const search = sp.get("search")?.trim().toLowerCase() || undefined;
  const limit = Math.min(parseInt(sp.get("limit") || "20", 10), 100);
  const offset = Math.max(parseInt(sp.get("offset") || "0", 10), 0);

  const where: Record<string, unknown> = {};
  if (concurrentId) where.concurrentId = concurrentId;
  if (activeParam === "true") where.active = true;
  else if (activeParam === "false") where.active = false;
  if (plateforme) where.plateformes = { has: plateforme };
  if (dateMinParam) {
    const d = new Date(dateMinParam);
    if (!isNaN(d.getTime())) where.dateDebut = { gte: d };
  }
  if (search) {
    where.OR = [
      { texte: { contains: search, mode: "insensitive" } },
      { titre: { contains: search, mode: "insensitive" } },
      { caption: { contains: search, mode: "insensitive" } },
    ];
  }

  const [pubs, total, concurrents] = await Promise.all([
    prisma.pubConcurrent.findMany({
      where,
      orderBy: { dateDebut: "desc" },
      take: limit,
      skip: offset,
      include: {
        concurrent: { select: { id: true, nom: true, categorie: true } },
      },
    }),
    prisma.pubConcurrent.count({ where }),
    prisma.concurrent.findMany({
      where: { actif: true },
      orderBy: { nom: "asc" },
      select: { id: true, nom: true, categorie: true, pageId: true, derniereSync: true },
    }),
  ]);

  return NextResponse.json({
    success: true,
    pubs: pubs.map((p) => ({
      id: p.id,
      adArchiveId: p.adArchiveId,
      snapshotUrl: p.snapshotUrl,
      texte: p.texte,
      titre: p.titre,
      caption: p.caption,
      plateformes: p.plateformes,
      dateDebut: p.dateDebut,
      dateFin: p.dateFin,
      active: p.active,
      recupereLe: p.recupereLe,
      concurrent: p.concurrent,
    })),
    total,
    concurrents,
    pagination: { limit, offset, hasMore: offset + pubs.length < total },
  });
}
