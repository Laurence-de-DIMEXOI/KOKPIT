/**
 * Envoi du guide PDF par email via Brevo (transactionnel).
 *
 * DÉSACTIVÉ tant que BREVO_GUIDE_SDB_TEMPLATE_ID n'est pas configuré.
 * Pour activer :
 * 1. Créer un template transactionnel dans Brevo avec les paramètres {{ params.prenom }}, {{ params.guide_url }}
 * 2. Ajouter BREVO_GUIDE_SDB_TEMPLATE_ID=<id_du_template> dans les env vars Vercel
 */

import { sendTransactionalEmail } from "@/lib/brevo";

const GUIDE_PDF_URL = "https://www.dimexoi.fr/guides/amenager-salle-de-bain-en-teck.pdf";

interface SendGuidePdfParams {
  email: string;
  prenom: string;
  piece?: string | null;
  showroom?: string | null;
}

/**
 * Envoie le guide PDF par email via template Brevo.
 * Retourne true si envoyé, false si désactivé (pas de template ID).
 */
export async function sendGuidePdfEmail(params: SendGuidePdfParams): Promise<boolean> {
  const templateId = process.env.BREVO_GUIDE_SDB_TEMPLATE_ID;

  if (!templateId) {
    console.log("[guide-brevo] Envoi désactivé — BREVO_GUIDE_SDB_TEMPLATE_ID non configuré");
    return false;
  }

  const id = parseInt(templateId, 10);
  if (isNaN(id)) {
    console.error("[guide-brevo] BREVO_GUIDE_SDB_TEMPLATE_ID invalide :", templateId);
    return false;
  }

  try {
    await sendTransactionalEmail({
      to: [{ email: params.email, name: params.prenom }],
      templateId: id,
      sender: {
        name: "DIMEXOI",
        email: process.env.BREVO_SENDER_EMAIL || "laurence.payet@dimexoi.fr",
      },
      params: {
        prenom: params.prenom,
        guide_url: GUIDE_PDF_URL,
        piece: params.piece || "",
        showroom: params.showroom || "",
      },
      tags: ["GUIDE_SDB"],
    });

    console.log(`[guide-brevo] Email guide envoyé à ${params.email}`);
    return true;
  } catch (error) {
    console.error("[guide-brevo] Erreur envoi email:", error);
    return false;
  }
}
