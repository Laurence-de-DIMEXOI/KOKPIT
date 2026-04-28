import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/webhooks/calendly-rdv
 *
 * Reçoit les événements RDV depuis le proxy dimexoi.fr
 * (`/api/webhooks/calendly` qui valide la signature Calendly puis forward).
 *
 * Payloads attendus :
 *   - { type: "rdv", email, name, phone?, rdvDate, rdvEndDate, calendlyEventUri,
 *       source: "calendly_<pageSource>", productSlug?, utm: {...} }
 *   - { type: "rdv_annulation", email, calendlyEventUri }
 *
 * Détection Teck Days : si `utm.utm_campaign === 'teckdays_2026'` ou si
 * `source` contient `teckdays`, on préfixe les notes du Lead créé/mis à jour
 * avec [TECK_DAYS_2026][TECK_DAYS_RDV_3D] pour filtrage homogène avec les
 * leads de formulaire.
 */

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function cleanPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const cleaned = String(phone).replace(/[\s.\-()]/g, "");
  if (cleaned.match(/^0[67]/)) return `+262${cleaned.slice(1)}`;
  return cleaned || null;
}

function splitName(full: string | null | undefined): { prenom: string; nom: string } {
  const safe = (full || "").trim();
  if (!safe) return { prenom: "Client", nom: "Calendly" };
  const parts = safe.split(/\s+/);
  if (parts.length === 1) return { prenom: parts[0], nom: "" };
  return { prenom: parts[0], nom: parts.slice(1).join(" ") };
}

function isTeckDays(utm: Record<string, string | undefined> | null, source: string | null): boolean {
  const camp = (utm?.utm_campaign || "").toLowerCase();
  if (camp.startsWith("teckdays")) return true;
  if ((source || "").toLowerCase().includes("teckdays")) return true;
  return false;
}

async function sendBrevoEmail(to: string, toName: string, subject: string, html: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return false;
  try {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "KÒKPIT", email: process.env.BREVO_SENDER_EMAIL || "noreply@dimexoi.fr" },
        to: [{ email: to, name: toName }],
        subject,
        htmlContent: html,
      }),
    });
    return r.ok;
  } catch (e) {
    console.error("[calendly-rdv] Brevo error", e);
    return false;
  }
}

