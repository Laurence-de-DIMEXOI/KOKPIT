import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  let montant: number | null = null;
  let statutSellsy: string | null = null;
  let statutConversion: string | null = null;
  let typeSellsy: "DEVIS" | "BON_COMMANDE" | null = null;

  if (numero.startsWith("BCDI")) {
    typeSellsy = "BON_COMMANDE";
    const vente = await prisma.vente.findFirst({
      where: { numero: { equals: projet.numeroSellsy, mode: "insensitive" } },
      select: { montant: true, statutSellsy: true },
    });
    if (vente) {
      montant = vente.montant;
      statutSellsy = vente.statutSellsy;
      statutConversion = "converti"; // un BCDI est déjà une commande
    }
  } else if (numero.startsWith("DEPI")) {
    typeSellsy = "DEVIS";
    const devis = await prisma.devis.findFirst({
      where: { numero: { equals: projet.numeroSellsy, mode: "insensitive" } },
      select: { montant: true, statutSellsy: true, sellsyQuoteId: true },
    });
    if (devis) {
      montant = devis.montant;
      statutSellsy = devis.statutSellsy;
      // Conversion : le devis a-t-il une liaison vers une commande ?
      if (devis.sellsyQuoteId) {
        const liaison = await prisma.liaisonDevisCommande.findFirst({
          where: { estimateId: Number(devis.sellsyQuoteId) },
        });
        statutConversion = liaison ? "converti" : "non_converti";
      } else {
        statutConversion = "non_converti";
      }
    }
  } else {
    return NextResponse.json({ error: "Préfixe Sellsy inconnu (attendu DEPI ou BCDI)" }, { status: 400 });
  }

  if (montant === null) {
    return NextResponse.json({
      error: `Document ${projet.numeroSellsy} introuvable en base locale. Il sera disponible après la prochaine sync Sellsy (toutes les 2h).`,
    }, { status: 404 });
  }

  const updated = await prisma.projetSurMesure.update({
    where: { id },
    data: {
      montantSellsy: montant,
      statutConversion,
      typeSellsy,
      montantSyncedAt: new Date(),
    },
    select: {
      montantSellsy: true, statutConversion: true, typeSellsy: true, montantSyncedAt: true,
    },
  });

  return NextResponse.json({ ...updated, statutSellsy });
}
