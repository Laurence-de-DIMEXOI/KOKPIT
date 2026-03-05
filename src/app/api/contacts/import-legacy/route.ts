import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactsData } from "@/data/contacts";
import { contactDetailsData } from "@/data/contact-details";

/**
 * POST /api/contacts/import-legacy
 *
 * Import des anciens contacts Glide + leurs détails (consentements + demandes)
 * dans Supabase. Upsert par email, puis création des DemandePrix.
 */

function splitNomPrenom(fullName: string): { nom: string; prenom: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { nom: "", prenom: "" };
  if (parts.length === 1) return { nom: parts[0], prenom: "" };
  const nom = parts[0];
  const prenom = parts.slice(1).join(" ");
  return { nom, prenom };
}

function normalizeShowroom(showroom: string | undefined): string | null {
  if (!showroom || showroom === "Non défini" || showroom === "non défini") {
    return null;
  }
  return showroom;
}

function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  // Format DD/MM/YYYY
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T10:00:00`);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "0", 10);
    const size = parseInt(url.searchParams.get("size") || "50", 10);

    const allContacts = contactsData as Array<{
      id: string;
      nom: string;
      email: string;
      telephone?: string;
      showroom?: string;
      stage?: string;
      demandes?: number;
    }>;

    const totalContacts = allContacts.length;
    const totalPages = Math.ceil(totalContacts / size);
    const contacts = allContacts.slice(page * size, (page + 1) * size);

    if (contacts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Import terminé ! Toutes les pages ont été traitées.",
        page,
        totalPages,
        done: true,
      });
    }

    let updated = 0;
    let skipped = 0;
    let errors = 0;
    let demandesCreated = 0;

    // Récupérer les showrooms existants
    const showrooms = await prisma.showroom.findMany();
    const showroomMap = new Map(
      showrooms.map((s) => [s.nom.toLowerCase(), s.id])
    );

    const showroomFuzzyMap = new Map<string, string>();
    for (const s of showrooms) {
      if (s.nom.toLowerCase().includes("nord") || s.nom.toLowerCase().includes("clotilde") || s.nom.toLowerCase().includes("denis")) {
        showroomFuzzyMap.set("saint-denis", s.id);
        showroomFuzzyMap.set("sainte-clotilde", s.id);
        showroomFuzzyMap.set("nord", s.id);
      }
      if (s.nom.toLowerCase().includes("sud") || s.nom.toLowerCase().includes("pierre")) {
        showroomFuzzyMap.set("saint-pierre", s.id);
        showroomFuzzyMap.set("sud", s.id);
      }
    }

    function findShowroomId(showroomNom: string | null): string | null {
      if (!showroomNom) return null;
      const lower = showroomNom.toLowerCase();
      return showroomMap.get(lower) || showroomFuzzyMap.get(lower) || null;
    }

    // Traiter séquentiellement pour éviter les race conditions
    for (const c of contacts) {
      try {
        const email = c.email?.trim().toLowerCase();
        if (!email) {
          skipped++;
          continue;
        }

        const showroomNom = normalizeShowroom(c.showroom);
        const showroomId = findShowroomId(showroomNom);

        // Trouver le contact existant par email
        const contact = await prisma.contact.findUnique({ where: { email } });
        if (!contact) {
          skipped++;
          continue;
        }
        updated++;

        // Créer les DemandePrix depuis les requests legacy
        const details = contactDetailsData[email];
        if (details?.requests && details.requests.length > 0) {
          for (const req of details.requests) {
            if (!req.meuble || req.meuble === "TEST") continue;

            // Vérifier si cette demande existe déjà
            const existing = await prisma.demandePrix.findFirst({
              where: {
                contactId: contact.id,
                meuble: req.meuble,
                ...(req.message ? { message: req.message } : {}),
              },
            });

            if (!existing) {
              const realDate = parseDate(req.date);
              const dp = await prisma.demandePrix.create({
                data: {
                  contactId: contact.id,
                  meuble: req.meuble,
                  message: req.message || null,
                  showroom: showroomNom,
                  dateDemande: realDate || null,
                },
              });
              if (realDate) {
                await prisma.$executeRawUnsafe(
                  `UPDATE "DemandePrix" SET "createdAt" = $1 WHERE id = $2`,
                  realDate,
                  dp.id
                );
              }
              demandesCreated++;
            }
          }
        }
      } catch (err: any) {
        errors++;
      }
    }

    const hasMore = page + 1 < totalPages;

    return NextResponse.json({
      success: true,
      page,
      totalPages,
      processed: contacts.length,
      updated,
      skipped,
      errors,
      demandesCreated,
      done: !hasMore,
      nextUrl: hasMore
        ? `/api/contacts/import-legacy?page=${page + 1}&size=${size}`
        : null,
    });
  } catch (error: any) {
    console.error("Import legacy contacts error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// GET pour vérifier le nombre de contacts à importer
export async function GET() {
  const contacts = contactsData as any[];
  const emails = new Set(
    contacts
      .map((c: any) => c.email?.trim().toLowerCase())
      .filter(Boolean)
  );

  // Détails disponibles
  const detailsEmails = Object.keys(contactDetailsData);
  const withConsents = detailsEmails.filter(
    (e) => contactDetailsData[e]?.consents && (
      contactDetailsData[e].consents.offre ||
      contactDetailsData[e].consents.newsletter ||
      contactDetailsData[e].consents.invitation ||
      contactDetailsData[e].consents.devis
    )
  ).length;
  const withRequests = detailsEmails.filter(
    (e) => contactDetailsData[e]?.requests?.length > 0
  ).length;
  const totalRequests = detailsEmails.reduce(
    (sum, e) => sum + (contactDetailsData[e]?.requests?.length || 0), 0
  );

  const existingCount = await prisma.contact.count({
    where: { email: { in: Array.from(emails) } },
  });

  const existingDemandes = await prisma.demandePrix.count();

  return NextResponse.json({
    totalStaticContacts: contacts.length,
    uniqueEmails: emails.size,
    alreadyInDatabase: existingCount,
    toImport: emails.size - existingCount,
    details: {
      withConsents,
      withRequests,
      totalRequests,
    },
    existingDemandes,
  });
}
