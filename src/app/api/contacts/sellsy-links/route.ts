import { NextRequest, NextResponse } from "next/server";
import { listEstimates, listOrders, listContacts as listSellsyContacts } from "@/lib/sellsy";

/**
 * GET /api/contacts/sellsy-links
 *
 * Croise les contacts KÒKPIT (par email) avec les devis/commandes Sellsy.
 * Retourne pour chaque email un résumé des documents Sellsy liés,
 * PLUS des suggestions "il s'agit peut-être de..." basées sur le nom.
 */

interface SellsyLink {
  email: string;
  sellsyContactId?: number;
  sellsyContactName?: string;
  devisCount: number;
  commandesCount: number;
  devisIds: number[];
  commandesIds: number[];
  totalDevisHT: number;
  totalCommandesHT: number;
}

interface SellsySuggestion {
  contactEmail: string; // email du contact KÒKPIT
  sellsyName: string; // nom trouvé dans Sellsy
  matchType: "nom" | "telephone" | "nom_partiel";
  confidence: "high" | "medium" | "low";
  sellsyContactId?: number;
  devisCount: number;
  commandesCount: number;
}

// Normaliser un nom pour comparaison
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // enlever accents
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

// Normaliser un téléphone
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-.()]/g, "").replace(/^(\+262|0262|262)/, "0");
}

export async function GET(request: NextRequest) {
  try {
    // Récupérer les données Sellsy en parallèle
    const [estimatesRes, ordersRes] = await Promise.all([
      listEstimates({ limit: 100, order: "created", direction: "desc" }),
      listOrders({ limit: 100, order: "created", direction: "desc" }),
    ]);

    // Tenter de récupérer les contacts Sellsy (pour avoir les emails)
    let sellsyContacts: Array<{
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
    }> = [];

    try {
      const contactsRes = await listSellsyContacts({
        limit: 100,
        order: "created",
        direction: "desc",
      });
      sellsyContacts = contactsRes.data;
    } catch {
      console.warn("Sellsy contacts API non disponible");
    }

    const estimates = estimatesRes.data;
    const orders = ordersRes.data;

    // Index des contacts Sellsy par ID
    const sellsyContactById = new Map(
      sellsyContacts.map((c) => [c.id, c])
    );

    // Index des contacts Sellsy par email normalisé
    const sellsyContactByEmail = new Map(
      sellsyContacts
        .filter((c) => c.email)
        .map((c) => [c.email.toLowerCase(), c])
    );

    // ===== 1. Liens exacts par email =====
    const linksByEmail = new Map<string, SellsyLink>();

    // Helper pour trouver l'email lié à un document Sellsy
    const getEmailForDoc = (contactId: number): string | null => {
      const sellsyContact = sellsyContactById.get(contactId);
      return sellsyContact?.email?.toLowerCase() || null;
    };

    // Devis
    for (const est of estimates) {
      const email = getEmailForDoc(est.contact_id);
      if (!email) continue;

      if (!linksByEmail.has(email)) {
        const sc = sellsyContactByEmail.get(email);
        linksByEmail.set(email, {
          email,
          sellsyContactId: sc?.id,
          sellsyContactName: sc
            ? `${sc.first_name} ${sc.last_name}`.trim()
            : est.company_name,
          devisCount: 0,
          commandesCount: 0,
          devisIds: [],
          commandesIds: [],
          totalDevisHT: 0,
          totalCommandesHT: 0,
        });
      }

      const link = linksByEmail.get(email)!;
      link.devisCount++;
      link.devisIds.push(est.id);
      if (est.amounts?.total_excl_tax) {
        link.totalDevisHT += est.amounts.total_excl_tax;
      }
    }

    // Commandes
    for (const ord of orders) {
      const email = getEmailForDoc(ord.contact_id);
      if (!email) continue;

      if (!linksByEmail.has(email)) {
        const sc = sellsyContactByEmail.get(email);
        linksByEmail.set(email, {
          email,
          sellsyContactId: sc?.id,
          sellsyContactName: sc
            ? `${sc.first_name} ${sc.last_name}`.trim()
            : ord.company_name,
          devisCount: 0,
          commandesCount: 0,
          devisIds: [],
          commandesIds: [],
          totalDevisHT: 0,
          totalCommandesHT: 0,
        });
      }

      const link = linksByEmail.get(email)!;
      link.commandesCount++;
      link.commandesIds.push(ord.id);
      if (ord.amounts?.total_excl_tax) {
        link.totalCommandesHT += ord.amounts.total_excl_tax;
      }
    }

    // ===== 2. Suggestions par nom (company_name) =====
    // Pour chaque company_name Sellsy sans lien email,
    // on cherche des correspondances de nom dans les contacts KÒKPIT
    // Cela sera utilisé côté client pour afficher "il s'agit peut-être de..."

    // Collecter les noms de company uniques depuis Sellsy
    const sellsyCompanyNames = new Map<
      string,
      { name: string; devisCount: number; commandesCount: number; sellsyContactId?: number }
    >();

    for (const est of estimates) {
      if (!est.company_name) continue;
      const key = normalizeName(est.company_name);
      if (!sellsyCompanyNames.has(key)) {
        sellsyCompanyNames.set(key, {
          name: est.company_name,
          devisCount: 0,
          commandesCount: 0,
          sellsyContactId: est.contact_id,
        });
      }
      sellsyCompanyNames.get(key)!.devisCount++;
    }

    for (const ord of orders) {
      if (!ord.company_name) continue;
      const key = normalizeName(ord.company_name);
      if (!sellsyCompanyNames.has(key)) {
        sellsyCompanyNames.set(key, {
          name: ord.company_name,
          devisCount: 0,
          commandesCount: 0,
          sellsyContactId: ord.contact_id,
        });
      }
      sellsyCompanyNames.get(key)!.commandesCount++;
    }

    // Les noms Sellsy et téléphones pour suggestions côté client
    const sellsyNames = Array.from(sellsyCompanyNames.entries()).map(
      ([key, val]) => ({
        normalized: key,
        original: val.name,
        devisCount: val.devisCount,
        commandesCount: val.commandesCount,
        sellsyContactId: val.sellsyContactId,
      })
    );

    const sellsyPhones = sellsyContacts
      .filter((c) => c.phone)
      .map((c) => ({
        phone: normalizePhone(c.phone),
        name: `${c.first_name} ${c.last_name}`.trim(),
        email: c.email?.toLowerCase() || "",
        sellsyContactId: c.id,
      }));

    return NextResponse.json({
      success: true,
      // Liens exacts par email
      links: Object.fromEntries(linksByEmail),
      // Données pour matching côté client
      sellsyNames,
      sellsyPhones,
      // Stats globales
      stats: {
        totalEstimates: estimates.length,
        totalOrders: orders.length,
        totalSellsyContacts: sellsyContacts.length,
        linkedByEmail: linksByEmail.size,
      },
    });
  } catch (error: any) {
    console.error("GET /api/contacts/sellsy-links error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
