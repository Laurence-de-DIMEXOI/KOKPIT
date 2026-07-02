import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncProjetSellsy } from "@/lib/sur-mesure-sellsy";

/**
 * POST /api/sur-mesure/[id]/sellsy — rafraîchit le montant + statut de conversion.
 *
 * Lecture seule. On lit la DB locale (Vente/Devis déjà synchronisés depuis Sellsy
 * via le cron 2h) plutôt que de taper l'API Sellsy → plus rapide, pas de quota.
 *
 * - Si numeroSellsy commence par DEPI → cherche dans Devis (numero)
 * - Si BCDI → cherche dans Vente (numero)
 * - Conversion : si le devis a une LiaisonDevisCommande → "converti", sinon "non_converti"
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const projet = await prisma.projetSurMesure.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, numeroSellsy: true },
  });
  if (!projet) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (!projet.numeroSellsy) {
    return NextResponse.json({ error: "Aucun numéro Sellsy renseigné" }, { status: 400 });
  }

  const numero = projet.numeroSellsy.toUpperCase().trim();
  if (!numero.startsWith("BCDI") && !numero.startsWith("DEPI")) {
    return NextResponse.json({ error: "Préfixe Sellsy inconnu (attendu DEPI ou BCDI)" }, { status: 400 });
  }

  // Récupère montant + statut Sellsy ET fait avancer la colonne (Gagné/Perdu, Prix reçu).
  const r = await syncProjetSellsy(id);
  if (r.montant == null) {
    return NextResponse.json({
      error: `Document ${projet.numeroSellsy} introuvable en base locale. Il sera disponible après la prochaine sync Sellsy (toutes les 2h).`,
    }, { status: 404 });
  }

  const updated = await prisma.projetSurMesure.findUnique({
    where: { id },
    select: { montantSellsy: true, statutConversion: true, typeSellsy: true, montantSyncedAt: true, statut: true },
  });

  return NextResponse.json({ ...updated, statutSellsy: r.statutSellsy });
}
