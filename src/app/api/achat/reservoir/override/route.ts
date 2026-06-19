import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/achat/reservoir/override
 *   body { bcdi, action: "stock" | "reset", note? }
 *
 * "stock"  → convertit le BCDI du réservoir en STOCK magasin (il est prêt en
 *            Indonésie mais on le fait venir pour le magasin, pas pour le client).
 * "reset"  → annule la conversion.
 * Le champ forcedType est préservé par le sync (non écrasé).
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const userId = (session.user as { id?: string }).id || null;

  const { bcdi, action, note } = (await req.json()) as {
    bcdi?: string;
    action?: string;
    note?: string | null;
  };
  if (!bcdi || !["stock", "reset"].includes(action || "")) {
    return NextResponse.json({ error: "bcdi et action (stock|reset) requis" }, { status: 400 });
  }

  const data =
    action === "stock"
      ? { forcedType: "stock", forcedNote: note ?? null, forcedBy: userId, forcedAt: new Date() }
      : { forcedType: null, forcedNote: null, forcedBy: null, forcedAt: null };

  await prisma.reservoirBcdi.update({ where: { bcdi }, data }).catch(() => {});
  return NextResponse.json({ ok: true, bcdi, action });
}
