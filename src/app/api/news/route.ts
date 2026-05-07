import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STATIC_NEWS, type NewsItem } from "@/lib/news-config";
import { getResponsableCafe } from "@/data/cafe-planning";
import { getPageViewsByPath } from "@/lib/ga4";
import { prochainFerie, formatFerieFR } from "@/lib/feries";
import { reportingFilterVente } from "@/lib/reporting-filter";

/**
 * GET /api/news
 *
 * Items affichés dans la NewsTicker (topbar) :
 *  - items statiques (cf. src/lib/news-config.ts)
 *  - items dynamiques :
 *      • CA BDC du mois en cours — récupéré DIRECT de Sellsy (cohérent avec
 *        le dashboard commercial)
 *      • Top vente du mois (commercial avec le plus gros CA Sellsy)
 *      • Prochain jour férié à La Réunion
 *
 * Cache : 10 min côté serveur (Sellsy = appels coûteux).
 */

let cache: { data: NewsItem[]; expires: number } | null = null;
const TTL_MS = 2 * 60 * 1000; // 2 min — refresh assez fréquent pour suivre les nouvelles ventes

function eur(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}


export async function GET() {
  if (cache && Date.now() < cache.expires) {
    return NextResponse.json({ items: cache.data, cached: true });
  }

  const items: NewsItem[] = [];

  // ====== 0. Rotation café — même source que le pop-up pointage ======
  try {
    const responsable = getResponsableCafe();
    if (responsable) {
      items.push({
        icon: "☕",
        text: `Semaine de ${responsable} pour la machine à café`,
        color: "text-amber-300",
      });
    }
  } catch (e) {
    console.warn("[news] Rotation café indisponible:", e);
  }

  // Items statiques (fixe : Teck Days + container)
  items.push(...STATIC_NEWS);

  // ====== 1. CA des BDC du mois en cours (KOKPIT base + filtre Laurence) ======
  // On query Vente locale (sync 2h) avec filtre standard (etatProduit + statutSellsy)
  // → cohérent avec les chiffres officiels que Laurence extrait de Sellsy.
  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
  const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  let ventesThisMonth: Array<{
    id: string;
    montant: number;
    contactId: string;
    contact: { nom: string; prenom: string | null } | null;
  }> = [];
  try {
    ventesThisMonth = await prisma.vente.findMany({
      where: {
        dateVente: { gte: debutMois, lt: finMois },
        ...reportingFilterVente(),
      },
      select: {
        id: true,
        montant: true,
        contactId: true,
        contact: { select: { nom: true, prenom: true } },
      },
    });
    const totalCA = ventesThisMonth.reduce((s, v) => s + v.montant, 0);
    if (totalCA > 0) {
      const moisLabel = debutMois.toLocaleDateString("fr-FR", { month: "long" });
      items.push({
        icon: "💶",
        text: `${eur(totalCA)} de BDC en ${moisLabel} (${ventesThisMonth.length} commandes)`,
        color: "text-emerald-300",
      });
    }
  } catch (e) {
    console.warn("[news] CA local indisponible:", e);
  }

  // ====== 1bis. Plus grosse commande du mois ======
  if (ventesThisMonth.length > 0) {
    const sorted = [...ventesThisMonth].sort((a, b) => b.montant - a.montant);
    const best = sorted[0];
    if (best && best.montant > 1) {
      const clientName = best.contact
        ? `${best.contact.prenom || ""} ${best.contact.nom}`.trim()
        : "";
      const labelClient = clientName ? ` — ${clientName}` : "";
      items.push({
        icon: "🥇",
        text: `Plus grosse commande : ${eur(best.montant)}${labelClient}`,
        color: "text-orange-300",
      });
    }
  }

  // (Le top commercial Sellsy/owner reste basé sur Sellsy live — désactivé pour l'instant
  // car la table Vente n'a pas encore le owner_id. À ré-implémenter via mapping Devis.commercialId
  // si besoin futur.)

  // ====== 2bis. Vues page Teck Days (GA4) ======
  try {
    const pv = await getPageViewsByPath("teckdays", "2026-04-15", "today");
    if (pv && pv.total > 0) {
      items.push({
        icon: "📊",
        text: `${pv.total.toLocaleString("fr-FR")} vues page Teck Days (${pv.users} utilisateurs uniques)`,
        color: "text-cyan-300",
      });
    }
  } catch (e) {
    console.warn("[news] GA4 vues Teck Days indisponible:", e);
  }

  // ====== 3. Prochain jour férié Réunion ======
  try {
    const ferie = prochainFerie();
    if (ferie) {
      const today = new Date();
      const todayMs = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const days = Math.floor((ferie.date.getTime() - todayMs) / (1000 * 60 * 60 * 24));
      const dayLabel =
        days === 0 ? "aujourd'hui" : days === 1 ? "demain" : `dans ${days} jours`;
      items.push({
        icon: "📅",
        text: `Prochain férié : ${ferie.nom} — ${formatFerieFR(ferie.date)} (${dayLabel})`,
        color: "text-violet-300",
      });
    }
  } catch (e) {
    console.warn("[news] Férié indisponible:", e);
  }

  cache = { data: items, expires: Date.now() + TTL_MS };
  return NextResponse.json({ items, cached: false });
}
