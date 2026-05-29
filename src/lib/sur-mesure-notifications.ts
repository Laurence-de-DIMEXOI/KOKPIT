import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";

/**
 * Notifications mail du module Sur-Mesure.
 *
 * Destinataires (validé Laurence, mai 2026) :
 *   - Michelle (Direction)
 *   - Laurent (dessinateur)
 *   - le propriétaire du projet (commercial créateur)
 * Pas de filtrage de l'auteur : tout le monde de cette liste reçoit.
 *
 * Chaque envoi est aussi loggé en Evenement sur le contact du projet (si présent).
 */

// Emails fixes de l'équipe sur-mesure (hors propriétaire dynamique)
const EQUIPE_FIXE = [
  "michelle.perrot@dimexoi.fr", // Michelle (Direction)
  "laurent@dimexoi.fr", // Laurent (dessinateur)
];

export type TransitionProjet =
  | "DESSIN_DEMANDE"
  | "PLANS_AJOUTES"
  | "NEED_PRICE_ENVOYE"
  | "PRIX_RECU"
  | "VENTE_CONCLUE";

const SUJETS: Record<TransitionProjet, (titre: string) => string> = {
  DESSIN_DEMANDE: (t) => `🎨 Nouvelle demande de dessin : ${t}`,
  PLANS_AJOUTES: (t) => `📐 Les plans de ${t} ont été ajoutés`,
  NEED_PRICE_ENVOYE: (t) => `💰 Un Need Price a été envoyé : ${t}`,
  PRIX_RECU: (t) => `✅ Le prix de ${t} est disponible, devis à finaliser`,
  VENTE_CONCLUE: (t) => `🎉 Le dessin de ${t} a abouti à une vente`,
};

const MESSAGES: Record<TransitionProjet, string> = {
  DESSIN_DEMANDE: "Une nouvelle demande de dessin sur-mesure a été créée.",
  PLANS_AJOUTES: "Les plans 3D du projet ont été ajoutés.",
  NEED_PRICE_ENVOYE: "Un Need Price a été envoyé à l'équipe achat.",
  PRIX_RECU: "Le prix est revenu. Le devis peut être finalisé.",
  VENTE_CONCLUE: "Bravo, le projet sur-mesure a abouti à une vente.",
};

interface NotifyParams {
  projetId: string;
  numero: string;
  titre: string;
  transition: TransitionProjet;
  proprietaireEmail?: string | null;
  lien?: string;
}

function buildHtml(numero: string, titre: string, transition: TransitionProjet, lien: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#0E6973;margin:0 0 12px">${SUJETS[transition](titre).replace(/^.. /, "")}</h2>
      <p style="margin:0 0 8px"><strong>Projet :</strong> ${numero} — ${titre}</p>
      <p style="margin:0 0 16px;color:#475569">${MESSAGES[transition]}</p>
      <p style="margin-top:20px">
        <a href="${lien}" style="background:linear-gradient(135deg,#0E6973,#FEEB9C);color:#0E6973;padding:10px 18px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;">Ouvrir le projet dans KOKPIT</a>
      </p>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px">Module Sur-Mesure KOKPIT — notification automatique.</p>
    </div>`;
}

/**
 * Envoie la notification de transition à l'équipe sur-mesure.
 * Garde-fou quota : si BREVO_API_KEY absente, on skip silencieusement (log only).
 */
export async function notifierTransitionProjet(params: NotifyParams): Promise<void> {
  const { projetId, numero, titre, transition, proprietaireEmail } = params;

  // Liste destinataires dédupliquée
  const destinataires = Array.from(
    new Set(
      [...EQUIPE_FIXE, proprietaireEmail]
        .filter(Boolean)
        .map((e) => (e as string).toLowerCase().trim())
    )
  );
  if (destinataires.length === 0) return;

  const baseUrl = process.env.NEXTAUTH_URL || "https://kokpit-kappa.vercel.app";
  const lien = params.lien || `${baseUrl}/commercial/sur-mesure?projet=${projetId}`;

  if (!process.env.BREVO_API_KEY) {
    console.warn(`[sur-mesure notif] BREVO_API_KEY absente — notif ${transition} non envoyée (${numero})`);
    return;
  }

  try {
    await sendEmail({
      to: destinataires,
      subject: SUJETS[transition](titre),
      html: buildHtml(numero, titre, transition, lien),
    });
  } catch (e) {
    console.warn(`[sur-mesure notif] échec envoi ${transition} (${numero}):`, (e as Error).message);
  }
}
