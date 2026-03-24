import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  listAllCompanies,
  listAllIndividuals,
  listAllEstimates,
  listAllOrders,
  type SellsyCompany,
  type SellsyIndividual,
  type SellsyEstimate,
  type SellsyOrder,
} from "@/lib/sellsy";

/**
 * POST /api/contacts/sellsy-sync
 *
 * Sync complète KOKPIT ↔ Sellsy :
 * 1. Récupère companies + individuals + estimates + orders
 * 2. Matche les contacts KOKPIT par email (companies ET individuals)
 * 3. Importe les devis/BDC via le champ `related[]` (seule méthode fiable)
 * 4. Met à jour lifecycleStage → CLIENT si au moins 1 BDC
 */

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

// Map Sellsy estimate status to DevisStatut
function mapEstimateStatus(status: string): "EN_ATTENTE" | "ENVOYE" | "ACCEPTE" | "REFUSE" | "EXPIRE" {
  const statusMap: Record<string, "EN_ATTENTE" | "ENVOYE" | "ACCEPTE" | "REFUSE" | "EXPIRE"> = {
    draft: "EN_ATTENTE",
    sent: "ENVOYE",
    read: "ENVOYE",
    accepted: "ACCEPTE",
    refused: "REFUSE",
    expired: "EXPIRE",
    cancelled: "REFUSE",
    invoiced: "ACCEPTE",
    partialinvoiced: "ACCEPTE",
    advanced: "ACCEPTE",
  };
  return statusMap[status?.toLowerCase()] || "EN_ATTENTE";
}

interface SellsyEntity {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  type: "company" | "individual";
}

interface SyncResult {
  success: boolean;
  totalKokpitContacts: number;
  totalSellsyEntities: number;
  linkedByEmail: number;
  linkedByName: number;
  alreadyLinked: number;
  suggestions: Array<{
    contactId: string;
    kokpitNom: string;
    kokpitPrenom: string;
    kokpitEmail: string;
    kokpitTelephone: string;
    sellsyContactId: number;
    sellsyNom: string;
    sellsyPrenom: string;
    sellsyEmail: string;
    sellsyTelephone: string;
    matchType: string;
  }>;
  devisImported: number;
  ventesImported: number;
  clientsUpdated: number;
  errors: string[];
}

