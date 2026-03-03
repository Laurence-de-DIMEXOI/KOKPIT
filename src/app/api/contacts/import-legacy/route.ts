import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactsData } from "@/data/contacts";

/**
 * POST /api/contacts/import-legacy
 *
 * Import one-shot des anciens contacts Glide (fichier statique) dans Supabase.
 * Upsert par email : crée si nouveau, met à jour si existant.
 * Sépare "nom prénom" en deux champs.
 */

function splitNomPrenom(fullName: string): { nom: string; prenom: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { nom: "", prenom: "" };
  if (parts.length === 1) return { nom: parts[0], prenom: "" };

  // Convention Glide : "NOM Prénom" ou "Nom Prénom"
  // Le premier mot est le nom de famille
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
    const errorDetails: string[] = [];

    // Récupérer les showrooms existants pour matcher par nom
    const showrooms = await prisma.showroom.findMany();
    const showroomMap = new Map(
      showrooms.map((s) => [s.nom.toLowerCase(), s.id])
    );

    // Traiter par batch de 50 pour éviter le timeout
    const batchSize = 50;
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

          // Trouver le showroom ID
          let showroomId: string | null = null;
          if (showroomNom) {
            showroomId =
              showroomMap.get(showroomNom.toLowerCase()) || null;
          }

          // Mapper le stage
          let lifecycleStage: "PROSPECT" | "LEAD" | "CLIENT" | "INACTIF" =
            "PROSPECT";
          if (c.stage === "CLIENT") lifecycleStage = "CLIENT";
          else if (c.stage === "LEAD" || c.stage === "NEGOCIATION")
            lifecycleStage = "LEAD";
          else if (c.stage === "INACTIF") lifecycleStage = "INACTIF";

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
            },
            update: {
              // Ne mettre à jour que si les champs sont vides
              // Pour ne pas écraser les données mises à jour manuellement
              nom: { set: nom }, // On force le nom car le format est meilleur (séparé)
              prenom: { set: prenom },
              // telephone et showroom : ne pas écraser si déjà renseigné
            },
          });

          // Vérifier si c'était un create ou update (par createdAt vs updatedAt)
          const isNew =
            result.createdAt.getTime() ===
            result.updatedAt.getTime();
          if (isNew) created++;
          else updated++;
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

  // Compter combien existent déjà en base
  const existingCount = await prisma.contact.count({
    where: {
      email: { in: Array.from(emails) },
    },
  });

  return NextResponse.json({
    totalStaticContacts: contacts.length,
    uniqueEmails: emails.size,
    alreadyInDatabase: existingCount,
    toImport: emails.size - existingCount,
  });
}
