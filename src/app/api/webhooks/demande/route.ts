import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/webhooks/demande
 *
 * Webhook pour recevoir les demandes de prix depuis le site web DIMEXOI.
 * Crée un contact (ou met à jour), une demande de prix, un lead,
 * et envoie les notifications email.
 *
 * Sécurité : Ajouter WEBHOOK_SECRET dans .env (optionnel)
 * Le header Authorization: Bearer <secret> doit correspondre
 *
 * ==========================================================
 * JSON ATTENDU :
 * ==========================================================
 * {
 *   "nom": "Dupont",                          // OBLIGATOIRE
 *   "prenom": "Marie",                        // OBLIGATOIRE
 *   "email": "marie@gmail.com",               // OBLIGATOIRE
 *   "telephone": "0692123456",                // optionnel
 *   "produit": "Cuisine Moderna",             // optionnel (= meuble)
 *   "message": "Souhaite un devis...",        // optionnel
 *   "showroom": "Saint-Denis",                // optionnel
 *   "budget": "5000-10000",                   // optionnel
 *   "modePaiement": "Comptant",               // optionnel
 *   "source": "site-web",                     // optionnel (défaut: "SITE_WEB")
 *   "consentements": {                        // optionnel
 *     "offre": true,
 *     "newsletter": false,
 *     "invitation": false,
 *     "devis": true,
 *     "rgpdEmail": true,
 *     "rgpdSms": false
 *   }
 * }
 */

function cleanPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const cleaned = String(phone).replace(/[\s.\-()]/g, "");
  // Convertir 06/07 en format international Réunion
  if (cleaned.match(/^0[67]/)) return `+262${cleaned.slice(1)}`;
  return cleaned;
}

async function findCommercialByShowroom(showroom: string | null) {
  if (!showroom) return null;
  try {
    const showroomData = await prisma.showroom.findFirst({
      where: { nom: { contains: showroom, mode: "insensitive" } },
    });
    if (!showroomData) return null;
    return prisma.user.findFirst({
      where: { role: "COMMERCIAL", showroomId: showroomData.id },
    });
  } catch { return null; }
}

async function findShowroomId(showroom: string | null): Promise<string | null> {
  if (!showroom) return null;
  try {
    const s = await prisma.showroom.findFirst({
      where: { nom: { contains: showroom, mode: "insensitive" } },
    });
    return s?.id || null;
  } catch { return null; }
}

async function sendEmailNotification(
  to: string, toName: string,
  nom: string, prenom: string, produit: string,
  telephone: string | null, email: string, showroom: string | null
) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (!brevoApiKey) return;

  const senderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@dimexoi.fr";
  const nomComplet = `${prenom} ${nom}`.trim();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
<div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
  <h2 style="color:#f59e0b;">🛋️ Nouvelle demande — Site Web</h2>
  <p>Bonjour ${toName},</p>
  <p>Une nouvelle demande a été reçue depuis le <strong>site web DIMEXOI</strong>.</p>
  <div style="background:#f9fafb;padding:15px;border-left:4px solid #f59e0b;margin:20px 0;">
    <p><strong>Contact :</strong> ${nomComplet}</p>
    <p><strong>Produit :</strong> ${produit}</p>
    ${showroom ? `<p><strong>Showroom :</strong> ${showroom}</p>` : ""}
    <p><strong>Téléphone :</strong> ${telephone || "Non fourni"}</p>
    <p><strong>Email :</strong> ${email}</p>
  </div>
  <p style="margin-top:30px;">
    <a href="https://kokpit-kappa.vercel.app/demandes" style="background:#f59e0b;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;">
      Voir dans KÒKPIT
    </a>
  </p>
  <hr style="border:none;border-top:1px solid #e0e0e0;margin:30px 0;">
  <p style="font-size:12px;color:#666;">Envoyé automatiquement par KÒKPIT</p>
