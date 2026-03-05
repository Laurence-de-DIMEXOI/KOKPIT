import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  listAllContacts,
  listAllCompanies,
  type SellsyContact,
  type SellsyCompany,
} from "@/lib/sellsy";

/**
 * POST /api/contacts/sellsy-sync
 *
 * Tente de lier les contacts KOKPIT aux entités Sellsy.
 *
 * Stratégie :
 * 1. Essaye d'abord l'API Contacts Sellsy (personnes)
 * 2. Si non disponible, utilise l'API Companies Sellsy (entreprises)
 * 3. Match par email → liaison automatique
 * 4. Match par nom + prénom + téléphone → suggestion à valider
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

export async function POST() {
  try {
    // 1. Tenter contacts Sellsy, sinon companies
    let sellsyEntities: SellsyEntity[] = [];
    let sourceType: "contacts" | "companies" = "contacts";

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
      // Fallback : utiliser les companies
      sourceType = "companies";
      const companies = await listAllCompanies();
      sellsyEntities = companies.map((c: SellsyCompany) => {
        // Le nom d'une company est souvent "Prénom Nom" pour les particuliers
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
    }

    // 2. Récupérer les contacts KOKPIT
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

    // 3. Index Sellsy par email
    const sellsyByEmail = new Map<string, SellsyEntity>();
    for (const se of sellsyEntities) {
      if (se.email) {
        sellsyByEmail.set(se.email, se);
      }
    }

    // 4. Index Sellsy par nom normalisé (pour suggestions)
    const sellsyByNormName = new Map<string, SellsyEntity>();
    for (const se of sellsyEntities) {
      const nom = normalize(se.nom);
      const prenom = normalize(se.prenom);
      if (nom) {
        // Clé nom+prenom
        if (prenom) sellsyByNormName.set(`${nom}|${prenom}`, se);
        // Aussi juste le nom pour nom_partiel
        sellsyByNormName.set(`nom:${nom}`, se);
      }
    }

    // 5. Matching
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
      // Déjà lié ?
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

      // === SUGGESTIONS ===
      const nom = normalize(kc.nom || "");
      const prenom = normalize(kc.prenom || "");
      const tel = kc.telephone ? normalizePhone(kc.telephone) : "";

      // Match nom + prénom + téléphone (les 3 ensemble)
      if (nom && prenom && tel.length >= 6) {
        const key = `${nom}|${prenom}`;
        const match = sellsyByNormName.get(key);
        if (match && match.telephone) {
          const sellsyTel = normalizePhone(match.telephone);
          if (sellsyTel === tel) {
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
              matchType: "nom_prenom_tel",
            });
            continue;
          }
        }
      }

      // Match nom + prénom (sans téléphone) → confiance moyenne
      if (nom && prenom) {
        const key = `${nom}|${prenom}`;
        const match = sellsyByNormName.get(key);
        if (match) {
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
            matchType: "nom_prenom",
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
    });
  } catch (error: any) {
    console.error("POST /api/contacts/sellsy-sync error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
