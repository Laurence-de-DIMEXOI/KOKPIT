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
const TTL_MS = 10 * 60 * 1000;

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
    ordersThisMonth = allOrders.filter((o: any) => !isCancelled(o));
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

        // Resolve owner name : Sellsy staff → email → KOKPIT user
        let topName = "Top commercial";
        try {
          const staffRes = await sellsyFetch<{
            data: Array<{ id: number; email?: string; first_name?: string; last_name?: string }>;
          }>("/staffs?limit=100");
          const staff = (staffRes.data || []).find((s) => s.id === topOwnerId);
          if (staff) {
            // Tenter de matcher avec un user KOKPIT par email
            if (staff.email) {
              const user = await prisma.user.findFirst({
                where: { email: staff.email.toLowerCase() },
                select: { prenom: true },
              });
              if (user?.prenom) topName = user.prenom;
              else topName = staff.first_name || staff.email.split("@")[0];
            } else if (staff.first_name) {
              topName = staff.first_name;
            }
          }
        } catch {
          /* ignore */
        }

        items.push({
          icon: "🏆",
          text: `Top vente : ${topName} ${eur(topAmount)} ce mois`,
          color: "text-yellow-300",
        });
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
