import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/webhooks/newsletter
 *
 * Inscription à la newsletter depuis le site web DIMEXOI.
 * Crée un contact (ou met à jour) avec consentement newsletter + RGPD email.
 *
 * JSON ATTENDU :
 * {
 *   "email": "marie@gmail.com",               // OBLIGATOIRE
 *   "nom": "Dupont",                           // optionnel
 *   "prenom": "Marie",                         // optionnel
 *   "source": "footer-site"                    // optionnel (défaut: "NEWSLETTER")
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin") || "";

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
    const email = (body.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Email obligatoire", required: ["email"] },
        { status: 400 }
      );
    }

    if (!email.includes("@") || !email.includes(".")) {
      return NextResponse.json(
        { error: "Format email invalide" },
        { status: 400 }
      );
    }

    const nom = (body.nom || "").trim() || "Inconnu";
    const prenom = (body.prenom || "").trim();
    const source = body.source || "NEWSLETTER";

    const contact = await prisma.contact.upsert({
      where: { email },
      create: {
        email,
        nom,
        prenom,
        sourcePremiere: source,
        consentNewsletter: true,
        rgpdEmailConsent: true,
        rgpdConsentDate: new Date(),
        rgpdConsentSource: "newsletter-site-web",
        lifecycleStage: "PROSPECT",
      },
      update: {
        consentNewsletter: true,
        rgpdEmailConsent: true,
        rgpdConsentDate: new Date(),
        rgpdConsentSource: "newsletter-site-web",
        ...(body.nom ? { nom } : {}),
        ...(body.prenom ? { prenom } : {}),
      },
    });

    await prisma.evenement.create({
      data: {
        contactId: contact.id,
        type: "NOTE",
        description: `Inscription newsletter via ${source}`,
        metadata: {
          source,
          ip: request.headers.get("x-forwarded-for") || null,
          userAgent: request.headers.get("user-agent") || null,
          timestamp: new Date().toISOString(),
        },
      },
    });

    const isNew = contact.createdAt.getTime() === contact.updatedAt.getTime();

    const headers: Record<string, string> = {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-webhook-secret",
    };

    return NextResponse.json({
      success: true,
      action: isNew ? "subscribed" : "updated",
      contactId: contact.id,
      message: isNew ? "Inscription newsletter confirmée" : "Préférences newsletter mises à jour",
    }, { status: isNew ? 201 : 200, headers });

  } catch (error: any) {
    console.error("Newsletter webhook error:", error);

    if (error.code === "P2002") {
      return NextResponse.json({
        success: true,
        action: "already_subscribed",
        message: "Déjà inscrit à la newsletter",
      });
    }

    return NextResponse.json(
      { error: "Erreur interne", detail: error.message },
      { status: 500 }
    );
  }
}

// OPTIONS — CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin") || "*";
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-webhook-secret",
      "Access-Control-Max-Age": "86400",
    },
  });
}

// GET — Health check
export async function GET() {
  const totalNewsletter = await prisma.contact.count({
    where: { consentNewsletter: true },
  });

  return NextResponse.json({
    status: "ok",
    webhook: "Newsletter → KÒKPIT",
    endpoint: "POST /api/webhooks/newsletter",
    required: ["email"],
    optional: ["nom", "prenom", "source"],
    stats: { totalSubscribers: totalNewsletter },
  });
}
