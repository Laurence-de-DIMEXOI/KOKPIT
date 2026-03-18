import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  upsertBrevoContact,
  addContactsToList,
  getLists,
  createList,
  getFolders,
} from "@/lib/brevo";
import { CLUB_LEVELS } from "@/data/club-grandis";

export const maxDuration = 60;

const CLUB_LIST_NAME = "Club Grandis";

/**
 * POST /api/club/sync-brevo
 *
 * Synchronise TOUS les membres Club Grandis vers Brevo :
 * - Crée la liste "Club Grandis" si elle n'existe pas
 * - Upsert chaque contact avec attributs CLUB_NIVEAU, CLUB_REMISE, etc.
 * - Ajoute tous les contacts à la liste unique "Club Grandis"
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // 1. Trouver ou créer la liste "Club Grandis"
    const lists = await getLists();
    let clubList = lists.find((l) => l.name === CLUB_LIST_NAME);

    if (!clubList) {
      console.log(`[Club Brevo] Création de la liste "${CLUB_LIST_NAME}"…`);
      // Récupérer le premier dossier disponible
      const folders = await getFolders();
      const folderId = folders[0]?.id || 1;
      const listId = await createList(CLUB_LIST_NAME, folderId);
      clubList = { id: listId, name: CLUB_LIST_NAME, totalSubscribers: 0 };
      console.log(`[Club Brevo] Liste créée (id: ${listId})`);
    }

    // 2. Récupérer TOUS les membres avec un email valide
    const membres = await prisma.clubMembre.findMany({
      where: {
        exclu: false,
        email: { not: "" },
      },
    });

    console.log(`[Club Brevo] ${membres.length} membres avec email à synchroniser`);

    if (membres.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        errors: 0,
        total: 0,
        message: "Aucun membre avec email. Lancez 'Récupérer emails' d'abord.",
      });
    }

    let synced = 0;
    let errors = 0;

    // 3. Upsert chaque contact avec ses attributs Club
    for (const membre of membres) {
      try {
        if (!membre.email.includes("@")) {
          errors++;
          continue;
        }

        const level = CLUB_LEVELS.find((l) => l.niveau === membre.niveau);
        if (!level) continue;

        await upsertBrevoContact({
          email: membre.email,
          attributes: {
            CLUB_NIVEAU: membre.niveau,
            CLUB_NOM_NIVEAU: level.nom,
            CLUB_CHIFFRE: level.chiffre,
            CLUB_REMISE: level.remise,
            PRENOM: membre.prenom,
            NOM: membre.nom,
          },
          listIds: [clubList.id],
        });

        // Marquer comme synchronisé
        await prisma.clubMembre.update({
          where: { id: membre.id },
          data: { brevoSynced: true },
        });

        synced++;
      } catch (err: any) {
        console.warn(`[Club Brevo] Erreur pour ${membre.email}:`, err.message);
        errors++;
      }
    }

    console.log(
      `[Club Brevo] Terminé — ${synced} synchronisés, ${errors} erreurs (liste: ${clubList.id})`
    );

    return NextResponse.json({
      success: true,
      synced,
      errors,
      total: membres.length,
      listId: clubList.id,
      listName: CLUB_LIST_NAME,
    });
  } catch (error: any) {
    console.error("[Club Brevo] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la sync Brevo" },
      { status: 500 }
    );
  }
}
