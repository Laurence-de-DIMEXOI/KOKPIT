/**
 * Club Grandis — Fonctions de synchronisation
 *
 * Logique extraite des routes API pour pouvoir etre appelee
 * depuis le cron automatique (sans session utilisateur) ET
 * depuis les routes manuelles (avec session).
 */

import { prisma } from "@/lib/prisma";
import {
  listAllOrders,
  assignSmartTag,
  fetchIndividualDetails,
  fetchCompanyDetails,
  invalidateSellsyCache,
} from "@/lib/sellsy";
import { calculerNiveau, getDebutFenetre, CLUB_LEVELS } from "@/data/club-grandis";
import {
  getLists,
  createList,
  getFolders,
  upsertBrevoContact,
  removeContactsFromList,
} from "@/lib/brevo";

// ============================================================================
// CONSTANTES
// ============================================================================

const EXCLUDED_COMPANIES = ["DIMEXOI"];
const EXCLUDED_TEAM = [
  { nom: "BATISSE", prenom: "LAURENT" },
  { nom: "LEGROS", prenom: "MICHELLE" },
  { nom: "PERROT", prenom: "MICHELLE" },
  { nom: "PAYET", prenom: "LAURENCE" },
  { nom: "DAMMBRILLE", prenom: "ALAIN" },
  { nom: "DECAUNES", prenom: "ELAURY" },
];

const BREVO_LISTS = [
  { name: "Club Grandis", forAll: true },
  { name: "Club Grandis \u00b7 I", niveau: 1 },
  { name: "Club Grandis \u00b7 II", niveau: 2 },
  { name: "Club Grandis \u00b7 III", niveau: 3 },
  { name: "Club Grandis \u00b7 IV", niveau: 4 },
  { name: "Club Grandis \u00b7 V", niveau: 5 },
] as const;

// ============================================================================
// syncClubCommandes
// ============================================================================

