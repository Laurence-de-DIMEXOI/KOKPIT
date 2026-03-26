import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReunionDateJour } from "@/data/pointage-config";

/**
 * POST /api/pointage/recup
 * Consomme une demi-journée de récup (déduit seuilRecup heures du solde).
 * Body: { userId, note? }
 * ADMIN/DIRECTION uniquement.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["ADMIN", "DIRECTION"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, note } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId requis" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, nom: true, prenom: true, soldeHeures: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const config = await prisma.configPointage.findFirst();
  const seuilRecup = config?.seuilRecup ?? 4;

  if ((user.soldeHeures ?? 0) < seuilRecup) {
    return NextResponse.json({
      error: `Solde insuffisant : ${user.soldeHeures?.toFixed(2)}h (minimum ${seuilRecup}h)`,
    }, { status: 400 });
  }

  // Déduire le seuil du solde
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { soldeHeures: { decrement: seuilRecup } },
    select: { soldeHeures: true },
  });

  // Créer un pointage "récup" pour la date du jour
  const now = new Date();
  const dateJour = getReunionDateJour(now);

  await prisma.pointage.upsert({
    where: { userId_date: { userId, date: dateJour } },
    create: {
      userId,
      date: dateJour,
      heuresTravaillees: seuilRecup,
      heuresSupp: 0,
      noteCorrection: `Demi-journée de récup consommée (${seuilRecup}h)${note ? ` — ${note}` : ""}`,
      corrigeParId: (session.user as any).id,
      corrigeLe: now,
    },
    update: {
      noteCorrection: `Demi-journée de récup consommée (${seuilRecup}h)${note ? ` — ${note}` : ""}`,
      corrigeParId: (session.user as any).id,
      corrigeLe: now,
    },
  });

  return NextResponse.json({
    success: true,
    message: `Récup consommée pour ${user.prenom} ${user.nom} (${seuilRecup}h déduites)`,
    nouveauSolde: Math.round((updated.soldeHeures ?? 0) * 100) / 100,
  });
}
