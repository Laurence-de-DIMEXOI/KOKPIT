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

export async function POST() {
  try {
    const contacts = contactsData as Array<{
      id: string;
      nom: string;
      email: string;
      telephone?: string;
      showroom?: string;
      stage?: string;
      demandes?: number;
    }>;

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    let demandesCreated = 0;
    const errorDetails: string[] = [];

    // Récupérer les showrooms existants
    const showrooms = await prisma.showroom.findMany();
    const showroomMap = new Map(
      showrooms.map((s) => [s.nom.toLowerCase(), s.id])
    );

    // Aussi matcher partiellement (ex: "Saint-Denis" → "NORD - Sainte-Clotilde")
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

    // Traiter par batch de 20 pour éviter le timeout
    const batchSize = 20;
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);

      const promises = batch.map(async (c) => {
        try {
          const email = c.email?.trim().toLowerCase();
          if (!email) {
            skipped++;
            return;
          }

          const { nom, prenom } = splitNomPrenom(c.nom || "");
          const showroomNom = normalizeShowroom(c.showroom);
          const showroomId = findShowroomId(showroomNom);

          // Mapper le stage
          let lifecycleStage: "PROSPECT" | "LEAD" | "CLIENT" | "INACTIF" = "PROSPECT";
          if (c.stage === "CLIENT") lifecycleStage = "CLIENT";
          else if (c.stage === "LEAD" || c.stage === "NEGOCIATION") lifecycleStage = "LEAD";
          else if (c.stage === "INACTIF") lifecycleStage = "INACTIF";

          // Récupérer les détails (consentements + demandes)
          const details = contactDetailsData[email];

          // Consentements
          const consentOffre = details?.consents?.offre ?? false;
          const consentNewsletter = details?.consents?.newsletter ?? false;
          const consentInvitation = details?.consents?.invitation ?? false;
          const consentDevis = details?.consents?.devis ?? false;
          const hasAnyConsent = consentOffre || consentNewsletter || consentInvitation || consentDevis;

          // Trouver la date la plus ancienne des demandes pour le consentement RGPD
          let earliestDate: Date | null = null;
          if (details?.requests) {
            for (const req of details.requests) {
              const d = parseDate(req.date);
              if (d && (!earliestDate || d < earliestDate)) {
                earliestDate = d;
              }
            }
          }
          // Si pas de date trouvée dans les demandes, fallback raisonnable
          const consentDate = earliestDate || (hasAnyConsent ? new Date("2024-01-01") : null);

          const result = await prisma.contact.upsert({
            where: { email },
            create: {
              email,
              nom,
              prenom,
              telephone: c.telephone || null,
              showroomId,
              sourcePremiere: "GLIDE",
              lifecycleStage,
              consentOffre,
              consentNewsletter,
              consentInvitation,
              consentDevis,
              rgpdEmailConsent: hasAnyConsent,
              rgpdConsentDate: consentDate,
              rgpdConsentSource: hasAnyConsent ? "glide" : null,
            },
            update: {
              nom: { set: nom },
              prenom: { set: prenom },
              ...(c.telephone ? { telephone: c.telephone } : {}),
              ...(showroomId ? { showroomId } : {}),
              lifecycleStage,
              consentOffre,
              consentNewsletter,
              consentInvitation,
              consentDevis,
              rgpdEmailConsent: hasAnyConsent,
              ...(hasAnyConsent ? {
                rgpdConsentDate: consentDate,
                rgpdConsentSource: "glide",
              } : {}),
            },
          });

          const isNew = result.createdAt.getTime() === result.updatedAt.getTime();
          if (isNew) created++;
          else updated++;

          // Créer les DemandePrix depuis les requests legacy
          if (details?.requests && details.requests.length > 0) {
            for (const req of details.requests) {
              if (!req.meuble || req.meuble === "TEST") continue;

              // Vérifier si cette demande existe déjà (par contactId + meuble + message)
              const existing = await prisma.demandePrix.findFirst({
                where: {
                  contactId: result.id,
                  meuble: req.meuble,
                  ...(req.message ? { message: req.message } : {}),
                },
              });

              if (!existing) {
                const realDate = parseDate(req.date);
                const dp = await prisma.demandePrix.create({
                  data: {
                    contactId: result.id,
                    meuble: req.meuble,
                    message: req.message || null,
                    showroom: showroomNom,
                    dateDemande: realDate || null,
                  },
                });
                // Forcer createdAt à la vraie date de la demande
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
          if (errorDetails.length < 10) {
            errorDetails.push(`${c.email}: ${err.message}`);
          }
        }
      });

      await Promise.all(promises);
    }

    return NextResponse.json({
      success: true,
      total: contacts.length,
      created,
      updated,
      skipped,
      errors,
      demandesCreated,
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
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
