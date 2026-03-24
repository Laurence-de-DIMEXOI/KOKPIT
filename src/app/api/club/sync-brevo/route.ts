import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncClubBrevo } from "@/lib/club-sync";

export const maxDuration = 60;

/**
 * POST /api/club/sync-brevo
 *
 * Synchronise TOUS les membres Club Tectona vers Brevo :
 * - 6 listes : "Club Tectona" (master) + 1 par niveau (I a V)
 * - Upsert chaque contact avec attributs CLUB_NIVEAU, CLUB_REMISE, etc.
 * - Ajoute au master + liste du niveau, retire des autres listes de niveau
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const result = await syncClubBrevo(50);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[Club Brevo] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la sync Brevo" },
      { status: 500 }
    );
  }
}
