import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listAllOrders, type SellsyOrder } from "@/lib/sellsy";
import { calculerNiveau, getDebutFenetre, CLUB_LEVELS } from "@/data/club-grandis";

/**
 * POST /api/club/sync
 *
 * Synchronisation manuelle : récupère toutes les commandes Sellsy des 36 derniers mois,
 * calcule le niveau de chaque client, et upsert dans ClubMembre.
 * Règle : ne jamais descendre de niveau.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // 1. Récupérer toutes les commandes depuis la fenêtre glissante 36 mois
    const debutFenetre = getDebutFenetre();
    const sinceISO = debutFenetre.toISOString().split("T")[0]; // "YYYY-MM-DD"

    console.log(`[Club Sync] Début sync — fenêtre depuis ${sinceISO}`);
    const orders = await listAllOrders(sinceISO);
    console.log(`[Club Sync] ${orders.length} commandes récupérées`);

    // 2. Grouper par contact (related[0].id = le tiers)
    const contactMap = new Map<
      string,
      {
        contactId: string;
        email: string;
        nom: string;
        prenom: string;
        nbCommandes: number;
        totalMontant: number;
      }
    >();

    for (const order of orders) {
      // Identifier le tiers (contact Sellsy)
      const related = order.related?.[0];
      if (!related) continue;

      const contactId = String(related.id);
      const existing = contactMap.get(contactId);

      // Montant HT de la commande
      const montant = order.amounts?.total_excl_tax || 0;

      // Infos contact depuis l'embed
      const contactEmbed = order._embed?.contact;
      const companyEmbed = order._embed?.company;

      const nom = contactEmbed?.last_name || companyEmbed?.name || "Inconnu";
      const prenom = contactEmbed?.first_name || "";
      const email = ""; // On récupérera l'email plus tard si besoin

      if (existing) {
        existing.nbCommandes += 1;
        existing.totalMontant += montant;
      } else {
        contactMap.set(contactId, {
          contactId,
          email,
          nom,
          prenom,
          nbCommandes: 1,
          totalMontant: montant,
        });
      }
    }

    console.log(`[Club Sync] ${contactMap.size} contacts identifiés`);

    // 3. Pour chaque contact qualifié, calculer le niveau et upsert
    let synced = 0;
    let upgraded = 0;
    let nouveaux = 0;

    for (const [contactId, data] of contactMap) {
      // Vérifier si le contact atteint au moins le niv 1 (1 cmd ≥ 500€)
      const niveauCalcule = calculerNiveau(data.nbCommandes, data.totalMontant, 0);
      if (niveauCalcule < 1) continue; // Pas qualifié

      // Vérifier le niveau actuel en base (ne jamais descendre)
      const existant = await prisma.clubMembre.findUnique({
        where: { sellsyContactId: contactId },
      });

      const niveauFinal = calculerNiveau(
        data.nbCommandes,
        data.totalMontant,
        existant?.niveau || 0
      );

      if (existant) {
        // Mise à jour
        const wasUpgraded = niveauFinal > existant.niveau;
        await prisma.clubMembre.update({
          where: { sellsyContactId: contactId },
          data: {
            niveau: niveauFinal,
            totalCommandes: data.nbCommandes,
            totalMontant: data.totalMontant,
            dernierSync: new Date(),
            // Reset sync flags si le niveau a changé
            ...(wasUpgraded
              ? { brevoSynced: false, sellsySynced: false }
              : {}),
          },
        });
        if (wasUpgraded) upgraded++;
      } else {
        // Nouveau membre
        await prisma.clubMembre.create({
          data: {
            sellsyContactId: contactId,
            email: data.email || "",
            nom: data.nom,
            prenom: data.prenom,
            niveau: niveauFinal,
            totalCommandes: data.nbCommandes,
            totalMontant: data.totalMontant,
            dernierSync: new Date(),
            brevoSynced: false,
            sellsySynced: false,
          },
        });
        nouveaux++;
      }
      synced++;
    }

    console.log(
      `[Club Sync] Terminé — ${synced} synchronisés, ${nouveaux} nouveaux, ${upgraded} upgradés`
    );

    return NextResponse.json({
      success: true,
      synced,
      nouveaux,
      upgraded,
      totalOrders: orders.length,
      totalContacts: contactMap.size,
    });
  } catch (error: any) {
    console.error("[Club Sync] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la synchronisation" },
      { status: 500 }
    );
  }
}
