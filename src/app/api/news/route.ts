import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STATIC_NEWS, type NewsItem } from "@/lib/news-config";

/**
 * GET /api/news
 *
 * Renvoie les items à afficher dans la NewsTicker (topbar) :
 *  - items statiques (cf. src/lib/news-config.ts)
 *  - items dynamiques :
 *      • CA des BDC du mois en cours (somme Vente.montant)
 *      • Anniversaires du jour (si User.dateNaissance match)
 *      • Demandes reçues ce mois (count Lead)
 *
 * Cache : 5 min côté serveur (les chiffres bougent peu pendant la journée).
 */

let cache: { data: NewsItem[]; expires: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

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

  const items: NewsItem[] = [...STATIC_NEWS];

  // ===== Dynamic 1 : CA des BDC du mois en cours =====
  try {
    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
    const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const ventes = await prisma.vente.aggregate({
      where: {
        OR: [
          { dateVente: { gte: debutMois, lt: finMois } },
          { createdAt: { gte: debutMois, lt: finMois } },
        ],
      },
      _sum: { montant: true },
      _count: true,
    });
    const total = ventes._sum.montant || 0;
    const moisLabel = debutMois.toLocaleDateString("fr-FR", { month: "long" });
    if (total > 0) {
      items.push({
        icon: "💶",
        text: `${eur(total)} de BDC en ${moisLabel} (${ventes._count} commandes)`,
        color: "text-emerald-300",
      });
    }
  } catch {
    // Silencieux : si Sellsy/DB indispo, on n'affiche juste pas cet item
  }

  // ===== Dynamic 2 : Demandes reçues ce mois =====
  try {
    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
    const count = await prisma.demandePrix.count({
      where: { createdAt: { gte: debutMois } },
    });
    if (count > 0) {
      items.push({
        icon: "📥",
        text: `${count} demande${count > 1 ? "s" : ""} reçue${count > 1 ? "s" : ""} ce mois`,
        color: "text-cyan-300",
      });
    }
  } catch {
    /* ignore */
  }

  // ===== Dynamic 3 : Anniversaires du jour =====
  try {
    const today = new Date();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    // On ignore l'année (recherche par jour/mois uniquement)
    const users = await prisma.$queryRawUnsafe<
      Array<{ prenom: string; nom: string }>
    >(`
      SELECT prenom, nom FROM "User"
      WHERE actif = true
        AND "dateNaissance" IS NOT NULL
        AND EXTRACT(MONTH FROM "dateNaissance") = ${m}
        AND EXTRACT(DAY FROM "dateNaissance") = ${d}
      LIMIT 5
    `).catch(() => []);
    for (const u of users) {
      items.push({
        icon: "🎂",
        text: `Joyeux anniversaire ${u.prenom} !`,
        color: "text-pink-300",
      });
    }
  } catch {
    /* ignore */
  }

  cache = { data: items, expires: Date.now() + TTL_MS };
  return NextResponse.json({ items, cached: false });
}
