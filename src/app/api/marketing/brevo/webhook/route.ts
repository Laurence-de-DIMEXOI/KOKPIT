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

    return NextResponse.json({ received: records.length });
  } catch (error: any) {
    console.error("POST /api/marketing/brevo/webhook error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
