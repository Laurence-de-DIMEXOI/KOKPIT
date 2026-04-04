import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const body = await req.json();
  const { bdcSellsyId, bdcReference, clientNom, notes } = body;

  if (!bdcReference?.trim())
    return NextResponse.json({ error: "La référence BDC est obligatoire" }, { status: 400 });

  // Upsert — si déjà lié, mettre à jour clientNom/notes
  const bdc = await prisma.bdcArrivage.upsert({
    where: {
      arrivageId_bdcSellsyId: {
        arrivageId: id,
        bdcSellsyId: bdcSellsyId || bdcReference.trim(),
      },
    },
    create: {
      arrivageId: id,
      bdcSellsyId: bdcSellsyId || bdcReference.trim(),
      bdcReference: bdcReference.trim(),
      clientNom: clientNom?.trim() || null,
      notes: notes?.trim() || null,
      liePar: (session.user as any).id,
    },
    update: {
      clientNom: clientNom?.trim() || null,
      notes: notes?.trim() || null,
    },
  });

  return NextResponse.json(bdc, { status: 201 });
}
