import { Queue, Worker } from 'bullmq';
import { Resend } from 'resend';

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

const resend = new Resend(process.env.RESEND_API_KEY);

interface RelanceJob {
  lead_id: string;
  contact_id: string;
  contact_email: string;
  contact_name: string;
  commercial_name: string;
  type: 'LEAD' | 'DEVIS';
}

export const relanceQueue = new Queue<RelanceJob>('relance', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const relanceWorker = new Worker<RelanceJob>(
  'relance',
  async (job) => {
    try {
      const { lead_id, contact_email, contact_name, commercial_name, type } = job.data;

      const subject =
        type === 'DEVIS'
          ? `Relance : Votre devis ${contact_name}`
          : `Relance : Nous aimerions vous aider`;

      const html =
        type === 'DEVIS'
          ? `
          <h1>Relance de votre devis</h1>
          <p>Bonjour ${contact_name},</p>
          <p>Nous avons envoyé un devis il y a quelques jours et aimerions connaître votre retour.</p>
          <p>Avez-vous des questions ? ${commercial_name} reste à votre disposition.</p>
          <p>Cordialement,<br/>L'équipe KÒKPIT</p>
        `
          : `
          <h1>Relance suite à votre demande</h1>
          <p>Bonjour ${contact_name},</p>
          <p>Nous avons bien reçu votre demande et souhaitons vous proposer une solution adaptée.</p>
          <p>${commercial_name} vous contactera prochainement pour en discuter.</p>
          <p>Cordialement,<br/>L'équipe KÒKPIT</p>
        `;

      // Send relance email
      await resend.emails.send({
        from: 'noreply@kokpit.com',
        to: contact_email,
        subject,
        html,
      });

      // Log event
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id,
          type: 'RELANCE_EMAIL_SENT',
          description: `Email de relance ${type === 'DEVIS' ? 'devis' : 'demande'} envoyé`,
          data: { email: contact_email, relance_type: type },
        }),
      });

      console.log(`Relance ${type} sent for lead ${lead_id}`);
      return { success: true, lead_id, type };
    } catch (error) {
      console.error('Relance job failed:', error);
      throw error;
    }
  },
  { connection: redisConnection }
);

relanceWorker.on('failed', async (job, err) => {
  console.error(`Relance job ${job?.id} failed:`, err);

  if (job?.data) {
    // Log failure
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: job.data.lead_id,
        type: 'RELANCE_EMAIL_FAILED',
        description: 'Erreur lors de l\'envoi de l\'email de relance',
        data: { error: err.message },
      }),
    });
  }
});

relanceWorker.on('completed', (job) => {
  console.log(`Relance job ${job.id} completed successfully`);
});

export async function scheduleRelance(relanceData: RelanceJob, delayMs: number = 0) {
  const jobId = `relance-${relanceData.lead_id}-${Date.now()}`;
  await relanceQueue.add(jobId, relanceData, {
    delay: delayMs,
    jobId,
  });
}
