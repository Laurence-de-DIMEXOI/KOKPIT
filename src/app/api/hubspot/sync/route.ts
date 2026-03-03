import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listContacts } from "@/lib/hubspot";

/**
 * POST /api/hubspot/sync
 *
 * Synchronise les contacts HubSpot dans la table Contact Prisma.
 * Upsert par email : crée si nouveau, met à jour si existant.
 * Préserve les données existantes (sourcePremière, showroom, etc.)
 */
export async function POST() {
  try {
    // Fetch all HubSpot contacts (paginated)
    let allContacts: any[] = [];
    let after: string | undefined;
    let pages = 0;

    do {
      const result = await listContacts({ limit: 100, after });
      allContacts.push(...result.results);
      after = result.paging?.next?.after;
      pages++;
      // Safety: max 10 pages = 1000 contacts
      if (pages >= 10) break;
    } while (after);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    // Process in batches of 20
    const batchSize = 20;
    for (let i = 0; i < allContacts.length; i += batchSize) {
      const batch = allContacts.slice(i, i + batchSize);

      const promises = batch.map(async (hubContact) => {
        try {
          const email = hubContact.properties?.email?.trim().toLowerCase();
          if (!email) {
            skipped++;
            return;
          }

          const prenom = hubContact.properties?.firstname || "";
          const nom = hubContact.properties?.lastname || "";
          const telephone = hubContact.properties?.phone || null;

          // Map HubSpot lifecycle stage to our enum
          let lifecycleStage: "PROSPECT" | "LEAD" | "CLIENT" | "INACTIF" = "PROSPECT";
          const hsStage = (hubContact.properties?.lifecyclestage || "").toLowerCase();
          if (hsStage === "customer" || hsStage === "evangelist") lifecycleStage = "CLIENT";
          else if (hsStage === "lead" || hsStage === "marketingqualifiedlead" || hsStage === "salesqualifiedlead" || hsStage === "opportunity") lifecycleStage = "LEAD";
          else if (hsStage === "subscriber" || hsStage === "other") lifecycleStage = "PROSPECT";

          const existing = await prisma.contact.findUnique({ where: { email } });

          if (existing) {
            // Update only if HubSpot has newer/better data
            const updateData: any = {};

            // Only update name if currently empty
            if (!existing.nom && nom) updateData.nom = nom;
            if (!existing.prenom && prenom) updateData.prenom = prenom;
            if (!existing.telephone && telephone) updateData.telephone = telephone;

            // Always update source info from HubSpot
            updateData.notes = existing.notes
              ? existing.notes
              : hubContact.properties?.hs_analytics_source
              ? `Source HubSpot: ${hubContact.properties.hs_analytics_source}`
              : undefined;

            if (Object.keys(updateData).length > 0) {
              await prisma.contact.update({
                where: { email },
                data: updateData,
              });
              updated++;
            } else {
              skipped++;
            }
          } else {
            // Create new contact
            await prisma.contact.create({
              data: {
                email,
                nom: nom || "Inconnu",
                prenom: prenom || "",
                telephone,
                lifecycleStage,
                sourcePremiere: "HUBSPOT",
                notes: [
                  hubContact.properties?.company ? `Entreprise: ${hubContact.properties.company}` : null,
                  hubContact.properties?.hs_analytics_source ? `Source: ${hubContact.properties.hs_analytics_source}` : null,
                  hubContact.properties?.utm_campaign ? `Campagne: ${hubContact.properties.utm_campaign}` : null,
                ].filter(Boolean).join(" | ") || null,
              },
            });
            created++;
          }
        } catch (err: any) {
          errors++;
          if (errorDetails.length < 10) {
            errorDetails.push(`${hubContact.properties?.email}: ${err.message}`);
          }
        }
      });

      await Promise.all(promises);
    }

    return NextResponse.json({
      success: true,
      totalFromHubSpot: allContacts.length,
      created,
      updated,
      skipped,
      errors,
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
    });
  } catch (error: any) {
    console.error("HubSpot sync error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// GET pour prévisualiser
export async function GET() {
  try {
    const result = await listContacts({ limit: 10 });
    const totalInDb = await prisma.contact.count();
    const hubspotSourceCount = await prisma.contact.count({
      where: { sourcePremiere: "HUBSPOT" },
    });

    return NextResponse.json({
      hubspotContactsSample: result.results.length,
      totalInDatabase: totalInDb,
      hubspotSourceInDb: hubspotSourceCount,
      sampleContacts: result.results.slice(0, 3).map((c) => ({
        email: c.properties.email,
        name: `${c.properties.firstname || ""} ${c.properties.lastname || ""}`.trim(),
        stage: c.properties.lifecyclestage,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
