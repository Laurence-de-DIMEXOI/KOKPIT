import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ reference: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { reference } = await params;

  const bdc = await prisma.bdcArrivage.findFirst({
    where: { bdcReference: decodeURIComponent(reference) },
    include: {
      arrivage: {
        select: {
          id: true,
          reference: true,
          dateDepart: true,
          dateLivraisonEstimee: true,
          statut: true,
          notes: true,
        },
      },
    },
  });

  if (!bdc) return NextResponse.json(null);

  return NextResponse.json(bdc);
}
