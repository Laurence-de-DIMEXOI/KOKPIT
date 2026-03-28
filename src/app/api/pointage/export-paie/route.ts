import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

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

  // Calcul des jours ouvrés du mois (lun–sam, hors dim)
  function joursOuvres(d: Date, f: Date): number {
    let count = 0;
    const cur = new Date(d);
    while (cur <= f) {
      const day = cur.getDay();
      if (day !== 0) count++; // 0 = dimanche
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }
  const nbJoursOuvres = joursOuvres(debut, new Date(annee, m, 0)); // dernier jour du mois

  const pointages = await prisma.pointage.findMany({
    where: { date: { gte: debut, lte: fin } },
    include: {
      user: { select: { id: true, nom: true, prenom: true } },
    },
    orderBy: [{ user: { nom: "asc" } }, { date: "asc" }],
  });

  // Conges validés sur le mois (pour info)
  const conges = await prisma.conge.findMany({
    where: {
      statut: "approuve",
      OR: [
        { dateDebut: { gte: debut, lte: fin } },
        { dateFin: { gte: debut, lte: fin } },
      ],
    },
    include: { user: { select: { id: true } } },
  });

  // Agréger par utilisateur
  const byUser = new Map<
    string,
    {
      nom: string;
      prenom: string;
      jours: number;
      heuresTotales: number;
      heuresSupp: number;
      joursConge: number;
    }
  >();

  for (const p of pointages) {
    const key = p.userId;
    if (!byUser.has(key)) {
      byUser.set(key, {
        nom: p.user.nom,
        prenom: p.user.prenom || "",
        jours: 0,
        heuresTotales: 0,
        heuresSupp: 0,
        joursConge: 0,
      });
    }
    const entry = byUser.get(key)!;
    entry.jours += 1;
    entry.heuresTotales += p.heuresTravaillees || 0;
    entry.heuresSupp += p.heuresSupp || 0;
  }

  // Compter jours de congé par user
  for (const c of conges) {
    const uid = c.userId;
    if (!byUser.has(uid)) continue;
    const entry = byUser.get(uid)!;
    // Compter les jours ouvrés du congé qui tombent dans le mois
    const deb = c.dateDebut > debut ? c.dateDebut : debut;
    const fend = c.dateFin < fin ? c.dateFin : fin;
    entry.joursConge += joursOuvres(deb, fend);
  }

  // Nom du mois en français
  const nomMois = debut.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

  // ── Feuille récapitulatif ──────────────────────────────────────────────────
  const HEURES_THEORIQUES_PAR_JOUR = 7;

  const summaryData = Array.from(byUser.values()).map((u) => {
    const heuresTheo = (nbJoursOuvres - u.joursConge) * HEURES_THEORIQUES_PAR_JOUR;
    const ecart = u.heuresTotales - heuresTheo;
    return {
      Nom: u.nom,
      Prénom: u.prenom,
      "Jours travaillés": u.jours,
      "Jours congé": u.joursConge,
      "Heures théoriques": parseFloat(heuresTheo.toFixed(2)),
      "Heures réelles": parseFloat(u.heuresTotales.toFixed(2)),
      "Heures supp": parseFloat(u.heuresSupp.toFixed(2)),
      "Écart (réel - théo)": parseFloat(ecart.toFixed(2)),
    };
  });

  // ── Feuille détail par jour ────────────────────────────────────────────────
  const tz = "Indian/Reunion";
  const fmt = (d: Date | null) =>
    d ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: tz }) : "";
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("fr-FR", { timeZone: tz });

  const detailData = pointages.map((p) => ({
    Nom: p.user.nom,
    Prénom: p.user.prenom || "",
    Date: fmtDate(p.date),
    Arrivée: fmt(p.arrivee),
    "Début pause": fmt(p.debutPause),
    "Fin pause": fmt(p.finPause),
    Départ: fmt(p.depart),
    "Heures travaillées": parseFloat((p.heuresTravaillees || 0).toFixed(2)),
    "Heures supp": parseFloat((p.heuresSupp || 0).toFixed(2)),
  }));

  // ── Construire le workbook ─────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  // Feuille récap
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  // Largeurs colonnes
  wsSummary["!cols"] = [
    { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 12 },
    { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Récapitulatif");

  // Feuille détail
  const wsDetail = XLSX.utils.json_to_sheet(detailData);
  wsDetail["!cols"] = [
    { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 10 },
    { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsDetail, "Détail pointages");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `fiches-paie-${mois}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
