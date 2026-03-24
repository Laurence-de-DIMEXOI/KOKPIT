import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["ADMIN", "DIRECTION"].includes(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const dateParam = req.nextUrl.searchParams.get("date");
  const moisParam = req.nextUrl.searchParams.get("mois");

  // Récupérer les utilisateurs avec pointage actif uniquement
  const users = await prisma.user.findMany({
    where: { actif: true, pointageActif: true },
    select: { id: true, nom: true, prenom: true, couleur: true, role: true },
    orderBy: { nom: "asc" },
  });

  if (moisParam) {
    // Vue mensuelle : récap par collaborateur
    const [annee, mois] = moisParam.split("-").map(Number);
    const debut = new Date(annee, mois - 1, 1);
    const fin = new Date(annee, mois, 0, 23, 59, 59);

    const pointages = await prisma.pointage.findMany({
      where: { date: { gte: debut, lte: fin } },
      include: { user: { select: { id: true, nom: true, prenom: true, couleur: true } } },
      orderBy: [{ userId: "asc" }, { date: "asc" }],
    });

    // Récap par utilisateur
    const recapMap = new Map<string, {
      userId: string;
      nom: string;
      prenom: string;
      couleur: string | null;
      joursTravailles: number;
      totalHeures: number;
      totalSupp: number;
    }>();

    for (const u of users) {
      recapMap.set(u.id, {
        userId: u.id,
        nom: u.nom,
        prenom: u.prenom || "",
        couleur: u.couleur,
        joursTravailles: 0,
        totalHeures: 0,
        totalSupp: 0,
      });
    }

    for (const p of pointages) {
      const r = recapMap.get(p.userId);
      if (r && p.heuresTravaillees != null) {
        r.joursTravailles += 1;
        r.totalHeures += p.heuresTravaillees;
        r.totalSupp += p.heuresSupp || 0;
      }
    }

    // Compter jours ouvrés dans le mois (mardi-samedi, excluant jours fériés)
    let joursOuvres = 0;
    const d = new Date(debut);
    while (d <= fin) {
      const day = d.getDay();
      if (day >= 2 && day <= 6) joursOuvres++;
      d.setDate(d.getDate() + 1);
    }

    return NextResponse.json({
      mois: moisParam,
      joursOuvres,
      recap: Array.from(recapMap.values()).map((r) => ({
        ...r,
        totalHeures: Math.round(r.totalHeures * 100) / 100,
        totalSupp: Math.round(r.totalSupp * 100) / 100,
      })),
      pointages,
    });
  }

  // Vue journalière
  const date = dateParam ? new Date(dateParam) : new Date();
  const dateJour = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const pointages = await prisma.pointage.findMany({
    where: { date: dateJour },
    include: {
      user: { select: { id: true, nom: true, prenom: true, couleur: true } },
      corrigePar: { select: { nom: true, prenom: true } },
    },
  });

  // Ajouter les utilisateurs sans pointage
  const pointageMap = new Map(pointages.map((p) => [p.userId, p]));
  const equipe = users.map((u) => ({
    user: u,
    pointage: pointageMap.get(u.id) || null,
  }));

  return NextResponse.json({ date: dateJour.toISOString(), equipe });
}
