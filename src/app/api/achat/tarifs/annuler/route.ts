import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sellsyFetch, invalidateSellsyCache } from "@/lib/sellsy";

const ROLES_AUTORISES = ["ADMIN", "DIRECTION"];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DELAI_ROLLBACK_MS = 24 * 60 * 60 * 1000; // 24h

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const role = (session.user as any).role as string;
    if (!ROLES_AUTORISES.includes(role)) {
      return NextResponse.json(
        { error: "Accès refusé — réservé ADMIN et DIRECTION" },
        { status: 403 }
      );
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId requis" }, { status: 400 });
    }

    const sessionTarif = await prisma.sessionTarif.findUnique({
      where: { id: sessionId },
    });
    if (!sessionTarif) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }
    if (sessionTarif.statut !== "APPLIQUE") {
      return NextResponse.json(
        { error: "Seules les sessions appliquées peuvent être annulées" },
        { status: 409 }
      );
    }

    // Vérifier le délai 24h
    if (!sessionTarif.appliqueLeAt) {
      return NextResponse.json({ error: "Date d'application manquante" }, { status: 400 });
    }
    const age = Date.now() - sessionTarif.appliqueLeAt.getTime();
    if (age > DELAI_ROLLBACK_MS) {
      return NextResponse.json(
        { error: "Délai de rollback expiré (24h maximum)" },
        { status: 410 }
      );
    }

    // Récupérer les backups appliqués
    const backups = await prisma.prixBackup.findMany({
      where: { sessionId, applique: true },
    });

    const errors: Array<{ reference: string; error: string }> = [];
    let restored = 0;

    for (const backup of backups) {
      try {
        await sellsyFetch(`/items/${backup.sellsyItemId}`, {
          method: "PUT",
          body: JSON.stringify({
            unit_amount: Math.round(backup.prixAvant * 100),
          }),
        });

        await prisma.prixBackup.update({
          where: { id: backup.id },
          data: { applique: false },
        });
        restored++;
      } catch (err) {
        errors.push({
          reference: backup.reference,
          error: err instanceof Error ? err.message : String(err),
        });
      }
      await sleep(100);
    }

    await prisma.sessionTarif.update({
      where: { id: sessionId },
      data: {
        statut: "ANNULE",
        annuleLeAt: new Date(),
      },
    });

    invalidateSellsyCache();

    return NextResponse.json({ success: errors.length === 0, restored, errors });
  } catch (err) {
    console.error("tarifs/annuler:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'annulation" },
      { status: 500 }
    );
  }
}
