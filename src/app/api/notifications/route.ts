import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cache: { data: unknown; timestamp: number } | null = null;

interface NotificationItem {
  type: "token_meta" | "devis_expirant" | "sync_brevo";
  message: string;
  severity: "danger" | "warning" | "info";
  href?: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Return cache if valid
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  const items: NotificationItem[] = [];

  try {
    // 1. Vérifier le token Meta
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
                message: "Token Meta expiré — le feed Instagram ne fonctionne plus",
                severity: "danger",
                href: "/nos-reseaux",
              });
            } else if (joursRestants < 10) {
              items.push({
                type: "token_meta",
                message: `Token Meta expire dans ${joursRestants} jour${joursRestants > 1 ? "s" : ""}`,
                severity: "warning",
                href: "/nos-reseaux",
              });
            }
          }
        }
      } catch {
        // Silently fail — token check is best-effort
      }
    }

    // 2. Vérifier la dernière sync Brevo
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
        // Aucune sync jamais faite
        items.push({
          type: "sync_brevo",
          message: "Aucune synchronisation Brevo effectuée",
          severity: "info",
          href: "/emailing",
        });
      }
    } catch {
      // Silently fail
    }

    const result = { items, count: items.length };
    cache = { data: result, timestamp: Date.now() };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ items: [], count: 0 });
  }
}
