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

  const mois = req.nextUrl.searchParams.get("mois");
  if (!mois || !/^\d{4}-\d{2}$/.test(mois)) {
    return NextResponse.json(
      { error: "Paramètre mois requis (format YYYY-MM)" },
      { status: 400 }
    );
  }

  const [annee, m] = mois.split("-").map(Number);
  const debut = new Date(annee, m - 1, 1);
  const fin = new Date(annee, m, 0, 23, 59, 59);

  const pointages = await prisma.pointage.findMany({
    where: { date: { gte: debut, lte: fin } },
    include: {
      user: { select: { nom: true, prenom: true } },
      corrigePar: { select: { nom: true, prenom: true } },
    },
    orderBy: [{ user: { nom: "asc" } }, { date: "asc" }],
  });

  // Générer le CSV
  const formatTime = (d: Date | null): string => {
    if (!d) return "";
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Indian/Reunion",
    });
  };

  const formatDate = (d: Date): string => {
    return d.toLocaleDateString("fr-FR", { timeZone: "Indian/Reunion" });
  };

  const header =
    "Nom,Prénom,Date,Arrivée,Début pause,Fin pause,Départ,Heures travaillées,Heures supp,Corrigé par,Note correction";

  const rows = pointages.map((p) => {
    const corrige = p.corrigePar
      ? `${p.corrigePar.prenom} ${p.corrigePar.nom}`
      : "";
    return [
      p.user.nom,
      p.user.prenom || "",
      formatDate(p.date),
      formatTime(p.arrivee),
      formatTime(p.debutPause),
      formatTime(p.finPause),
      formatTime(p.depart),
      p.heuresTravaillees?.toFixed(2) || "",
      p.heuresSupp?.toFixed(2) || "",
      corrige,
      (p.noteCorrection || "").replace(/,/g, ";"),
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");
  const filename = `pointage-${mois}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
