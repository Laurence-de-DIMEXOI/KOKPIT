import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculerJoursOuvres } from "@/data/conges-config";
import { sendEmail } from "@/lib/resend";

const MICHELLE_EMAIL = "michelle.perrot@dimexoi.fr";
const MICHELLE_ID = "1825c25e-45ed-49b6-9ce9-9ed62d085ab5";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId");
  const statut = searchParams.get("statut");
  const annee = searchParams.get("annee") || String(new Date().getFullYear());
  const mois = searchParams.get("mois");

  const where: Record<string, unknown> = {};

  if (userId) {
    where.userId = userId;
  }

  if (statut) {
    where.statut = statut;
  }

  // Filtre par annee
  const startOfYear = new Date(`${annee}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${annee}-12-31T23:59:59.999Z`);

  if (mois) {
    const m = mois.padStart(2, "0");
    const startOfMonth = new Date(`${annee}-${m}-01T00:00:00.000Z`);
    const lastDay = new Date(Number(annee), Number(m), 0).getDate();
    const endOfMonth = new Date(`${annee}-${m}-${lastDay}T23:59:59.999Z`);
    where.dateDebut = {
      gte: startOfMonth,
      lte: endOfMonth,
    };
  } else {
    where.dateDebut = {
      gte: startOfYear,
      lte: endOfYear,
    };
  }

  const conges = await prisma.conge.findMany({
    where,
    include: {
      user: {
        select: { nom: true, prenom: true, couleur: true, titre: true },
      },
      approuvePar: {
        select: { nom: true, prenom: true },
      },
    },
    orderBy: { dateDebut: "desc" },
  });

  return NextResponse.json({ conges });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const body = await req.json();
  const { userId, type, periodes, notes } = body;

  if (!userId || !type || !periodes || !Array.isArray(periodes) || periodes.length === 0 || periodes.length > 4) {
    return NextResponse.json(
      { error: "Donnees invalides. Fournir userId, type, et 1 a 4 periodes." },
      { status: 400 }
    );
  }

  const user = session.user as { id: string; role?: string };
  const isAdminOrDirection = user.role === "ADMIN" || user.role === "DIRECTION";

  // Statut par defaut : en_attente, sauf si ADMIN/DIRECTION
  const statut = isAdminOrDirection ? "approuve" : "en_attente";

  const createdConges = [];

  for (const periode of periodes) {
    const { dateDebut, dateFin } = periode;

    if (!dateDebut || !dateFin) {
      return NextResponse.json(
        { error: "Chaque periode doit avoir dateDebut et dateFin." },
        { status: 400 }
      );
    }

    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    if (fin < debut) {
      return NextResponse.json(
        { error: `dateFin (${dateFin}) ne peut pas etre avant dateDebut (${dateDebut}).` },
        { status: 400 }
      );
    }

    const nbJours = calculerJoursOuvres(debut, fin);

    const conge = await prisma.conge.create({
      data: {
        userId,
        type,
        dateDebut: debut,
        dateFin: fin,
        nbJours,
        statut,
        notes: notes || null,
        ...(isAdminOrDirection
          ? {
              approuveParId: user.id,
              approuveLe: new Date(),
            }
          : {}),
      },
    });

    createdConges.push(conge);
  }

  // Auto-tâche pour Michelle si congé en attente de validation
  if (statut === "en_attente" && createdConges.length > 0) {
    const demandeur = await prisma.user.findUnique({
      where: { id: userId },
      select: { prenom: true, nom: true, email: true },
    });
    const nomDemandeur = demandeur ? `${demandeur.prenom} ${demandeur.nom}` : "Un collaborateur";
    const premierConge = createdConges[0];
    const totalJours = createdConges.reduce((s, c) => s + c.nbJours, 0);
    const dateDebutFR = new Date(premierConge.dateDebut).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    const dateFinFR = new Date(createdConges[createdConges.length - 1].dateFin).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

    // Tâche pour Michelle
    try {
      await prisma.task.create({
        data: {
          titre: `Valider congé — ${nomDemandeur}`,
          description: `${nomDemandeur} a demandé un congé à partir du ${dateDebutFR} (${totalJours}j). À valider dans Congés & Absences.`,
          assigneAId: MICHELLE_ID,
          createdById: user.id,
          echeance: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
      });
    } catch { /* silencieux si Michelle n'existe pas */ }

    // Email à Michelle
    await sendEmail({
      to: MICHELLE_EMAIL,
      subject: `Demande de congé — ${nomDemandeur}`,
      html: `
        <p>Bonjour Michelle,</p>
        <p><strong>${nomDemandeur}</strong> a soumis une demande de congé :</p>
        <ul>
          <li><strong>Du :</strong> ${dateDebutFR}</li>
          <li><strong>Au :</strong> ${dateFinFR}</li>
          <li><strong>Durée :</strong> ${totalJours} jour${totalJours > 1 ? "s" : ""}</li>
        </ul>
        <p>À valider dans <a href="https://kokpit.dimexoi.fr/conges">Congés &amp; Absences</a>.</p>
      `,
    });
  }

  return NextResponse.json({ conges: createdConges }, { status: 201 });
}
