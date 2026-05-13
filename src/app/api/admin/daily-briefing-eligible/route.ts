import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * Daily Briefing — gestion de la liste des utilisateurs éligibles.
 * Auth : ADMIN / DIRECTION uniquement.
 *
 * GET    → renvoie la liste actuelle (User.dailyBriefingEligible = true)
 * PATCH  → { userId, eligible: boolean } met à jour 1 user
 */

const patchSchema = z.object({
  userId: z.string().min(1),
  eligible: z.boolean(),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false as const, status: 401 };
  const role = (session.user as { role?: string }).role || "";
  if (!["ADMIN", "DIRECTION"].includes(role)) return { ok: false as const, status: 403 };
  return { ok: true as const };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Non autorisé" }, { status: auth.status });
  }
  const users = await prisma.user.findMany({
    where: { actif: true, role: { in: ["COMMERCIAL", "MARKETING"] } },
    select: {
      id: true,
      nom: true,
      prenom: true,
      role: true,
      email: true,
      dailyBriefingEligible: true,
    },
    orderBy: [{ role: "asc" }, { prenom: "asc" }],
  });
  return NextResponse.json({ users });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Non autorisé" }, { status: auth.status });
  }
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }
  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { dailyBriefingEligible: parsed.data.eligible },
  });
  return NextResponse.json({ success: true });
}
