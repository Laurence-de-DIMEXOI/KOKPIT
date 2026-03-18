import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  fetchIndividualDetails,
  fetchCompanyDetails,
} from "@/lib/sellsy";

export const maxDuration = 60;

/**
 * POST /api/club/sync-emails
 *
 * Récupère les emails manquants depuis Sellsy via l'ID Sellsy déjà en base.
 * Traite 50 membres par appel (batches de 5 en parallèle pour éviter le rate limit).
 * Le frontend boucle automatiquement jusqu'à remaining === 0.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const total = await prisma.clubMembre.count({
      where: { email: "", exclu: false },
    });

    if (total === 0) {
      return NextResponse.json({
        success: true,
        fetched: 0,
        remaining: 0,
        message: "Tous les membres ont un email",
      });
    }

    // 50 par appel max pour rester sous 60s
    const membres = await prisma.clubMembre.findMany({
      where: { email: "", exclu: false },
      select: { sellsyContactId: true, id: true },
      take: 50,
    });

    console.log(`[Club Emails] Fetch emails pour ${membres.length}/${total} membres…`);

    let fetched = 0;
    let errors = 0;

    // Batches de 5 en parallèle (moins agressif sur le rate limit Sellsy)
    for (let i = 0; i < membres.length; i += 5) {
      const batch = membres.slice(i, i + 5);
      await Promise.all(
        batch.map(async (membre) => {
          const numId = parseInt(membre.sellsyContactId, 10);
          if (isNaN(numId)) { errors++; return; }

          let email = "";
          try {
            // Essayer individual d'abord, puis company
            try {
              const info = await fetchIndividualDetails(numId);
              email = info.email;
            } catch {
              const info = await fetchCompanyDetails(numId);
              email = info.email;
            }
          } catch {
            errors++;
            return;
          }

          // Mettre à jour même si pas d'email (marquer comme "no-email" pour ne pas reboucler)
          await prisma.clubMembre.update({
            where: { id: membre.id },
            data: { email: email || "—" },
          });
          if (email) fetched++;
        })
      );
    }

    const remaining = total - membres.length;
    console.log(`[Club Emails] ${fetched} emails récupérés, ${errors} erreurs, ${remaining} restants`);

    return NextResponse.json({
      success: true,
      fetched,
      errors,
      remaining: Math.max(0, remaining),
    });
  } catch (error: any) {
    console.error("[Club Emails] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la récupération des emails" },
      { status: 500 }
    );
  }
}
