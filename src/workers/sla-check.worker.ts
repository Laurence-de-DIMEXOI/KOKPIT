import { Queue, Worker } from 'bullmq';
import { Resend } from 'resend';

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

const resend = new Resend(process.env.RESEND_API_KEY);

interface SLACheckJob {
  check_time?: string;
}

export const slaCheckQueue = new Queue<SLACheckJob>('sla-check', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const slaCheckWorker = new Worker<SLACheckJob>(
  'sla-check',
  async (job) => {
    try {
      // Fetch leads approaching or past SLA deadline
      const response = await fetch('/api/leads/sla-alerts');
      if (!response.ok) throw new Error('Failed to fetch SLA alerts');

      const alerts = await response.json();
      const now = new Date();

      for (const alert of alerts) {
        const deadline = new Date(alert.sla_deadline);
        const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Alert statuses
        let status = 'ATTENTION';
        let subject = `Alerte SLA : ${alert.contact_name}`;
        let isUrgent = false;

        if (hoursRemaining < 0) {
          status = 'URGENT';
          subject = `🚨 URGENT SLA DÉPASSÉ : ${alert.contact_name}`;
          isUrgent = true;
        } else if (hoursRemaining < 24) {
          status = 'URGENT';
          subject = `🚨 URGENT SLA < 24h : ${alert.contact_name}`;
          isUrgent = true;
        }

        // Send alert to commercial
        if (alert.commercial_email) {
          await resend.emails.send({
            from: 'noreply@kokpit.com',
            to: alert.commercial_email,
            subject,
            html: `
              <h1>${isUrgent ? '🚨 Alerte SLA Urgente' : '⚠️ Alerte SLA'}</h1>
              <p>Bonjour ${alert.commercial_name},</p>
              <p>La demande de <strong>${alert.contact_name}</strong> approche ou a dépassé son SLA.</p>
              <ul>
                <li><strong>Contact :</strong> ${alert.contact_name}</li>
                <li><strong>Deadline :</strong> ${deadline.toLocaleString('fr-FR')}</li>
                <li><strong>Statut :</strong> ${status}</li>
              </ul>
              <p>Veuillez prendre les actions nécessaires dans les meilleurs délais.</p>
              <p><a href="${process.env.APP_URL}/leads/${alert.lead_id}">Voir la demande</a></p>
            `,
          });
        }

        // Send alert to manager
        if (alert.manager_email) {
          await resend.emails.send({
            from: 'noreply@kokpit.com',
            to: alert.manager_email,
            subject: `[Manager] ${subject}`,
            html: `
              <h1>Rapport d'alerte SLA</h1>
              <p>Demande : <strong>${alert.contact_name}</strong></p>
              <p>Commercial : <strong>${alert.commercial_name}</strong></p>
              <p>Deadline : ${deadline.toLocaleString('fr-FR')}</p>
              <p>Statut : <strong>${status}</strong></p>
            `,
          });
        }

        // Log alert
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead_id: alert.lead_id,
            type: 'SLA_ALERT',
            description: `Alerte SLA: ${status}`,
            data: {
              status,
              hours_remaining: hoursRemaining,
              contact_name: alert.contact_name,
            },
          }),
        });
      }

      console.log(`SLA check completed. ${alerts.length} alert(s) sent.`);
      return { success: true, alerts_count: alerts.length };
    } catch (error) {
      console.error('SLA check job failed:', error);
      throw error;
    }
  },
  { connection: redisConnection }
);

slaCheckWorker.on('failed', async (job, err) => {
  console.error(`SLA check job ${job?.id} failed:`, err);
});

slaCheckWorker.on('completed', (job) => {
  console.log(`SLA check job ${job.id} completed successfully`);
});

// Schedule SLA check every 2 hours
export async function scheduleSLACheck() {
  await slaCheckQueue.add('sla-check', {}, {
    repeat: {
      every: 2 * 60 * 60 * 1000, // Every 2 hours
    },
    jobId: 'sla-check-recurring',
  });
}
