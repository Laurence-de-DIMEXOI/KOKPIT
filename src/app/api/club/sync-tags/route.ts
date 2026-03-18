import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ensureTagsExist,
  assignTagToIndividual,
  assignTagToCompany,
} from "@/lib/sellsy";
import { CLUB_LEVELS } from "@/data/club-grandis";

export const maxDuration = 60;

/**
 * POST /api/club/sync-tags
 *
 * Push les tags "CLUB - Niv X" sur les contacts Sellsy via leur ID.
 * Traite 30 contacts par appel. Le frontend boucle automatiquement.
 * Pas besoin d'email — on utilise le sellsyContactId directement.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // 1. S'assurer que les 5 tags existent
    const tagNames = CLUB_LEVELS.map((l) => l.sellsyTag);
    const tagMap = await ensureTagsExist(tagNames);

    // 2. Compter le total puis prendre un batch de 30
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
      try {
        const contactId = parseInt(membre.sellsyContactId, 10);
        if (isNaN(contactId)) { errors++; continue; }

        const level = CLUB_LEVELS.find((l) => l.niveau === membre.niveau);
        if (!level) { errors++; continue; }

        const tagId = tagMap.get(level.sellsyTag);
        if (!tagId) { errors++; continue; }

        // Assigner le tag : essayer individual d'abord, puis company
        try {
          await assignTagToIndividual(contactId, tagId);
        } catch {
          try {
            await assignTagToCompany(contactId, tagId);
          } catch {
            errors++;
            // Marquer quand même pour ne pas reboucler
            await prisma.clubMembre.update({
              where: { id: membre.id },
              data: { sellsySynced: true },
            });
            continue;
          }
        }

        await prisma.clubMembre.update({
          where: { id: membre.id },
          data: { sellsySynced: true },
        });
        synced++;
      } catch (err: any) {
        console.warn(`[Club Tags] Erreur ${membre.sellsyContactId}:`, err.message);
        errors++;
      }
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
