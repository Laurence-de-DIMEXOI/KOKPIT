import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listAllContacts } from "@/lib/sellsy";

/**
 * POST /api/contacts/sellsy-sync
 *
 * Phase 1 : Match par email → liaison automatique (écrit sellsyContactId en base)
 * Phase 2 : Match par nom + prénom + téléphone → suggestions à valider
 *
 * Retourne le résumé : combien liés, combien de suggestions.
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

export async function POST() {
  try {
    // 1. Récupérer tous les contacts Sellsy
    const sellsyContacts = await listAllContacts();

    // 2. Récupérer tous les contacts KOKPIT
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
    const sellsyByEmail = new Map<
      string,
      (typeof sellsyContacts)[0]
    >();
    for (const sc of sellsyContacts) {
      if (sc.email) {
        sellsyByEmail.set(sc.email.toLowerCase().trim(), sc);
      }
    }

    // 4. Index Sellsy par nom+prenom+tel normalisés
    const sellsyByNamePhone = new Map<
      string,
      (typeof sellsyContacts)[0]
    >();
    for (const sc of sellsyContacts) {
      const nom = normalize(sc.last_name || "");
      const prenom = normalize(sc.first_name || "");
      const tel = sc.phone ? normalizePhone(sc.phone) : "";
      if (nom && prenom && tel.length >= 6) {
        sellsyByNamePhone.set(`${nom}|${prenom}|${tel}`, sc);
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
      matchType: "nom_prenom_tel";
      confidence: "high";
    }> = [];

    for (const kc of kokpitContacts) {
      // Déjà lié ?
      if (kc.sellsyContactId) {
        alreadyLinked++;
        continue;
      }

      const email = kc.email?.toLowerCase().trim();

      // === MATCH PAR EMAIL ===
      if (email) {
        const sellsyMatch = sellsyByEmail.get(email);
        if (sellsyMatch) {
          await prisma.contact.update({
            where: { id: kc.id },
            data: { sellsyContactId: String(sellsyMatch.id) },
          });
          linkedByEmail++;
          continue;
        }
      }

      // === SUGGESTION PAR NOM + PRÉNOM + TÉLÉPHONE ===
      const nom = normalize(kc.nom || "");
      const prenom = normalize(kc.prenom || "");
      const tel = kc.telephone ? normalizePhone(kc.telephone) : "";

      if (nom && prenom && tel.length >= 6) {
        const key = `${nom}|${prenom}|${tel}`;
        const sellsyMatch = sellsyByNamePhone.get(key);
        if (sellsyMatch) {
          suggestions.push({
            contactId: kc.id,
            kokpitNom: kc.nom || "",
            kokpitPrenom: kc.prenom || "",
            kokpitEmail: kc.email || "",
            kokpitTelephone: kc.telephone || "",
            sellsyContactId: sellsyMatch.id,
            sellsyNom: sellsyMatch.last_name || "",
            sellsyPrenom: sellsyMatch.first_name || "",
            sellsyEmail: sellsyMatch.email || "",
            sellsyTelephone: sellsyMatch.phone || "",
            matchType: "nom_prenom_tel",
            confidence: "high",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalKokpit: kokpitContacts.length,
      totalSellsy: sellsyContacts.length,
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
