import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Webhook Google Ads Lead Form Extensions
 *
 * Configuration dans Google Ads :
 *   Campagne → Ressources → Formulaire de prospects → Livraison des prospects
 *   URL webhook : https://kokpit-kappa.vercel.app/api/webhooks/google-ads-lead
 *   Clé Google : valeur de GOOGLE_ADS_WEBHOOK_KEY (env var Vercel)
 *
 * GET  → vérification du challenge (requis par Google)
 * POST → réception d'un lead
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Champs possibles dans user_column_data
const FIELD = {
  FULL_NAME:    "FULL_NAME",
  FIRST_NAME:   "FIRST_NAME",
  LAST_NAME:    "LAST_NAME",
  EMAIL:        "EMAIL",
  PHONE_NUMBER: "PHONE_NUMBER",
  CITY:         "CITY",
  POSTAL_CODE:  "POSTAL_CODE",
  COUNTRY:      "COUNTRY",
};

function getField(data: { column_name: string; string_value?: string }[], key: string): string {
  return data.find((d) => d.column_name === key)?.string_value?.trim() || "";
}

function cleanPhone(phone: string): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s.\-()]/g, "");
  if (cleaned.match(/^0[67]/)) return `+262${cleaned.slice(1)}`;
  return cleaned || null;
}

// ── GET : vérification challenge ────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get("challenge");
  if (challenge) {
    return new Response(challenge, { status: 200, headers: CORS });
  }
  return NextResponse.json({ status: "ok", service: "google-ads-lead-webhook" }, { headers: CORS });
}

// ── OPTIONS : CORS preflight ────────────────────────────────────────────────
export async function OPTIONS() {
  return new Response(null, { status: 200, headers: CORS });
}

// ── POST : réception d'un lead ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Vérification clé Google (optionnelle mais recommandée)
    const webhookKey = process.env.GOOGLE_ADS_WEBHOOK_KEY;
    if (webhookKey && body.google_key && body.google_key !== webhookKey) {
      console.warn("[GADS-LEAD] Clé Google invalide:", body.google_key);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
    }

    const cols: { column_name: string; string_value?: string }[] = body.user_column_data || [];

    // Extraire les champs du lead
    const fullName  = getField(cols, FIELD.FULL_NAME);
    const firstName = getField(cols, FIELD.FIRST_NAME) || fullName.split(" ")[0] || "";
    const lastName  = getField(cols, FIELD.LAST_NAME)  || fullName.split(" ").slice(1).join(" ") || "";
    const email     = getField(cols, FIELD.EMAIL);
    const phone     = cleanPhone(getField(cols, FIELD.PHONE_NUMBER));
    const city      = getField(cols, FIELD.CITY);

    if (!email && !phone) {
      return NextResponse.json({ error: "Email ou téléphone requis" }, { status: 400, headers: CORS });
    }

    const leadId    = body.lead_id as string | undefined;
    const campaignId = String(body.campaign_id || "");
    const campaignName = body.campaign_name as string || "";
    const formName  = body.google_ads_form_name as string || "Formulaire Google Ads";
    const isTest    = body.is_test === true;

    console.log(`[GADS-LEAD] Nouveau lead${isTest ? " (TEST)" : ""}: ${firstName} ${lastName} <${email}> — ${campaignName}`);

    // Éviter les doublons sur lead_id (stocké dans gclid)
    if (leadId) {
      const existing = await prisma.lead.findFirst({
        where: { gclid: `lead_${leadId}` },
      });
      if (existing) {
        return NextResponse.json({ received: true, duplicate: true }, { status: 200, headers: CORS });
      }
    }

    // Trouver la campagne en DB
    let campagneId: string | null = null;
    if (campaignId) {
      const camp = await prisma.campagne.findFirst({
        where: { metaCampaignId: `google_${campaignId}` },
      });
      campagneId = camp?.id || null;
    }

    // Créer ou mettre à jour le contact
    const contactWhere = email
      ? { email: email.toLowerCase() }
      : undefined;

    let contact = contactWhere
      ? await prisma.contact.findFirst({ where: contactWhere })
      : null;

    if (contact) {
      // Mettre à jour si infos manquantes
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          ...(phone && !contact.telephone ? { telephone: phone } : {}),
          ...(city && !contact.ville ? { ville: city } : {}),
        },
      });
    } else {
      contact = await prisma.contact.create({
        data: {
          prenom: firstName || "Inconnu",
          nom: lastName || "",
          email: email ? email.toLowerCase() : `gads_${leadId || Date.now()}@noreply.placeholder`,
          telephone: phone,
          ville: city || null,
          sourcePremiere: "GOOGLE_ADS",
        },
      });
    }

    // Créer le lead
    const lead = await prisma.lead.create({
      data: {
        contactId: contact.id,
        campagneId,
        source: "GOOGLE_ADS",
        gclid: leadId ? `lead_${leadId}` : (body.gcl_id || undefined),
        utmCampaign: campaignName || undefined,
        statut: "NOUVEAU",
        slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // SLA 48h
        notes: [
          campaignName ? `Campagne : ${campaignName}` : "",
          formName ? `Formulaire : ${formName}` : "",
          city ? `Ville : ${city}` : "",
          isTest ? "⚠️ Lead de test" : "",
        ].filter(Boolean).join("\n") || null,
      },
    });

    // Notification email
    void notifyNewLead({ contact, lead, campaignName, formName });

    return NextResponse.json({ received: true, leadId: lead.id }, { status: 200, headers: CORS });

  } catch (err: any) {
    console.error("[GADS-LEAD] Erreur:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500, headers: CORS });
  }
}

async function notifyNewLead({ contact, lead, campaignName, formName }: {
  contact: any; lead: any; campaignName: string; formName: string;
}) {
  const brevoKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@dimexoi.fr";
  if (!brevoKey) return;

  const name = `${contact.prenom} ${contact.nom}`.trim();
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:linear-gradient(135deg,#4285F4,#34A853);padding:20px;border-radius:8px;margin-bottom:20px;">
        <h1 style="color:white;margin:0;font-size:20px;">🎯 Nouveau lead Google Ads</h1>
        <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;font-size:13px;">${campaignName || formName}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#666;width:140px;">Nom</td>
            <td style="padding:10px;border-bottom:1px solid #eee;font-weight:600;">${name || "—"}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#666;">Email</td>
            <td style="padding:10px;border-bottom:1px solid #eee;">${contact.email || "—"}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#666;">Téléphone</td>
            <td style="padding:10px;border-bottom:1px solid #eee;">${contact.telephone || "—"}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#666;">Ville</td>
            <td style="padding:10px;border-bottom:1px solid #eee;">${contact.ville || "—"}</td></tr>
        <tr><td style="padding:10px;color:#666;">Formulaire</td>
            <td style="padding:10px;">${formName}</td></tr>
      </table>
      <div style="margin-top:24px;text-align:center;">
        <a href="https://kokpit-kappa.vercel.app/leads" style="background:#4285F4;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
          Voir dans KÒKPIT →
        </a>
      </div>
    </div>`;

  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": brevoKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: "KÒKPIT — Google Ads", email: senderEmail },
      to: [{ email: "laurence.payet@dimexoi.fr", name: "Laurence" }],
      subject: `🎯 Nouveau lead Google Ads — ${name || contact.email || "Inconnu"}`,
      htmlContent: html,
    }),
  }).catch((e) => console.error("[GADS-LEAD] Email:", e));
}
