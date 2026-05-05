import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listAllOrders, sellsyFetch } from "@/lib/sellsy";
import { STATIC_NEWS, type NewsItem } from "@/lib/news-config";
import { getResponsableCafe } from "@/data/cafe-planning";
import { prochainFerie, formatFerieFR } from "@/lib/feries";

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

function getOrderAmount(o: any): number {
  const a = o?.amounts || {};
  const val =
    a.total ?? a.total_incl_tax ?? a.total_excl_tax ?? a.total_raw_excl_tax ?? 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function isCancelled(o: any): boolean {
  const s = (o?.status || "").toLowerCase();
  return s === "cancelled" || s === "annulé" || s === "annule";
}

/**
 * On inclut les BDC en cours (drafts compris) — exclut juste les annulés/refusés/expirés.
 */
const VENTE_STATUTS = new Set([
  "invoiced",
  "advanced",
  "accepted",
  "partialinvoiced",
  "paid",
  "completed",
  "draft",
  "sent",
  "read",
]);

function isVenteEffective(o: any): boolean {
  const s = (o?.status || "").toLowerCase();
  return VENTE_STATUTS.has(s);
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

  // ====== 1. CA des BDC du mois en cours (Sellsy direct) ======
  let ordersThisMonth: any[] = [];
  try {
    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
    const sinceStr = debutMois.toISOString().split("T")[0]; // YYYY-MM-DD
    const allOrders = await listAllOrders(sinceStr);
    // Strict : on ne garde que les BDC effectivement vendus (pas les drafts/envois)
    ordersThisMonth = allOrders.filter((o: any) => isVenteEffective(o));
    const totalCA = ordersThisMonth.reduce((s, o) => s + getOrderAmount(o), 0);
    if (totalCA > 0) {
      const moisLabel = debutMois.toLocaleDateString("fr-FR", { month: "long" });
      items.push({
        icon: "💶",
        text: `${eur(totalCA)} de BDC en ${moisLabel} (${ordersThisMonth.length} commandes)`,
        color: "text-emerald-300",
      });
    }
  } catch (e) {
    console.warn("[news] CA Sellsy indisponible:", e);
  }

  // ====== 1bis. Meilleure vente du mois (plus grosse commande individuelle) ======
  if (ordersThisMonth.length > 0) {
    try {
      const sorted = [...ordersThisMonth].sort(
        (a, b) => getOrderAmount(b) - getOrderAmount(a)
      );
      const best = sorted[0];
      const bestAmount = getOrderAmount(best);
      if (bestAmount > 0) {
        const clientName = (best?.company_name || "").trim();
        const labelClient = clientName ? ` — ${clientName}` : "";
        items.push({
          icon: "🥇",
          text: `Plus grosse commande : ${eur(bestAmount)}${labelClient}`,
          color: "text-orange-300",
        });
      }
    } catch (e) {
      console.warn("[news] Meilleure vente indisponible:", e);
    }
  }

  // ====== 2. Top vente du mois (par owner Sellsy → user KOKPIT) ======
  if (ordersThisMonth.length > 0) {
    try {
      // Group by owner_id Sellsy
      const byOwner = new Map<number, number>();
      for (const o of ordersThisMonth) {
        const ownerId = o?.owner?.id || o?.owner_id;
        if (!ownerId) continue;
        byOwner.set(ownerId, (byOwner.get(ownerId) || 0) + getOrderAmount(o));
      }
      if (byOwner.size > 0) {
        const top = [...byOwner.entries()].sort((a, b) => b[1] - a[1])[0];
        const [topOwnerId, topAmount] = top;

        // Mapping STRICT : owner Sellsy → email → user KOKPIT actif.
        // Si pas de match côté KOKPIT, on N'AFFICHE PAS l'item (pas de
        // "michelle.legros" ou autre identifiant Sellsy interne).
        let topPrenom: string | null = null;
        try {
          const staffRes = await sellsyFetch<{
            data: Array<{ id: number; email?: string }>;
          }>("/staffs?limit=100");
          const staff = (staffRes.data || []).find((s) => s.id === topOwnerId);
          if (staff?.email) {
            const user = await prisma.user.findFirst({
              where: {
                email: staff.email.toLowerCase(),
                actif: true,
              },
              select: { prenom: true },
            });
            if (user?.prenom) topPrenom = user.prenom;
          }
        } catch {
          /* ignore */
        }

        if (topPrenom) {
          items.push({
            icon: "🏆",
            text: `Meilleur commercial : ${topPrenom} ${eur(topAmount)} ce mois`,
            color: "text-yellow-300",
          });
        }
      }
    } catch (e) {
      console.warn("[news] Top vente indisponible:", e);
    }
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
