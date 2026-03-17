import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  upsertBrevoContact,
  addContactsToList,
  removeContactsFromList,
} from "@/lib/brevo";
import { CLUB_LEVELS } from "@/data/club-grandis";

/**
 * POST /api/club/sync-brevo
 *
 * Push les membres Club Grandis vers Brevo :
 * - Upsert contact avec attributs CLUB_NIVEAU, CLUB_REMISE
 * - Ajoute à la bonne liste Brevo (via env vars BREVO_CLUB_LIST_ID_X)
 * - Retire des anciennes listes
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Charger les IDs de listes Brevo depuis les env vars
    const listIds: Record<number, number | null> = {};
    for (const level of CLUB_LEVELS) {
      const envVal = process.env[level.brevoListEnvKey];
      listIds[level.niveau] = envVal ? parseInt(envVal, 10) : null;
    }

    // Vérifier qu'au moins une liste est configurée
    const configuredLists = Object.values(listIds).filter((v) => v !== null);
    if (configuredLists.length === 0) {
      return NextResponse.json(
        {
          error:
            "Aucune liste Brevo configurée. Ajouter BREVO_CLUB_LIST_ID_1 à _5 dans les variables d'environnement.",
        },
        { status: 400 }
      );
    }

    // Récupérer les membres non synchronisés avec un email valide
    const membres = await prisma.clubMembre.findMany({
      where: {
        brevoSynced: false,
        email: { not: "" },
      },
    });

    console.log(`[Club Brevo] ${membres.length} membres à synchroniser`);

    let synced = 0;
    let errors = 0;

    for (const membre of membres) {
      try {
        if (!membre.email || !membre.email.includes("@")) {
          console.warn(`[Club Brevo] Email invalide pour ${membre.nom}: "${membre.email}"`);
          errors++;
          continue;
        }

        const level = CLUB_LEVELS.find((l) => l.niveau === membre.niveau);
        if (!level) continue;

        const targetListId = listIds[membre.niveau];

        // Listes à retirer (toutes les autres listes club)
        const unlinkListIds = CLUB_LEVELS
          .filter((l) => l.niveau !== membre.niveau)
          .map((l) => listIds[l.niveau])
          .filter((id): id is number => id !== null);

        // Upsert contact Brevo avec attributs
        await upsertBrevoContact({
          email: membre.email,
          attributes: {
            CLUB_NIVEAU: membre.niveau,
            CLUB_NOM_NIVEAU: level.nom,
            CLUB_REMISE: level.remise,
            PRENOM: membre.prenom,
            NOM: membre.nom,
          },
          listIds: targetListId ? [targetListId] : undefined,
          unlinkListIds: unlinkListIds.length > 0 ? unlinkListIds : undefined,
        });

        // Marquer comme synchronisé
        await prisma.clubMembre.update({
          where: { id: membre.id },
          data: { brevoSynced: true },
        });

        synced++;
      } catch (err: any) {
        console.warn(
          `[Club Brevo] Erreur pour ${membre.email}:`,
          err.message
        );
        errors++;
      }
    }

    console.log(
      `[Club Brevo] Terminé — ${synced} synchronisés, ${errors} erreurs`
    );

    return NextResponse.json({
      success: true,
      synced,
      errors,
      total: membres.length,
    });
  } catch (error: any) {
    console.error("[Club Brevo] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la sync Brevo" },
      { status: 500 }
    );
  }
}
