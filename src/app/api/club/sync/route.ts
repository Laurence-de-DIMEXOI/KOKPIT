import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncClubCommandes } from "@/lib/club-sync";

// Vercel Hobby = max 60s, Pro = max 300s
export const maxDuration = 60;

/**
 * POST /api/club/sync
 *
 * Synchronisation manuelle : recupere toutes les commandes Sellsy depuis debut 2020,
 * calcule le niveau de chaque client, et upsert dans ClubMembre.
 * Regle : ne jamais descendre de niveau.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const result = await syncClubCommandes();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[Club Sync] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la synchronisation" },
      { status: 500 }
    );
  }
}
