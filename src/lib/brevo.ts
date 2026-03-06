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
