import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sellsyFetch, invalidateSellsyCache } from "@/lib/sellsy";

const ROLES_AUTORISES = ["ADMIN", "DIRECTION"];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

    // Vérifier la session
    const sessionTarif = await prisma.sessionTarif.findUnique({
      where: { id: sessionId },
    });
    if (!sessionTarif) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }
    if (sessionTarif.statut !== "SIMULE") {
      return NextResponse.json(
        { error: `Session déjà ${sessionTarif.statut.toLowerCase()}` },
        { status: 409 }
      );
    }

    // Récupérer les backups
    const backups = await prisma.prixBackup.findMany({
      where: { sessionId },
    });

    const errors: Array<{ reference: string; error: string }> = [];
    let applied = 0;

    for (const backup of backups) {
      if (backup.prixApres === null) continue;
      try {
        // Sellsy V2 : PUT /items/{id}
        // unit_amount est en centimes
        await sellsyFetch(`/items/${backup.sellsyItemId}`, {
          method: "PUT",
          body: JSON.stringify({
            unit_amount: Math.round(backup.prixApres * 100),
          }),
        });

        await prisma.prixBackup.update({
          where: { id: backup.id },
          data: { applique: true },
        });
        applied++;
      } catch (err) {
        errors.push({
          reference: backup.reference,
          error: err instanceof Error ? err.message : String(err),
        });
      }

      // Rate limiting : 10 req/s max
      await sleep(100);
    }

    // Mettre à jour le statut de la session
    const statut = errors.length === 0 ? "APPLIQUE" : "ERREUR";
    await prisma.sessionTarif.update({
      where: { id: sessionId },
      data: {
        statut,
        appliqueLeAt: new Date(),
      },
    });

    // Invalider le cache Sellsy
    invalidateSellsyCache();

    return NextResponse.json({
      success: errors.length === 0,
      applied,
      errors,
      total: backups.length,
    });
  } catch (err) {
    console.error("tarifs/appliquer:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'application" },
      { status: 500 }
    );
  }
}
