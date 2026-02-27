import { Queue, Worker } from 'bullmq';
import { Resend } from 'resend';

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

const resend = new Resend(process.env.RESEND_API_KEY);

interface NurturingJob {
  lead_id: string;
  contact_id: string;
  contact_email: string;
  contact_name: string;
  source: string;
}

export const nurturingQueue = new Queue<NurturingJob>('nurturing', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const nurturingWorker = new Worker<NurturingJob>(
  'nurturing',
  async (job) => {
    try {
      const { lead_id, contact_email, contact_name, source } = job.data;

      // Step 1: Send welcome email
      await resend.emails.send({
        from: 'noreply@kokpit.com',
        to: contact_email,
        subject: `Bienvenue ${contact_name}!`,
        html: `
          <h1>Bienvenue chez KÒKPIT!</h1>
          <p>Merci pour votre demande. Nous avons bien reçu votre demande via ${source}.</p>
          <p>Un commercial spécialisé va vous recontacter sous peu avec une offre personnalisée.</p>
          <p>Cordialement,<br/>L'équipe KÒKPIT</p>
        `,
      });

      // Log event
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id,
          type: 'EMAIL_SENT',
          description: 'Email de bienvenue envoyé',
          data: { email: contact_email },
        }),
      });

      // Schedule follow-up at J+2
      await nurturingQueue.add(
        `nurturing-followup-j2-${lead_id}`,
        job.data,
        {
          delay: 2 * 24 * 60 * 60 * 1000, // 2 days
          jobId: `nurturing-followup-j2-${lead_id}`,
        }
      );

      // Schedule follow-up at J+5
      await nurturingQueue.add(
        `nurturing-followup-j5-${lead_id}`,
        job.data,
        {
          delay: 5 * 24 * 60 * 60 * 1000, // 5 days
          jobId: `nurturing-followup-j5-${lead_id}`,
        }
      );

      console.log(`Nurturing started for lead ${lead_id}`);
      return { success: true, lead_id };
    } catch (error) {
      console.error('Nurturing job failed:', error);
      throw error;
    }
  },
  { connection: redisConnection }
);

nurturingWorker.on('failed', async (job, err) => {
  console.error(`Nurturing job ${job?.id} failed:`, err);

  if (job?.data) {
    // Log failure
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: job.data.lead_id,
        type: 'EMAIL_FAILED',
        description: 'Erreur lors de l\'envoi de l\'email de bienvenue',
        data: { error: err.message },
      }),
    });
  }
});

nurturingWorker.on('completed', (job) => {
  console.log(`Nurturing job ${job.id} completed successfully`);
});

export async function scheduleNurturing(leadData: NurturingJob) {
  await nurturingQueue.add(`nurturing-${leadData.lead_id}`, leadData, {
    jobId: `nurturing-${leadData.lead_id}`,
  });
}
