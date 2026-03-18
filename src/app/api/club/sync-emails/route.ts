import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  fetchIndividualDetails,
  fetchCompanyDetails,
} from "@/lib/sellsy";

// Vercel Hobby = max 60s
export const maxDuration = 60;

/**
 * POST /api/club/sync-emails
 *
 * Récupère les emails manquants depuis Sellsy pour les membres du Club.
 * Traite 200 membres par appel (batches de 10 en parallèle).
 * Appeler plusieurs fois jusqu'à ce que `remaining === 0`.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Récupérer les membres sans email
    const membresWithoutEmail = await prisma.clubMembre.findMany({
      where: { email: "", exclu: false },
      select: { sellsyContactId: true, id: true },
      take: 200,
    });

    const total = await prisma.clubMembre.count({
      where: { email: "", exclu: false },
    });

    if (membresWithoutEmail.length === 0) {
      return NextResponse.json({
        success: true,
        fetched: 0,
        remaining: 0,
        message: "Tous les membres ont un email",
      });
    }

    console.log(`[Club Emails] Fetch emails pour ${membresWithoutEmail.length}/${total} membres…`);

    let fetched = 0;
    let errors = 0;

    // Batches de 10 en parallèle
    for (let i = 0; i < membresWithoutEmail.length; i += 10) {
      const batch = membresWithoutEmail.slice(i, i + 10);
      await Promise.all(
        batch.map(async (membre) => {
          const numId = parseInt(membre.sellsyContactId, 10);

          let email = "";
          let nom = "";
          let prenom = "";
          try {
            // Essayer d'abord comme individual, puis comme company
            try {
              const info = await fetchIndividualDetails(numId);
              email = info.email;
              nom = info.nom;
              prenom = info.prenom;
            } catch {
              const info = await fetchCompanyDetails(numId);
              email = info.email;
              nom = info.nom;
            }
          } catch {
            errors++;
          }

          if (email) {
            await prisma.clubMembre.update({
              where: { id: membre.id },
              data: { email },
            });
            fetched++;
          }
        })
      );
    }

    const remaining = total - fetched;
    console.log(`[Club Emails] Terminé — ${fetched} emails récupérés, ${errors} erreurs, ${remaining} restants`);

    return NextResponse.json({
      success: true,
      fetched,
      errors,
      remaining,
    });
  } catch (error: any) {
    console.error("[Club Emails] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la récupération des emails" },
      { status: 500 }
    );
  }
}
