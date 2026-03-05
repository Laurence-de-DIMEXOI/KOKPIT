import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  listAllContacts,
  listAllCompanies,
  listAllEstimates,
  listAllOrders,
  type SellsyContact,
  type SellsyCompany,
  type SellsyEstimate,
  type SellsyOrder,
} from "@/lib/sellsy";

/**
 * POST /api/contacts/sellsy-sync
 *
 * Comprehensive Sellsy sync route:
 * 1. Fetches all Sellsy companies, estimates, and orders
 * 2. Matches KOKPIT contacts to Sellsy companies by email or normalized nom+prenom
 * 3. For matched contacts, imports their estimates as Devis and orders as Vente
 * 4. Updates contact lifecycleStage to CLIENT if they have at least 1 Vente
 * 5. Returns detailed summary of linking, import, and update operations
 */

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function normalizePhone(phone: string): string {
  return phone
    .replace(/[\s\-.()]/g, "")
    .replace(/^(\+262|0262|262)/, "0")
    .replace(/^(\+33|0033|33)/, "0");
}

interface SellsyEntityForMatching {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  type: "contact" | "company";
}

// Map Sellsy estimate status to DevisStatut
function mapEstimateStatusToDevisStatut(status: string): "EN_ATTENTE" | "ENVOYE" | "ACCEPTE" | "REFUSE" | "EXPIRE" {
  const statusMap: Record<string, "EN_ATTENTE" | "ENVOYE" | "ACCEPTE" | "REFUSE" | "EXPIRE"> = {
    draft: "EN_ATTENTE",
    sent: "ENVOYE",
    accepted: "ACCEPTE",
    refused: "REFUSE",
    expired: "EXPIRE",
  };
  return statusMap[status?.toLowerCase()] || "EN_ATTENTE";
}