async function notifyTeckDaysRdv(opts: {
  prenom: string; nom: string; email: string; tel: string | null;
  start: Date; productSlug: string | null;
}) {
  const recipient = process.env.TECKDAYS_3D_NOTIFY_EMAIL || "laurence.payet@dimexoi.fr";
  const html = `
    <h2 style="color:#3D5A2A;">🌿 Nouveau RDV visio Teck Days</h2>
    <p><strong>${opts.prenom} ${opts.nom}</strong> a réservé un créneau visio avec le dessinateur 3D.</p>
    <ul>
      <li><strong>Date :</strong> ${opts.start.toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short", timeZone: "Indian/Reunion" })}</li>
      <li><strong>Email :</strong> ${opts.email}</li>
      ${opts.tel ? `<li><strong>Téléphone :</strong> ${opts.tel}</li>` : ""}
      ${opts.productSlug ? `<li><strong>Projet :</strong> ${opts.productSlug}</li>` : ""}
    </ul>
    <p style="margin-top:20px;"><a href="https://kokpit-kappa.vercel.app/leads" style="background:#5A7A3B;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;">Voir dans KÒKPIT</a></p>
    <p style="font-size:11px;color:#999;">Notification automatique · Teck Days 2026</p>
  `.trim();
  return sendBrevoEmail(recipient, "Équipe Teck Days", `🌿 Nouveau RDV visio Teck Days — ${opts.prenom} ${opts.nom}`, html);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = body.type as string | undefined;

    // === Annulation ===
    if (type === "rdv_annulation") {
      const uri = body.calendlyEventUri as string | null;
      if (!uri) return NextResponse.json({ ok: true, skipped: "no uri" }, { headers: cors });
      try {
        await prisma.rendezVous.update({
          where: { calendlyEventId: uri },
          data: { statut: "ANNULE" },
        });
      } catch {
        // Pas trouvé → silencieux (peut-être un RDV jamais reçu côté KOKPIT)
      }
      return NextResponse.json({ ok: true, action: "cancelled" }, { headers: cors });
    }

    // === Création ===
    if (type !== "rdv") {
      return NextResponse.json({ ok: true, skipped: "unknown type" }, { headers: cors });
    }

    const email = (body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "email invalide" }, { status: 400, headers: cors });
    }

    const { prenom, nom } = splitName(body.name);
    const tel = cleanPhone(body.phone);
    const start = body.rdvDate ? new Date(body.rdvDate) : null;
    const end = body.rdvEndDate ? new Date(body.rdvEndDate) : null;
    if (!start || !end) {
      return NextResponse.json({ error: "rdvDate/rdvEndDate requis" }, { status: 400, headers: cors });
    }

    const utm = (body.utm || {}) as Record<string, string | undefined>;
    const source = (body.source || "calendly") as string;
    const calendlyUri = (body.calendlyEventUri || null) as string | null;
    const productSlug = (body.productSlug || null) as string | null;
    const teckdays = isTeckDays(utm, source);
    const tagsBlock = teckdays ? "[TECK_DAYS_2026][TECK_DAYS_RDV_3D] " : "";

    // Upsert contact
    const contact = await prisma.contact.upsert({
      where: { email },
      create: {
        email,
        nom: nom || prenom,
        prenom,
        telephone: tel,
        sourcePremiere: teckdays ? "SALON" : "SITE_WEB",
        rgpdEmailConsent: true,
        rgpdConsentDate: new Date(),
        rgpdConsentSource: "calendly",
      },
      update: {
        ...(tel ? { telephone: tel } : {}),
      },
    });

    // Upsert RendezVous (dédoublonnage par calendlyEventId si présent)
    let rdv;
    if (calendlyUri) {
      rdv = await prisma.rendezVous.upsert({
        where: { calendlyEventId: calendlyUri },
        create: {
          contactId: contact.id,
          calendlyEventId: calendlyUri,
          dateDebut: start,
          dateFin: end,
          statut: "CONFIRME",
          source,
          productSlug,
          utm: JSON.stringify(utm),
          notes: teckdays ? `${tagsBlock}RDV visio dessinateur 3D` : null,
        },
        update: {
          dateDebut: start,
          dateFin: end,
          statut: "CONFIRME",
        },
      });
    } else {
      rdv = await prisma.rendezVous.create({
        data: {
          contactId: contact.id,
          dateDebut: start,
          dateFin: end,
          statut: "CONFIRME",
          source,
          productSlug,
          utm: JSON.stringify(utm),
          notes: teckdays ? `${tagsBlock}RDV visio dessinateur 3D` : null,
        },
      });
    }

    // Lead lié — réutilise le lead du jour s'il existe (cohérent avec /webhooks/demande)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingLead = await prisma.lead.findFirst({
      where: { contactId: contact.id, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
    });

    const noteRdv = `${tagsBlock}RDV Calendly ${start.toLocaleString("fr-FR", { timeZone: "Indian/Reunion" })} (${source})`;

    if (existingLead) {
      await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          notes: existingLead.notes ? `${existingLead.notes}\n---\n${noteRdv}` : noteRdv,
          ...(teckdays ? { utmCampaign: utm.utm_campaign || "teckdays_2026" } : {}),
        },
      });
    } else {
      const slaDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await prisma.lead.create({
        data: {
          contactId: contact.id,
          source: teckdays ? "SALON" : "SITE_WEB",
          statut: "NOUVEAU",
          notes: noteRdv,
          slaDeadline,
          utmSource: utm.utm_source || null,
          utmMedium: utm.utm_medium || null,
          utmCampaign: utm.utm_campaign || null,
          utmContent: utm.utm_content || null,
        },
      });
    }

    // Évènement traçabilité
    await prisma.evenement.create({
      data: {
        contactId: contact.id,
        type: "CREATION_LEAD",
        description: `${tagsBlock}RDV Calendly créé`,
        metadata: {
          calendlyEventUri: calendlyUri,
          source,
          productSlug,
          teckdays,
          utm,
          rdvId: rdv.id,
          start: start.toISOString(),
        },
      },
    });

    // Notif spécifique Teck Days (visio dessinateur 3D)
    if (teckdays) {
      await notifyTeckDaysRdv({ prenom, nom, email, tel, start, productSlug }).catch(() => null);
    }

    return NextResponse.json({ ok: true, contactId: contact.id, rdvId: rdv.id, teckdays }, { headers: cors });
  } catch (err: any) {
    console.error("[calendly-rdv] error", err);
    return NextResponse.json({ error: "internal", detail: err.message }, { status: 500, headers: cors });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "POST /api/webhooks/calendly-rdv",
    types: ["rdv", "rdv_annulation"],
  });
}
