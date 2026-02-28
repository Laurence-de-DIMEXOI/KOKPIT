import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/demandes
 * Récupère SEULEMENT les demandes de prix (DemandePrix)
 * Les Leads sont créés automatiquement mais affichés dans Contacts (pas ici pour éviter les doublons)
 *
 * Query params:
 * - limit: nombre de résultats (défaut: 100)
 * - offset: pagination (défaut: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    // Récupérer SEULEMENT les demandes de prix
    const [demandesPrix, totalDemandesPrix] = await Promise.all([
      prisma.demandePrix.findMany({
        include: {
          contact: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.demandePrix.count(),
    ]);

    // Formater les demandes de prix
    const formattedDemandesPrix = demandesPrix.map((demande) => ({
      id: demande.id,
      type: "DEMANDE_PRIX",
      nom: demande.contact.nom,
      prenom: demande.contact.prenom,
      email: demande.contact.email,
      telephone: demande.contact.telephone,
      source: "GLIDE",
      statut: "NOUVEAU",
      meuble: demande.meuble,
      message: demande.message,
      showroom: demande.showroom,
      modePaiement: demande.modePaiement,
      assigneA: "Non assigné",
      assigneEmail: null,
      dateCreation: demande.createdAt.toISOString(),
      dateDemande: demande.dateDemande?.toISOString() || null,
      glideRowId: demande.glideRowId,
    }));

    return NextResponse.json({
      success: true,
      data: formattedDemandesPrix,
      pagination: {
        total: totalDemandesPrix,
        limit,
        offset,
        count: formattedDemandesPrix.length,
      },
      stats: {
        totalDemandesPrix,
      },
    });
  } catch (error: any) {
    console.error("GET /api/demandes error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
