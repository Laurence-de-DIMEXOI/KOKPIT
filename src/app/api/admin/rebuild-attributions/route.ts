import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rebuildAttributionsFenetre } from "@/lib/attribution-tunnel";

/**
 * POST /api/admin/rebuild-attributions?months=12
 *
 * Recalcule l'attribution (AttributionDevis + AttributionBDC) pour tous les
 * leads créés dans les X derniers mois. Corrige aussi les statuts Lead
 * (faux VENTE/DEVIS hérités de l'ancienne logique `hasBDC`).
 *
 * Réservé ADMIN + DIRECTION + Laurence. Long-running — ne pas appeler
 * pendant les heures de pointe.
 */
export async function POST(request: NextRequest) {
  // Auth : soit session admin, soit bearer CRON_API_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_API_SECRET;
  const isCronCall = !!cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCronCall) {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    const email = session?.user?.email;
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (
      email !== "laurence.payet@dimexoi.fr" &&
      email !== "admin@kokpit.re" &&
      !["ADMIN", "DIRECTION"].includes(role)
    ) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
  }

  const url = new URL(request.url);
  const monthsParam = url.searchParams.get("months");
  const months = monthsParam ? Math.max(1, Math.min(36, parseInt(monthsParam, 10))) : 12;

  const started = Date.now();
  try {
    const result = await rebuildAttributionsFenetre(months);
    const elapsed = Date.now() - started;
    return NextResponse.json({
      success: true,
      months,
      elapsedMs: elapsed,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("POST /api/admin/rebuild-attributions:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
