import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Webhook Glideapps — Réception des nouvelles demandes de devis
 *
 * POST /api/webhooks/glide
 *
 * Configuration dans Glideapps :
 * 1. Aller dans Settings > Integrations > Webhooks
 * 2. Ajouter un webhook avec l'URL : https://votre-domaine.com/api/webhooks/glide
 * 3. Sélectionner le trigger "New row in Demande de prix"
 * 4. Mapper les colonnes :
 *    - Nom, Prénom, Meuble, Numéro de téléphone, Adresse e-mail,
 *      Message, 🔒 Row ID, Offre, Newsletter, Invitation, Devis,
 *      Mode de paiement, Showroom, DATE
 *
 * Sécurité : Ajouter GLIDE_WEBHOOK_SECRET dans .env
 * Le header X-Glide-Secret doit correspondre
 */

interface GlidePayload {
  // Colonnes de l'onglet "Demande de prix"
  "Nom"?: string;
  "Prénom"?: string;
  "Meuble"?: string;
  "Numéro de téléphone"?: string;
  "Adresse e-mail"?: string;
  "Message"?: string;
  "🔒 Row ID"?: string;
  "Offre"?: number | boolean;
  "Newsletter"?: number | boolean;
  "Invitation"?: number | boolean;
  "Devis"?: number | boolean;
  "Mode de paiement"?: string;
  "Showroom"?: string;
  "DATE"?: string;
  // Glide peut aussi envoyer les colonnes en camelCase
  nom?: string;
  prenom?: string;
  meuble?: string;
  telephone?: string;
  email?: string;
  message?: string;
  rowId?: string;
  offre?: number | boolean;
  newsletter?: number | boolean;
  invitation?: number | boolean;
  devis?: number | boolean;
  modePaiement?: string;
  showroom?: string;
  date?: string;
}

function isTruthy(val: any): boolean {
  return val === true || val === 1 || val === "1" || val === "true";
}

function cleanPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  return String(phone).replace(/\s+/g, "").replace(/^0/, "+262");
}

/**
 * Trouver le commercial assigné basé sur le showroom
 */
async function findCommercialByShowroom(showroom: string | null) {
  if (!showroom) return null;

  try {
    // Chercher un user avec le rôle COMMERCIAL et le showroom spécifié
    const commercial = await prisma.user.findFirst({
      where: {
        role: "COMMERCIAL",
        showroom: {
          contains: showroom,
          mode: "insensitive",
        },
      },
    });
    return commercial;
  } catch (error) {
    console.warn("Erreur lors de la recherche du commercial:", error);
    return null;
  }
}

/**
 * Envoyer un email de notification au commercial via Brevo
 */
