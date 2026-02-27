import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export interface SendSmsResult {
  success: boolean;
  sid?: string;
  error?: string;
}

/**
 * Send a single SMS
 */
export async function sendSms(
  to: string,
  message: string
): Promise<SendSmsResult> {
  try {
    if (!process.env.TWILIO_PHONE_NUMBER) {
      return {
        success: false,
        error: "TWILIO_PHONE_NUMBER not configured",
      };
    }

    const result = await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
      body: message,
    });

    return {
      success: true,
      sid: result.sid,
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
 * Send SMS to multiple recipients
 */
export async function sendSmsBulk(
  recipients: string[],
  message: string
): Promise<SendSmsResult> {
  try {
    const results = await Promise.allSettled(
      recipients.map((to) => sendSms(to, message))
    );

    const failures = results.filter(
      (result) => result.status === "rejected" || !result.value?.success
    );

    if (failures.length > 0) {
      return {
        success: false,
        error: `Failed to send ${failures.length} out of ${recipients.length} SMS`,
      };
    }

    return {
      success: true,
      sid: `bulk_${Date.now()}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
