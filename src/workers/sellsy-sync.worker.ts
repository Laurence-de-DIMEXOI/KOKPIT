import { Queue, Worker } from 'bullmq';

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

const SELLSY_API_URL = 'https://api.sellsy.com/v2';

interface SellsySyncJob {
  action: 'SYNC_CONTACTS' | 'SYNC_DEVIS' | 'SYNC_VENTES' | 'FULL_SYNC';
  contact_id?: string;
  devis_id?: string;
  vente_id?: string;
}

export const sellsySyncQueue = new Queue<SellsySyncJob>('sellsy-sync', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const sellsySyncWorker = new Worker<SellsySyncJob>(
  'sellsy-sync',
  async (job) => {
    try {
      const { action, contact_id, devis_id, vente_id } = job.data;
      const apiKey = process.env.SELLSY_API_KEY;
      const apiSecret = process.env.SELLSY_API_SECRET;

      if (!apiKey || !apiSecret) {
        throw new Error('Sellsy API credentials not configured');
      }

      switch (action) {
        case 'SYNC_CONTACTS': {
          if (!contact_id) throw new Error('contact_id required');

          // Fetch contact from DB
          const contactRes = await fetch(`/api/contacts/${contact_id}`);
          if (!contactRes.ok) throw new Error('Contact not found');
          const contact = await contactRes.json();

          // Push to Sellsy
          const response = await fetch(`${SELLSY_API_URL}/contacts`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firstname: contact.prenom,
              lastname: contact.nom,
              email: contact.email,
              phone: contact.telephone,
            }),
          });

          if (!response.ok) throw new Error('Failed to sync contact to Sellsy');

          const result = await response.json();

          // Update contact with Sellsy ID
          await fetch(`/api/contacts/${contact_id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sellsy_id: result.id }),
          });

          console.log(`Contact ${contact_id} synced to Sellsy`);
          break;
        }

        case 'SYNC_DEVIS': {
          if (!devis_id) throw new Error('devis_id required');

          // Fetch devis from DB
          const devisRes = await fetch(`/api/devis/${devis_id}`);
          if (!devisRes.ok) throw new Error('Devis not found');
          const devis = await devisRes.json();

          // Push to Sellsy
          const response = await fetch(`${SELLSY_API_URL}/estimates`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customerId: devis.sellsy_contact_id,
              amount: devis.montant,
              subject: devis.objet,
              items: devis.items,
            }),
          });

          if (!response.ok) throw new Error('Failed to sync devis to Sellsy');

          const result = await response.json();

          // Update devis with Sellsy ID
          await fetch(`/api/devis/${devis_id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sellsy_id: result.id }),
          });

          console.log(`Devis ${devis_id} synced to Sellsy`);
          break;
        }

        case 'SYNC_VENTES': {
          if (!vente_id) throw new Error('vente_id required');

          // Fetch vente from DB
          const venteRes = await fetch(`/api/ventes/${vente_id}`);
          if (!venteRes.ok) throw new Error('Vente not found');
          const vente = await venteRes.json();

          // Push to Sellsy as invoice
          const response = await fetch(`${SELLSY_API_URL}/invoices`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customerId: vente.sellsy_contact_id,
              amount: vente.montant,
              items: vente.items,
            }),
          });

          if (!response.ok) throw new Error('Failed to sync vente to Sellsy');

          const result = await response.json();

          // Update vente with Sellsy ID
          await fetch(`/api/ventes/${vente_id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sellsy_id: result.id }),
          });

          console.log(`Vente ${vente_id} synced to Sellsy`);
          break;
        }

        case 'FULL_SYNC': {
          // Sync all contacts, devis, and ventes
          const contactsRes = await fetch('/api/contacts?limit=1000');
          const contacts = await contactsRes.json();

          for (const contact of contacts.contacts) {
            if (!contact.sellsy_id) {
              await sellsySyncQueue.add(
                `sync-contact-${contact.id}`,
                { action: 'SYNC_CONTACTS', contact_id: contact.id },
                { jobId: `sync-contact-${contact.id}` }
              );
            }
          }

          console.log('Full Sellsy sync scheduled');
          break;
        }
      }

      return { success: true, action };
    } catch (error) {
      console.error('Sellsy sync job failed:', error);
      throw error;
    }
  },
  { connection: redisConnection }
);

sellsySyncWorker.on('failed', async (job, err) => {
  console.error(`Sellsy sync job ${job?.id} failed:`, err);

  // Log failure
  if (job?.data) {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'SELLSY_SYNC_FAILED',
        description: `Sellsy sync failed: ${job.data.action}`,
        data: { action: job.data.action, error: err.message },
      }),
    }).catch(console.error);
  }
});

sellsySyncWorker.on('completed', (job) => {
  console.log(`Sellsy sync job ${job.id} completed successfully`);
});

export async function scheduleSellsySync(syncData: SellsySyncJob) {
  const jobId = `sellsy-sync-${syncData.action}-${Date.now()}`;
  await sellsySyncQueue.add(jobId, syncData, { jobId });
}

export async function scheduleFullSellsySync() {
  await sellsySyncQueue.add('full-sync', { action: 'FULL_SYNC' }, {
    repeat: {
      every: 24 * 60 * 60 * 1000, // Daily
    },
    jobId: 'sellsy-sync-full-recurring',
  });
}
