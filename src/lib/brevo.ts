/**
 * Brevo (ex-Sendinblue) API client
 * Docs: https://developers.brevo.com/reference
 */

const BREVO_API_URL = "https://api.brevo.com/v3";

function getHeaders() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY manquante");
  return {
    "api-key": apiKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

// ============================================================================
// TEMPLATES
// ============================================================================

export interface BrevoTemplate {
  id: number;
  name: string;
  subject: string;
  htmlContent: string;
  isActive: boolean;
  createdAt: string;
  modifiedAt: string;
}

/** Lister les templates transactionnels */
export async function listTemplates(): Promise<BrevoTemplate[]> {
  const res = await fetch(`${BREVO_API_URL}/smtp/templates?templateStatus=true&limit=50&offset=0&sort=desc`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo listTemplates: ${res.status} ${err}`);
  }
  const data = await res.json();
  return data.templates || [];
}

/** Récupérer un template par ID */
export async function getTemplate(templateId: number): Promise<BrevoTemplate> {
  const res = await fetch(`${BREVO_API_URL}/smtp/templates/${templateId}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo getTemplate: ${res.status} ${err}`);
  }
  return res.json();
}

/** Créer un template transactionnel sur Brevo */
export async function createTemplate(params: {
  name: string;
  subject: string;
  htmlContent: string;
  sender?: { name: string; email: string };
}): Promise<{ id: number }> {
  const res = await fetch(`${BREVO_API_URL}/smtp/templates`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      templateName: params.name,
      subject: params.subject,
      htmlContent: params.htmlContent,
      sender: params.sender || { name: "Dimexoi", email: "noreply@dimexoi.re" },
      isActive: true,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo createTemplate: ${res.status} ${err}`);
  }
  return res.json();
}

/** Mettre à jour un template existant sur Brevo */
export async function updateTemplate(
  templateId: number,
  params: {
    name?: string;
    subject?: string;
    htmlContent?: string;
  }
): Promise<void> {
  const body: any = {};
  if (params.name) body.templateName = params.name;
  if (params.subject) body.subject = params.subject;
  if (params.htmlContent) body.htmlContent = params.htmlContent;

  const res = await fetch(`${BREVO_API_URL}/smtp/templates/${templateId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo updateTemplate: ${res.status} ${err}`);
  }
}

// ============================================================================
// ENVOI TRANSACTIONNEL
// ============================================================================

export interface SendEmailParams {
  to: { email: string; name?: string }[];
  templateId?: number;
  subject?: string;
  htmlContent?: string;
  params?: Record<string, string>;
  sender?: { name: string; email: string };
  replyTo?: { email: string; name?: string };
  tags?: string[];
}

/** Envoyer un email transactionnel via Brevo */
export async function sendTransactionalEmail(params: SendEmailParams): Promise<{ messageId: string }> {
  const body: any = {
    to: params.to,
    sender: params.sender || { name: "Dimexoi", email: "noreply@dimexoi.re" },
  };

  if (params.templateId) {
    body.templateId = params.templateId;
  } else {
    body.subject = params.subject;
    body.htmlContent = params.htmlContent;
  }

  if (params.params) body.params = params.params;
  if (params.replyTo) body.replyTo = params.replyTo;
  if (params.tags) body.tags = params.tags;

  const res = await fetch(`${BREVO_API_URL}/smtp/email`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo sendEmail: ${res.status} ${err}`);
  }
  return res.json();
}

// ============================================================================
// ACCOUNT INFO (pour vérifier la connexion)
// ============================================================================

export async function getAccount(): Promise<{
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  plan: { type: string; credits: number };
}> {
  const res = await fetch(`${BREVO_API_URL}/account`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo getAccount: ${res.status} ${err}`);
  }
  return res.json();
}

/** Construire l'URL de l'éditeur Brevo pour un template */
export function getBrevoEditorUrl(templateId: number): string {
  return `https://app.brevo.com/camp/template/${templateId}/design`;
}

// ============================================================================
// CONTACTS & LISTES (Club Grandis)
// ============================================================================

