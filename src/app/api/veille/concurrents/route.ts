import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolvePageIdFromUrl } from "@/lib/meta-ad-library";

export const dynamic = "force-dynamic";

// Rôles autorisés à gérer les concurrents : ADMIN + MARKETING (+ DIRECTION pour cohérence).
const ALLOWED_ROLES = new Set(["ADMIN", "MARKETING", "DIRECTION"]);

async function requireAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, status: 401, error: "Non autorisé" } as const;
  const role = (session.user as { role?: string }).role;
  if (!role || !ALLOWED_ROLES.has(role)) {
    return { ok: false, status: 403, error: "Accès refusé" } as const;
  }
  return { ok: true as const };
}

// GET /api/veille/concurrents — liste
export async function GET() {
  const access = await requireAccess();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const concurrents = await prisma.concurrent.findMany({
    orderBy: { nom: "asc" },
    include: {
      _count: { select: { pubs: true } },
    },
  });

  return NextResponse.json({
    success: true,
    concurrents: concurrents.map((c) => ({
      id: c.id,
      nom: c.nom,
      pageId: c.pageId,
      pageUrl: c.pageUrl,
      categorie: c.categorie,
      actif: c.actif,
      derniereSync: c.derniereSync,
      pubCount: c._count.pubs,
      createdAt: c.createdAt,
    })),
  });
}

// POST /api/veille/concurrents — créer + résoudre pageId auto
export async function POST(req: NextRequest) {
  const access = await requireAccess();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  let body: { nom?: string; pageUrl?: string; categorie?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const nom = (body.nom || "").trim();
  const pageUrl = (body.pageUrl || "").trim();
  const categorie = body.categorie?.trim() || null;

  if (!nom) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }
  if (!pageUrl || !/facebook\.com|fb\.com/.test(pageUrl)) {
    return NextResponse.json({ error: "URL Facebook invalide" }, { status: 400 });
  }

  // Tentative de résolution automatique du Page ID
  const resolved = await resolvePageIdFromUrl(pageUrl).catch(() => null);
  const pageId = resolved?.pageId ?? null;

  try {
    const concurrent = await prisma.concurrent.create({
      data: { nom, pageUrl, categorie, pageId, actif: true },
    });
    return NextResponse.json({
      success: true,
      concurrent,
      resolved: pageId !== null,
      message: pageId
        ? `Page ID résolu : ${pageId}`
        : "Page ID non résolu automatiquement — à renseigner manuellement",
    });
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "Un concurrent avec ce nom ou ce Page ID existe déjà" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
