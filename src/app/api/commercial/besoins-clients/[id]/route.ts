import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const WRITE_ROLES = ["ADMIN", "DIRECTION", "MARKETING", "COMMERCIAL"];
const STATUTS = ["EN_ATTENTE", "CONTACTE", "SATISFAIT", "ANNULE"];
const CATEGORIES = ["CUISINE", "DRESSING", "SDB", "SALON", "CHAMBRE", "EXTERIEUR", "AUTRE"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  const { id } = await params;
  const item = await prisma.besoinClient.findUnique({
    where: { id },
    include: { createdBy: { select: { nom: true, prenom: true } }, matches: { orderBy: { score: "desc" } } },
  });
  if (!item) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  return NextResponse.json(item);
}

// PUT — maj partielle du besoin (statut, notes, coordonnées, mots-clés…)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  if (!WRITE_ROLES.includes(session.user.role)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.besoinClient.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });

  const body = await request.json();
  const data: any = {};
  if (body.nomClient !== undefined) data.nomClient = String(body.nomClient).trim();
  if (body.telephone !== undefined) data.telephone = String(body.telephone).trim() || null;
  if (body.email !== undefined) data.email = String(body.email).trim() || null;
  if (body.recherche !== undefined) data.recherche = String(body.recherche).trim();
  if (body.motsCles !== undefined) data.motsCles = String(body.motsCles).trim() || null;
  if (body.delai !== undefined) data.delai = String(body.delai).trim() || null;
  if (body.notes !== undefined) data.notes = String(body.notes).trim() || null;
  if (body.categorie !== undefined) {
    const c = String(body.categorie).toUpperCase();
    data.categorie = CATEGORIES.includes(c) ? c : null;
  }
  if (body.statut !== undefined && STATUTS.includes(body.statut)) data.statut = body.statut;

  const updated = await prisma.besoinClient.update({
    where: { id },
    data,
    include: { createdBy: { select: { nom: true, prenom: true } }, matches: { orderBy: { score: "desc" } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  if (!WRITE_ROLES.includes(session.user.role)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const { id } = await params;
  await prisma.besoinClient.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
