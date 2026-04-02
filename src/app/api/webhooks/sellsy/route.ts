import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndNotifyScoring } from "@/lib/scoring-alerts";
import crypto from "crypto";

// Validate Sellsy webhook signature
function validateSellsySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return hash === signature;
}

// POST - Receive Sellsy webhook
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-sellsy-signature") || "";

    // Validate webhook signature (required for Sellsy)
    const sellsyWebhookSecret = process.env.SELLSY_WEBHOOK_SECRET;
    if (!sellsyWebhookSecret) {
      console.warn("SELLSY_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Secret non configuré" },
        { status: 400 }
      );
    }

    const isValid = validateSellsySignature(payload, signature, sellsyWebhookSecret);
    if (!isValid) {
      return NextResponse.json(
        { error: "Signature invalide" },
        { status: 401 }
      );
    }

    const data = JSON.parse(payload);

    // Handle different webhook events
    if (data.event === "quote.created" || data.event === "quote.updated") {
      await handleQuoteEvent(data);
    } else if (data.event === "invoice.created") {
      await handleInvoiceEvent(data);
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors du traitement du webhook Sellsy:", error);
    // Return 200 to acknowledge receipt even on error
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}

// Handle quote events
async function handleQuoteEvent(data: any) {
  try {
    const quoteId = data.quote?.id;
    const contactId = data.quote?.contactId;
    const amount = data.quote?.amount;
    const status = data.quote?.status; // draft, sent, accepted, refused, expired

    if (!quoteId || !contactId) {
      return;
    }

    // Find contact by Sellsy ID
    const contact = await prisma.contact.findUnique({
      where: { sellsyContactId: contactId },
    });

    if (!contact) {
      console.log(`Contact Sellsy ${contactId} non trouvé localement`);
      return;
    }

    // Find or create devis
    let devis = await prisma.devis.findUnique({
      where: { sellsyQuoteId: quoteId },
    });

    if (!devis) {
      // Create new devis
      const statusMap: Record<string, any> = {
        draft: "EN_ATTENTE",
        sent: "ENVOYE",
        accepted: "ACCEPTE",
        refused: "REFUSE",
        expired: "EXPIRE",
      };

      devis = await prisma.devis.create({
        data: {
          contactId: contact.id,
          sellsyQuoteId: quoteId,
          montant: amount || 0,
          statut: statusMap[status] || "EN_ATTENTE",
          dateEnvoi: status !== "draft" ? new Date() : undefined,
        },
      });

      // Create event
      await prisma.evenement.create({
        data: {
          contactId: contact.id,
          type: "DEVIS_CREE",
          description: `Devis créé dans Sellsy: ${amount}€`,
          metadata: {
            sellsyQuoteId: quoteId,
            montant: amount,
            statut: status,
          },
        },
      });
    } else {
      // Update existing devis
      const statusMap: Record<string, any> = {
        draft: "EN_ATTENTE",
        sent: "ENVOYE",
        accepted: "ACCEPTE",
        refused: "REFUSE",
        expired: "EXPIRE",
      };

      devis = await prisma.devis.update({
        where: { id: devis.id },
        data: {
          montant: amount || devis.montant,
          statut: statusMap[status] || devis.statut,
          dateEnvoi: status !== "draft" && !devis.dateEnvoi ? new Date() : devis.dateEnvoi,
        },
      });

      // Create event for status change
      await prisma.evenement.create({
        data: {
          contactId: contact.id,
          type: "DEVIS_CREE",
          description: `Devis mis à jour dans Sellsy: ${status}`,
          metadata: {
            sellsyQuoteId: quoteId,
            statut: status,
          },
        },
      });
    }

    // Update contact lifecycle stage if quote accepted
    if (status === "accepted") {
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          lifecycleStage: "CLIENT",
        },
      });
    }

    // Vérifier le scoring du contact (fire-and-forget)
    checkAndNotifyScoring(contact.id).catch(() => {});

    console.log(`Devis Sellsy ${quoteId} traité`);
  } catch (error) {
    console.error("Erreur lors du traitement du devis Sellsy:", error);
  }
}

// Handle invoice events
async function handleInvoiceEvent(data: any) {
  try {
    const invoiceId = data.invoice?.id;
    const contactId = data.invoice?.contactId;
    const amount = data.invoice?.amount;
    const invoiceDate = data.invoice?.date;

    if (!invoiceId || !contactId) {
      return;
    }

    // Find contact by Sellsy ID
    const contact = await prisma.contact.findUnique({
      where: { sellsyContactId: contactId },
    });

    if (!contact) {
      console.log(`Contact Sellsy ${contactId} non trouvé localement`);
      return;
    }

    // Check if vente already exists
    const existingVente = await prisma.vente.findUnique({
      where: { sellsyInvoiceId: invoiceId },
    });

    if (existingVente) {
      console.log(`Vente ${invoiceId} déjà existe`);
      return;
    }

    // Find devis for this contact if exists
    const devis = await prisma.devis.findFirst({
      where: { contactId: contact.id },
      orderBy: { createdAt: "desc" },
    });

    // Create vente (invoice)
    const vente = await prisma.vente.create({
      data: {
        contactId: contact.id,
        devisId: devis?.id,
        sellsyInvoiceId: invoiceId,
        montant: amount || 0,
        dateVente: invoiceDate ? new Date(invoiceDate) : new Date(),
      },
    });

    // Update lead status if devis is linked
    if (devis?.leadId) {
      await prisma.lead.update({
        where: { id: devis.leadId },
        data: {
          statut: "VENTE",
        },
      });
    }

    // Update contact lifecycle stage
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        lifecycleStage: "CLIENT",
      },
    });

    // Create event
    await prisma.evenement.create({
      data: {
        contactId: contact.id,
        type: "VENTE",
        description: `Facture créée dans Sellsy: ${amount}€`,
        metadata: {
          sellsyInvoiceId: invoiceId,
          montant: amount,
          devisId: devis?.id,
        },
      },
    });

    // Vérifier le scoring du contact (fire-and-forget)
    checkAndNotifyScoring(contact.id).catch(() => {});

    console.log(`Vente Sellsy ${invoiceId} créée: ${amount}€`);
  } catch (error) {
    console.error("Erreur lors du traitement de la facture Sellsy:", error);
  }
}
