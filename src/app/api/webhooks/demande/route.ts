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
 * JSON ATTENDU (v2 — avec articles) :
 * ==========================================================
 * {
 *   "nom": "Dupont",                          // OBLIGATOIRE
 *   "prenom": "Marie",                        // OBLIGATOIRE
 *   "email": "marie@gmail.com",               // OBLIGATOIRE
 *   "telephone": "0692123456",                // optionnel
 *   "message": "Souhaite un devis...",        // optionnel
 *   "showroom": "SUD - Saint-Pierre",         // optionnel
 *   "budget": "3 000€ - 5 000€",             // optionnel
 *   "modePaiement": "Comptant",               // optionnel
 *   "source": "site-web",                     // optionnel (défaut: "SITE_WEB")
 *   "articles": [                             // optionnel (liste des articles)
 *     {
 *       "nom": "Bureau Nabul",
 *       "categorie": "Bureau",
 *       "finition": "Miel",
 *       "quantite": 1,
 *       "prix": 450,                          // optionnel
 *       "reference": "BUR-NAB-001"            // optionnel
 *     }
 *   ],
 *   "consentements": {                        // optionnel
 *     "offre": true,
 *     "newsletter": false,
 *     "invitation": false,
 *     "devis": true,
 *     "rgpdEmail": true,
 *     "rgpdSms": false
 *   }
 * }
 *
 * RÉTRO-COMPATIBLE : "produit" ou "meuble" (string) est toujours accepté
 */

interface Article {
  nom: string;
  categorie?: string;
  finition?: string;
  quantite?: number;
  prix?: number;
  reference?: string;
}

function cleanPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const cleaned = String(phone).replace(/[\s.\-()]/g, "");
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

/** Construire le résumé des articles pour le champ "meuble" */
function buildMeubleFromArticles(articles: Article[]): string {
  if (!articles || articles.length === 0) return "Non spécifié";
  if (articles.length === 1) {
    const a = articles[0];
    return [a.nom, a.finition ? `(${a.finition})` : null]
      .filter(Boolean).join(" ");
  }
  return articles.map(a => {
    const qty = a.quantite && a.quantite > 1 ? `x${a.quantite}` : "";
    return `${a.nom}${qty ? ` ${qty}` : ""}`;
  }).join(", ");
}

/** Construire le HTML des articles pour l'email */
function buildArticlesHtml(articles: Article[]): string {
  if (!articles || articles.length === 0) return "";
  const rows = articles.map(a => `
    <tr>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;">${a.nom}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;">${a.categorie || "-"}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;">${a.finition || "-"}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;">${a.quantite || 1}</td>
    </tr>`).join("");
  return `
  <table style="width:100%;border-collapse:collapse;margin:10px 0;">
    <thead>
      <tr style="background:#f59e0b;color:white;">
        <th style="padding:8px 10px;text-align:left;">Article</th>
        <th style="padding:8px 10px;text-align:left;">Catégorie</th>
        <th style="padding:8px 10px;text-align:left;">Finition</th>
        <th style="padding:8px 10px;text-align:center;">Qté</th>
      </tr>
    </thead>
    <tbody>${rows}
    </tbody>
  </table>`;
}

async function sendEmailNotification(
  to: string, toName: string,
  nom: string, prenom: string, meuble: string,
  telephone: string | null, email: string, showroom: string | null,
  budget: string | null, articles: Article[] | null, message: string | null
) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (!brevoApiKey) return;

  const senderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@dimexoi.fr";
  const nomComplet = `${prenom} ${nom}`.trim();
  const articlesHtml = articles && articles.length > 0 ? buildArticlesHtml(articles) : "";
  const nbArticles = articles ? articles.length : 0;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
<div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
  <h2 style="color:#f59e0b;">🛋️ Nouvelle demande — Site Web${nbArticles > 0 ? ` (${nbArticles} article${nbArticles > 1 ? "s" : ""})` : ""}</h2>
  <p>Bonjour ${toName},</p>
  <p>Une nouvelle demande a été reçue depuis le <strong>site web DIMEXOI</strong>.</p>
  <div style="background:#f9fafb;padding:15px;border-left:4px solid #f59e0b;margin:20px 0;">
    <p><strong>Contact :</strong> ${nomComplet}</p>
    <p><strong>Téléphone :</strong> ${telephone || "Non fourni"}</p>
    <p><strong>Email :</strong> ${email}</p>
    ${showroom ? `<p><strong>Showroom :</strong> ${showroom}</p>` : ""}
    ${budget ? `<p><strong>Budget :</strong> ${budget}</p>` : ""}
    ${message ? `<p><strong>Message :</strong> ${message}</p>` : ""}
  </div>
  ${articlesHtml ? `<h3 style="color:#333;margin-top:20px;">Articles demandés</h3>${articlesHtml}` : `<p><strong>Produit :</strong> ${meuble}</p>`}
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
        subject: `🛋️ Nouvelle demande site web : ${meuble}${nbArticles > 1 ? ` (${nbArticles} articles)` : ""}`,
        htmlContent,
      }),
    });
  } catch (err) {
    console.error("Brevo error:", err);
  }
}

