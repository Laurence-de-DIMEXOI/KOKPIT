import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignSmartTag } from "@/lib/sellsy";
import { CLUB_LEVELS } from "@/data/club-grandis";

export const maxDuration = 60;

/**
 * POST /api/club/sync-tags
 *
 * Assigne les smart tags "CLUB - Niv X" sur les contacts Sellsy.
 * Utilise l'endpoint /smart-tags de Sellsy V2.
 * Traite 30 contacts par appel. Le frontend boucle automatiquement.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const total = await prisma.clubMembre.count({
      where: { sellsySynced: false, exclu: false },
    });

    if (total === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        errors: 0,
        remaining: 0,
      });
    }

    const membres = await prisma.clubMembre.findMany({
      where: { sellsySynced: false, exclu: false },
      take: 30,
    });

    console.log(`[Club Tags] Batch de ${membres.length}/${total} membres…`);

    let synced = 0;
    let errors = 0;

    for (const membre of membres) {
      const contactId = parseInt(membre.sellsyContactId, 10);
      if (isNaN(contactId)) { errors++; continue; }

      const level = CLUB_LEVELS.find((l) => l.niveau === membre.niveau);
      if (!level) { errors++; continue; }

      try {
        // Essayer d'abord comme company, puis comme people (individual)
        try {
          await assignSmartTag(contactId, level.sellsyTag, "company");
        } catch {
          await assignSmartTag(contactId, level.sellsyTag, "people");
        }
        synced++;
      } catch (err: any) {
        console.warn(`[Club Tags] Erreur ${contactId} (${membre.nom}):`, err.message);
        errors++;
      }

      // Marquer comme traité (même en erreur, pour ne pas reboucler indéfiniment)
      await prisma.clubMembre.update({
        where: { id: membre.id },
        data: { sellsySynced: true },
      });
    }

    const remaining = total - membres.length;
    console.log(`[Club Tags] ${synced} OK, ${errors} erreurs, ${remaining} restants`);

    return NextResponse.json({
      success: true,
      synced,
      errors,
      remaining: Math.max(0, remaining),
    });
  } catch (error: any) {
    console.error("[Club Tags] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la sync tags" },
      { status: 500 }
    );
  }
}