async function sendEmailToCommercial(
  commercialEmail: string,
  commercialName: string,
  contactNom: string,
  contactPrenom: string,
  meuble: string,
  telephone: string | null,
  email: string
) {
  try {
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      console.warn("BREVO_API_KEY non configuré, email non envoyé");
      return;
    }

    const senderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@dimexoi.fr";
    const nomComplet = `${contactPrenom} ${contactNom}`.trim();

    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Nouvelle demande de prix</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
    <h2 style="color: #f59e0b;">Nouvelle demande de prix - KÒKPIT</h2>

    <p>Bonjour ${commercialName},</p>

    <p>Une nouvelle demande de prix a été reçue via Glideapps.</p>

    <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
      <p><strong>Contact:</strong> ${nomComplet}</p>
      <p><strong>Meuble:</strong> ${meuble}</p>
      <p><strong>Téléphone:</strong> ${telephone || "Non fourni"}</p>
      <p><strong>Email:</strong> ${email}</p>
    </div>

    <p style="margin-top: 30px;">
      <a href="https://kokpit.dimexoi.fr/leads" style="background-color: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Voir dans KÒKPIT
      </a>
    </p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    <p style="font-size: 12px; color: #666;">
      Cet email a été envoyé automatiquement par KÒKPIT - Aucune réponse n'est nécessaire
    </p>
  </div>
</body>
</html>
    `.trim();

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "KÒKPIT",
          email: senderEmail,
        },
        to: [
          {
            email: commercialEmail,
            name: commercialName,
          },
        ],
        subject: `📧 Nouvelle demande de prix: ${meuble}`,
        htmlContent: emailContent,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Erreur Brevo:", error);
    } else {
      console.log("Email envoyé avec succès au commercial");
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérification du secret (optionnel mais recommandé)
    const secret = process.env.GLIDE_WEBHOOK_SECRET;
    if (secret) {
      const headerSecret = request.headers.get("x-glide-secret") ||
        request.headers.get("authorization")?.replace("Bearer ", "");
      if (headerSecret !== secret) {
        return NextResponse.json(
          { error: "Non autorisé" },
          { status: 401 }
        );
      }
    }

    const payload: GlidePayload = await request.json();

    // Normaliser les champs (Glide peut envoyer en français ou camelCase)
    const email = (payload["Adresse e-mail"] || payload.email || "").trim().toLowerCase();
    const nom = (payload["Nom"] || payload.nom || "").trim();
    const prenom = (payload["Prénom"] || payload.prenom || "").trim();
    const telephone = cleanPhone(payload["Numéro de téléphone"] || payload.telephone);
    const meuble = (payload["Meuble"] || payload.meuble || "Non spécifié").trim();
    const message = (payload["Message"] || payload.message || "").trim() || null;
    const glideRowId = payload["🔒 Row ID"] || payload.rowId || null;
    const showroom = payload["Showroom"] || payload.showroom || null;
    const modePaiement = payload["Mode de paiement"] || payload.modePaiement || null;
    const dateStr = payload["DATE"] || payload.date || null;

    const consentOffre = isTruthy(payload["Offre"] ?? payload.offre);
    const consentNewsletter = isTruthy(payload["Newsletter"] ?? payload.newsletter);
    const consentInvitation = isTruthy(payload["Invitation"] ?? payload.invitation);
    const consentDevis = isTruthy(payload["Devis"] ?? payload.devis);

    if (!email) {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      );
    }

    // Upsert du contact
    const contact = await prisma.contact.upsert({
      where: { email },
      create: {
        email,
        nom,
        prenom,
        telephone,
        sourcePremiere: "GLIDE",
        consentOffre,
        consentNewsletter,
        consentInvitation,
        consentDevis,
      },
      update: {
        // Mettre à jour le téléphone s'il n'existait pas
        ...(telephone ? { telephone } : {}),
        // Les consentements ne passent jamais de true à false
        ...(consentOffre ? { consentOffre: true } : {}),
        ...(consentNewsletter ? { consentNewsletter: true } : {}),
        ...(consentInvitation ? { consentInvitation: true } : {}),
        ...(consentDevis ? { consentDevis: true } : {}),
      },
    });

    // Vérifier si cette demande existe déjà (par glideRowId)
    if (glideRowId) {
      const existing = await prisma.demandePrix.findUnique({
        where: { glideRowId },
      });
      if (existing) {
        return NextResponse.json({
          success: true,
          action: "duplicate",
          contactId: contact.id,
          message: "Demande déjà enregistrée",
        });
      }
    }

    // Créer la demande de prix
    const demande = await prisma.demandePrix.create({
      data: {
        contactId: contact.id,
        meuble,
        message,
        glideRowId,
        showroom: showroom && showroom !== "false" ? showroom : null,
        modePaiement,
        dateDemande: dateStr ? new Date(dateStr) : new Date(),
      },
    });

    // Chercher le commercial assigné basé sur le showroom
    const commercial = await findCommercialByShowroom(showroom);

    // Créer automatiquement un Lead depuis la demande de prix
    const lead = await prisma.lead.create({
      data: {
        contactId: contact.id,
        source: "GLIDE",
        statut: "NOUVEAU",
        notes: `Demande de prix: ${meuble}${message ? ` - ${message}` : ""}`,
        commercialId: commercial?.id || null,
      },
    });

    // Créer un événement pour traçabilité
    await prisma.evenement.create({
      data: {
        contactId: contact.id,
        type: "CREATION_LEAD",
        description: `Nouvelle demande de prix via Glideapps : ${meuble}`,
        metadata: {
          source: "glide_webhook",
          meuble,
          glideRowId,
          demandePrixId: demande.id,
          leadId: lead.id,
          assignedTo: commercial?.email || "non assigné",
        },
      },
    });

    // Envoyer un email de notification au commercial assigné
    if (commercial) {
      await sendEmailToCommercial(
        commercial.email,
        commercial.nom || "Collègue",
        nom,
        prenom,
        meuble,
        telephone,
        email
      );
    }

    return NextResponse.json({
      success: true,
      action: "created",
      contactId: contact.id,
      demandePrixId: demande.id,
      leadId: lead.id,
      assignedTo: commercial?.email || "non assigné",
    });
  } catch (error: any) {
    console.error("Webhook Glide error:", error);
    return NextResponse.json(
      { error: "Erreur interne", detail: error.message },
      { status: 500 }
    );
  }
}

// GET pour le health check / vérification de l'URL
export async function GET() {
  return NextResponse.json({
    status: "ok",
    webhook: "Glideapps → KÒKPIT",
    description: "Webhook pour recevoir les demandes de prix depuis Glideapps",
  });
}