export async function syncClubCommandes() {
  // 0. Vider le cache Sellsy pour avoir des donnees fraiches
  invalidateSellsyCache();

  // 1. Recuperer toutes les commandes depuis debut 2020
  const debutFenetre = getDebutFenetre();
  const sinceISO = debutFenetre.toISOString().split("T")[0];

  console.log(`[Club Sync] Debut sync — fenetre depuis ${sinceISO}`);
  const orders = await listAllOrders(sinceISO);
  console.log(`[Club Sync] ${orders.length} commandes recuperees`);

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

  console.log(`[Club Sync] ${contactMap.size} contacts identifies`);

  // 3. Pre-charger TOUS les membres existants en 1 seule requete
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

  // 4. Completer noms/emails : reutiliser la base + fetch Sellsy uniquement pour les nouveaux "Inconnu"
  for (const [id, data] of contactMap) {
    const dbMember = existingMap.get(id);
    if (dbMember) {
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
    console.log(`[Club Sync] Fetch details pour ${needsFetch.length} nouveaux contacts…`);
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

  // 5. Calculer niveaux et batch upsert (1 transaction au lieu de 1191 requetes)
  let synced = 0;
  let upgraded = 0;
  let nouveaux = 0;
  const now = new Date();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ops: any[] = [];

  for (const [contactId, data] of contactMap) {
    if (EXCLUDED_COMPANIES.some((n) => data.nom.toUpperCase().includes(n))) continue;
    const nomUp = data.nom.toUpperCase();
    const prenomUp = data.prenom.toUpperCase();
    if (EXCLUDED_TEAM.some((t) => nomUp === t.nom && prenomUp === t.prenom)) continue;

    const niveauCalcule = calculerNiveau(data.nbCommandes, data.totalMontant, 0);
    if (niveauCalcule < 1) continue;

    const existant = existingMap.get(contactId);
    if (existant?.exclu) continue;

    const niveauFinal = calculerNiveau(
      data.nbCommandes,
      data.totalMontant,
      existant?.niveau || 0
    );

    if (existant) {
      const wasUpgraded = niveauFinal > existant.niveau;
      ops.push(
        prisma.clubMembre.update({
          where: { sellsyContactId: contactId },
          data: {
            niveau: niveauFinal,
            totalCommandes: data.nbCommandes,
            totalMontant: Number(data.totalMontant) || 0,
            dernierSync: now,
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
        })
      );
      if (wasUpgraded) upgraded++;
    } else {
      ops.push(
        prisma.clubMembre.create({
          data: {
            sellsyContactId: contactId,
            email: data.email || "",
            nom: data.nom,
            prenom: data.prenom,
            niveau: niveauFinal,
            totalCommandes: data.nbCommandes,
            totalMontant: Number(data.totalMontant) || 0,
            dernierSync: now,
            brevoSynced: false,
            sellsySynced: false,
          },
        })
      );
      nouveaux++;
    }
    synced++;
  }

  // Executer tous les upserts en 1 transaction (beaucoup plus rapide que 1 par 1)
  if (ops.length > 0) {
    console.log(`[Club Sync] Batch de ${ops.length} operations…`);
    // Prisma $transaction accepte max ~32000 ops, on batch par 500
    for (let i = 0; i < ops.length; i += 500) {
      await prisma.$transaction(ops.slice(i, i + 500));
    }
  }

  console.log(
    `[Club Sync] Upserts termines — ${synced} synchronises, ${nouveaux} nouveaux, ${upgraded} upgrades`
  );

  return { synced, nouveaux, upgraded, totalOrders: orders.length, totalContacts: contactMap.size };
}

// ============================================================================
// syncClubTags
// ============================================================================

export async function syncClubTags(limit?: number) {
  const total = await prisma.clubMembre.count({
    where: { sellsySynced: false, exclu: false },
  });

  if (total === 0) {
    return { synced: 0, errors: 0, remaining: 0 };
  }

  const membres = await prisma.clubMembre.findMany({
    where: { sellsySynced: false, exclu: false },
    ...(limit ? { take: limit } : {}),
  });

  console.log(`[Club Tags] Batch de ${membres.length}/${total} membres…`);

  let synced = 0;
  let errors = 0;

  for (const membre of membres) {
    const contactId = parseInt(membre.sellsyContactId, 10);
    if (isNaN(contactId)) { errors++; continue; }

    const level = CLUB_LEVELS.find((l) => l.niveau === membre.niveau);
    if (!level) { errors++; continue; }

    try {
      await assignSmartTag(contactId, level.sellsyTag);
      synced++;
    } catch (err: any) {
      console.warn(`[Club Tags] Erreur ${contactId} (${membre.nom}):`, err.message);
      errors++;
    }

    // Marquer comme traite (meme en erreur, pour ne pas reboucler indefiniment)
    await prisma.clubMembre.update({
      where: { id: membre.id },
      data: { sellsySynced: true },
    });
  }

  const remaining = total - membres.length;
  console.log(`[Club Tags] ${synced} OK, ${errors} erreurs, ${remaining} restants`);

  return { synced, errors, remaining: Math.max(0, remaining) };
}

// ============================================================================
// syncClubEmails
// ============================================================================

export async function syncClubEmails(limit?: number) {
  const total = await prisma.clubMembre.count({
    where: { email: "", exclu: false },
  });

  if (total === 0) {
    return { fetched: 0, errors: 0, remaining: 0 };
  }

  const membres = await prisma.clubMembre.findMany({
    where: { email: "", exclu: false },
    select: { sellsyContactId: true, id: true },
    ...(limit ? { take: limit } : {}),
  });

  console.log(`[Club Emails] Fetch emails pour ${membres.length}/${total} membres…`);

  let fetched = 0;
  let errors = 0;

  // Batches de 5 en parallele (moins agressif sur le rate limit Sellsy)
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

        // Mettre a jour meme si pas d'email (marquer comme "no-email" pour ne pas reboucler)
        await prisma.clubMembre.update({
          where: { id: membre.id },
          data: { email: email || "\u2014" },
        });
        if (email) fetched++;
      })
    );
  }

  const remaining = total - membres.length;
  console.log(`[Club Emails] ${fetched} emails recuperes, ${errors} erreurs, ${remaining} restants`);

  return { fetched, errors, remaining: Math.max(0, remaining) };
}

