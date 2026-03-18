import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ensureTagsExist,
  getContactTags,
  assignTagToIndividual,
  removeTagFromIndividual,
  assignTagToCompany,
  removeTagFromCompany,
} from "@/lib/sellsy";
import { CLUB_LEVELS } from "@/data/club-grandis";

export const maxDuration = 60;

/**
 * POST /api/club/sync-tags
 *
 * Push les tags "CLUB - Niv X" sur les contacts Sellsy.
 * Gère les individuals ET les companies (fallback automatique).
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

    // 2. Récupérer les membres non synchronisés
    const membres = await prisma.clubMembre.findMany({
      where: { sellsySynced: false, exclu: false },
    });

    console.log(`[Club Tags] ${membres.length} membres à synchroniser`);

    let synced = 0;
    let errors = 0;

    for (const membre of membres) {
      try {
        const contactId = parseInt(membre.sellsyContactId, 10);
        if (isNaN(contactId)) {
          errors++;
          continue;
        }

        // Récupérer les tags actuels (essaie individual puis company)
        const currentTags = await getContactTags(contactId);

        // Retirer tous les tags CLUB existants
        for (const tag of currentTags) {
          if (tag.name.startsWith("CLUB - Niv")) {
            // Essayer individual d'abord, puis company
            try {
              await removeTagFromIndividual(contactId, tag.id);
            } catch {
              try {
                await removeTagFromCompany(contactId, tag.id);
              } catch {
                // Ignorer
              }
            }
          }
        }

        // Assigner le nouveau tag
        const level = CLUB_LEVELS.find((l) => l.niveau === membre.niveau);
        if (level) {
          const tagId = tagMap.get(level.sellsyTag);
          if (tagId) {
            // Essayer individual d'abord, puis company
            try {
              await assignTagToIndividual(contactId, tagId);
            } catch {
              await assignTagToCompany(contactId, tagId);
            }
          }
        }

        // Marquer comme synchronisé
        await prisma.clubMembre.update({
          where: { id: membre.id },
          data: { sellsySynced: true },
        });

        synced++;
      } catch (err: any) {
        console.warn(
          `[Club Tags] Erreur pour ${membre.sellsyContactId}:`,
          err.message
        );
        errors++;
      }
    }

    console.log(
      `[Club Tags] Terminé — ${synced} synchronisés, ${errors} erreurs`
    );

    return NextResponse.json({
      success: true,
      synced,
      errors,
      total: membres.length,
    });
  } catch (error: any) {
    console.error("[Club Tags] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la sync tags" },
      { status: 500 }
    );
  }
}