</div>
</body>
</html>`.trim();

  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "KÒKPIT", email: senderEmail },
        to: [{ email: to, name: toName }],
        subject: `🛋️ Nouvelle demande site web : ${produit}`,
        htmlContent,
      }),
    });
  } catch (err) {
    console.error("Brevo error:", err);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérification secret (optionnel)
    const secret = process.env.WEBHOOK_SECRET;
    if (secret) {
      const auth = request.headers.get("authorization")?.replace("Bearer ", "") ||
        request.headers.get("x-webhook-secret");
      if (auth !== secret) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
    }

    const body = await request.json();

    // Validation
    const email = (body.email || "").trim().toLowerCase();
    const nom = (body.nom || "").trim();
    const prenom = (body.prenom || "").trim();

    if (!email || !nom) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants", required: ["email", "nom", "prenom"] },
        { status: 400 }
      );
    }

    const telephone = cleanPhone(body.telephone);
    const produit = (body.produit || body.meuble || "Non spécifié").trim();
    const message = (body.message || "").trim() || null;
    const showroom = body.showroom || null;
    const budget = body.budget || null;
    const modePaiement = body.modePaiement || null;
    const source = body.source || "SITE_WEB";

    // Consentements
    const consentements = body.consentements || {};
    const consentOffre = Boolean(consentements.offre);
    const consentNewsletter = Boolean(consentements.newsletter);
    const consentInvitation = Boolean(consentements.invitation);
    const consentDevis = Boolean(consentements.devis);
    const rgpdEmailConsent = Boolean(consentements.rgpdEmail);
    const rgpdSmsConsent = Boolean(consentements.rgpdSms);

    // Trouver le showroom ID
    const showroomId = await findShowroomId(showroom);

    // Upsert contact
    const contact = await prisma.contact.upsert({
      where: { email },
      create: {
        email, nom, prenom, telephone,
        showroomId,
        sourcePremiere: source,
        consentOffre, consentNewsletter, consentInvitation, consentDevis,
        rgpdEmailConsent, rgpdSmsConsent,
        rgpdConsentDate: (rgpdEmailConsent || rgpdSmsConsent) ? new Date() : null,
        rgpdConsentSource: "site-web",
      },
      update: {
        ...(nom ? { nom } : {}),
        ...(prenom ? { prenom } : {}),
        ...(telephone ? { telephone } : {}),
        ...(showroomId ? { showroomId } : {}),
        consentOffre, consentNewsletter, consentInvitation, consentDevis,
        rgpdEmailConsent, rgpdSmsConsent,
        ...(rgpdEmailConsent || rgpdSmsConsent ? {
          rgpdConsentDate: new Date(),
          rgpdConsentSource: "site-web",
        } : {}),
      },
    });

    // Créer la demande de prix
    const demande = await prisma.demandePrix.create({
      data: {
        contactId: contact.id,
        meuble: produit,
        message: [message, budget ? `Budget: ${budget}` : null].filter(Boolean).join(" | "),
        showroom,
        modePaiement,
        dateDemande: new Date(),
      },
    });

    // Chercher le commercial du showroom
    const commercial = await findCommercialByShowroom(showroom);

    // Créer un Lead avec SLA 72h
    const slaDeadline = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const lead = await prisma.lead.create({
      data: {
        contactId: contact.id,
        source: source,
        statut: "NOUVEAU",
        notes: `Demande site web: ${produit}${message ? ` — ${message}` : ""}${budget ? ` (Budget: ${budget})` : ""}`,
        commercialId: commercial?.id || null,
        slaDeadline,
      },
    });

    // Événement pour traçabilité
    await prisma.evenement.create({
      data: {
        contactId: contact.id,
        type: "CREATION_LEAD",
        description: `Nouvelle demande via site web : ${produit}`,
        metadata: {
          source,
          produit,
          budget,
          showroom,
          demandePrixId: demande.id,
          leadId: lead.id,
          assignedTo: commercial?.email || "non assigné",
          ip: request.headers.get("x-forwarded-for") || null,
          userAgent: request.headers.get("user-agent") || null,
        },
      },
    });

    // Notifications email
    if (commercial) {
      await sendEmailNotification(
        commercial.email, commercial.nom || "Commercial",
        nom, prenom, produit, telephone, email, showroom
      );
    }

    // Si showroom Sud → notifier contact@dimexoi.fr
    const isSud = showroom && (
      showroom.toLowerCase().includes("saint-pierre") ||
      showroom.toLowerCase().includes("sud")
    );
    if (isSud) {
      await sendEmailNotification(
        "contact@dimexoi.fr", "Équipe DIMEXOI",
        nom, prenom, produit, telephone, email, showroom
      );
    }

    return NextResponse.json({
      success: true,
      contactId: contact.id,
      demandePrixId: demande.id,
      leadId: lead.id,
      assignedTo: commercial?.email || null,
    }, { status: 201 });

  } catch (error: any) {
    console.error("Webhook demande error:", error);
    return NextResponse.json(
      { error: "Erreur interne", detail: error.message },
      { status: 500 }
    );
  }
}

// GET — Health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    webhook: "Site Web → KÒKPIT",
    endpoints: {
      demande: "POST /api/webhooks/demande",
      newsletter: "POST /api/webhooks/newsletter",
    },
    required: ["email", "nom"],
    optional: ["prenom", "telephone", "produit", "message", "showroom", "budget", "modePaiement", "source", "consentements"],
  });
}
