import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncClubEmails } from "@/lib/club-sync";

export const maxDuration = 60;

/**
 * POST /api/club/sync-emails
 *
 * Recupere les emails manquants depuis Sellsy via l'ID Sellsy deja en base.
 * Traite 50 membres par appel.
 * Le frontend boucle automatiquement jusqu'a remaining === 0.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const result = await syncClubEmails(50);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[Club Emails] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la recuperation des emails" },
      { status: 500 }
    );
  }
}
