import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

/**
 * Daily Briefing (/aujourd-hui) — règles d'accès.
 *
 * - Commercial éligible (`User.dailyBriefingEligible = true`) → mode `"own"`,
 *   filtré sur son propre userId.
 * - ADMIN / DIRECTION / MARKETING → mode `"aggregated"`, toggle Tous/perso.
 * - Tout autre user → pas d'accès.
 */

export type BriefingMode = "own" | "aggregated";

export interface BriefingAccess {
  allowed: boolean;
  mode: BriefingMode | null;
  userId: string | null;
}

const ROLES_ADMIN_VIEW = ["ADMIN", "DIRECTION", "MARKETING"] as const;

export async function canAccessDailyBriefing(
  session: Session | null
): Promise<BriefingAccess> {
  if (!session?.user) return { allowed: false, mode: null, userId: null };

  const userId = (session.user as { id?: string }).id || null;
  const role = (session.user as { role?: string }).role || "";

  if (!userId) return { allowed: false, mode: null, userId: null };

  // Vérifier le flag éligibilité commercial
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyBriefingEligible: true },
  });

  const isEligible = !!user?.dailyBriefingEligible;
  const isAdminView = ROLES_ADMIN_VIEW.includes(role as never);

  if (!isEligible && !isAdminView) {
    return { allowed: false, mode: null, userId };
  }

  return {
    allowed: true,
    mode: isEligible ? "own" : "aggregated",
    userId,
  };
}

/**
 * Détermine quel userId utiliser pour les requêtes (own → forcé, aggregated → param).
 */
export function resolveTargetUserId(
  access: BriefingAccess,
  queryParam: string | null
): string | "all" {
  if (access.mode === "own") return access.userId!;
  if (!queryParam || queryParam === "all") return "all";
  return queryParam;
}
