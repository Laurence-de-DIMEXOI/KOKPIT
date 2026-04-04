import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/webhooks/calendly-rdv
 *
 * Reçoit les données RDV depuis dimexoi.fr (webhook Calendly forwarded).
 * Crée un RendezVous + Lead + Evenement.
 *
 * Types :
 * - "rdv" : RDV pris (invitee.created)
 * - "rdv_annulation" : RDV annulé (invitee.canceled)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = body.type as string;

    if (type === "rdv") {
      return handleRdvCreation(body);
    }

    if (type === "rdv_annulation") {
      return handleRdvAnnulation(body);
    }

    return NextResponse.json(
      { success: false, error: "Type inconnu" },
      { status: 400, headers: corsHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[calendly-rdv webhook] Erreur:", message);
    return NextResponse.json(
      { success: false, error: "Erreur interne", detail: message },
      { status: 500, headers: corsHeaders }
    );
  }
}

async function handleRdvCreation(body: {
  email: string;
  name: string;
  phone?: string | null;
  rdvDate: string;
  rdvEndDate: string;
  calendlyEventUri?: string | null;
  source?: string;
  productSlug?: string | null;
  utm?: Record<string, string>;
}) {
  const email = (body.email || "").trim().toLowerCase();
  const name = (body.name || "").trim();

  if (!email) {
    return NextResponse.json(
      { success: false, error: "email obligatoire" },
      { status: 400, headers: corsHeaders }
    );
  }

  const prenom = name.split(" ")[0] || "";
  const nom = name.split(" ").slice(1).join(" ") || "";
  const source = body.source || "calendly";
  const dateDebut = new Date(body.rdvDate);
  const dateFin = new Date(body.rdvEndDate);

  // 1. Upsert contact
  const existing = await prisma.contact.findUnique({ where: { email } });

  let contact;
  if (existing) {
    contact = existing;
  } else {
    contact = await prisma.contact.create({
      data: {
        email,
        nom: nom || prenom,
        prenom,
        telephone: body.phone || null,
        sourcePremiere: "CALENDLY",
        lifecycleStage: "PROSPECT",
        rgpdEmailConsent: true,
        rgpdConsentDate: new Date(),
        rgpdConsentSource: "calendly",
      },
    });
  }

  // 2. Créer le RendezVous (dédoublonnage par calendlyEventId)
  if (body.calendlyEventUri) {
    const existingRdv = await prisma.rendezVous.findUnique({
      where: { calendlyEventId: body.calendlyEventUri },
    });
    if (existingRdv) {
      return NextResponse.json(
        { success: true, message: "RDV déjà enregistré", rendezVousId: existingRdv.id },
        { status: 200, headers: corsHeaders }
      );
    }
  }

  const rdv = await prisma.rendezVous.create({
    data: {
      contactId: contact.id,
      calendlyEventId: body.calendlyEventUri || null,
      dateDebut,
      dateFin,
      statut: "CONFIRME",
      source,
      productSlug: body.productSlug || null,
      utm: body.utm ? JSON.stringify(body.utm) : null,
    },
  });

  // 3. Créer le lead associé
  const rdvDateStr = dateDebut.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const lead = await prisma.lead.create({
    data: {
      contactId: contact.id,
      source: "FORMULAIRE",
      statut: "NOUVEAU",
      slaDeadline: dateDebut,
      notes: `[RDV] Rendez-vous showroom le ${rdvDateStr}${
        body.productSlug ? ` — produit : ${body.productSlug}` : ""
      } — via ${source}`,
      utmSource: body.utm?.utm_source || source,
      utmMedium: body.utm?.utm_medium || "calendly",
    },
  });

  // 4. Logger l'événement
  await prisma.evenement.create({
    data: {
      contactId: contact.id,
      leadId: lead.id,
      type: "RDV_PRIS",
      description: `RDV showroom pris via Calendly — ${rdvDateStr}`,
      metadata: {
        rendezVousId: rdv.id,
        source,
        productSlug: body.productSlug || null,
        utm: body.utm || null,
      },
    },
  });

  return NextResponse.json(
    {
      success: true,
      contactId: contact.id,
      rendezVousId: rdv.id,
      leadId: lead.id,
      message: "RDV enregistré",
    },
    { status: 200, headers: corsHeaders }
  );
}

async function handleRdvAnnulation(body: {
  email: string;
  calendlyEventUri?: string | null;
}) {
  const email = (body.email || "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      { success: false, error: "email obligatoire" },
      { status: 400, headers: corsHeaders }
    );
  }

  // Retrouver le RDV par calendlyEventId ou par email (le plus récent confirmé)
  let rdv = null;

  if (body.calendlyEventUri) {
    rdv = await prisma.rendezVous.findUnique({
      where: { calendlyEventId: body.calendlyEventUri },
    });
  }

  if (!rdv) {
    const contact = await prisma.contact.findUnique({ where: { email } });
    if (contact) {
      rdv = await prisma.rendezVous.findFirst({
        where: { contactId: contact.id, statut: "CONFIRME" },
        orderBy: { dateDebut: "desc" },
      });
    }
  }

  if (rdv) {
    await prisma.rendezVous.update({
      where: { id: rdv.id },
      data: { statut: "ANNULE" },
    });

    await prisma.evenement.create({
      data: {
        contactId: rdv.contactId,
        type: "RDV_ANNULE",
        description: "RDV showroom annulé par le client via Calendly",
        metadata: { rendezVousId: rdv.id },
      },
    });
  }

  return NextResponse.json(
    { success: true, message: rdv ? "RDV annulé" : "Aucun RDV trouvé" },
    { status: 200, headers: corsHeaders }
  );
}
