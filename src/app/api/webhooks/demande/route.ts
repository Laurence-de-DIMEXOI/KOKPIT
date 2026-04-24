import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { estimateAndSave } from "@/lib/estimation";

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

/** Envoyer un email via Brevo. Retourne true si envoyé, false sinon. */
async function sendBrevoEmail(
  brevoApiKey: string,
  senderEmail: string,
  to: string,
  toName: string,
  subject: string,
  htmlContent: string
): Promise<boolean> {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "KÒKPIT", email: senderEmail },
        to: [{ email: to, name: toName }],
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[EMAIL] Brevo ERREUR ${response.status}: ${errorBody}`);
      return false;
    }
    const result = await response.json();
    console.log(`[EMAIL] Brevo OK → ${to} — messageId: ${result.messageId || "?"}`);
    return true;
  } catch (err) {
    console.error("[EMAIL] Brevo fetch error:", err);
    return false;
  }
}

/** Envoyer la notification de nouvelle demande au commercial. Retourne true si OK. */
async function sendEmailNotification(
  to: string, toName: string,
  nom: string, prenom: string, meuble: string,
  telephone: string | null, email: string, showroom: string | null,
  budget: string | null, articles: Article[] | null, message: string | null,
  sourceDetail: string | null = null
): Promise<boolean> {
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (!brevoApiKey) {
    console.error("[EMAIL] BREVO_API_KEY manquante — email NON envoyé à", to);
    return false;
  }

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
  <h2 style="color:#f59e0b;">🛋️ Nouvelle demande — ${sourceDetail ? sourceDetail : "Site Web"}${nbArticles > 0 ? ` (${nbArticles} article${nbArticles > 1 ? "s" : ""})` : ""}</h2>
  <p>Bonjour ${toName},</p>
  <p>Une nouvelle demande a été reçue depuis le <strong>site web DIMEXOI</strong>.</p>
  <div style="background:#f9fafb;padding:15px;border-left:4px solid #f59e0b;margin:20px 0;">
    <p><strong>Contact :</strong> ${nomComplet}</p>
    <p><strong>Téléphone :</strong> ${telephone || "Non fourni"}</p>
    <p><strong>Email :</strong> ${email}</p>
    ${showroom ? `<p><strong>Showroom :</strong> ${showroom}</p>` : ""}
    ${budget ? `<p><strong>Budget :</strong> ${budget}</p>` : ""}
    ${sourceDetail ? `<p><strong>🎯 Source :</strong> ${sourceDetail}</p>` : ""}
    ${message ? `<p><strong>Message :</strong> ${message}</p>` : ""}
  </div>
  ${articlesHtml ? `<h3 style="color:#333;margin-top:20px;">Articles demandés</h3>${articlesHtml}` : `<p><strong>Produit :</strong> ${meuble}</p>`}
  <p style="margin-top:30px;">
    <a href="https://kokpit-kappa.vercel.app/leads" style="background:#f59e0b;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;">
      Voir dans KÒKPIT
    </a>
  </p>
  <hr style="border:none;border-top:1px solid #e0e0e0;margin:30px 0;">
  <p style="font-size:12px;color:#666;">Envoyé automatiquement par KÒKPIT</p>
</div>
</body>
</html>`.trim();

  console.log(`[EMAIL] Envoi notification demande → ${to} (${toName}) — ${meuble}`);
  return sendBrevoEmail(brevoApiKey, senderEmail, to, toName,
    `🛋️ Nouvelle demande site web : ${meuble}${nbArticles > 1 ? ` (${nbArticles} articles)` : ""}`,
    htmlContent
  );
}

