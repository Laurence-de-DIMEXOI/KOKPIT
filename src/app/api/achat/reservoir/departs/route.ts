import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireUser() {
  const session = await getServerSession(authOptions);
  return session?.user ? session : null;
}

function parseDate(v: unknown): Date | null {
  if (!v || typeof v !== "string") return null;
  const d = new Date(v.length === 10 ? `${v}T00:00:00Z` : v);
  return isNaN(d.getTime()) ? null : d;
}

// GET — liste des départs planifiés (tri par date)
export async function GET() {
  if (!(await requireUser())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const departs = await prisma.departPrevu.findMany({ orderBy: { dateDepart: "asc" } });
  return NextResponse.json({ departs });
}

// POST — créer un départ
export async function POST(req: NextRequest) {
  if (!(await requireUser())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const dateDepart = parseDate(body.dateDepart);
  if (!dateDepart) return NextResponse.json({ error: "Date de départ requise" }, { status: 400 });
  const created = await prisma.departPrevu.create({
    data: {
      dateDepart,
      dateArrivee: parseDate(body.dateArrivee),
      capaciteMeubles: Number(body.capaciteMeubles) > 0 ? Math.round(Number(body.capaciteMeubles)) : 130,
      navire: body.navire?.toString().trim() || null,
      note: body.note?.toString().trim() || null,
    },
  });
  return NextResponse.json({ ok: true, depart: created });
}

// PUT — modifier un départ (id dans le body)
export async function PUT(req: NextRequest) {
  if (!(await requireUser())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const data: Record<string, unknown> = {};
  if (body.dateDepart !== undefined) { const d = parseDate(body.dateDepart); if (d) data.dateDepart = d; }
  if (body.dateArrivee !== undefined) data.dateArrivee = parseDate(body.dateArrivee);
  if (body.capaciteMeubles !== undefined) data.capaciteMeubles = Number(body.capaciteMeubles) > 0 ? Math.round(Number(body.capaciteMeubles)) : 130;
  if (body.navire !== undefined) data.navire = body.navire?.toString().trim() || null;
  if (body.note !== undefined) data.note = body.note?.toString().trim() || null;
  const updated = await prisma.departPrevu.update({ where: { id: body.id }, data });
  return NextResponse.json({ ok: true, depart: updated });
}

// DELETE — supprimer un départ (?id=)
export async function DELETE(req: NextRequest) {
  if (!(await requireUser())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  await prisma.departPrevu.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
