import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/sellsy/document-chain/save — Sauvegarde manuelle d'une liaison
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const { enfantType, enfantSellsyId, enfantNumero, parentType, parentSellsyId, parentNumero } = body;

  if (!enfantType || !enfantSellsyId || !parentType || !parentSellsyId) {
    return NextResponse.json(
      { error: "Champs requis : enfantType, enfantSellsyId, parentType, parentSellsyId" },
      { status: 400 }
    );
  }

  try {
    const liaison = await prisma.liaisonDocumentaire.upsert({
      where: {
        enfantType_enfantSellsyId: {
          enfantType,
          enfantSellsyId: String(enfantSellsyId),
        },
      },
      update: {
        parentType,
        parentSellsyId: String(parentSellsyId),
        parentNumero: parentNumero || "",
        confirmeManuel: true,
      },
      create: {
        enfantType,
        enfantSellsyId: String(enfantSellsyId),
        enfantNumero: enfantNumero || "",
        parentType,
        parentSellsyId: String(parentSellsyId),
        parentNumero: parentNumero || "",
        confirmeManuel: true,
      },
    });

    return NextResponse.json({ success: true, liaison });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