/** Envoyer une alerte à Laurence si l'email au commercial a échoué */
async function sendFailureAlert(
  commercialEmail: string,
  nom: string, prenom: string, meuble: string,
  telephone: string | null, email: string, showroom: string | null,
  erreurDetail: string
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
  <h2 style="color:#dc2626;">🚨 Échec envoi email commercial</h2>
  <p>Bonjour Laurence,</p>
  <p>Une demande a été reçue mais <strong>l'email de notification au commercial a échoué</strong>.</p>
  <div style="background:#fef2f2;padding:15px;border-left:4px solid #dc2626;margin:20px 0;">
    <p><strong>Destinataire prévu :</strong> ${commercialEmail}</p>
    <p><strong>Erreur :</strong> ${erreurDetail}</p>
  </div>
  <div style="background:#f9fafb;padding:15px;border-left:4px solid #f59e0b;margin:20px 0;">
    <p><strong>Contact :</strong> ${nomComplet}</p>
    <p><strong>Téléphone :</strong> ${telephone || "Non fourni"}</p>
    <p><strong>Email :</strong> ${email}</p>
    <p><strong>Produit :</strong> ${meuble}</p>
    ${showroom ? `<p><strong>Showroom :</strong> ${showroom}</p>` : ""}
  </div>
  <p style="margin-top:20px;">
    <a href="https://kokpit-kappa.vercel.app/leads" style="background:#dc2626;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;">
      Voir dans KÒKPIT
    </a>
  </p>
  <hr style="border:none;border-top:1px solid #e0e0e0;margin:30px 0;">
  <p style="font-size:12px;color:#666;">Alerte automatique KÒKPIT — action requise</p>
</div>
</body>
</html>`.trim();

  await sendBrevoEmail(brevoApiKey, senderEmail,
    "laurence.payet@dimexoi.fr", "Laurence",
    `🚨 Échec notification demande : ${nomComplet} — ${meuble}`,
    htmlContent
  );
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
    const rawSource = (body.source || "").toString().toUpperCase().replace(/-/g, "_");

    // Mapper vers les valeurs valides de l'enum LeadSource
    const VALID_SOURCES = ["META_ADS", "GOOGLE_ADS", "SITE_WEB", "GLIDE", "SALON", "FORMULAIRE", "DIRECT"];

    // UTM tracking data from site
    const utm = body.utm || {};
    const utmSource = (utm.utm_source || "").toLowerCase();
    const utmMedium = (utm.utm_medium || "").toLowerCase();
    const utmCampaign = utm.utm_campaign || null;

    // Auto-detect lead source from UTM parameters
    let source = VALID_SOURCES.includes(rawSource) ? rawSource : "SITE_WEB";
    if (utmSource.includes("facebook") || utmSource.includes("instagram") || utmSource === "fb" || utmSource === "ig") {
      source = "META_ADS";
    } else if (utmSource.includes("google") && utmMedium === "cpc") {
      source = "GOOGLE_ADS";
    }

    // Build source detail string for notes/email
    const sourceDetail = [utmSource, utmMedium, utmCampaign].filter(Boolean).join(" / ") || null;

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

    // ===== FUSION DEMANDES MULTIPLES =====
    // Si une demande existe pour ce contact aujourd'hui (Réunion UTC+4) → fusionner
    // Sinon → créer normalement (Lead + DemandePrix)
    const nowUtc = new Date();
    const reunionOffset = 4 * 60 * 60 * 1000;
    const reunionNow = new Date(nowUtc.getTime() + reunionOffset);
    const jourStr = reunionNow.toISOString().slice(0, 10); // YYYY-MM-DD en Réunion
    const jourDebutUtc = new Date(`${jourStr}T00:00:00.000+04:00`);
    const jourFinUtc = new Date(`${jourStr}T23:59:59.999+04:00`);

    const existingLeadToday = await prisma.lead.findFirst({
      where: {
        contactId: contact.id,
        createdAt: { gte: jourDebutUtc, lt: jourFinUtc },
      },
      orderBy: { createdAt: "desc" },
    });

    const existingDemandeToday = await prisma.demandePrix.findFirst({
      where: {
        contactId: contact.id,
        createdAt: { gte: jourDebutUtc, lt: jourFinUtc },
      },
      orderBy: { createdAt: "desc" },
    });

    let demande;
    let lead;
    const commercial = await findCommercialByShowroom(showroom);

    if (existingLeadToday || existingDemandeToday) {
      // ===== FUSION =====
      // 1) Lead : update notes concat, réutiliser si existant, sinon créer (cas rare)
      const newNotesBlock = `Demande site web: ${meuble}${message ? ` — ${message}` : ""}${budget ? ` (Budget: ${budget})` : ""}${sourceDetail ? ` [Source: ${sourceDetail}]` : ""}`;
      if (existingLeadToday) {
        lead = await prisma.lead.update({
          where: { id: existingLeadToday.id },
          data: {
            notes: existingLeadToday.notes
              ? `${existingLeadToday.notes}\n---\n${newNotesBlock}`
              : newNotesBlock,
            updatedAt: new Date(),
          },
        });
      } else {
        const slaDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
        lead = await prisma.lead.create({
          data: {
            contactId: contact.id,
            source: source,
            statut: "NOUVEAU",
            notes: newNotesBlock,
            commercialId: commercial?.id || null,
            slaDeadline,
            ...(utmSource ? { utmSource } : {}),
            ...(utmMedium ? { utmMedium } : {}),
            ...(utmCampaign ? { utmCampaign } : {}),
          },
        });
      }

      // 2) DemandePrix : fusion si existante, sinon création
      if (existingDemandeToday) {
        // Fusionner articles + meuble + message dans la demande existante
        const prevArticles = Array.isArray(existingDemandeToday.articles)
          ? (existingDemandeToday.articles as unknown as Article[])
          : [];
        const mergedArticles = articles ? [...prevArticles, ...articles] : prevArticles;
        const mergedMeuble = [existingDemandeToday.meuble, meuble]
          .filter((m) => m && m !== "Non spécifié")
          .join(" + ") || "Non spécifié";
        const mergedMessage = [existingDemandeToday.message, message]
          .filter(Boolean)
          .join("\n---\n") || null;

        demande = await prisma.demandePrix.update({
          where: { id: existingDemandeToday.id },
          data: {
            meuble: mergedMeuble,
            message: mergedMessage,
            articles: mergedArticles.length > 0
              ? (JSON.parse(JSON.stringify(mergedArticles)) as object)
              : undefined,
            // On ne touche pas showroom/budget/modePaiement — on garde la première valeur saisie
          },
        });
        console.log(`[WEBHOOK] Fusion: lead ${lead.id} + demande ${demande.id} (mis à jour)`);
      } else {
        demande = await prisma.demandePrix.create({
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
      }
    } else {
      // ===== CRÉATION NORMALE =====
      demande = await prisma.demandePrix.create({
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

      const slaDeadline = new Date(Date.now() + 72 * 60 * 60 * 1000);
      lead = await prisma.lead.create({
        data: {
          contactId: contact.id,
          source: source,
          statut: "NOUVEAU",
          notes: `Demande site web: ${meuble}${message ? ` — ${message}` : ""}${budget ? ` (Budget: ${budget})` : ""}${sourceDetail ? ` [Source: ${sourceDetail}]` : ""}`,
          commercialId: commercial?.id || null,
          slaDeadline,
          // UTM — stockés dans les colonnes dédiées pour analyse dans ROI Marketing
          ...(utmSource ? { utmSource } : {}),
          ...(utmMedium ? { utmMedium } : {}),
          ...(utmCampaign ? { utmCampaign } : {}),
        },
      });
    }

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
          utm: utm || null,
          sourceDetail: sourceDetail || null,
          ip: request.headers.get("x-forwarded-for") || null,
          userAgent: request.headers.get("user-agent") || null,
        },
      },
    });

    // Notification email au commercial — AWAIT obligatoire sur Vercel serverless
    const notifEmail = commercial?.email || "commercial@dimexoi.fr";
    const notifName = commercial?.nom || "Commercial";

    let emailSent = false;
    try {
      emailSent = await sendEmailNotification(
        notifEmail, notifName,
        nom, prenom, meuble, telephone, email, showroom,
        budget, articles, message, sourceDetail
      );
    } catch (err) {
      console.error("[WEBHOOK] Email notification error:", err);
    }

    // Si l'email au commercial a échoué → alerter Laurence
    if (!emailSent) {
      console.error(`[WEBHOOK] Email NON envoyé à ${notifEmail} — envoi alerte à Laurence`);
      try {
        await sendFailureAlert(
          notifEmail, nom, prenom, meuble, telephone, email, showroom,
          "L'email de notification n'a pas pu être transmis au commercial"
        );
      } catch (alertErr) {
        console.error("[WEBHOOK] Alerte Laurence aussi échouée:", alertErr);
      }
    }

    // Estimation automatique — AWAIT pour garantir l'exécution sur serverless
    try {
      await estimateAndSave(demande.id);
    } catch (err) {
      console.error("[WEBHOOK] Auto-estimation error:", err);
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
