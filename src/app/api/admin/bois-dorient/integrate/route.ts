import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculerNiveau } from "@/data/club-tectona";
import { upsertBrevoContact, getLists, createList } from "@/lib/brevo";

export const maxDuration = 60;

/**
 * POST /api/admin/bois-dorient/integrate
 *
 * Integre les donnees BDO dans Club Tectona :
 * - Fusionne les CA pour les clients matches
 * - Cree de nouveaux ClubMembre pour les clients BDO non matches
 * - Synchronise avec Brevo (liste "Bois d'Orient")
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  try {
    // 1. Charger les clients BDO avec du CA
    const bdoClients = await prisma.clientBoisDOrient.findMany({
      where: { totalCA: { gt: 0 } },
    });

    // 2. Charger tous les ClubMembre existants
    const existingMembres = await prisma.clubMembre.findMany();
    const membresBySellsyId = new Map(
      existingMembres.map((m) => [m.sellsyContactId, m])
    );

    let integrated = 0;
    let created = 0;
    let updated = 0;
    const brevoContacts: { email: string; nom: string; prenom: string }[] = [];

    for (const bdo of bdoClients) {
      // Cas 1 : client matche (contactDimexoiId existe)
      if (bdo.contactDimexoiId) {
        const existing = membresBySellsyId.get(bdo.contactDimexoiId);

        if (existing) {
          // Fusionner les CA
          const newTotalMontant = existing.totalMontant + bdo.totalCA;
          const newTotalCommandes = existing.totalCommandes + bdo.nbFactures;
          const newNiveau = calculerNiveau(newTotalCommandes, newTotalMontant, existing.niveau);

          await prisma.clubMembre.update({
            where: { id: existing.id },
            data: {
              totalMontant: newTotalMontant,
              totalCommandes: newTotalCommandes,
              niveau: newNiveau,
              origine: "LES_DEUX",
              dernierSync: new Date(),
            },
          });

          updated++;
        } else {
          // Creer un nouveau membre avec l'ID Dimexoi
          const niveau = calculerNiveau(bdo.nbFactures, bdo.totalCA, 0);

          await prisma.clubMembre.create({
            data: {
              sellsyContactId: bdo.contactDimexoiId,
              email: bdo.email || "",
              nom: bdo.nom,
              prenom: bdo.prenom || "",
              totalMontant: bdo.totalCA,
              totalCommandes: bdo.nbFactures,
              niveau,
              origine: "LES_DEUX",
              dernierSync: new Date(),
            },
          });

          created++;
        }

        if (bdo.email?.includes("@")) {
          brevoContacts.push({
            email: bdo.email!,
            nom: bdo.nom,
            prenom: bdo.prenom || "",
          });
        }
      }
      // Cas 2 : pas matche mais a un email valide
      else if (bdo.email?.includes("@")) {
        const niveau = calculerNiveau(bdo.nbFactures, bdo.totalCA, 0);

        await prisma.clubMembre.create({
          data: {
            sellsyContactId: `BDO-${bdo.sellsyIdBdo}`,
            email: bdo.email,
            nom: bdo.nom,
            prenom: bdo.prenom || "",
            totalMontant: bdo.totalCA,
            totalCommandes: bdo.nbFactures,
            niveau,
            origine: "BDO",
            dernierSync: new Date(),
          },
        });

        created++;
        brevoContacts.push({
          email: bdo.email,
          nom: bdo.nom,
          prenom: bdo.prenom || "",
        });
      }

      integrated++;
    }

    // 6. Brevo : trouver ou creer la liste "Bois d'Orient"
    let brevoSynced = 0;
    try {
      const lists = await getLists();
      let bdoList = lists.find((l) => l.name === "Bois d'Orient");

      if (!bdoList) {
        // Creer la liste dans le dossier par defaut (folderId = 1)
        const newListId = await createList("Bois d'Orient", 1);
        bdoList = { id: newListId, name: "Bois d'Orient", totalSubscribers: 0 };
      }

      // Ajouter les contacts BDO avec email valide
      for (const contact of brevoContacts) {
        try {
          await upsertBrevoContact({
            email: contact.email,
            attributes: {
              NOM: contact.nom,
              PRENOM: contact.prenom,
            },
            listIds: [bdoList.id],
          });
          brevoSynced++;
        } catch (brevoErr: any) {
          console.warn(`[BDO Integrate] Brevo erreur pour ${contact.email}:`, brevoErr.message);
        }
      }
    } catch (brevoError: any) {
      console.error("[BDO Integrate] Erreur Brevo globale:", brevoError.message);
    }

    return NextResponse.json({
      success: true,
      integrated,
      created,
      updated,
      brevoSynced,
      totalBdoClients: bdoClients.length,
    });
  } catch (error: any) {
    console.error("[BDO Integrate] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'integration" },
      { status: 500 }
    );
  }
}