/**
 * Crée ou met à jour un contact Brevo.
 * Si le contact existe (par email), il est mis à jour.
 * Gère les attributions/retraits de listes.
 */
export async function upsertBrevoContact(params: {
  email: string;
  attributes?: Record<string, string | number>;
  listIds?: number[];
  unlinkListIds?: number[];
}): Promise<void> {
  const body: Record<string, unknown> = {
    email: params.email,
    updateEnabled: true,
  };
  if (params.attributes) body.attributes = params.attributes;
  if (params.listIds?.length) body.listIds = params.listIds;
  if (params.unlinkListIds?.length) body.unlinkListIds = params.unlinkListIds;

  const res = await fetch(`${BREVO_API_URL}/contacts`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  // 201 = créé, 204 = mis à jour — les deux sont OK
  if (!res.ok && res.status !== 204) {
    const err = await res.text();
    throw new Error(`Brevo upsertContact: ${res.status} ${err}`);
  }
}

/**
 * Ajoute des contacts à une liste Brevo par emails.
 * Max 150 emails par appel.
 */
export async function addContactsToList(listId: number, emails: string[]): Promise<void> {
  if (!emails.length) return;

  // Brevo limite à 150 emails par appel
  const batchSize = 150;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const res = await fetch(`${BREVO_API_URL}/contacts/lists/${listId}/contacts/add`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ emails: batch }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Brevo addContactsToList(${listId}): ${res.status} ${err}`);
    }
  }
}

/**
 * Retire des contacts d'une liste Brevo par emails.
 * Max 150 emails par appel.
 */
export async function removeContactsFromList(listId: number, emails: string[]): Promise<void> {
  if (!emails.length) return;

  const batchSize = 150;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const res = await fetch(`${BREVO_API_URL}/contacts/lists/${listId}/contacts/remove`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ emails: batch }),
    });
    if (!res.ok) {
      const err = await res.text();
      // Ignorer 404 (contact pas dans la liste)
      if (res.status !== 404) {
        throw new Error(`Brevo removeContactsFromList(${listId}): ${res.status} ${err}`);
      }
    }
  }
}

/**
 * Récupère les contacts d'une liste Brevo.
 */
export async function getListContacts(listId: number): Promise<{ email: string }[]> {
  const contacts: { email: string }[] = [];
  let offset = 0;
  const limit = 500;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(
      `${BREVO_API_URL}/contacts/lists/${listId}/contacts?limit=${limit}&offset=${offset}`,
      { headers: getHeaders() }
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Brevo getListContacts(${listId}): ${res.status} ${err}`);
    }
    const data = await res.json();
    const batch = data.contacts || [];
    contacts.push(...batch.map((c: any) => ({ email: c.email })));
    hasMore = batch.length === limit;
    offset += limit;
  }

  return contacts;
}

/**
 * Liste toutes les listes/dossiers Brevo.
 */
export async function getLists(): Promise<{ id: number; name: string; totalSubscribers: number }[]> {
  const res = await fetch(`${BREVO_API_URL}/contacts/lists?limit=50&offset=0`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo getLists: ${res.status} ${err}`);
  }
  const data = await res.json();
  return (data.lists || []).map((l: any) => ({
    id: l.id,
    name: l.name,
    totalSubscribers: l.totalSubscribers || 0,
  }));
}

/**
 * Crée une liste Brevo. Retourne l'ID de la liste créée.
 */
export async function createList(name: string, folderId: number): Promise<number> {
  const res = await fetch(`${BREVO_API_URL}/contacts/lists`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ name, folderId }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo createList: ${res.status} ${err}`);
  }
  const data = await res.json();
  return data.id;
}

/**
 * Liste les dossiers Brevo.
 */
export async function getFolders(): Promise<{ id: number; name: string }[]> {
  const res = await fetch(`${BREVO_API_URL}/contacts/folders?limit=50&offset=0`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo getFolders: ${res.status} ${err}`);
  }
  const data = await res.json();
  return (data.folders || []).map((f: any) => ({ id: f.id, name: f.name }));
}