// ============================================================================
// syncClubBrevo
// ============================================================================

/**
 * Trouve ou cree une liste Brevo par nom.
 * Retourne l'ID de la liste.
 */
async function findOrCreateList(
  name: string,
  existingLists: { id: number; name: string; totalSubscribers: number }[],
  folderId: number
): Promise<number> {
  const found = existingLists.find((l) => l.name === name);
  if (found) return found.id;

  console.log(`[Club Brevo] Creation de la liste "${name}"…`);
  const listId = await createList(name, folderId);
  console.log(`[Club Brevo] Liste creee (id: ${listId})`);
  return listId;
}

export async function syncClubBrevo() {
  // 1. Recuperer les listes existantes et le premier dossier
  const [existingLists, folders] = await Promise.all([
    getLists(),
    getFolders(),
  ]);
  const folderId = folders[0]?.id || 1;

  // 2. Trouver ou creer les 6 listes
  const listIds: Record<string, number> = {};
  for (const listDef of BREVO_LISTS) {
    listIds[listDef.name] = await findOrCreateList(listDef.name, existingLists, folderId);
  }

  const masterListId = listIds["Club Grandis"];
  const levelListIds: Record<number, number> = {};
  for (const listDef of BREVO_LISTS) {
    if ("niveau" in listDef && listDef.niveau) {
      levelListIds[listDef.niveau] = listIds[listDef.name];
    }
  }

  // Toutes les IDs de listes par niveau pour pouvoir retirer des mauvaises
  const allLevelListIdValues = Object.values(levelListIds);

  // 3. Recuperer TOUS les membres avec un email valide
  const membres = await prisma.clubMembre.findMany({
    where: {
      exclu: false,
      email: { not: "" },
    },
  });

  console.log(`[Club Brevo] ${membres.length} membres avec email a synchroniser`);

  if (membres.length === 0) {
    return { synced: 0, errors: 0, total: 0 };
  }

  let synced = 0;
  let errors = 0;

  // 4. Upsert chaque contact avec ses attributs Club
  for (const membre of membres) {
    try {
      if (!membre.email.includes("@")) {
        errors++;
        continue;
      }

      const level = CLUB_LEVELS.find((l) => l.niveau === membre.niveau);
      if (!level) continue;

      const correctLevelListId = levelListIds[membre.niveau];
      // Listes de niveaux incorrects dont il faut retirer le contact
      const wrongLevelListIds = allLevelListIdValues.filter(
        (id) => id !== correctLevelListId
      );

      await upsertBrevoContact({
        email: membre.email,
        attributes: {
          CLUB_NIVEAU: membre.niveau,
          CLUB_NOM_NIVEAU: level.nom,
          CLUB_CHIFFRE: level.chiffre,
          CLUB_REMISE: level.remise,
          PRENOM: membre.prenom,
          NOM: membre.nom,
        },
        listIds: [masterListId, correctLevelListId],
        unlinkListIds: wrongLevelListIds,
      });

      // Marquer comme synchronise
      await prisma.clubMembre.update({
        where: { id: membre.id },
        data: { brevoSynced: true },
      });

      synced++;
    } catch (err: any) {
      console.warn(`[Club Brevo] Erreur pour ${membre.email}:`, err.message);
      errors++;
    }
  }

  console.log(
    `[Club Brevo] Termine — ${synced} synchronises, ${errors} erreurs`
  );

  return { synced, errors, total: membres.length };
}
