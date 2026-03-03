import { NextRequest, NextResponse } from "next/server";
import { listContacts, searchContacts } from "@/lib/hubspot";

/**
 * GET /api/hubspot/contacts
 *
 * Récupère les contacts HubSpot avec pagination.
 * Query params:
 * - limit: nombre de résultats (défaut: 100)
 * - after: cursor pagination
 * - search: recherche texte
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const after = searchParams.get("after") || undefined;
    const search = searchParams.get("search") || undefined;

    let result;

    if (search) {
      result = await searchContacts({ query: search, limit });
    } else {
      result = await listContacts({ limit, after });
    }

    // Formater les contacts pour KOKPIT
    const contacts = result.results.map((c) => ({
      id: c.id,
      hubspotId: c.id,
      email: c.properties.email || "",
      prenom: c.properties.firstname || "",
      nom: c.properties.lastname || "",
      telephone: c.properties.phone || null,
      entreprise: c.properties.company || null,
      stage: c.properties.lifecyclestage || "subscriber",
      leadStatus: c.properties.hs_lead_status || null,
      source: c.properties.hs_analytics_source || null,
      utmSource: c.properties.utm_source || null,
      utmMedium: c.properties.utm_medium || null,
      utmCampaign: c.properties.utm_campaign || null,
      dealsCount: parseInt(c.properties.num_associated_deals || "0", 10),
      createdAt: c.properties.createdate || c.createdAt,
      updatedAt: c.properties.lastmodifieddate || c.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      contacts,
      pagination: {
        count: contacts.length,
        next: result.paging?.next?.after || null,
      },
      total: (result as any).total || contacts.length,
    });
  } catch (error: any) {
    console.error("GET /api/hubspot/contacts error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
