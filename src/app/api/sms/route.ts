import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const sendSmsSchema = z.object({
  contactIds: z.array(z.string().uuid()).optional(),
  phoneNumbers: z.array(z.string()).optional(),
  message: z.string().min(1).max(1600),
});

// POST - Send SMS to contact(s)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    // Check authorization
    if (!["MARKETING", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Autorisation insuffisante" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const smsData = sendSmsSchema.parse(body);

    // Collect phone numbers to send to
    const phoneNumbers: Array<{ contactId: string; phone: string }> = [];

    if (smsData.contactIds && smsData.contactIds.length > 0) {
      // Get contacts by ID
      const contacts = await prisma.contact.findMany({
        where: {
          id: {
            in: smsData.contactIds,
          },
          telephone: {
            not: null,
          },
          rgpdSmsConsent: true,
        },
        select: {
          id: true,
          telephone: true,
        },
      });

      for (const contact of contacts) {
        if (contact.telephone) {
          phoneNumbers.push({
            contactId: contact.id,
            phone: contact.telephone,
          });
        }
      }
    } else if (smsData.phoneNumbers && smsData.phoneNumbers.length > 0) {
      // Use provided phone numbers (without contact mapping)
      for (const phone of smsData.phoneNumbers) {
        phoneNumbers.push({
          contactId: "", // Will be set to null
          phone,
        });
      }
    } else {
      return NextResponse.json(
        { error: "contactIds ou phoneNumbers requis" },
        { status: 400 }
      );
    }

    if (phoneNumbers.length === 0) {
      return NextResponse.json(
        { error: "Aucun contact avec SMS consent trouvé" },
        { status: 400 }
      );
    }

    // Check Twilio configuration
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      return NextResponse.json(
        { error: "Service SMS non configuré" },
        { status: 500 }
      );
    }

    let sentCount = 0;
    const errors: Array<{ phone: string; error: string }> = [];

    // Send SMS via Twilio
    for (const { contactId, phone } of phoneNumbers) {
      try {
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${twilioAccountSid}:${twilioAuthToken}`
              ).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              From: twilioPhoneNumber,
              To: phone,
              Body: smsData.message,
            }).toString(),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error);
        }

        const twilioData = await response.json();

        // Log SMS send
        if (contactId) {
          await prisma.smsLog.create({
            data: {
              contactId,
              message: smsData.message,
              statut: "SENT",
              twilioSid: twilioData.sid,
              sentAt: new Date(),
            },
          });

          // Create event
          await prisma.evenement.create({
            data: {
              contactId,
              type: "SMS_ENVOYE",
              description: "SMS envoyé",
              metadata: {
                phone,
                message: smsData.message,
              },
            },
          });
        }

        sentCount++;
      } catch (error) {
        console.error(`Erreur lors de l'envoi SMS à ${phone}:`, error);
        errors.push({
          phone,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    return NextResponse.json({
      message: "SMS envoyés",
      sentCount,
      totalCount: phoneNumbers.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi SMS:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
