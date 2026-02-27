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
        },
      },
    });

    return NextResponse.json({
      success: true,
      action: "created",
      contactId: contact.id,
      demandePrixId: demande.id,
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
