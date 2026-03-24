import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/marketing/brevo/webhook — Receives Brevo webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Brevo sends individual events or batches
    const events = Array.isArray(body) ? body : [body];

    const records = events.map((evt: any) => ({
      event: evt.event || "unknown",
      email: evt.email || "",
      messageId: evt["message-id"] || evt.messageId || null,
      subject: evt.subject || null,
      tag: evt.tag || null,
      payload: evt,
    }));

    if (records.length > 0) {
      await prisma.brevoWebhookEvent.createMany({ data: records });
    }

    // Auto-log événements sur les contacts KOKPIT
    for (const evt of events) {
      const email = evt.email;
      if (!email) continue;

      const contact = await prisma.contact.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true },
      });
      if (!contact) continue;

      const eventName = evt.event;
      if (eventName === "click") {
        await prisma.evenement.create({
          data: {
            contactId: contact.id,
            type: "VISITE_WEB",
            description: `Clic email : ${evt.subject || "campagne"}${evt.link ? ` → ${evt.link}` : ""}`,
            metadata: { brevoEvent: eventName, link: evt.link, tag: evt.tag },
          },
        });
      } else if (eventName === "delivered") {
        await prisma.evenement.create({
          data: {
            contactId: contact.id,
            type: "EMAIL_ENVOYE",
            description: `Email délivré : ${evt.subject || "campagne Brevo"}`,
            metadata: { brevoEvent: eventName, messageId: evt["message-id"], tag: evt.tag },
          },
        });
      }
    }

    return NextResponse.json({ received: records.length });
  } catch (error: any) {
    console.error("POST /api/marketing/brevo/webhook error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
