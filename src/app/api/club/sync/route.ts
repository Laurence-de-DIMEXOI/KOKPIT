import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listAllOrders, type SellsyOrder } from "@/lib/sellsy";
import { calculerNiveau, getDebutFenetre, CLUB_LEVELS } from "@/data/club-grandis";

// Helper : fetch un individual Sellsy par son ID
async function fetchIndividualName(id: number): Promise<{ nom: string; prenom: string; email: string }> {
  try {
    const token = process.env.SELLSY_ACCESS_TOKEN;
    const res = await fetch(`https://api.sellsy.com/v2/individuals/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { nom: "Inconnu", prenom: "", email: "" };
    const data = await res.json();
    return {
      nom: data.last_name || data.name || "Inconnu",
      prenom: data.first_name || "",
      email: data.email || "",
    };
  } catch {
    return { nom: "Inconnu", prenom: "", email: "" };
  }
}

// Helper : fetch une company Sellsy par son ID
async function fetchCompanyName(id: number): Promise<{ nom: string; email: string }> {
  try {
    const token = process.env.SELLSY_ACCESS_TOKEN;
    const res = await fetch(`https://api.sellsy.com/v2/companies/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { nom: "Inconnu", email: "" };
    const data = await res.json();
    return {
      nom: data.name || "Inconnu",
      email: data.email || "",
    };
  } catch {
    return { nom: "Inconnu", email: "" };
  }
}

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

    // 2. Grouper par tiers (related[0].id)
    const contactMap = new Map<
      string,
      {
        contactId: string;
        relatedType: string; // "individual" | "company"
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

      // Montant HT de la commande (Sellsy retourne des strings)
      const montant = Number(order.amounts?.total_excl_tax) || 0;

      if (existing) {
        existing.nbCommandes += 1;
        existing.totalMontant += montant;
      } else {
        // Extraire le nom depuis les embeds ou les champs directs
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

    // 3. Pour les contacts sans nom ou sans email, fetch les détails depuis Sellsy
    const needsFetch = [...contactMap.entries()].filter(
      ([, d]) => d.nom === "Inconnu" || !d.email
    );
    if (needsFetch.length > 0) {
      console.log(`[Club Sync] Récupération détails pour ${needsFetch.length} contacts…`);
      // Batch de 10 requêtes en parallèle
      for (let i = 0; i < needsFetch.length; i += 10) {
        const batch = needsFetch.slice(i, i + 10);
        await Promise.all(
          batch.map(async ([id, data]) => {
            const numId = parseInt(id, 10);
            if (data.relatedType === "individual") {
              const info = await fetchIndividualName(numId);
              if (data.nom === "Inconnu") {
                data.nom = info.nom;
                data.prenom = info.prenom;
              }
              if (!data.email) data.email = info.email;
            } else {
              const info = await fetchCompanyName(numId);
              if (data.nom === "Inconnu") data.nom = info.nom;
              if (!data.email) data.email = info.email;
            }
          })
        );
      }
    }

    // 4. Pour chaque contact qualifié, calculer le niveau et upsert
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
            totalMontant: Number(data.totalMontant) || 0,
            dernierSync: new Date(),
            // Mettre à jour le nom si on avait "Inconnu" avant
            ...(existant.nom === "Inconnu" && data.nom !== "Inconnu"
              ? { nom: data.nom, prenom: data.prenom }
              : {}),
            // Mettre à jour l'email si on en a un maintenant
            ...(existant.email === "" && data.email
              ? { email: data.email }
              : {}),
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
