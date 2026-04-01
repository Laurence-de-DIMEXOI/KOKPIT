import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listAllItems, invalidateSellsyCache } from "@/lib/sellsy";

const ROLES_AUTORISES = ["ADMIN", "DIRECTION"];

// Arrondi au prix se terminant par 9 >= prix calculé
function roundToNine(price: number): number {
  const base = Math.floor(price / 10) * 10 + 9;
  return base >= price ? base : base + 10;
}

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

    const body = await req.json();
    const coefficient = parseFloat(body.coefficient);
    if (isNaN(coefficient) || coefficient <= 0 || coefficient > 10) {
      return NextResponse.json(
        { error: "Coefficient invalide (doit être entre 0 et 10)" },
        { status: 400 }
      );
    }

    // Récupérer TOUS les produits et services du catalogue Sellsy
    // listAllItems : filtre type product+service, non archivés, dédupliqué par ID
    // → inclut bien les déclinaisons (finitions, couleurs) car chaque variante
    //   est un item distinct avec sa propre référence et son propre prix dans Sellsy
    invalidateSellsyCache();
    const allItems = await listAllItems();

    // Calculer les nouveaux prix
    const userId = (session.user as any).id as string;
    const lignes = allItems
      .filter((item) => parseFloat(item.reference_price_taxes_exc || "0") > 0)
      .map((item) => {
        const prixAvant = parseFloat(item.reference_price_taxes_exc);
        const prixApres = roundToNine(prixAvant * coefficient);
        return {
          sellsyItemId: item.id,
          reference: item.reference || String(item.id),
          designation: item.name || item.reference || String(item.id),
          prixAvant,
          prixApres,
          diff: prixApres - prixAvant,
        };
      });

    // Créer la session
    const sessionTarif = await prisma.sessionTarif.create({
      data: {
        coefficient,
        nbReferences: lignes.length,
        statut: "SIMULE",
        createdById: userId,
      },
    });

    // Créer les backups en batch
    await prisma.prixBackup.createMany({
      data: lignes.map((l) => ({
        sessionId: sessionTarif.id,
        sellsyItemId: l.sellsyItemId,
        reference: l.reference,
        designation: l.designation,
        prixAvant: l.prixAvant,
        prixApres: l.prixApres,
        createdById: userId,
      })),
    });

    const totalAvant = lignes.reduce((s, l) => s + l.prixAvant, 0);
    const totalApres = lignes.reduce((s, l) => s + l.prixApres, 0);

    return NextResponse.json({
      sessionId: sessionTarif.id,
      coefficient,
      nbReferences: lignes.length,
      totalAvant,
      totalApres,
      lignes,
    });
  } catch (err) {
    console.error("tarifs/simuler:", err);
    return NextResponse.json(
      { error: "Erreur lors de la simulation" },
      { status: 500 }
    );
  }
}
