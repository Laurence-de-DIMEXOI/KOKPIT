import { Queue, Worker } from 'bullmq';
import { Resend } from 'resend';

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

const resend = new Resend(process.env.RESEND_API_KEY);

// Mapping produits → cross-sell
const CROSS_SELL_MAP: Record<string, { produits: string[]; delaiJours: number }> = {
  'meuble-salle-de-bain': {
    produits: ['miroir-teck', 'colonne-salle-de-bain', 'accessoires-salle-de-bain'],
    delaiJours: 2,
  },
  'meuble-cuisine': {
    produits: ['plan-de-travail-teck', 'etageres-cuisine', 'ilot-central'],
    delaiJours: 3,
  },
  'meuble-sejour': {
    produits: ['table-basse-teck', 'meuble-tv', 'bibliotheque-teck'],
    delaiJours: 2,
  },
  'meuble-chambre': {
    produits: ['table-de-chevet', 'commode-teck', 'miroir-chambre'],
    delaiJours: 2,
  },
};

export const crossSellQueue = new Queue('cross-sell', { connection: redisConnection });

export const crossSellWorker = new Worker(
  'cross-sell',
  async (job) => {
    const { contactId, contactEmail, contactPrenom, produitsAchetes, venteId } = job.data;

    console.log(`[CrossSell] Traitement pour contact ${contactId}, vente ${venteId}`);

    // Déterminer les produits à suggérer
    const suggestions: string[] = [];

    if (Array.isArray(produitsAchetes)) {
      for (const produit of produitsAchetes) {
        const normalised = String(produit).toLowerCase().replace(/\s+/g, '-');
        for (const [key, mapping] of Object.entries(CROSS_SELL_MAP)) {
          if (normalised.includes(key)) {
            suggestions.push(...mapping.produits);
          }
        }
      }
    }

    // Dédupliquer
    const uniqueSuggestions = [...new Set(suggestions)];

    if (uniqueSuggestions.length === 0) {
      console.log(`[CrossSell] Aucune suggestion pour les produits: ${produitsAchetes}`);
      return { status: 'no_suggestions', contactId };
    }

    // Formater les noms de produits pour l'email
    const produitsFormates = uniqueSuggestions
      .map((p) => p.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
      .join(', ');

    // Envoyer l'email de cross-sell
    try {
      const { data, error } = await resend.emails.send({
        from: 'KÒKPIT <noreply@dimexoi.re>',
        to: [contactEmail],
        subject: `${contactPrenom}, complétez votre espace avec nos suggestions`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #121212; padding: 24px; text-align: center;">
              <h1 style="color: #F4B400; margin: 0;">KÒKPIT</h1>
              <p style="color: #ccc; margin: 4px 0 0;">Dimexoi - Meubles en Teck</p>
            </div>
            <div style="padding: 32px 24px; background: #ffffff;">
              <h2 style="color: #121212;">Bonjour ${contactPrenom},</h2>
              <p style="color: #333; line-height: 1.6;">
                Merci pour votre récent achat ! Pour compléter votre aménagement,
                nous avons sélectionné des pièces qui s'accorderaient parfaitement :
              </p>
              <div style="background: #F5F5F5; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #F4B400;">
                <p style="margin: 0; color: #121212; font-weight: bold;">
                  Nos suggestions pour vous :
                </p>
                <p style="margin: 8px 0 0; color: #555;">
                  ${produitsFormates}
                </p>
              </div>
              <p style="color: #333; line-height: 1.6;">
                Contactez votre showroom ou répondez à cet email pour plus d'informations.
              </p>
              <a href="https://dimexoi.re"
                 style="display: inline-block; padding: 12px 24px; background: #F4B400; color: #121212; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px;">
                Découvrir nos collections
              </a>
            </div>
            <div style="background: #F5F5F5; padding: 16px 24px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Vous recevez cet email suite à votre achat chez Dimexoi.<br/>
                <a href="#" style="color: #999;">Se désinscrire</a>
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error(`[CrossSell] Erreur Resend:`, error);
        return { status: 'error', error: error.message, contactId };
      }

      console.log(`[CrossSell] Email envoyé à ${contactEmail}, id: ${data?.id}`);
      return {
        status: 'sent',
        contactId,
        resendId: data?.id,
        suggestions: uniqueSuggestions,
      };
    } catch (err) {
      console.error(`[CrossSell] Erreur envoi:`, err);
      throw err;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

crossSellWorker.on('completed', (job) => {
  console.log(`[CrossSell] Job ${job.id} terminé:`, job.returnvalue);
});

crossSellWorker.on('failed', (job, err) => {
  console.error(`[CrossSell] Job ${job?.id} échoué:`, err.message);
});
