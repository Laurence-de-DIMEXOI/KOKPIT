import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TYPES_COUT = [
  { value: "meta_ads", label: "Meta Ads" },
  { value: "google_ads", label: "Google Ads" },
  { value: "salon", label: "Salon / Événement" },
  { value: "agence", label: "Agence" },
  { value: "print", label: "Print / Flyer" },
  { value: "autre", label: "Autre" },
];

// GET /api/marketing/roi — Dashboard ROI avec CA Sellsy + dépenses
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const annee = req.nextUrl.searchParams.get("annee") || String(new Date().getFullYear());

  // Récupérer tous les coûts marketing de l'année
  const couts = await prisma.coutMarketing.findMany({
    where: { periode: { startsWith: annee } },
    include: { createdBy: { select: { nom: true, prenom: true } } },
    orderBy: { periode: "asc" },
  });

  // Récupérer le CA mensuel depuis les ventes en base
  const ventes = await prisma.vente.findMany({
    where: {
      createdAt: {
        gte: new Date(`${annee}-01-01`),
        lt: new Date(`${parseInt(annee) + 1}-01-01`),
      },
    },
    select: { montant: true, createdAt: true },
  });

  // Grouper CA par mois
  const caMensuel: Record<string, number> = {};
  for (const v of ventes) {
    const mois = v.createdAt.toISOString().substring(0, 7); // "2026-03"
    caMensuel[mois] = (caMensuel[mois] || 0) + v.montant;
  }

  // Grouper dépenses par mois et type
  const depensesMensuel: Record<string, number> = {};
  const depensesParType: Record<string, number> = {};
  for (const c of couts) {
    depensesMensuel[c.periode] = (depensesMensuel[c.periode] || 0) + c.montant;
    depensesParType[c.type] = (depensesParType[c.type] || 0) + c.montant;
  }

  // Construire le tableau mensuel
  const mois = [];
  for (let m = 1; m <= 12; m++) {
    const periode = `${annee}-${String(m).padStart(2, "0")}`;
    const ca = caMensuel[periode] || 0;
    const depenses = depensesMensuel[periode] || 0;
    const roi = depenses > 0 ? Math.round(((ca - depenses) / depenses) * 100) : 0;
    mois.push({ periode, ca, depenses, roi });
  }

  // Totaux annuels
  const totalCA = Object.values(caMensuel).reduce((s, v) => s + v, 0);
  const totalDepenses = couts.reduce((s, c) => s + c.montant, 0);
  const roiAnnuel = totalDepenses > 0 ? Math.round(((totalCA - totalDepenses) / totalDepenses) * 100) : 0;
  const cac = ventes.length > 0 && totalDepenses > 0 ? Math.round(totalDepenses / ventes.length) : 0;

  return NextResponse.json({
    annee,
    kpis: {
      totalCA: Math.round(totalCA),
      totalDepenses: Math.round(totalDepenses),
      roiAnnuel,
      cac,
      nbVentes: ventes.length,
    },
    mois,
    depensesParType: TYPES_COUT.map((t) => ({
      type: t.value,
      label: t.label,
      montant: Math.round(depensesParType[t.value] || 0),
    })),
    couts,
    typesCout: TYPES_COUT,
  });
}

// POST /api/marketing/roi — Ajouter un coût marketing
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["ADMIN", "DIRECTION", "MARKETING"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const { periode, type, libelle, montant } = body;

  if (!periode || !type || !libelle || montant === undefined) {
    return NextResponse.json({ error: "Champs requis : periode, type, libelle, montant" }, { status: 400 });
  }

  const cout = await prisma.coutMarketing.create({
    data: {
      periode,
      type,
      libelle,
      montant: parseFloat(montant),
      createdById: (session.user as any).id,
    },
  });

  return NextResponse.json(cout, { status: 201 });
}

// DELETE /api/marketing/roi — Supprimer un coût
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["ADMIN", "DIRECTION"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  await prisma.coutMarketing.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
