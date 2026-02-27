import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateSlaDeadline } from "@/lib/sla";
import { parseMetaClickId } from "@/lib/utm";
import crypto from "crypto";

// Validate Meta webhook signature
function validateMetaSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac("sha1", secret)
    .update(payload)
    .digest("hex");

  return hash === signature;
}

// POST - Receive Meta Ads lead webhook
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-hub-signature") || "";

    // Validate webhook signature (if secret is configured)
    const metaWebhookSecret = process.env.META_WEBHOOK_SECRET;
    if (metaWebhookSecret && signature) {
      const isValid = validateMetaSignature(payload, signature, metaWebhookSecret);
      if (!isValid) {
        return NextResponse.json(
          { error: "Signature invalide" },
          { status: 401 }
        );
      }
    }

    const data = JSON.parse(payload);

    // Handle Meta lead webhook
    if (data.entry && Array.isArray(data.entry)) {
      for (const entry of data.entry) {
        if (entry.changes && Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            if (change.field === "leadgen_qualification" || change.field === "lead") {
              const leadData = change.value;

              // Extract lead information
              const email = leadData.email?.[0]?.value || "";
              const phone = leadData.phone_number?.[0]?.value || "";
              const firstName = leadData.first_name?.[0]?.value || "";
              const lastName = leadData.last_name?.[0]?.value || "";
              const fbClickId = leadData.click_id || "";

              if (!email || !firstName) {
                console.log("Lead incomplet reçu de Meta");
                continue;
              }

              // Find or create contact
              let contact = await prisma.contact.findUnique({
                where: { email },
              });

              if (!contact) {
                contact = await prisma.contact.create({
                  data: {
                    email,
                    nom: lastName || "N/A",
                    prenom: firstName,
                    telephone: phone || undefined,
                    sourcePremiere: "META_ADS",
                    lifecycleStage: "PROSPECT",
                  },
                });

                // Log contact creation
                await prisma.evenement.create({
                  data: {
                    contactId: contact.id,
                    type: "CREATION_LEAD",
                    description: "Contact créé via Meta Ads",
                    metadata: {
                      fbLeadId: leadData.id,
                    },
                  },
                });
              }

              // Calculate SLA deadline
              const slaDeadline = calculateSlaDeadline(new Date());

              // Auto-assign commercial if contact has a showroom
              let commercialId = null;
              if (contact.showroomId) {
                const commercials = await prisma.user.findMany({
                  where: {
                    showroomId: contact.showroomId,
                    role: "COMMERCIAL",
                    actif: true,
                  },
                  select: { id: true },
                });

                if (commercials.length > 0) {
                  // Round-robin assignment
                  const stats = await Promise.all(
                    commercials.map(async (c) => ({
                      id: c.id,
                      count: await prisma.lead.count({
                        where: { commercialId: c.id },
                      }),
                    }))
                  );

                  const assigned = stats.reduce((prev, current) =>
                    current.count < prev.count ? current : prev
                  );

                  commercialId = assigned.id;
                }
              }

              // Create lead
              const lead = await prisma.lead.create({
                data: {
                  contactId: contact.id,
                  source: "META_ADS",
                  showroomId: contact.showroomId,
                  commercialId,
                  metaClickId: fbClickId,
                  slaDeadline,
                  statut: "NOUVEAU",
                },
              });

              // Log lead creation event
              await prisma.evenement.create({
                data: {
                  leadId: lead.id,
                  contactId: contact.id,
                  type: "CREATION_LEAD",
                  description: "Lead créé via Meta Ads",
                  metadata: {
                    fbLeadId: leadData.id,
                    fbClickId,
                  },
                },
              });

              console.log(`Lead créé depuis Meta: ${email}`);
            }
          }
        }
      }
    }

    // Return success to Meta
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors du traitement du webhook Meta:", error);
    // Return 200 to acknowledge receipt even on error
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}

// GET - Webhook verification (Meta requires GET endpoint for verification)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

    if (mode === "subscribe" && token === verifyToken) {
      return NextResponse.json(challenge);
    }

    return NextResponse.json(
      { error: "Token de vérification invalide" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Erreur lors de la vérification du webhook Meta:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
