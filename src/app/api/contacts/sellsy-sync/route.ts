import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  listAllContacts,
  type SellsyContact,
  type SellsyCompany,
} from "@/lib/sellsy";

// Import sellsyFetch directly for companies with no params
import { listCompanies } from "@/lib/sellsy";

/**
 * POST /api/contacts/sellsy-sync
 *
 * Tente de lier les contacts KOKPIT aux entités Sellsy.
 *
 * Stratégie :
 * 1. Essaye l'API Contacts Sellsy (personnes)
 * 2. Si non dispo, essaye l'API Companies
 * 3. Match par email → liaison automatique
 * 4. Match par nom + prénom → suggestion à valider
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

interface SellsyEntity {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  type: "contact" | "company";
}

/**
 * Récupère toutes les companies Sellsy en paginant, sans params order/direction
 * (certains endpoints Sellsy ne les acceptent pas)
 */
async function fetchAllCompanies(): Promise<SellsyCompany[]> {
  const all: SellsyCompany[] = [];
  const pageSize = 100;
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const res = await listCompanies({ limit: pageSize, offset });
    all.push(...res.data);
    total = res.pagination.total;
    offset += pageSize;
  }

  return all;
}

export async function POST() {
  try {
    let sellsyEntities: SellsyEntity[] = [];
    let sourceType: "contacts" | "companies" = "contacts";
    const errors: string[] = [];

    // 1. Tenter contacts Sellsy
    const sellsyContacts = await listAllContacts();

    if (sellsyContacts && sellsyContacts.length > 0) {
      sourceType = "contacts";
      sellsyEntities = sellsyContacts.map((c: SellsyContact) => ({
        id: c.id,
        email: (c.email || "").toLowerCase().trim(),
        nom: c.last_name || "",
        prenom: c.first_name || "",
        telephone: c.phone || "",
        type: "contact" as const,
      }));
    } else {
      // 2. Fallback : companies
      try {
        sourceType = "companies";
        const companies = await fetchAllCompanies();
        sellsyEntities = companies.map((c: SellsyCompany) => {
          // Pour les particuliers, le nom est souvent "Prénom Nom"
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
        });
      } catch (err: any) {
        errors.push(`Companies API: ${err.message}`);
      }
    }

    // 3. Récupérer les contacts KOKPIT
    const kokpitContacts = await prisma.contact.findMany({
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        sellsyContactId: true,
      },
    });

    // 4. Index Sellsy par email
    const sellsyByEmail = new Map<string, SellsyEntity>();
    for (const se of sellsyEntities) {
      if (se.email) {
        sellsyByEmail.set(se.email, se);
      }
    }

    // 5. Index Sellsy par nom normalisé
    const sellsyByNormName = new Map<string, SellsyEntity>();
    for (const se of sellsyEntities) {
      const nom = normalize(se.nom);
      const prenom = normalize(se.prenom);
      if (nom && prenom) {
        sellsyByNormName.set(`${nom}|${prenom}`, se);
        // Aussi en inversé (prénom|nom)
        sellsyByNormName.set(`${prenom}|${nom}`, se);
      }
    }

    // 6. Matching
    let linkedByEmail = 0;
    let alreadyLinked = 0;
    const suggestions: Array<{
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
    }> = [];

    for (const kc of kokpitContacts) {
      if (kc.sellsyContactId) {
        alreadyLinked++;
        continue;
      }

      const email = kc.email?.toLowerCase().trim();

      // === MATCH PAR EMAIL (automatique) ===
      if (email) {
        const match = sellsyByEmail.get(email);
        if (match) {
          await prisma.contact.update({
            where: { id: kc.id },
            data: { sellsyContactId: String(match.id) },
          });
          linkedByEmail++;
          continue;
        }
      }

      // === SUGGESTIONS par nom + prénom ===
      const nom = normalize(kc.nom || "");
      const prenom = normalize(kc.prenom || "");
      const tel = kc.telephone ? normalizePhone(kc.telephone) : "";

      if (nom && prenom) {
        const key = `${nom}|${prenom}`;
        const match = sellsyByNormName.get(key);
        if (match) {
          // Vérifier aussi le téléphone si disponible des deux côtés
          const sellsyTel = match.telephone ? normalizePhone(match.telephone) : "";
          const matchType =
            tel && sellsyTel && tel === sellsyTel
              ? "nom_prenom_tel"
              : "nom_prenom";

          suggestions.push({
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

    return NextResponse.json({
      success: true,
      sourceType,
      totalKokpit: kokpitContacts.length,
      totalSellsy: sellsyEntities.length,
      alreadyLinked,
      linkedByEmail,
      suggestions,
      totalSuggestions: suggestions.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("POST /api/contacts/sellsy-sync error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