interface SyncResult {
  success: boolean;
  sourceType: "contacts" | "companies";
  totalKokpitContacts: number;
  totalSellsyEntities: number;
  linkedByEmail: number;
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
    sourceType: "companies",
    totalKokpitContacts: 0,
    totalSellsyEntities: 0,
    linkedByEmail: 0,
    alreadyLinked: 0,
    suggestions: [],
    devisImported: 0,
    ventesImported: 0,
    clientsUpdated: 0,
    errors: [],
  };

  try {
    // 1. Fetch all Sellsy data in parallel
    console.log("Fetching Sellsy companies, estimates, and orders...");
    const [sellsyCompanies, sellsyEstimates, sellsyOrders] = await Promise.all([
      listAllCompanies(),
      listAllEstimates(),
      listAllOrders(),
    ]);

    console.log(
      `Fetched: ${sellsyCompanies.length} companies, ${sellsyEstimates.length} estimates, ${sellsyOrders.length} orders`
    );

    // 2. Convert companies to matching entities (format: "Prénom Nom" for individuals)
    let sellsyEntities: SellsyEntityForMatching[] = sellsyCompanies.map(
      (c: SellsyCompany) => {
        const parts = (c.name || "").trim().split(/\s+/);
        const prenom = parts.length > 1 ? parts[0] : "";
        const nom = parts.length > 1 ? parts.slice(1).join(" ") : parts[0] || "";
        return {
          id: c.id,
          email: (c.email || "").toLowerCase().trim(),
          nom,
          prenom,
          telephone: c.phone || "",
          type: "company" as const,
        };
      }
    );

    result.sourceType = "companies";
    result.totalSellsyEntities = sellsyEntities.length;

    // 3. Fetch KOKPIT contacts with their relations
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
    console.log(`Fetched ${kokpitContacts.length} KOKPIT contacts`);

    // 4. Index Sellsy entities by email and normalized nom+prenom
    const sellsyByEmail = new Map<string, SellsyEntityForMatching>();
    const sellsyByNormName = new Map<string, SellsyEntityForMatching>();

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

    // 5. Create company name to Sellsy company mapping for linking estimates/orders
    const companyNameToSellsyCompany = new Map<number, SellsyCompany>();
    for (const company of sellsyCompanies) {
      companyNameToSellsyCompany.set(company.id, company);
    }

    // 6. Match KOKPIT contacts to Sellsy companies
    console.log("Matching contacts...");
    for (const kc of kokpitContacts) {
      if (kc.sellsyContactId) {
        result.alreadyLinked++;
        continue;
      }

      const email = kc.email?.toLowerCase().trim();

      // === MATCH BY EMAIL (automatic) ===
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

      // === MATCH BY NORMALIZED NOM + PRENOM (suggestions) ===
      const nom = normalize(kc.nom || "");
      const prenom = normalize(kc.prenom || "");
      const tel = kc.telephone ? normalizePhone(kc.telephone) : "";

      if (nom && prenom) {
        const key = `${nom}|${prenom}`;
        const match = sellsyByNormName.get(key);
        if (match) {
          const sellsyTel = match.telephone
            ? normalizePhone(match.telephone)
            : "";
          const matchType =
            tel && sellsyTel && tel === sellsyTel
              ? "nom_prenom_tel"
              : "nom_prenom";

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
            sellsyTelephone: match.telephone,
            matchType,
          });
        }
      }
    }

    console.log(
      `Matched: ${result.linkedByEmail} by email, ${result.alreadyLinked} already linked, ${result.suggestions.length} suggestions`
    );

    // 7. Get linked contacts for importing devis/ventes
    const linkedContacts = await prisma.contact.findMany({
      where: {
        sellsyContactId: { not: null },
      },
      select: {
        id: true,
        sellsyContactId: true,
        devis: {
          select: { id: true, sellsyQuoteId: true },
        },
        ventes: {
          select: { id: true, sellsyInvoiceId: true },
        },
      },
    });

    console.log(`Found ${linkedContacts.length} linked contacts for sync`);

    // 8. Import estimates as Devis
    console.log("Importing estimates as Devis...");
    for (const estimate of sellsyEstimates) {
      // Find the Sellsy company for this estimate
      const sellsyCompany = companyNameToSellsyCompany.get(estimate.contact_id);
      if (!sellsyCompany) continue;

      // Find the KOKPIT contact linked to this company
      const linkedContact = linkedContacts.find(
        (lc) => lc.sellsyContactId === String(sellsyCompany.id)
      );
      if (!linkedContact) continue;

      // Check if this estimate already exists
      const existingDevis = linkedContact.devis.find(
        (d) => d.sellsyQuoteId === String(estimate.id)
      );
      if (existingDevis) continue;

      // Upsert the Devis
      try {
        await prisma.devis.upsert({
          where: { sellsyQuoteId: String(estimate.id) },
          update: {
            statut: mapEstimateStatusToDevisStatut(estimate.status),
            montant: estimate.amounts?.total_excl_tax || 0,
            dateEnvoi:
              estimate.status === "sent" ? new Date(estimate.date) : null,
          },
          create: {
            contactId: linkedContact.id,
            sellsyQuoteId: String(estimate.id),
            montant: estimate.amounts?.total_excl_tax || 0,
            statut: mapEstimateStatusToDevisStatut(estimate.status),
            dateEnvoi:
              estimate.status === "sent" ? new Date(estimate.date) : null,
          },
        });
        result.devisImported++;
      } catch (err: any) {
        result.errors.push(
          `Failed to upsert Devis ${estimate.id}: ${err.message}`
        );
      }
    }

    console.log(`Imported ${result.devisImported} Devis`);

    // 9. Import orders as Vente
    console.log("Importing orders as Vente...");
    for (const order of sellsyOrders) {
      // Find the Sellsy company for this order
      const sellsyCompany = companyNameToSellsyCompany.get(order.contact_id);
      if (!sellsyCompany) continue;

      // Find the KOKPIT contact linked to this company
      const linkedContact = linkedContacts.find(
        (lc) => lc.sellsyContactId === String(sellsyCompany.id)
      );
      if (!linkedContact) continue;

      // Check if this order already exists
      const existingVente = linkedContact.ventes.find(
        (v) => v.sellsyInvoiceId === String(order.id)
      );
      if (existingVente) continue;

      // Upsert the Vente
      try {
        await prisma.vente.upsert({
          where: { sellsyInvoiceId: String(order.id) },
          update: {
            montant: order.amounts?.total_excl_tax || 0,
            dateVente: new Date(order.date),
          },
          create: {
            contactId: linkedContact.id,
            sellsyInvoiceId: String(order.id),
            montant: order.amounts?.total_excl_tax || 0,
            dateVente: new Date(order.date),
          },
        });
        result.ventesImported++;
      } catch (err: any) {
        result.errors.push(
          `Failed to upsert Vente ${order.id}: ${err.message}`
        );
      }
    }

    console.log(`Imported ${result.ventesImported} Vente`);

    // 10. Update lifecycleStage to CLIENT for contacts with at least 1 Vente
    console.log("Updating lifecycleStage for contacts with Vente...");
    const contactsWithVentes = await prisma.contact.findMany({
      where: {
        ventes: {
          some: {},
        },
        lifecycleStage: {
          not: "CLIENT",
        },
      },
      select: { id: true },
    });

    if (contactsWithVentes.length > 0) {
      await prisma.contact.updateMany({
        where: {
          id: {
            in: contactsWithVentes.map((c) => c.id),
          },
        },
        data: { lifecycleStage: "CLIENT" },
      });
      result.clientsUpdated = contactsWithVentes.length;
    }

    console.log(`Updated ${result.clientsUpdated} contacts to CLIENT`);

    result.success = true;
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/contacts/sellsy-sync error:", error);
    result.errors.push(error.message);
    return NextResponse.json(result, { status: 500 });
  }
}
