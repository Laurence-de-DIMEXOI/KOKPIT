import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateSlaDeadline } from "@/lib/sla";
import { z } from "zod";

// Parse CSV manually (without external dependency)
function parseCSV(csv: string): string[][] {
  const lines = csv.split("\n");
  const result: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // Handle quoted values
    const row: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    row.push(current.trim());
    result.push(row);
  }

  return result;
}

// POST - Import CSV file
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    // Check authorization - MARKETING or ADMIN
    if (!["MARKETING", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Autorisation insuffisante" },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const showroomId = formData.get("showroomId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Fichier requis" },
        { status: 400 }
      );
    }

    if (!file.type.includes("csv") && !file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Le fichier doit être un CSV" },
        { status: 400 }
      );
    }

    // Read file content
    const csv = await file.text();
    const rows = parseCSV(csv);

    if (rows.length < 2) {
      return NextResponse.json(
        { error: "Le fichier CSV doit contenir un en-tête et au moins une ligne" },
        { status: 400 }
      );
    }

    // Parse header
    const headers = rows[0].map((h) => h.toLowerCase().trim());
    const expectedColumns = ["nom", "prenom", "email", "telephone", "produits", "showroom", "notes"];
    const columnIndices: Record<string, number> = {};

    for (const col of expectedColumns) {
      const index = headers.indexOf(col);
      if (index >= 0) {
        columnIndices[col] = index;
      }
    }

    if (!columnIndices["nom"] || !columnIndices["prenom"] || !columnIndices["email"]) {
      return NextResponse.json(
        { error: "Le CSV doit contenir les colonnes: nom, prenom, email" },
        { status: 400 }
      );
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ line: number; error: string }> = [];

    // Process each row
    for (let i = 1; i < rows.length; i++) {
      try {
        const row = rows[i];

        const email = row[columnIndices["email"]]?.trim();
        const nom = row[columnIndices["nom"]]?.trim();
        const prenom = row[columnIndices["prenom"]]?.trim();
        const telephone = row[columnIndices["telephone"]]?.trim();
        const produits = row[columnIndices["produits"]]?.trim();
        const leadShowroomId = row[columnIndices["showroom"]]?.trim();
        const notes = row[columnIndices["notes"]]?.trim();

        // Validate required fields
        if (!email || !nom || !prenom) {
          throw new Error("Colonnes requises manquantes");
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error("Format email invalide");
        }

        // Find or create contact
        let contact = await prisma.contact.findUnique({
          where: { email },
        });

        if (!contact) {
          contact = await prisma.contact.create({
            data: {
              email,
              nom,
              prenom,
              telephone: telephone || undefined,
              showroomId: showroomId || undefined,
              sourcePremiere: "SALON",
              lifecycleStage: "PROSPECT",
            },
          });
        } else {
          // Update contact if it exists
          contact = await prisma.contact.update({
            where: { email },
            data: {
              nom: nom || contact.nom,
              prenom: prenom || contact.prenom,
              telephone: telephone || contact.telephone,
            },
          });
        }

        // Determine showroom for lead
        const finalShowroomId = showroomId || contact.showroomId;

        // Auto-assign commercial if showroom is assigned
        let commercialId = null;
        if (finalShowroomId) {
          const commercials = await prisma.user.findMany({
            where: {
              showroomId: finalShowroomId,
              role: "COMMERCIAL",
              actif: true,
            },
            select: { id: true },
          });

          if (commercials.length > 0) {
            // Round-robin assignment
            const stats = await Promise.all(
              commercials.map(async (c) => ({
                id: c.id,
                count: await prisma.lead.count({
                  where: { commercialId: c.id },
                }),
              }))
            );

            const assigned = stats.reduce((prev, current) =>
              current.count < prev.count ? current : prev
            );

            commercialId = assigned.id;
          }
        }

        // Create lead
        const slaDeadline = calculateSlaDeadline(new Date());

        await prisma.lead.create({
          data: {
            contactId: contact.id,
            source: "SALON",
            showroomId: finalShowroomId,
            commercialId,
            produitsDemandes: produits ? { items: [produits] } : undefined,
            notes,
            slaDeadline,
            statut: "NOUVEAU",
          },
        });

        // Log creation event
        await prisma.evenement.create({
          data: {
            contactId: contact.id,
            type: "CREATION_LEAD",
            description: "Lead créé via import CSV",
            auteurId: session.user.id,
            metadata: {
              source: "SALON",
            },
          },
        });

        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          line: i + 1,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    return NextResponse.json({
      message: "Import terminé",
      successCount,
      errorCount,
      totalCount: rows.length - 1,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Erreur lors de l'import CSV:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'import" },
      { status: 500 }
    );
  }
}
