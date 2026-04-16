import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolvePageIdFromUrl } from "@/lib/meta-ad-library";

export const dynamic = "force-dynamic";

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

// PATCH /api/veille/concurrents/[id] — update partiel (nom, url, categorie, actif, pageId manuel)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireAccess();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const { id } = await params;
  let body: {
    nom?: string;
    pageUrl?: string;
    pageId?: string | null;
    categorie?: string | null;
    actif?: boolean;
    resolve?: boolean; // si true : tenter une résolution auto du Page ID depuis pageUrl
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.nom === "string") data.nom = body.nom.trim();
  if (typeof body.pageUrl === "string") data.pageUrl = body.pageUrl.trim();
  if (body.pageId === null || typeof body.pageId === "string") data.pageId = body.pageId;
  if (body.categorie === null || typeof body.categorie === "string") data.categorie = body.categorie;
  if (typeof body.actif === "boolean") data.actif = body.actif;

  // Résolution auto optionnelle
  if (body.resolve && typeof body.pageUrl === "string" && body.pageUrl.trim()) {
    const resolved = await resolvePageIdFromUrl(body.pageUrl.trim()).catch(() => null);
    if (resolved?.pageId) data.pageId = resolved.pageId;
  }

  try {
    const concurrent = await prisma.concurrent.update({
      where: { id },
      data,
    });
    return NextResponse.json({ success: true, concurrent });
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Concurrent introuvable" }, { status: 404 });
    }
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "Conflit : nom ou Page ID déjà utilisé" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/veille/concurrents/[id] — suppression en cascade (pubs + snapshots supprimés)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireAccess();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const { id } = await params;
  try {
    await prisma.concurrent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Concurrent introuvable" }, { status: 404 });
    }
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
