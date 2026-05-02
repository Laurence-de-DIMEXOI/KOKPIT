/**
 * sendEmail — wrapper Brevo (anciennement Resend, migré le 2 mai 2026).
 *
 * Le module garde le nom de fichier `resend.ts` et la signature publique
 * inchangée pour ne pas toucher tous les call-sites. En interne, on appelle
 * directement l'API Brevo (déjà configurée via BREVO_API_KEY).
 *
 * Expéditeur configurable via :
 *   - options.from (prioritaire)
 *   - BREVO_SENDER_EMAIL (env)
 *   - "laurence.payet@dimexoi.fr" (fallback)
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkEmailOptions {
  recipients: Array<{ email: string; name?: string }>;
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
}

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

function parseFrom(value: string | undefined): { email: string; name?: string } {
  if (!value) return { email: "" };
  const m = value.match(/^\s*(.*?)\s*<(.+?)>\s*$/);
  if (m) return { name: m[1] || undefined, email: m[2] };
  return { email: value };
}

function getDefaultSender(): { email: string; name: string } {
  const envSender = process.env.BREVO_SENDER_EMAIL;
  if (envSender) {
    const p = parseFrom(envSender);
    return { email: p.email, name: p.name || "KÒKPIT" };
  }
  return { email: "laurence.payet@dimexoi.fr", name: "KÒKPIT" };
}

function toRecipients(to: string | string[]): Array<{ email: string }> {
  return (Array.isArray(to) ? to : [to])
    .map((e) => e.trim())
    .filter(Boolean)
    .map((email) => ({ email }));
}

/**
 * Send a single email via Brevo SMTP API.
 */
export async function sendEmail(options: EmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { success: false, error: "BREVO_API_KEY manquante" };
  }

  const fromOpt = options.from ? parseFrom(options.from) : null;
  const defaultSender = getDefaultSender();
  const sender = {
    email: fromOpt?.email || defaultSender.email,
    name: options.fromName || fromOpt?.name || defaultSender.name,
  };

  const payload = {
    sender,
    to: toRecipients(options.to),
    subject: options.subject,
    htmlContent: options.html,
  };

  try {
    const response = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return { success: false, error: `Brevo ${response.status}: ${errBody}` };
    }

    const data = (await response.json().catch(() => ({}))) as { messageId?: string };
    return { success: true, messageId: data.messageId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Send the same email to multiple recipients (envoi individuel pour personnalisation).
 */
export async function sendBulkEmail(options: BulkEmailOptions): Promise<SendEmailResult> {
  const results = await Promise.allSettled(
    options.recipients.map((r) =>
      sendEmail({
        to: r.email,
        subject: options.subject,
        html: options.html,
        from: options.from,
        fromName: options.fromName,
      })
    )
  );

  const failures = results.filter(
    (res) => res.status === "rejected" || (res.status === "fulfilled" && !res.value.success)
  );

  if (failures.length > 0) {
    return {
      success: false,
      error: `${failures.length}/${options.recipients.length} envois échoués`,
    };
  }
  return { success: true, messageId: `bulk_${Date.now()}` };
}
