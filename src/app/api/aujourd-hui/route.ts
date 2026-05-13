import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessDailyBriefing, resolveTargetUserId } from "@/lib/daily-briefing-access";
import { reportingFilterVente } from "@/lib/reporting-filter";
import { getSellsyUrl } from "@/lib/sellsy-urls";

export const dynamic = "force-dynamic";

/**
 * Daily Briefing — endpoint unique.
 * GET /api/aujourd-hui?userId=<id|all>&fresh=true
 *
 * Renvoie 4 blocs : leadsBrulants · devisExpirants · moodMensuel · tachesJour.
 * Cache 5 min in-memory par cible (own user OU "all").
 */

interface CacheEntry {
  data: unknown;
  expires: number;
}
const cache = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000;

const DEVIS_VALIDITE_JOURS = 30; // Convention DIMEXOI — durée validité d'un devis envoyé

// ============================================================
// BLOC 1 — Leads brûlants non touchés depuis 48h
// ============================================================
async function getLeadsBrulants(target: string | "all") {
  const seuil48h = new Date(Date.now() - 48 * 3600 * 1000);

  const leads = await prisma.lead.findMany({
    where: {
      statut: { in: ["NOUVEAU", "EN_COURS"] },
      ...(target !== "all" ? { commercialId: target } : {}),
    },
    include: {
      contact: { select: { id: true, nom: true, prenom: true, email: true, telephone: true, lastScoringLevel: true } },
      evenements: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, type: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const brulants = leads
    .map((lead) => {
      const derniereActivite = lead.evenements[0]?.createdAt ?? lead.createdAt;
      return { lead, derniereActivite };
    })
    .filter(({ lead, derniereActivite }) => {
      // Priorité "hot" ou "burning" (calculée par contact-priority cron) + pas touché depuis 48h
      const lvl = lead.contact?.lastScoringLevel;
      const isHotOrBurning = lvl === "hot" || lvl === "burning";
      return isHotOrBurning && derniereActivite < seuil48h;
    })
    .sort((a, b) => {
      // burning avant hot
      const score = (lvl: string | null | undefined) => (lvl === "burning" ? 2 : lvl === "hot" ? 1 : 0);
      return score(b.lead.contact?.lastScoringLevel) - score(a.lead.contact?.lastScoringLevel);
    });

  return {
    items: brulants.slice(0, 3).map(({ lead, derniereActivite }) => ({
      leadId: lead.id,
      contactId: lead.contact?.id || lead.contactId,
      contactNom: lead.contact?.nom || "Inconnu",
      contactPrenom: lead.contact?.prenom || "",
      priorite: lead.contact?.lastScoringLevel || "warm",
      derniereActivite: derniereActivite.toISOString(),
      heuresDepuisActivite: Math.floor((Date.now() - derniereActivite.getTime()) / 3_600_000),
      telephone: lead.contact?.telephone || null,
      email: lead.contact?.email || null,
      lienContact: `/contacts/${lead.contact?.id || lead.contactId}`,
    })),
    total: brulants.length,
  };
}

// ============================================================
// BLOC 2 — Devis expirants < 5 jours
// ============================================================
async function getDevisExpirants(target: string | "all") {
  const now = new Date();
  const dans5jPlus = new Date(now.getTime() + 5 * 24 * 3600 * 1000);
  // Pas de champ dateExpiration en DB → convention : dateEnvoi + 30j
  // Donc on cherche les devis dont dateEnvoi est entre (now - 30j) et (now - 25j)
  const minEnvoi = new Date(now.getTime() - DEVIS_VALIDITE_JOURS * 24 * 3600 * 1000);
  const maxEnvoi = new Date(now.getTime() - (DEVIS_VALIDITE_JOURS - 5) * 24 * 3600 * 1000);

  const devis = await prisma.devis.findMany({
    where: {
      dateEnvoi: { gte: minEnvoi, lte: maxEnvoi },
      statutSellsy: { notIn: ["cancelled", "canceled", "refused", "rejected", "expired", "accepted", "invoiced"] },
      montant: { gt: 1 },
      ...(target !== "all"
        ? { lead: { commercialId: target } }
        : {}),
    },
    include: {
      contact: { select: { id: true, nom: true, prenom: true } },
    },
    orderBy: { montant: "desc" },
    take: 3,
  });

  return {
    items: devis.map((d) => {
      const dateExpiration = new Date((d.dateEnvoi || now).getTime() + DEVIS_VALIDITE_JOURS * 24 * 3600 * 1000);
      const joursRestants = Math.ceil((dateExpiration.getTime() - now.getTime()) / 86_400_000);
      return {
        devisId: d.id,
        numero: d.numero || `#${d.id.slice(-6)}`,
        contactNom: `${d.contact.prenom || ""} ${d.contact.nom || ""}`.trim() || "Inconnu",
        montantHT: d.montant,
        dateExpiration: dateExpiration.toISOString(),
        joursRestants,
        sellsyUrl: d.sellsyQuoteId ? getSellsyUrl("estimate", Number(d.sellsyQuoteId)) : null,
        lienContact: `/contacts/${d.contact.id}`,
      };
    }),
    suppose: DEVIS_VALIDITE_JOURS, // documentation : la durée prise
  };
}

// ============================================================
// BLOC 3 — Mood mensuel par showroom
// ============================================================
type MoodStatut = "AVANCE" | "DANS_LES_CLOUS" | "RETARD" | "CRITIQUE";

async function getMoodMensuel(target: string | "all") {
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  let showroomLabel: "SUD" | "NORD" | "GLOBAL" = "GLOBAL";
  let objectifHT = 80000; // global par défaut (40k SUD + 40k NORD)
  let commercialFilter: { lead: { commercialId: string } } | undefined;

  if (target !== "all") {
    const user = await prisma.user.findUnique({
      where: { id: target },
      include: { showroom: true },
    });
    if (user?.showroom?.nom) {
      const nom = user.showroom.nom.toUpperCase();
      if (nom.includes("NORD")) showroomLabel = "NORD";
      else if (nom.includes("SUD")) showroomLabel = "SUD";
    }
    if (user?.showroom?.objectifMensuelHT != null) {
      objectifHT = user.showroom.objectifMensuelHT;
    }
    commercialFilter = { lead: { commercialId: target } };
  } else {
    // Mode "all" : somme des objectifs des showrooms
    const showrooms = await prisma.showroom.findMany({
      select: { objectifMensuelHT: true },
    });
    const sum = showrooms.reduce(
      (acc, s) => acc + (s.objectifMensuelHT ?? 0),
      0
    );
    if (sum > 0) objectifHT = sum;
  }

  // Ventes du mois courant — filtre Laurence + commercial si applicable
  const ventes = await prisma.vente.findMany({
    where: {
      dateVente: { gte: startMonth, lte: endMonth },
      ...reportingFilterVente(),
      ...(commercialFilter ? { devis: { ...commercialFilter } } : {}),
    },
    select: { montant: true },
  });

  const realiseHT = ventes.reduce((sum, v) => sum + v.montant, 0);
  const pourcentageAtteinte = objectifHT > 0 ? (realiseHT / objectifHT) * 100 : 0;

  const joursTotaux = endMonth.getDate();
  const jourActuel = now.getDate();
  const joursRestants = Math.max(0, joursTotaux - jourActuel);
  const rythmeAttendu = (jourActuel / joursTotaux) * 100;

  let statut: MoodStatut;
  if (pourcentageAtteinte >= rythmeAttendu + 10) statut = "AVANCE";
  else if (pourcentageAtteinte >= rythmeAttendu - 10) statut = "DANS_LES_CLOUS";
  else if (pourcentageAtteinte >= rythmeAttendu - 25) statut = "RETARD";
  else statut = "CRITIQUE";

  return {
    showroom: showroomLabel,
    objectifHT,
    realiseHT,
    pourcentageAtteinte,
    joursRestants,
    rythmeAttendu,
    statut,
  };
}

// ============================================================
// BLOC 4 — Tâches du jour
// ============================================================
async function getTachesJour(target: string | "all") {
  const debutJour = new Date();
  debutJour.setHours(0, 0, 0, 0);
  const finJour = new Date();
  finJour.setHours(23, 59, 59, 999);

  const where = {
    statut: { not: "TERMINEE" as const },
    ...(target !== "all" ? { assigneAId: target } : {}),
  };

  const taches = await prisma.task.findMany({
    where: {
      ...where,
      OR: [
        { echeance: { gte: debutJour, lte: finJour } },
        { echeance: null }, // Tâches sans échéance = considérées "à faire maintenant"
      ],
    },
    include: {
      contact: { select: { id: true, nom: true, prenom: true } },
    },
    orderBy: [{ echeance: "asc" }, { createdAt: "asc" }],
    take: 10,
  });

  const enRetard = await prisma.task.count({
    where: {
      ...where,
      echeance: { lt: debutJour, not: null },
    },
  });

  return {
    items: taches.map((t) => ({
      tacheId: t.id,
      titre: t.titre,
      description: t.description,
      contactNom: t.contact
        ? `${t.contact.prenom || ""} ${t.contact.nom || ""}`.trim() || null
        : null,
      lienContact: t.contact ? `/contacts/${t.contact.id}` : null,
      echeance: t.echeance ? t.echeance.toISOString() : null,
    })),
    enRetard,
  };
}

// ============================================================
// HANDLER
// ============================================================
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const access = await canAccessDailyBriefing(session);
  if (!access.allowed) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const url = new URL(request.url);
  const queryUserId = url.searchParams.get("userId");
  const fresh = url.searchParams.get("fresh") === "true";
  const target = resolveTargetUserId(access, queryUserId);

  // Cache key par cible
  const cacheKey = `briefing:${target}`;
  if (!fresh) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return NextResponse.json({ ...(cached.data as object), meta: { ...(cached.data as { meta?: object }).meta, cached: true } });
    }
  }

  const userInfo = session?.user
    ? {
        id: (session.user as { id?: string }).id || "",
        nom: (session.user as { name?: string }).name || "",
        prenom: "",
        role: (session.user as { role?: string }).role || "",
      }
    : null;

  const [leadsBrulants, devisExpirants, moodMensuel, tachesJour] = await Promise.all([
    getLeadsBrulants(target),
    getDevisExpirants(target),
    getMoodMensuel(target),
    getTachesJour(target),
  ]);

  const response = {
    meta: {
      user: userInfo,
      mode: access.mode,
      target,
      generatedAt: new Date().toISOString(),
      cached: false,
    },
    leadsBrulants,
    devisExpirants,
    moodMensuel,
    tachesJour,
  };

  cache.set(cacheKey, { data: response, expires: Date.now() + TTL_MS });
  return NextResponse.json(response);
}
