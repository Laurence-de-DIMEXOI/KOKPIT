import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReunionDateJour } from "@/data/pointage-config";

/**
 * POST /api/pointage/recup
 * Consomme un nombre d'heures du solde de récup (heures supp).
 * Body: { userId, heures?, note?, date? }
 *   - heures : nombre d'heures à consommer (défaut : seuilRecup = 4h = demi-journée).
 *              Décimales acceptées (ex: 7, 3.5).
 *   - date   : date du pointage de récup (YYYY-MM-DD). Défaut : aujourd'hui Réunion.
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
  const { userId, heures, note, date } = body;

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

  // Montant à déduire — paramétrable, défaut = seuilRecup
  const heuresASoustraire = typeof heures === "number" && heures > 0 ? heures : seuilRecup;
  if (heuresASoustraire <= 0 || heuresASoustraire > 24) {
    return NextResponse.json({ error: "Heures invalides (entre 0 et 24)" }, { status: 400 });
  }

  if ((user.soldeHeures ?? 0) < heuresASoustraire) {
    return NextResponse.json({
      error: `Solde insuffisant : ${user.soldeHeures?.toFixed(2)}h (demande : ${heuresASoustraire}h)`,
    }, { status: 400 });
  }

  // Déduire les heures du solde
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { soldeHeures: { decrement: heuresASoustraire } },
    select: { soldeHeures: true },
  });

  // Créer/MAJ un pointage "récup" pour la date donnée (ou aujourd'hui)
  const now = new Date();
  const dateJour = date ? new Date(`${date}T00:00:00+04:00`) : getReunionDateJour(now);
  const libelle =
    heuresASoustraire === seuilRecup
      ? `Demi-journée de récup consommée (${heuresASoustraire}h)`
      : `Récup consommée (${heuresASoustraire}h)`;

  await prisma.pointage.upsert({
    where: { userId_date: { userId, date: dateJour } },
    create: {
      userId,
      date: dateJour,
      heuresTravaillees: heuresASoustraire,
      heuresSupp: 0,
      noteCorrection: `${libelle}${note ? ` — ${note}` : ""}`,
      corrigeParId: (session.user as any).id,
      corrigeLe: now,
    },
    update: {
      noteCorrection: `${libelle}${note ? ` — ${note}` : ""}`,
      corrigeParId: (session.user as any).id,
      corrigeLe: now,
    },
  });

  return NextResponse.json({
    success: true,
    message: `${heuresASoustraire}h déduites du solde de ${user.prenom} ${user.nom}`,
    heuresConsommees: heuresASoustraire,
    nouveauSolde: Math.round((updated.soldeHeures ?? 0) * 100) / 100,
  });
}