export async function POST(request: NextRequest) {
  // Headers CORS pour toutes les réponses
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-webhook-secret",
  };

  try {
    // Vérification secret (optionnel)
    const secret = process.env.WEBHOOK_SECRET;
    if (secret) {
      const auth = request.headers.get("authorization")?.replace("Bearer ", "") ||
        request.headers.get("x-webhook-secret");
      if (auth !== secret) {
        return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401, headers: corsHeaders });
      }
    }

    const body = await request.json();

    // Validation
    const email = (body.email || "").trim().toLowerCase();
    const nom = (body.nom || "").trim();
    const prenom = (body.prenom || "").trim();

    if (!email || !nom) {
      return NextResponse.json(
        { success: false, error: "Champs obligatoires manquants", required: ["email", "nom"] },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validation email basique
    if (!email.includes("@") || !email.includes(".")) {
      return NextResponse.json(
        { success: false, error: "Format email invalide" },
        { status: 400, headers: corsHeaders }
      );
    }

    const telephone = cleanPhone(body.telephone);
    const message = (body.message || "").trim() || null;
    const showroom = body.showroom || null;
    const budget = body.budget || null;
    const modePaiement = body.modePaiement || null;
    const source = body.source || "SITE_WEB";

    // Articles (v2) — compatible avec l'ancien champ "produit"/"meuble"
    const articles: Article[] | null = Array.isArray(body.articles) && body.articles.length > 0
      ? body.articles.map((a: any) => ({
          nom: (a.nom || a.name || "Sans nom").trim(),
          categorie: (a.categorie || a.category || "").trim() || null,
          finition: (a.finition || a.finish || "").trim() || null,
          quantite: Number(a.quantite || a.quantity || a.qty || 1),
          prix: a.prix || a.price || null,
          reference: a.reference || a.ref || a.sku || null,
        }))
      : null;

    // Champ "meuble" — résumé des articles ou ancien champ simple
    const meuble = articles
      ? buildMeubleFromArticles(articles)
      : (body.produit || body.meuble || "Non spécifié").trim();

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
        meuble,
        message,
        showroom,
        modePaiement,
        budget,
        articles: articles ? (JSON.parse(JSON.stringify(articles)) as object) : undefined,
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
        notes: `Demande site web: ${meuble}${message ? ` — ${message}` : ""}${budget ? ` (Budget: ${budget})` : ""}`,
        commercialId: commercial?.id || null,
        slaDeadline,
      },
    });

    // Événement pour traçabilité
    await prisma.evenement.create({
      data: {
        contactId: contact.id,
        type: "CREATION_LEAD",
        description: `Nouvelle demande via site web : ${meuble}`,
        metadata: {
          source,
          meuble,
          budget,
          showroom,
          articles: articles ? (JSON.parse(JSON.stringify(articles)) as object) : undefined,
          nbArticles: articles?.length || 0,
          demandePrixId: demande.id,
          leadId: lead.id,
          assignedTo: commercial?.email || "non assigné",
          ip: request.headers.get("x-forwarded-for") || null,
          userAgent: request.headers.get("user-agent") || null,
        },
      },
    });

    // Notifications email — fire-and-forget (ne bloque pas la réponse)
    const emailPromises: Promise<void>[] = [];
    if (commercial) {
      emailPromises.push(
        sendEmailNotification(
          commercial.email, commercial.nom || "Commercial",
          nom, prenom, meuble, telephone, email, showroom,
          budget, articles, message
        )
      );
    }

    // Si showroom Sud → notifier contact@dimexoi.fr
    const isSud = showroom && (
      showroom.toLowerCase().includes("saint-pierre") ||
      showroom.toLowerCase().includes("sud")
    );
    if (isSud) {
      emailPromises.push(
        sendEmailNotification(
          "contact@dimexoi.fr", "Équipe DIMEXOI",
          nom, prenom, meuble, telephone, email, showroom,
          budget, articles, message
        )
      );
    }

    // Lancer les emails sans attendre (fire-and-forget)
    if (emailPromises.length > 0) {
      Promise.allSettled(emailPromises).catch(err => console.error("Email background error:", err));
    }

    return NextResponse.json({
      success: true,
      message: "Demande envoyée avec succès",
      contactId: contact.id,
      demandePrixId: demande.id,
      leadId: lead.id,
      assignedTo: commercial?.email || null,
      nbArticles: articles?.length || 0,
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error("Webhook demande error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne", detail: error.message },
      { status: 500, headers: corsHeaders }
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
  return NextResponse.json({
    status: "ok",
    version: "v2",
    webhook: "Site Web → KÒKPIT",
    endpoints: {
      demande: "POST /api/webhooks/demande",
      newsletter: "POST /api/webhooks/newsletter",
    },
    required: ["email", "nom"],
    optional: ["prenom", "telephone", "message", "showroom", "budget", "modePaiement", "source", "articles", "consentements"],
    articlesFormat: {
      description: "Array d'objets articles",
      example: {
        nom: "Bureau Nabul",
        categorie: "Bureau",
        finition: "Miel",
        quantite: 1,
        prix: 450,
        reference: "BUR-NAB-001",
      },
    },
  });
}
