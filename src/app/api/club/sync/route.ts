import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  listAllOrders,
  fetchIndividualDetails,
  fetchCompanyDetails,
  invalidateSellsyCache,
} from "@/lib/sellsy";
import { calculerNiveau, getDebutFenetre } from "@/data/club-grandis";

// Vercel Hobby = max 60s, Pro = max 300s
export const maxDuration = 60;

/**
 * POST /api/club/sync
 *
 * Synchronisation manuelle : récupère toutes les commandes Sellsy depuis début 2020,
 * calcule le niveau de chaque client, et upsert dans ClubMembre.
 * Règle : ne jamais descendre de niveau.
 *
 * Optimisé pour tenir dans les 60s (Vercel Hobby) :
 *  - Pré-chargement de tous les membres existants en 1 requête
 *  - Réutilisation des noms/emails déjà en base
 *  - Fetch API Sellsy uniquement pour les NOUVEAUX contacts sans nom
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // 0. Vider le cache Sellsy pour avoir des données fraîches
    invalidateSellsyCache();

    // 1. Récupérer toutes les commandes depuis début 2020
    const debutFenetre = getDebutFenetre();
    const sinceISO = debutFenetre.toISOString().split("T")[0];

    console.log(`[Club Sync] Début sync — fenêtre depuis ${sinceISO}`);
    const orders = await listAllOrders(sinceISO);
    console.log(`[Club Sync] ${orders.length} commandes récupérées`);

    // 2. Grouper par tiers (related[0].id)
    const contactMap = new Map<
      string,
      {
        contactId: string;
        relatedType: string;
        email: string;
        nom: string;
        prenom: string;
        nbCommandes: number;
        totalMontant: number;
      }
    >();

    for (const order of orders) {
      const related = order.related?.[0];
      if (!related) continue;

      const contactId = String(related.id);
      const existing = contactMap.get(contactId);

      // Montant TTC (Sellsy retourne des strings)
      const montant = Number(order.amounts?.total_incl_tax) || 0;

      if (existing) {
        existing.nbCommandes += 1;
        existing.totalMontant += montant;
      } else {
        const contactEmbed = order._embed?.contact;
        const companyEmbed = order._embed?.company;

        let nom = "Inconnu";
        let prenom = "";
        let email = "";

        if (related.type === "individual" && contactEmbed) {
          nom = contactEmbed.last_name || "Inconnu";
          prenom = contactEmbed.first_name || "";
        } else if (related.type === "company" && companyEmbed) {
          nom = companyEmbed.name || "Inconnu";
        } else if (order.company_name) {
          nom = order.company_name;
        }

        contactMap.set(contactId, {
          contactId,
          relatedType: related.type || "unknown",
          email,
          nom,
          prenom,
          nbCommandes: 1,
          totalMontant: montant,
        });
      }
    }

    console.log(`[Club Sync] ${contactMap.size} contacts identifiés`);

    // 3. Pré-charger TOUS les membres existants en 1 seule requête
    const existingMembers = await prisma.clubMembre.findMany({
      select: {
        sellsyContactId: true,
        nom: true,
        prenom: true,
        email: true,
        niveau: true,
        exclu: true,
      },
    });
    const existingMap = new Map(
      existingMembers.map((m) => [m.sellsyContactId, m])
    );
    console.log(`[Club Sync] ${existingMap.size} membres existants en base`);

    // 4. Compléter noms/emails : réutiliser la base + fetch Sellsy uniquement pour les nouveaux "Inconnu"
    for (const [id, data] of contactMap) {
      const dbMember = existingMap.get(id);
      if (dbMember) {
        // Réutiliser les données déjà en base (pas d'appel API)
        if (data.nom === "Inconnu" && dbMember.nom !== "Inconnu") {
          data.nom = dbMember.nom;
          data.prenom = dbMember.prenom;
        }
        if (!data.email && dbMember.email) {
          data.email = dbMember.email;
        }
      }
    }

    // Fetch API Sellsy uniquement pour les NOUVEAUX contacts sans nom (pas en base)
    const needsFetch = [...contactMap.entries()].filter(
      ([id, d]) => d.nom === "Inconnu" && !existingMap.has(id)
    );
    if (needsFetch.length > 0) {
      console.log(`[Club Sync] Fetch détails pour ${needsFetch.length} nouveaux contacts…`);
      for (let i = 0; i < needsFetch.length; i += 10) {
        const batch = needsFetch.slice(i, i + 10);
        await Promise.all(
          batch.map(async ([id, data]) => {
            const numId = parseInt(id, 10);
            if (data.relatedType === "individual") {
              const info = await fetchIndividualDetails(numId);
              data.nom = info.nom;
              data.prenom = info.prenom;
              if (!data.email) data.email = info.email;
            } else {
              const info = await fetchCompanyDetails(numId);
              data.nom = info.nom;
              if (!data.email) data.email = info.email;
            }
          })
        );
      }
    }

    // 5. Calculer niveaux et upsert
    let synced = 0;
    let upgraded = 0;
    let nouveaux = 0;

    // Contacts internes à exclure
    const EXCLUDED_COMPANIES = ["DIMEXOI"];
    const EXCLUDED_TEAM = [
      { nom: "BATISSE", prenom: "LAURENT" },
      { nom: "LEGROS", prenom: "MICHELLE" },
      { nom: "PERROT", prenom: "MICHELLE" },
      { nom: "PAYET", prenom: "LAURENCE" },
      { nom: "DAMMBRILLE", prenom: "ALAIN" },
      { nom: "DECAUNES", prenom: "ELAURY" },
    ];

    for (const [contactId, data] of contactMap) {
      // Exclure Dimexoi
      if (EXCLUDED_COMPANIES.some((n) => data.nom.toUpperCase().includes(n))) continue;
      // Exclure l'équipe
      const nomUp = data.nom.toUpperCase();
      const prenomUp = data.prenom.toUpperCase();
      if (EXCLUDED_TEAM.some((t) => nomUp === t.nom && prenomUp === t.prenom)) continue;

      // Vérifier qualification niv 1 minimum
      const niveauCalcule = calculerNiveau(data.nbCommandes, data.totalMontant, 0);
      if (niveauCalcule < 1) continue;

      // Utiliser les données pré-chargées au lieu de findUnique
      const existant = existingMap.get(contactId);

      // Si exclu manuellement, ne pas recréer
      if (existant?.exclu) continue;

      const niveauFinal = calculerNiveau(
        data.nbCommandes,
        data.totalMontant,
        existant?.niveau || 0
      );

      if (existant) {
        const wasUpgraded = niveauFinal > existant.niveau;
        await prisma.clubMembre.update({
          where: { sellsyContactId: contactId },
          data: {
            niveau: niveauFinal,
            totalCommandes: data.nbCommandes,
            totalMontant: Number(data.totalMontant) || 0,
            dernierSync: new Date(),
            ...(existant.nom === "Inconnu" && data.nom !== "Inconnu"
              ? { nom: data.nom, prenom: data.prenom }
              : {}),
            ...(existant.email === "" && data.email
              ? { email: data.email }
              : {}),
            ...(wasUpgraded
              ? { brevoSynced: false, sellsySynced: false }
              : {}),
          },
        });
        if (wasUpgraded) upgraded++;
      } else {
        await prisma.clubMembre.create({
          data: {
            sellsyContactId: contactId,
            email: data.email || "",
            nom: data.nom,
            prenom: data.prenom,
            niveau: niveauFinal,
            totalCommandes: data.nbCommandes,
            totalMontant: Number(data.totalMontant) || 0,
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
