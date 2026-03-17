import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ensureTagsExist,
  getContactTags,
  assignTagToIndividual,
  removeTagFromIndividual,
} from "@/lib/sellsy";
import { CLUB_LEVELS } from "@/data/club-grandis";

/**
 * POST /api/club/sync-tags
 *
 * Push les tags "CLUB - Niv X" sur les contacts Sellsy.
 * - Crée les tags s'ils n'existent pas
 * - Assigne le bon tag au contact
 * - Retire les anciens tags CLUB
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
      where: { sellsySynced: false },
    });

    console.log(`[Club Tags] ${membres.length} membres à synchroniser`);

    let synced = 0;
    let errors = 0;

    for (const membre of membres) {
      try {
        const contactId = parseInt(membre.sellsyContactId, 10);
        if (isNaN(contactId)) {
          console.warn(`[Club Tags] ID invalide: ${membre.sellsyContactId}`);
          errors++;
          continue;
        }

        // Récupérer les tags actuels du contact
        const currentTags = await getContactTags(contactId);

        // Retirer tous les tags CLUB existants
        for (const tag of currentTags) {
          if (tag.name.startsWith("CLUB - Niv")) {
            try {
              await removeTagFromIndividual(contactId, tag.id);
            } catch {
              // Ignorer les erreurs de retrait
            }
          }
        }

        // Assigner le nouveau tag
        const level = CLUB_LEVELS.find((l) => l.niveau === membre.niveau);
        if (level) {
          const tagId = tagMap.get(level.sellsyTag);
          if (tagId) {
            await assignTagToIndividual(contactId, tagId);
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
