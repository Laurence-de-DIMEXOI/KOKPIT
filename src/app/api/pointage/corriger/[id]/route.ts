import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculerHeuresTravaillees } from "@/data/pointage-config";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["ADMIN", "DIRECTION"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { arrivee, debutPause, finPause, depart, noteCorrection } = body;

  if (!noteCorrection || noteCorrection.trim() === "") {
    return NextResponse.json(
      { error: "La note de correction est obligatoire" },
      { status: 400 }
    );
  }

  const pointage = await prisma.pointage.findUnique({ where: { id } });
  if (!pointage) {
    return NextResponse.json({ error: "Pointage introuvable" }, { status: 404 });
  }

  // Préparer les nouvelles valeurs
  const newArrivee = arrivee ? new Date(arrivee) : pointage.arrivee;
  const newDebutPause = debutPause ? new Date(debutPause) : pointage.debutPause;
  const newFinPause = finPause ? new Date(finPause) : pointage.finPause;
  const newDepart = depart ? new Date(depart) : pointage.depart;

  // Recalculer les heures si arrivée et départ sont présents
  let heuresTravaillees = pointage.heuresTravaillees;
  let heuresSupp = pointage.heuresSupp;

  if (newArrivee && newDepart) {
    const calc = calculerHeuresTravaillees(
      newArrivee,
      newDepart,
      newDebutPause,
      newFinPause
    );
    heuresTravaillees = calc.heuresTravaillees;
    heuresSupp = calc.heuresSupp;
  }

  const updated = await prisma.pointage.update({
    where: { id },
    data: {
      arrivee: newArrivee,
      debutPause: newDebutPause,
      finPause: newFinPause,
      depart: newDepart,
      heuresTravaillees,
      heuresSupp,
      corrigeParId: (session.user as any).id,
      noteCorrection: noteCorrection.trim(),
      corrigeLe: new Date(),
    },
    include: {
      user: { select: { nom: true, prenom: true } },
    },
  });

  return NextResponse.json(updated);
}
