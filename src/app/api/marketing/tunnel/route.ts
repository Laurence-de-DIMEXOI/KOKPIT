import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/marketing/tunnel
 *   ?periode=jour|semaine|mois|annee|custom
 *   &dateDebut=YYYY-MM-DD
 *   &dateFin=YYYY-MM-DD
 *
 * Retourne les KPI du tunnel marketing :
 * - Demandes reçues
 * - Devis liés (AttributionDevis, fenêtre 7j)
 * - BDC liés (AttributionBDC, fenêtre 30j)
 * - CA attribué (somme bdcCA)
 * - ROAS (CA / dépenses CoutMarketing)
 * - Répartition par source UTM
 */

type Periode = "jour" | "semaine" | "mois" | "annee" | "custom";

function resolvePeriode(periode: Periode, dateDebut?: string | null, dateFin?: string | null): { debut: Date; fin: Date } {
  const now = new Date();
  const fin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let debut: Date;

  switch (periode) {
    case "jour":
      debut = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      break;
    case "semaine": {
      const d = new Date(now);
      const dow = (d.getDay() + 6) % 7; // lundi = 0
      d.setDate(d.getDate() - dow);
      d.setHours(0, 0, 0, 0);
      debut = d;
      break;
    }
    case "mois":
      debut = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    case "annee":
      debut = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      break;
    case "custom":
      debut = dateDebut ? new Date(`${dateDebut}T00:00:00.000`) : new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        debut,
        fin: dateFin ? new Date(`${dateFin}T23:59:59.999`) : fin,
      };
    default:
      debut = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }

  return { debut, fin };
}

function normalizeSource(lead: { utmSource: string | null; utmMedium: string | null; source: string }): string {
  const utm = (lead.utmSource || "").toLowerCase();
  if (utm.includes("facebook") || utm.includes("instagram") || utm === "fb" || utm === "ig" || utm === "meta") {
    return "Meta Ads";
  }
  if (utm.includes("google")) return "Google Ads";
  if (utm === "email" || (lead.utmMedium || "").toLowerCase() === "email") return "Email";

  switch (lead.source) {
    case "META_ADS": return "Meta Ads";
    case "GOOGLE_ADS": return "Google Ads";
    case "SITE_WEB": return "Direct";
    case "SALON": return "Salon";
    case "FORMULAIRE": return "Formulaire";
    case "GLIDE": return "Glide";
    default: return "Direct";
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const url = new URL(request.url);
  const periode = (url.searchParams.get("periode") || "mois") as Periode;
  const dateDebut = url.searchParams.get("dateDebut");
  const dateFin = url.searchParams.get("dateFin");

  const { debut, fin } = resolvePeriode(periode, dateDebut, dateFin);

  try {
    // Leads de la période avec leurs attributions
    const leads = await prisma.lead.findMany({
      where: { createdAt: { gte: debut, lte: fin } },
      select: {
        id: true,
        source: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        attributionsDevis: { select: { id: true, devisCA: true } },
        attributionsBDC: { select: { id: true, bdcCA: true } },
      },
    });

    const demandes = leads.length;
    let devisLies = 0;
    let bdcLies = 0;
    let caAttribue = 0;
    let caDevis = 0;

    // Agrégation par source normalisée
    const parSource = new Map<string, { demandes: number; devis: number; bdc: number; caAttribue: number }>();

    for (const l of leads) {
      const srcKey = normalizeSource({ utmSource: l.utmSource, utmMedium: l.utmMedium, source: l.source });
      const agg = parSource.get(srcKey) || { demandes: 0, devis: 0, bdc: 0, caAttribue: 0 };
      agg.demandes++;

      if (l.attributionsDevis.length > 0) {
        devisLies++;
        agg.devis++;
        caDevis += l.attributionsDevis.reduce((s, a) => s + a.devisCA, 0);
      }
      if (l.attributionsBDC.length > 0) {
        bdcLies++;
        agg.bdc++;
        const caLead = l.attributionsBDC.reduce((s, a) => s + a.bdcCA, 0);
        caAttribue += caLead;
        agg.caAttribue += caLead;
      }

      parSource.set(srcKey, agg);
    }

    const conversion = demandes > 0 ? (bdcLies / demandes) * 100 : 0;

    // Dépenses marketing sur la période
    let depenses = 0;
    // Source 1 : CoutOffline (saisie manuelle par date)
    try {
      const couts = await prisma.coutOffline.findMany({
        where: { date: { gte: debut, lte: fin } },
        select: { montant: true },
      });
      depenses += couts.reduce((s, c) => s + c.montant, 0);
    } catch { /* ignore */ }

    // Source 2 : CoutMarketing (par mois YYYY-MM)
    try {
      const moisCouverts = new Set<string>();
      const cursor = new Date(debut.getFullYear(), debut.getMonth(), 1);
      while (cursor <= fin) {
        const mois = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
        moisCouverts.add(mois);
        cursor.setMonth(cursor.getMonth() + 1);
      }
      if (moisCouverts.size > 0) {
        const coutsMarketing = await prisma.coutMarketing.findMany({
          where: { periode: { in: Array.from(moisCouverts) } },
          select: { montant: true },
        });
        depenses += coutsMarketing.reduce((s, c) => s + c.montant, 0);
      }
    } catch { /* ignore */ }

    const roas = depenses > 0 ? caAttribue / depenses : null;

    const parSourceArray = Array.from(parSource.entries())
      .map(([source, v]) => ({
        source,
        demandes: v.demandes,
        devis: v.devis,
        bdc: v.bdc,
        caAttribue: Math.round(v.caAttribue * 100) / 100,
        conversion: v.demandes > 0 ? Math.round((v.bdc / v.demandes) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.demandes - a.demandes);

    return NextResponse.json({
      periode,
      debut: debut.toISOString(),
      fin: fin.toISOString(),
      demandes,
      devisLies,
      bdcLies,
      caAttribue: Math.round(caAttribue * 100) / 100,
      caDevis: Math.round(caDevis * 100) / 100,
      conversion: Math.round(conversion * 10) / 10,
      depenses: Math.round(depenses * 100) / 100,
      roas: roas === null ? null : Math.round(roas * 10) / 10,
      parSource: parSourceArray,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("GET /api/marketing/tunnel:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