export async function POST() {
  const result: SyncResult = {
    success: false,
    totalKokpitContacts: 0,
    totalSellsyEntities: 0,
    linkedByEmail: 0,
    linkedByName: 0,
    alreadyLinked: 0,
    suggestions: [],
    devisImported: 0,
    ventesImported: 0,
    clientsUpdated: 0,
    errors: [],
  };

  try {
    // 1. Fetch ALL Sellsy data SEQUENTIALLY to avoid 429 rate limit
    const sellsyCompanies = await listAllCompanies();
    const sellsyIndividuals = await listAllIndividuals();
    const sellsyEstimates = await listAllEstimates();
    const sellsyOrders = await listAllOrders();

    console.log(
      `Sellsy sync: ${sellsyCompanies.length} companies, ${sellsyIndividuals.length} individuals, ${sellsyEstimates.length} estimates, ${sellsyOrders.length} orders`
    );

    // 2. Build unified entity pool (companies + individuals)
    const sellsyEntities: SellsyEntity[] = [];

    for (const c of sellsyCompanies) {
      const parts = (c.name || "").trim().split(/\s+/);
      sellsyEntities.push({
        id: c.id,
        email: (c.email || "").toLowerCase().trim(),
        nom: parts.length > 1 ? parts.slice(1).join(" ") : parts[0] || "",
        prenom: parts.length > 1 ? parts[0] : "",
        type: "company",
      });
    }

    for (const ind of sellsyIndividuals) {
      sellsyEntities.push({
        id: ind.id,
        email: (ind.email || "").toLowerCase().trim(),
        nom: ind.last_name || "",
        prenom: ind.first_name || "",
        type: "individual",
      });
    }

    result.totalSellsyEntities = sellsyEntities.length;

    // 3. Index Sellsy entities by email and normalized name
    const sellsyByEmail = new Map<string, SellsyEntity>();
    const sellsyByNormName = new Map<string, SellsyEntity>();

    for (const se of sellsyEntities) {
      if (se.email) {
        sellsyByEmail.set(se.email, se);
      }
      const nom = normalize(se.nom);
      const prenom = normalize(se.prenom);
      if (nom && prenom) {
        sellsyByNormName.set(`${nom}|${prenom}`, se);
        sellsyByNormName.set(`${prenom}|${nom}`, se);
      }
    }

    // 4. Fetch KOKPIT contacts
    const kokpitContacts = await prisma.contact.findMany({
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        sellsyContactId: true,
        lifecycleStage: true,
      },
    });

    result.totalKokpitContacts = kokpitContacts.length;

    // 5. Match KOKPIT contacts to Sellsy entities (by email, then by name)
    for (const kc of kokpitContacts) {
      if (kc.sellsyContactId) {
        result.alreadyLinked++;
        continue;
      }

      const email = kc.email?.toLowerCase().trim();

      // Match by email (automatic)
      if (email) {
        const match = sellsyByEmail.get(email);
        if (match) {
          await prisma.contact.update({
            where: { id: kc.id },
            data: { sellsyContactId: String(match.id) },
          });
          result.linkedByEmail++;
          continue;
        }
      }

      // Match by normalized nom + prenom (suggestion)
      const nom = normalize(kc.nom || "");
      const prenom = normalize(kc.prenom || "");

      if (nom && prenom) {
        const key = `${nom}|${prenom}`;
        const match = sellsyByNormName.get(key);
        if (match) {
          result.suggestions.push({
            contactId: kc.id,
            kokpitNom: kc.nom || "",
            kokpitPrenom: kc.prenom || "",
            kokpitEmail: kc.email || "",
            kokpitTelephone: kc.telephone || "",
            sellsyContactId: match.id,
            sellsyNom: match.nom,
            sellsyPrenom: match.prenom,
            sellsyEmail: match.email,
            sellsyTelephone: "",
            matchType: "nom_prenom",
          });
        }
      }
    }

    console.log(
      `Matching: ${result.linkedByEmail} by email, ${result.alreadyLinked} already linked, ${result.suggestions.length} suggestions`
    );

    // 5b. Créer les contacts Sellsy qui n'existent PAS dans KOKPIT
    //     (import tous les contacts Sellsy avec email)
    const existingEmails = new Set(
      kokpitContacts.map((c) => (c.email || "").toLowerCase().trim()).filter(Boolean)
    );
    const existingSellsyIds = new Set(
      kokpitContacts.map((c) => c.sellsyContactId).filter(Boolean)
    );

    let newContactsCreated = 0;
    const batchCreate: any[] = [];

    for (const se of sellsyEntities) {
      // Skip si déjà en base (par email ou sellsyId)
      if (se.email && existingEmails.has(se.email)) continue;
      if (existingSellsyIds.has(String(se.id))) continue;
      if (!se.nom && !se.prenom) continue; // pas de nom = skip

      batchCreate.push({
        email: se.email || "",
        nom: se.nom || "",
        prenom: se.prenom || "",
        sellsyContactId: String(se.id),
        lifecycleStage: "PROSPECT" as const,
      });

      // Éviter les doublons email dans le batch
      if (se.email) existingEmails.add(se.email);
      existingSellsyIds.add(String(se.id));
    }

    // Batch insert par 200
    for (let i = 0; i < batchCreate.length; i += 200) {
      const batch = batchCreate.slice(i, i + 200);
      await prisma.contact.createMany({
        data: batch,
        skipDuplicates: true,
      });
      newContactsCreated += batch.length;
    }

    console.log(`[Sync] ${newContactsCreated} nouveaux contacts créés depuis Sellsy`);
    (result as any).newContactsCreated = newContactsCreated;

    // 6. Build reverse map: sellsyEntityId → kokpitContactId (for document import)
    //    Un même client peut avoir un ID company ET un ID individual dans Sellsy.
    //    On mappe TOUS les IDs qui partagent le même email vers le même contact KOKPIT.
    const linkedContacts = await prisma.contact.findMany({
      where: { sellsyContactId: { not: null } },
      select: {
        id: true,
        email: true,
        sellsyContactId: true,
        devis: { select: { id: true, sellsyQuoteId: true } },
        ventes: { select: { id: true, sellsyInvoiceId: true } },
      },
    });

    // Index: email → all Sellsy entity IDs (company + individual) with that email
    const emailToSellsyIds = new Map<string, number[]>();
    for (const se of sellsyEntities) {
      if (se.email) {
        const ids = emailToSellsyIds.get(se.email) || [];
        ids.push(se.id);
        emailToSellsyIds.set(se.email, ids);
      }
    }

    const sellsyIdToKokpit = new Map<number, { id: string; devisIds: Set<string>; venteIds: Set<string> }>();
    for (const lc of linkedContacts) {
      if (!lc.sellsyContactId) continue;
      const kokpitRef = {
        id: lc.id,
        devisIds: new Set(lc.devis.map((d) => d.sellsyQuoteId || "").filter(Boolean)),
        venteIds: new Set(lc.ventes.map((v) => v.sellsyInvoiceId || "").filter(Boolean)),
      };

      // Map le sellsyContactId principal
      sellsyIdToKokpit.set(Number(lc.sellsyContactId), kokpitRef);

      // Map aussi TOUS les autres IDs Sellsy qui partagent le même email
      const email = lc.email?.toLowerCase().trim();
      if (email) {
        const allIds = emailToSellsyIds.get(email) || [];
        for (const altId of allIds) {
          if (!sellsyIdToKokpit.has(altId)) {
            sellsyIdToKokpit.set(altId, kokpitRef);
          }
        }
      }
    }

    console.log(`Map sellsyId→kokpit: ${sellsyIdToKokpit.size} entrées`);

    // 7. Import estimates as Devis — using `related[]` puis fallback `contact_id`
    const estimatesWithRelated = sellsyEstimates.filter((e) => e.related && e.related.length > 0).length;
    console.log(`Estimates: ${sellsyEstimates.length} total, ${estimatesWithRelated} with related[]`);

    for (const estimate of sellsyEstimates) {
      const relatedIds = (estimate.related || []).map((r) => r.id);
      let kokpitContact = relatedIds.map((rid) => sellsyIdToKokpit.get(rid)).find(Boolean);

      // Fallback: utiliser contact_id si related[] ne matche pas
      if (!kokpitContact && estimate.contact_id) {
        kokpitContact = sellsyIdToKokpit.get(estimate.contact_id);
      }

      if (!kokpitContact) continue;

      // Skip if already imported
      if (kokpitContact.devisIds.has(String(estimate.id))) continue;

      try {
        await prisma.devis.upsert({
          where: { sellsyQuoteId: String(estimate.id) },
          update: {
            numero: estimate.number || null,
            statut: mapEstimateStatus(estimate.status),
            montant: Number(estimate.amounts?.total_excl_tax) || 0,
            dateEnvoi: estimate.status === "sent" ? new Date(estimate.date) : null,
          },
          create: {
            contactId: kokpitContact.id,
            sellsyQuoteId: String(estimate.id),
            numero: estimate.number || null,
            montant: Number(estimate.amounts?.total_excl_tax) || 0,
            statut: mapEstimateStatus(estimate.status),
            dateEnvoi: estimate.status === "sent" ? new Date(estimate.date) : null,
          },
        });
        kokpitContact.devisIds.add(String(estimate.id));
        result.devisImported++;
      } catch (err: any) {
        result.errors.push(`Devis ${estimate.id}: ${err.message}`);
      }
    }

    console.log(`Imported ${result.devisImported} devis`);

    // 8. Import orders as Vente — using `related[]` OR `contact_id`
    //    Les orders search n'ont pas toujours `related[]`, on fallback sur contact_id
    const ordersWithRelated = sellsyOrders.filter((o) => o.related && o.related.length > 0).length;
    const ordersWithContactId = sellsyOrders.filter((o) => o.contact_id).length;
    console.log(`Orders: ${sellsyOrders.length} total, ${ordersWithRelated} with related[], ${ordersWithContactId} with contact_id`);

    for (const order of sellsyOrders) {
      // Essayer d'abord par related[], puis fallback sur contact_id
      const relatedIds = (order.related || []).map((r) => r.id);
      let kokpitContact = relatedIds.map((rid) => sellsyIdToKokpit.get(rid)).find(Boolean);

      // Fallback: utiliser contact_id si related[] ne matche pas
      if (!kokpitContact && order.contact_id) {
        kokpitContact = sellsyIdToKokpit.get(order.contact_id);
      }

      if (!kokpitContact) continue;

      if (kokpitContact.venteIds.has(String(order.id))) continue;

      try {
        await prisma.vente.upsert({
          where: { sellsyInvoiceId: String(order.id) },
          update: {
            montant: Number(order.amounts?.total_excl_tax) || 0,
            dateVente: new Date(order.date),
          },
          create: {
            contactId: kokpitContact.id,
            sellsyInvoiceId: String(order.id),
            montant: Number(order.amounts?.total_excl_tax) || 0,
            dateVente: new Date(order.date),
          },
        });
        kokpitContact.venteIds.add(String(order.id));
        result.ventesImported++;
      } catch (err: any) {
        result.errors.push(`BDC ${order.id}: ${err.message}`);
      }
    }

    console.log(`Imported ${result.ventesImported} BDC`);

    // 9. Update lifecycleStage to CLIENT for contacts with at least 1 Vente
    const contactsWithVentes = await prisma.contact.findMany({
      where: {
        ventes: { some: {} },
        lifecycleStage: { not: "CLIENT" },
      },
      select: { id: true },
    });

    if (contactsWithVentes.length > 0) {
      await prisma.contact.updateMany({
        where: { id: { in: contactsWithVentes.map((c) => c.id) } },
        data: { lifecycleStage: "CLIENT" },
      });
      result.clientsUpdated = contactsWithVentes.length;
    }

    result.success = true;
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/contacts/sellsy-sync error:", error);
    result.errors.push(error.message);
    return NextResponse.json(result, { status: 500 });
  }
}
