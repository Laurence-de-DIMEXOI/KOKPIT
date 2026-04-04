import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/webhooks/guide-download
 *
 * Webhook pour recevoir les téléchargements du guide PDF depuis dimexoi.fr.
 * Crée ou met à jour un contact, crée un lead [GUIDE_SDB] et un événement de traçabilité.
 *
 * JSON ATTENDU :
 * {
 *   "name": "Marie",          // prénom (obligatoire)
 *   "email": "marie@...",     // obligatoire
 *   "phone": "0692...",       // optionnel
 *   "tags": ["GUIDE_SDB"],    // optionnel
 *   "metadata": {
 *     "piece": "Salle de bain",
 *     "source": "blog_sdb",
 *     "guide": "amenager-salle-de-bain-en-teck"
 *   }
 * }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email = (body.email || "").trim().toLowerCase();
    const prenom = (body.name || body.prenom || "").trim();

    if (!email || !prenom) {
      return NextResponse.json(
        { success: false, error: "email et name sont obligatoires" },
        { status: 400, headers: corsHeaders }
      );
    }

    const telephone = body.phone || null;
    const metadata = body.metadata || {};
    const source = metadata.source || "blog_sdb";
    const piece = metadata.piece || null;
    const guide = metadata.guide || "amenager-salle-de-bain-en-teck";

    // Upsert contact
    const contact = await prisma.contact.upsert({
      where: { email },
      create: {
        email,
        nom: prenom,
        prenom,
        telephone: telephone || null,
        sourcePremiere: "SITE_WEB",
        rgpdEmailConsent: true,
        rgpdConsentDate: new Date(),
        rgpdConsentSource: "guide-pdf",
        lifecycleStage: "PROSPECT",
        notes: `[GUIDE_SDB] Téléchargement guide "${guide}" — source: ${source}${piece ? ` — pièce: ${piece}` : ""}`,
      },
      update: {
        ...(telephone ? { telephone } : {}),
        ...(prenom ? { prenom } : {}),
        rgpdEmailConsent: true,
        rgpdConsentDate: new Date(),
        rgpdConsentSource: "guide-pdf",
      },
    });

    // Événement de traçabilité
    await prisma.evenement.create({
      data: {
        contactId: contact.id,
        type: "NOTE",
        description: `Téléchargement guide PDF : "${guide}"`,
        metadata: {
          tag: "GUIDE_SDB",
          guide,
          source,
          piece: piece || null,
          downloadedAt: new Date().toISOString(),
          ip: request.headers.get("x-forwarded-for") || null,
        },
      },
    });

    // Créer un Lead si aucun lead FORMULAIRE récent pour ce contact
    const existingLead = await prisma.lead.findFirst({
      where: {
        contactId: contact.id,
        source: "FORMULAIRE",
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // 30 jours
      },
    });

    let leadId: string | null = null;

    if (!existingLead) {
      const slaDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // SLA 7 jours (lead froid)
      const lead = await prisma.lead.create({
        data: {
          contactId: contact.id,
          source: "FORMULAIRE",
          statut: "NOUVEAU",
          priorite: "BASSE",
          slaDeadline,
          notes: `[GUIDE_SDB] Téléchargement guide salle de bain en teck${piece ? ` — intéressé(e) par : ${piece}` : ""} — source: ${source}`,
          utmSource: source,
          utmMedium: "guide_pdf",
          utmCampaign: "guide_sdb_avril26",
        },
      });
      leadId = lead.id;
    }

    return NextResponse.json({
      success: true,
      contactId: contact.id,
      leadId,
      message: "Contact enregistré avec tag GUIDE_SDB",
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error("[guide-download webhook] Erreur:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne", detail: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
