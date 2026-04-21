import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculerHeuresTravaillees, getReunionDateJour } from "@/data/pointage-config";
import { estSemaineCafe, getMessageCafe } from "@/data/cafe-planning";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // SÉCURITÉ : userId TOUJOURS depuis la session, jamais depuis le body
  const sessionUserId = (session.user as any).id;

  const body = await req.json();
  const { action, pourUserId } = body;

  // Délégation : si pourUserId est fourni, vérifier que la session user est bien le délégué
  let userId = sessionUserId;
  if (pourUserId && pourUserId !== sessionUserId) {
    const targetUser = await prisma.user.findUnique({
      where: { id: pourUserId },
      select: { pointageDelegueId: true, pointageActif: true },
    });
    if (!targetUser || targetUser.pointageDelegueId !== sessionUserId) {
      return NextResponse.json({ error: "Vous n'êtes pas autorisé à pointer pour cette personne" }, { status: 403 });
    }
    userId = pourUserId;
  }

  const validActions = ["arrivee", "debutPause", "finPause", "depart"];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  }

  // Date du jour La Réunion (UTC+4) pour le @@unique
  const now = new Date();
  const dateJour = getReunionDateJour(now);

  // Récupérer ou créer le pointage du jour
  let pointage = await prisma.pointage.findUnique({
    where: { userId_date: { userId, date: dateJour } },
  });

  // Valider les transitions d'état
  if (action === "arrivee") {
    if (pointage?.arrivee) {
      return NextResponse.json({ error: "Arrivée déjà pointée" }, { status: 400 });
    }
  } else if (action === "debutPause") {
    if (!pointage?.arrivee) {
      return NextResponse.json({ error: "Pointez d'abord votre arrivée" }, { status: 400 });
    }
    if (pointage.debutPause) {
      return NextResponse.json({ error: "Pause déjà commencée" }, { status: 400 });
    }
  } else if (action === "finPause") {
    if (!pointage?.debutPause) {
      return NextResponse.json({ error: "Vous n'êtes pas en pause" }, { status: 400 });
    }
    if (pointage.finPause) {
      return NextResponse.json({ error: "Pause déjà terminée" }, { status: 400 });
    }
  } else if (action === "depart") {
    if (!pointage?.arrivee) {
      return NextResponse.json({ error: "Pointez d'abord votre arrivée" }, { status: 400 });
    }
    if (pointage.depart) {
      return NextResponse.json({ error: "Départ déjà pointé" }, { status: 400 });
    }
  }

  // Préparer les données de mise à jour
  const updateData: any = { [action]: now };

  // Si c'est le départ, calculer les heures
  if (action === "depart") {
    const arrivee = pointage!.arrivee!;
    const { heuresTravaillees, heuresSupp } = calculerHeuresTravaillees(
      arrivee,
      now,
      pointage!.debutPause,
      pointage!.finPause,
      undefined,
      dateJour
    );
    updateData.heuresTravaillees = heuresTravaillees;
    updateData.heuresSupp = heuresSupp;
  }

  // Upsert (create si premier pointage du jour, update sinon)
  const result = await prisma.pointage.upsert({
    where: { userId_date: { userId, date: dateJour } },
    create: {
      userId,
      date: dateJour,
      ...updateData,
    },
    update: updateData,
  });

  // Si départ : accumuler les heures supp/manque dans le solde cumulé
  if (action === "depart" && updateData.heuresSupp != null) {
    await prisma.user.update({
      where: { id: userId },
      data: { soldeHeures: { increment: updateData.heuresSupp } },
    });
  }

  // Si c'est l'arrivée, vérifier si c'est la semaine café de l'utilisateur
  let cafe: { message: string } | null = null;
  if (action === "arrivee") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { prenom: true },
    });
    if (user && estSemaineCafe(user.prenom)) {
      cafe = { message: getMessageCafe() };
    }
  }

  return NextResponse.json({ ...result, cafe });
}
