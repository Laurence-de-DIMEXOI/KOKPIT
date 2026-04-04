import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseExcelPrevisionnel } from "@/lib/import-previsionnel";

const WRITE_ROLES = ["ADMIN", "DIRECTION", "ACHAT"];

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role;
  if (!WRITE_ROLES.includes(role))
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;

  const arrivage = await prisma.arrivage.findUnique({ where: { id } });
  if (!arrivage) return NextResponse.json({ error: "Arrivage introuvable" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const arrivageIndexStr = formData.get("arrivageIndex") as string | null;

  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  const buffer = await file.arrayBuffer();
  const arrivages = parseExcelPrevisionnel(buffer);

  if (arrivages.length === 0)
    return NextResponse.json({ error: "Aucun arrivage détecté dans ce fichier" }, { status: 400 });

  // Si un index spécifique est fourni, on importe uniquement cet arrivage
  const arrivageIndex = arrivageIndexStr !== null ? parseInt(arrivageIndexStr) : null;
  const targetArrivage =
    arrivageIndex !== null && arrivageIndex >= 0 && arrivageIndex < arrivages.length
      ? arrivages[arrivageIndex]
      : arrivages[0];

  // Upsert : supprimer les anciennes lignes et recréer
  await prisma.ligneArrivage.deleteMany({ where: { arrivageId: id } });

  const lignes = await prisma.ligneArrivage.createMany({
    data: targetArrivage.lignes.map((l) => ({
      arrivageId: id,
      reference: l.refSellsy || l.bcdiReference,
      designation: l.designation,
      quantite: l.quantite,
      notes: l.moisClient || null,
    })),
  });

  return NextResponse.json({
    success: true,
    arrivagesDetectes: arrivages.map((a, i) => ({ index: i, dateLabel: a.dateLabel, nbLignes: a.lignes.length })),
    imported: lignes.count,
    dateLabel: targetArrivage.dateLabel,
  });
}

// GET : parse only, returns preview without saving
export async function GET(req: Request, { params: _params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  // This endpoint is not used for GET — preview is handled client-side
  void url;
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
