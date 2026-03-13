import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/demandes/relance
 *
 * Envoie un email de relance au commercial assigné à une demande de prix.
 * Le message insiste sur l'urgence si le SLA est dépassé.
 *
 * Body: { demandeId: string }
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { demandeId } = await request.json();

    if (!demandeId) {
      return NextResponse.json({ error: "demandeId requis" }, { status: 400 });
    }

    // Récupérer la demande avec le contact et le commercial
    const demande = await prisma.demandePrix.findUnique({
      where: { id: demandeId },
      include: {
        contact: {
          include: {
            leads: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                commercial: {
                  select: { id: true, nom: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!demande) {
      return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 });
    }

    const lead = demande.contact.leads?.[0];
    const commercial = lead?.commercial;

    if (!commercial?.email) {
      return NextResponse.json(
        { error: "Aucun commercial assigné ou pas d'email configuré" },
        { status: 400 }
      );
    }

    // Calculer le retard
    const now = new Date();
    const dateCreation = demande.dateDemande || demande.createdAt;
    const joursDepuis = Math.floor(
      (now.getTime() - dateCreation.getTime()) / (1000 * 60 * 60 * 24)
    );

    const slaExpired = lead?.slaDeadline ? new Date(lead.slaDeadline) < now : false;
    const heuresRetard = slaExpired && lead?.slaDeadline
      ? Math.floor((now.getTime() - new Date(lead.slaDeadline).getTime()) / (1000 * 60 * 60))
      : 0;

    const clientNom = `${demande.contact.prenom || ""} ${demande.contact.nom || ""}`.trim();
    const clientEmail = demande.contact.email;
    const clientTel = demande.contact.telephone || "Non renseigné";
    const meuble = demande.meuble || "Non spécifié";
    const showroom = demande.showroom || "Non spécifié";
    const envoyePar = (session.user as any).nom || session.user.email || "KÒKPIT";

    // Construire le HTML de l'email
    const urgenceLabel = slaExpired
      ? `⚠️ URGENT — SLA DÉPASSÉ DE ${heuresRetard}H`
      : `⏰ RELANCE — Demande en attente depuis ${joursDepuis} jour${joursDepuis > 1 ? "s" : ""}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; padding: 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

    <!-- Header urgence -->
    <div style="background: ${slaExpired ? "#D32F2F" : "#E65100"}; color: white; padding: 20px 24px;">
      <h1 style="margin: 0; font-size: 18px; font-weight: 700;">${urgenceLabel}</h1>
      <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">
        ${envoyePar} vous demande de traiter cette demande MAINTENANT
      </p>
    </div>

    <!-- Détails client -->
    <div style="padding: 24px;">
      <h2 style="margin: 0 0 16px; font-size: 16px; color: #32475C;">📋 Demande de prix</h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #8592A3; font-size: 13px; width: 120px;">Client</td>
          <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #32475C;">${clientNom}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #8592A3; font-size: 13px;">Email</td>
          <td style="padding: 8px 0; font-size: 14px; color: #32475C;">
            <a href="mailto:${clientEmail}" style="color: #C2185B; text-decoration: none;">${clientEmail}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #8592A3; font-size: 13px;">Téléphone</td>
          <td style="padding: 8px 0; font-size: 14px; color: #32475C;">
            <a href="tel:${clientTel}" style="color: #C2185B; text-decoration: none;">${clientTel}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #8592A3; font-size: 13px;">Produit</td>
          <td style="padding: 8px 0; font-size: 14px; color: #32475C;">${meuble}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #8592A3; font-size: 13px;">Showroom</td>
          <td style="padding: 8px 0; font-size: 14px; color: #32475C;">${showroom}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #8592A3; font-size: 13px;">Date demande</td>
          <td style="padding: 8px 0; font-size: 14px; color: #32475C;">
            ${dateCreation.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
            <span style="color: ${slaExpired ? "#D32F2F" : "#E65100"}; font-weight: 600; margin-left: 8px;">
              (il y a ${joursDepuis} jour${joursDepuis > 1 ? "s" : ""})
            </span>
          </td>
        </tr>
      </table>

      ${demande.message ? `
      <div style="margin-top: 16px; padding: 12px 16px; background: #f5f6f7; border-radius: 8px; border-left: 3px solid #C2185B;">
        <p style="margin: 0 0 4px; font-size: 12px; color: #8592A3; font-weight: 600;">MESSAGE DU CLIENT</p>
        <p style="margin: 0; font-size: 13px; color: #32475C; line-height: 1.5;">${demande.message}</p>
      </div>
      ` : ""}

      <!-- Bouton action -->
      <div style="text-align: center; margin-top: 24px;">
        <a href="${process.env.NEXTAUTH_URL || "https://kokpit.vercel.app"}/leads"
           style="display: inline-block; background: ${slaExpired ? "#D32F2F" : "#E65100"}; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">
          Traiter cette demande →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f5f6f7; padding: 16px 24px; text-align: center;">
      <p style="margin: 0; font-size: 11px; color: #8592A3;">
        Envoyé depuis KÒKPIT · Demande #${demande.id.slice(-8)}
      </p>
    </div>
  </div>
</body>
</html>`;

    // Envoyer via Brevo (transactional)
    const brevoKey = process.env.BREVO_API_KEY;
    const resendKey = process.env.RESEND_API_KEY;

    let emailSent = false;
    let emailError = "";

    if (brevoKey) {
      // Brevo transactional API
      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "KÒKPIT", email: process.env.BREVO_SENDER_EMAIL || "noreply@dimexoi.fr" },
          to: [{ email: commercial.email, name: commercial.nom }],
          subject: `${slaExpired ? "⚠️ URGENT" : "⏰ RELANCE"} — Demande de ${clientNom} (${meuble})`,
          htmlContent,
        }),
      });

      if (brevoRes.ok) {
        emailSent = true;
      } else {
        emailError = await brevoRes.text();
        console.error("Brevo send error:", emailError);
      }
    } else if (resendKey) {
      // Fallback Resend
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "noreply@kokpit.fr",
          to: commercial.email,
          subject: `${slaExpired ? "⚠️ URGENT" : "⏰ RELANCE"} — Demande de ${clientNom} (${meuble})`,
          html: htmlContent,
        }),
      });

      if (resendRes.ok) {
        emailSent = true;
      } else {
        emailError = await resendRes.text();
        console.error("Resend send error:", emailError);
      }
    } else {
      return NextResponse.json(
        { error: "Aucun service email configuré (BREVO_API_KEY ou RESEND_API_KEY manquant)" },
        { status: 503 }
      );
    }

    // Logger l'événement de relance
    if (emailSent) {
      await prisma.evenement.create({
        data: {
          contactId: demande.contactId,
          leadId: lead?.id,
          type: "RELANCE",
          description: `Relance envoyée à ${commercial.nom} (${commercial.email}) par ${envoyePar} — demande en attente depuis ${joursDepuis}j`,
          metadata: {
            demandeId: demande.id,
            commercialId: commercial.id,
            commercialEmail: commercial.email,
            joursRetard: joursDepuis,
            slaExpired,
            envoyePar,
          },
        },
      });
    }

    return NextResponse.json({
      success: emailSent,
      commercial: { nom: commercial.nom, email: commercial.email },
      joursDepuis,
      slaExpired,
      error: emailSent ? undefined : emailError,
    });
  } catch (error: any) {
    console.error("POST /api/demandes/relance error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
