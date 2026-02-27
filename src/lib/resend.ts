import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkEmailOptions {
  recipients: Array<{
    email: string;
    name?: string;
  }>;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send a single email
 */
export async function sendEmail(
  options: EmailOptions
): Promise<SendEmailResult> {
  try {
    const response = await resend.emails.send({
      from: options.from || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (response.error) {
      return {
        success: false,
        error: response.error.message,
      };
    }

    return {
      success: true,
      messageId: response.data?.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send bulk emails to multiple recipients
 */
export async function sendBulkEmail(
  options: BulkEmailOptions
): Promise<SendEmailResult> {
  try {
    // Resend doesn't have a native bulk send, so we send individual emails
    const results = await Promise.allSettled(
      options.recipients.map((recipient) =>
        sendEmail({
          to: recipient.email,
          subject: options.subject,
          html: options.html,
          from: options.from,
        })
      )
    );

    const failures = results.filter(
      (result) => result.status === "rejected" || !result.value?.success
    );

    if (failures.length > 0) {
      return {
        success: false,
        error: `Failed to send ${failures.length} out of ${options.recipients.length} emails`,
      };
    }

    return {
      success: true,
      messageId: `bulk_${Date.now()}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
