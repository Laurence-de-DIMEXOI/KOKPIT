import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  listEstimates,
  listOrders,
  listContacts as listSellsyContacts,
} from "@/lib/sellsy";

/**
 * GET /api/contacts/sellsy-links
 *
 * Croise les contacts KÒKPIT (Supabase) avec les devis/commandes Sellsy.
 *
 * Logique de liaison :
 * 1. Email exact → lien confirmé
 * 2. Nom exact (nom + prénom) → suggestion haute confiance
 * 3. Nom de famille seul → suggestion moyenne confiance
 * 4. Téléphone identique → suggestion haute confiance
 *
 * Retourne aussi le CA total, par contact, et les KPIs globaux.
 */

// Normaliser un nom pour comparaison
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-.()]/g, "").replace(/^(\+262|0262|262)/, "0");
}

interface SellsyDoc {
  id: number;
  number: string;
  date: string;
  status: string;
  company_name: string;
  contact_id: number;
  subject: string;
  totalHT: number;
  totalTTC: number;
}

interface ContactLink {
  contactId: string; // ID contact KÒKPIT
  email: string;
  matchType: "email" | "nom" | "nom_partiel" | "telephone";
  confidence: "confirmed" | "high" | "medium";
  sellsyContactId?: number;
  sellsyContactName?: string;
  devis: SellsyDoc[];
  commandes: SellsyDoc[];
  totalDevisHT: number;
  totalCommandesHT: number;
  totalCA: number;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Récupérer nos contacts KÒKPIT
    const kokpitContacts = await prisma.contact.findMany({
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
      },
    });

    // 2. Récupérer les données Sellsy en parallèle
    const [estimatesRes, ordersRes] = await Promise.all([
      listEstimates({ limit: 100, order: "created", direction: "desc" }),
      listOrders({ limit: 100, order: "created", direction: "desc" }),
    ]);

    // Tenter les contacts Sellsy (pour emails)
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

    // Index Sellsy contacts par ID
    const sellsyContactById = new Map(
      sellsyContacts.map((c) => [c.id, c])
    );

    // Préparer les devis
    const devisDocs: SellsyDoc[] = estimatesRes.data.map((e) => ({
      id: e.id,
      number: e.number,
      date: e.date,
      status: e.status,
      company_name: e.company_name,
      contact_id: e.contact_id,
      subject: e.subject || "",
      totalHT: e.amounts?.total_excl_tax || 0,
      totalTTC: e.amounts?.total_incl_tax || 0,
    }));

    // Préparer les commandes
    const commandesDocs: SellsyDoc[] = ordersRes.data.map((o) => ({
      id: o.id,
      number: o.number,
      date: o.date,
      status: o.status,
      company_name: o.company_name,
      contact_id: o.contact_id,
      subject: o.subject || "",
      totalHT: o.amounts?.total_excl_tax || 0,
      totalTTC: o.amounts?.total_incl_tax || 0,
    }));

    // 3. Index par contact_id Sellsy → docs
    const devisByContactId = new Map<number, SellsyDoc[]>();
    for (const d of devisDocs) {
      if (!devisByContactId.has(d.contact_id))
        devisByContactId.set(d.contact_id, []);
      devisByContactId.get(d.contact_id)!.push(d);
    }

    const commandesByContactId = new Map<number, SellsyDoc[]>();
    for (const c of commandesDocs) {
      if (!commandesByContactId.has(c.contact_id))
        commandesByContactId.set(c.contact_id, []);
      commandesByContactId.get(c.contact_id)!.push(c);
    }

    // Index par company_name → docs
    const devisByCompanyName = new Map<string, SellsyDoc[]>();
    for (const d of devisDocs) {
      const key = normalizeName(d.company_name);
      if (!devisByCompanyName.has(key)) devisByCompanyName.set(key, []);
      devisByCompanyName.get(key)!.push(d);
    }

    const commandesByCompanyName = new Map<string, SellsyDoc[]>();
    for (const c of commandesDocs) {
      const key = normalizeName(c.company_name);
      if (!commandesByCompanyName.has(key))
        commandesByCompanyName.set(key, []);
      commandesByCompanyName.get(key)!.push(c);
    }

    // 4. Matcher chaque contact KÒKPIT
    const links: Record<string, ContactLink> = {};
    const suggestions: Record<
      string,
      Array<{ sellsyName: string; matchType: string; confidence: string }>
    > = {};

    // Index emails Sellsy
    const sellsyContactByEmail = new Map(
      sellsyContacts
        .filter((c) => c.email)
        .map((c) => [c.email.toLowerCase(), c])
    );

    for (const contact of kokpitContacts) {
      const email = contact.email?.toLowerCase();
      const fullName = normalizeName(
        `${contact.prenom || ""} ${contact.nom || ""}`.trim()
      );
      const fullNameReverse = normalizeName(
        `${contact.nom || ""} ${contact.prenom || ""}`.trim()
      );
      const nomFamille = normalizeName(contact.nom || "");
      const phone = contact.telephone
        ? normalizePhone(contact.telephone)
        : "";

      // === MATCH PAR EMAIL (confirmé) ===
      const sellsyContact = email
        ? sellsyContactByEmail.get(email)
        : undefined;

      if (sellsyContact) {
        const devis =
          devisByContactId.get(sellsyContact.id) || [];
        const commandes =
          commandesByContactId.get(sellsyContact.id) || [];
        const totalDevisHT = devis.reduce((s, d) => s + d.totalHT, 0);
        const totalCommandesHT = commandes.reduce(
          (s, c) => s + c.totalHT,
          0
        );

        links[contact.id] = {
          contactId: contact.id,
          email: email!,
          matchType: "email",
          confidence: "confirmed",
          sellsyContactId: sellsyContact.id,
          sellsyContactName: `${sellsyContact.first_name} ${sellsyContact.last_name}`.trim(),
          devis,
          commandes,
          totalDevisHT,
          totalCommandesHT,
          totalCA: totalCommandesHT,
        };
        continue;
      }

      // === MATCH PAR NOM EXACT (company_name) ===
      const devisNom =
        devisByCompanyName.get(fullName) ||
        devisByCompanyName.get(fullNameReverse) ||
        [];
      const commandesNom =
        commandesByCompanyName.get(fullName) ||
        commandesByCompanyName.get(fullNameReverse) ||
        [];

      if (devisNom.length > 0 || commandesNom.length > 0) {
        const totalDevisHT = devisNom.reduce((s, d) => s + d.totalHT, 0);
        const totalCommandesHT = commandesNom.reduce(
          (s, c) => s + c.totalHT,
          0
        );

        links[contact.id] = {
          contactId: contact.id,
          email: email || "",
          matchType: "nom",
          confidence: "high",
          sellsyContactName: devisNom[0]?.company_name || commandesNom[0]?.company_name || "",
          devis: devisNom,
          commandes: commandesNom,
          totalDevisHT,
          totalCommandesHT,
          totalCA: totalCommandesHT,
        };
        continue;
      }

      // === SUGGESTIONS PAR NOM PARTIEL ou TELEPHONE ===
      const contactSuggestions: Array<{
        sellsyName: string;
        matchType: string;
        confidence: string;
      }> = [];

      // Nom partiel
      if (nomFamille.length >= 3) {
        for (const [companyKey, docs] of devisByCompanyName) {
          if (
            companyKey.includes(nomFamille) ||
            nomFamille.includes(companyKey)
          ) {
            contactSuggestions.push({
              sellsyName: docs[0].company_name,
              matchType: "nom_partiel",
              confidence: "medium",
            });
          }
        }
        if (contactSuggestions.length === 0) {
          for (const [companyKey, docs] of commandesByCompanyName) {
            if (
              companyKey.includes(nomFamille) ||
              nomFamille.includes(companyKey)
            ) {
              contactSuggestions.push({
                sellsyName: docs[0].company_name,
                matchType: "nom_partiel",
                confidence: "medium",
              });
            }
          }
        }
      }

      // Téléphone
      if (phone.length >= 8) {
        for (const sc of sellsyContacts) {
          if (sc.phone && normalizePhone(sc.phone) === phone) {
            contactSuggestions.push({
              sellsyName: `${sc.first_name} ${sc.last_name}`.trim(),
              matchType: "telephone",
              confidence: "high",
            });
          }
        }
      }

      if (contactSuggestions.length > 0) {
        suggestions[contact.id] = contactSuggestions.slice(0, 3);
      }
    }

    // 5. KPIs globaux
    const linkedContacts = Object.values(links);
    const totalCA = linkedContacts.reduce((s, l) => s + l.totalCA, 0);
    const totalDevisHT = linkedContacts.reduce(
      (s, l) => s + l.totalDevisHT,
      0
    );
    const contactsAvecDevis = linkedContacts.filter(
      (l) => l.devis.length > 0
    ).length;
    const contactsAvecCommande = linkedContacts.filter(
      (l) => l.commandes.length > 0
    ).length;

    return NextResponse.json({
      success: true,
      links,
      suggestions,
      kpis: {
        totalContactsKokpit: kokpitContacts.length,
        totalLinked: linkedContacts.length,
        linkedByEmail: linkedContacts.filter(
          (l) => l.matchType === "email"
        ).length,
        linkedByNom: linkedContacts.filter((l) => l.matchType === "nom")
          .length,
        contactsAvecDevis,
        contactsAvecCommande,
        totalSuggestions: Object.keys(suggestions).length,
        totalDevisHT: Math.round(totalDevisHT * 100) / 100,
        totalCA: Math.round(totalCA * 100) / 100,
        totalDevis: devisDocs.length,
        totalCommandes: commandesDocs.length,
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
