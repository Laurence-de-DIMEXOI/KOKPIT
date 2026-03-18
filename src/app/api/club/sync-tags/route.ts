import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncClubTags } from "@/lib/club-sync";

export const maxDuration = 60;

/**
 * POST /api/club/sync-tags
 *
 * Assigne les smart tags "CLUB - Niv X" sur les contacts Sellsy.
 * Traite 30 contacts par appel. Le frontend boucle automatiquement.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const result = await syncClubTags(30);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[Club Tags] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la sync tags" },
      { status: 500 }
    );
  }
}
