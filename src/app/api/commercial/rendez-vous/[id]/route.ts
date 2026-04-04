import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/commercial/rendez-vous/[id]
 * Changer statut : CONFIRME → HONORE ou CONFIRME → ANNULE
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const newStatut = body.statut as string;

  if (!["HONORE", "ANNULE"].includes(newStatut)) {
    return NextResponse.json(
      { error: "Statut invalide. Valeurs acceptées : HONORE, ANNULE" },
      { status: 400 }
    );
  }

  const rdv = await prisma.rendezVous.findUnique({ where: { id } });
  if (!rdv) {
    return NextResponse.json({ error: "RDV introuvable" }, { status: 404 });
  }

  if (rdv.statut !== "CONFIRME") {
    return NextResponse.json(
      { error: `Transition impossible : ${rdv.statut} → ${newStatut}` },
      { status: 400 }
    );
  }

  const updated = await prisma.rendezVous.update({
    where: { id },
    data: { statut: newStatut },
  });

  // Logger l'événement
  const typeEvt = newStatut === "HONORE" ? "RDV_PRIS" : "RDV_ANNULE";
  const desc =
    newStatut === "HONORE"
      ? "RDV marqué comme honoré par le commercial"
      : "RDV marqué comme annulé par le commercial";

  await prisma.evenement.create({
    data: {
      contactId: rdv.contactId,
      type: typeEvt,
      description: desc,
      metadata: { rendezVousId: rdv.id, changedBy: session.user.id },
    },
  });

  return NextResponse.json({ success: true, rdv: updated });
}
