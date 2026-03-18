/**
 * Club Grandis — Envoi d'emails de bienvenue par niveau
 *
 * Utilise l'API Brevo transactionnelle pour envoyer un email
 * quand un membre monte de niveau. Anti-doublon via niveauEmailEnvoye.
 *
 * Templates créés via scripts/seed-brevo-club-templates.ts
 * et activés manuellement par Laurence dans Brevo.
 */

const BREVO_API_URL = "https://api.brevo.com/v3";

const TEMPLATE_IDS: Record<number, number | undefined> = {
  1: process.env.BREVO_CLUB_TEMPLATE_ID_1 ? parseInt(process.env.BREVO_CLUB_TEMPLATE_ID_1) : undefined,
  2: process.env.BREVO_CLUB_TEMPLATE_ID_2 ? parseInt(process.env.BREVO_CLUB_TEMPLATE_ID_2) : undefined,
  3: process.env.BREVO_CLUB_TEMPLATE_ID_3 ? parseInt(process.env.BREVO_CLUB_TEMPLATE_ID_3) : undefined,
  4: process.env.BREVO_CLUB_TEMPLATE_ID_4 ? parseInt(process.env.BREVO_CLUB_TEMPLATE_ID_4) : undefined,
  5: process.env.BREVO_CLUB_TEMPLATE_ID_5 ? parseInt(process.env.BREVO_CLUB_TEMPLATE_ID_5) : undefined,
};

const NOM_NIVEAUX: Record<number, string> = {
  1: "L'Écorce",
  2: "L'Aubier",
  3: "Le Cœur",
  4: "Le Grain",
  5: "Le Tectona",
};

const REMISES: Record<number, string> = {
  1: "5 %",
  2: "10 %",
  3: "15 %",
  4: "20 %",
  5: "25 % à vie",
};

const PROCHAINE_ETAPE: Record<number, string> = {
  1: "Atteignez 2 000 € de cumul pour rejoindre le cercle II - L'Aubier",
  2: "Atteignez 5 000 € de cumul pour rejoindre le cercle III - Le Cœur",
  3: "Atteignez 10 000 € de cumul pour rejoindre le cercle IV - Le Grain",
  4: "À partir de 20 000 € de cumul, vous atteindrez le cercle V - Le Tectona",
  5: "",
};

/**
 * Envoie l'email de bienvenue pour un niveau donné via Brevo transactionnel.
 *
 * @returns true si l'email a été envoyé, false sinon
 */
export async function envoyerEmailNiveau(
  email: string,
  prenom: string,
  niveau: number
): Promise<boolean> {
  const templateId = TEMPLATE_IDS[niveau];
  if (!templateId) {
    console.warn(`[Club Email] Template ID non configuré pour niveau ${niveau}`);
    return false;
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("[Club Email] BREVO_API_KEY manquante");
    return false;
  }

  // DRY_RUN en dev : log mais n'envoie pas
  if (process.env.DRY_RUN === "true" || process.env.NODE_ENV === "development") {
    console.log(`[Club Email] DRY_RUN — email niveau ${niveau} pour ${email} (template ${templateId})`);
    return true;
  }

  try {
    const res = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        templateId,
        to: [{ email, name: prenom || email }],
        params: {
          prenom: prenom || "Cher client",
          niveau,
          nomNiveau: NOM_NIVEAUX[niveau],
          remise: REMISES[niveau],
          prochaineEtape: PROCHAINE_ETAPE[niveau],
        },
      }),
    });

    if (res.ok) {
      console.log(`[Club Email] Email niveau ${niveau} envoyé à ${email}`);
      return true;
    } else {
      const err = await res.text();
      console.error(`[Club Email] Erreur envoi niveau ${niveau} à ${email}: ${res.status} ${err}`);
      return false;
    }
  } catch (err) {
    console.error(`[Club Email] Erreur réseau pour ${email}:`, err);
    return false;
  }
}
