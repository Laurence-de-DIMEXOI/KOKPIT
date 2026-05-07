import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface NotificationItem {
  type:
    | "token_meta"
    | "devis_expirant"
    | "sync_brevo"
    | "tache_retard"
    | "sla_48h"
    | "demande_non_traitee";
  message: string;
  severity: "danger" | "warning" | "info";
  href?: string;
}

// Cache par userId — chaque user a sa propre vue
const cacheByUser: Map<string, { data: unknown; timestamp: number }> = new Map();

/**
 * Notifications filtrées par utilisateur connecté.
 *
 * Règles :
 *  - ADMIN / DIRECTION : voit tout (pas de filtre)
 *  - MARKETING : token Meta + sync Brevo + ses propres tâches/leads
 *  - COMMERCIAL / ACHAT : uniquement ce qui lui est assigné (tâches, leads, devis, demandes)
 *
 * Les notifications "globales" (Meta, Brevo) ne sont remontées qu'aux rôles
 * concernés (ADMIN/DIRECTION/MARKETING).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;
  const isFullScope = ["ADMIN", "DIRECTION"].includes(role);
  const isMarketing = role === "MARKETING" || isFullScope;

  // Cache par user
  const cached = cacheByUser.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const items: NotificationItem[] = [];

  try {
    // ===== 1. Token Meta — ADMIN/DIRECTION/MARKETING uniquement =====
    if (isMarketing) {
      const metaToken = process.env.META_ACCESS_TOKEN;
      if (metaToken) {
        try {
          const tokenRes = await fetch(
            `https://graph.facebook.com/debug_token?input_token=${metaToken}&access_token=${metaToken}`
          );
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            const expiresAt = tokenData.data?.expires_at;
            if (expiresAt && expiresAt > 0) {
              const joursRestants = Math.floor(
                (expiresAt * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
              );
              if (joursRestants < 0) {
                items.push({
                  type: "token_meta",
                  message:
                    "Token Meta expiré — les données Meta Ads ne sont plus mises à jour",
                  severity: "danger",
                  href: "/marketing/roi",
                });
              } else if (joursRestants < 10) {
                items.push({
                  type: "token_meta",
                  message: `Token Meta expire dans ${joursRestants} jour${
                    joursRestants > 1 ? "s" : ""
                  }`,
                  severity: "warning",
                  href: "/marketing/roi",
                });
              }
            }
          }
        } catch {
          /* silent */
        }
      }
    }

    // ===== 2. Tâches en retard — MES tâches (sauf full scope) =====
    try {
      const overdueTasks = await prisma.task.count({
        where: {
          echeance: { lt: new Date() },
          statut: { not: "TERMINEE" },
          ...(isFullScope ? {} : { assigneAId: userId }),
        },
      });
      if (overdueTasks > 0) {
        items.push({
          type: "tache_retard",
          message: `${overdueTasks} tâche${
            overdueTasks > 1 ? "s" : ""
          } en retard${isFullScope ? "" : ""}`,
          severity: "warning",
          href: "/commercial/taches",
        });
      }
    } catch {
      /* silent */
    }

    // ===== 3. Leads SLA 48h — MES leads (commercial assigné = user connecté) =====
    // Exclusions : statut PERDU + données legacy avant le 7 mars 2026.
    try {
      const slaDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const SLA_LEGACY_CUTOFF = new Date("2026-03-07T00:00:00+04:00");
      const slaLeads = await prisma.lead.count({
        where: {
          statut: { in: ["NOUVEAU", "EN_COURS"] },
          createdAt: { lt: slaDate, gte: SLA_LEGACY_CUTOFF },
          premiereActionAt: null,
          ...(isFullScope ? {} : { commercialId: userId }),
        },
      });
      if (slaLeads > 0) {
        items.push({
          type: "sla_48h",
          message: `${slaLeads} demande${
            slaLeads > 1 ? "s" : ""
          } sans action depuis 48h`,
          severity: "danger",
          href: "/leads",
        });
      }
    } catch {
      /* silent */
    }

    // ===== 4. Devis expirants — MES devis (commercial = user connecté) =====
    try {
      const fiveDaysFromExpiry = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000);
      const expiringDevis = await prisma.devis.count({
        where: {
          statut: "ENVOYE",
          dateEnvoi: { lte: fiveDaysFromExpiry },
          ...(isFullScope
            ? {}
            : {
                lead: {
                  commercialId: userId,
                },
              }),
        },
      });
      if (expiringDevis > 0) {
        items.push({
          type: "devis_expirant",
          message: `${expiringDevis} devis bientôt expiré${
            expiringDevis > 1 ? "s" : ""
          }`,
          severity: "warning",
          href: "/commercial/pipeline",
        });
      }
    } catch {
      /* silent */
    }

    // ===== 5. Demandes non traitées — MES demandes (commercial = user connecté) =====
    try {
      const demandesNonTraitees = await prisma.lead.count({
        where: {
          statut: "NOUVEAU",
          ...(isFullScope ? {} : { commercialId: userId }),
        },
      });
      if (demandesNonTraitees > 0) {
        items.push({
          type: "demande_non_traitee",
          message: `${demandesNonTraitees} demande${
            demandesNonTraitees > 1 ? "s" : ""
          } à traiter`,
          severity: "danger",
          href: "/leads",
        });
      }
    } catch {
      /* silent */
    }

    // ===== 6. Sync Brevo — MARKETING / ADMIN / DIRECTION uniquement =====
    if (isMarketing) {
      try {
        const lastSync = await prisma.brevoSyncLog.findFirst({
          where: { statut: "success" },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        });
        if (lastSync) {
          const daysSinceSync = Math.floor(
            (Date.now() - lastSync.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysSinceSync >= 7) {
            items.push({
              type: "sync_brevo",
              message: `Sync Brevo non effectuée depuis ${daysSinceSync} jours`,
              severity: "info",
              href: "/emailing",
            });
          }
        } else {
          items.push({
            type: "sync_brevo",
            message: "Aucune synchronisation Brevo effectuée",
            severity: "info",
            href: "/emailing",
          });
        }
      } catch {
        /* silent */
      }
    }

    const result = { items, count: items.length, scope: isFullScope ? "global" : "perso" };
    cacheByUser.set(userId, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ items: [], count: 0 });
  }
}
