import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndNotifyScoring } from "@/lib/scoring-alerts";
import {
  getItem,
  listDeclinations,
  getItemV1Declinations,
  getOrder,
  sellsyFetch,
} from "@/lib/sellsy";
import crypto from "crypto";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Webhook Sellsy — point d'entrée unique pour la sync quasi-instantanée.
 *
 * Sellsy push chaque événement → on re-fetch la donnée canonique depuis
 * l'API v2 (au lieu de croire le payload) puis on upsert en DB.
 *
 * Events traités :
 *  - item.created / item.updated / item.deleted          → SellsyItemCache + déclinaisons
 *  - order.created / order.updated / order.deleted        → Vente (BDC) + etatProduit
 *  - estimate.created / estimate.updated / estimate.deleted → Devis + etatProduit
 *  - invoice.created (legacy) → Vente
 *
 * Configuration côté Sellsy (Paramètres → Webhooks) :
 *  URL : https://kokpit-kappa.vercel.app/api/webhooks/sellsy
 *  Events à activer : item.*, order.*, estimate.*, invoice.created
 *  Secret : variable SELLSY_WEBHOOK_SECRET
 */

function validateSellsySignature(payload: string, signature: string, secret: string): boolean {
  const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return hash === signature;
}

interface CustomFieldOnDoc {
  code?: string;
  name?: string;
  label?: string;
  value?: unknown;
  parameters?: { items?: Array<{ id: number | string; label: string }> };
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
function isEtatProduit(cf: CustomFieldOnDoc): boolean {
  const fields = [cf.code, cf.name, cf.label].filter(Boolean) as string[];
  return fields.some((v) => {
    const n = normalize(v);
    return n.includes("etat") && n.includes("produit");
  });
}
function readValueLabel(cf: CustomFieldOnDoc): string | null {
  if (cf.value == null || cf.value === "") return null;
  if (typeof cf.value === "string" || typeof cf.value === "number" || typeof cf.value === "boolean") {
    const raw = String(cf.value).trim();
    const items = cf.parameters?.items || [];
    const matched = items.find((it) => String(it.id) === raw);
    return matched?.label || raw;
  }
  return JSON.stringify(cf.value);
}

async function fetchEtatAndStatus(
  type: "order" | "estimate",
  sellsyId: string
): Promise<{ etatProduit: string | null; statutSellsy: string | null }> {
  const path = type === "order" ? `/orders/${sellsyId}` : `/estimates/${sellsyId}`;
  const cfPath = `${path}/custom-fields?limit=100`;
  const [docRes, cfRes] = await Promise.all([
    sellsyFetch<{ data: any }>(path).catch(() => ({ data: null })),
    sellsyFetch<{ data: CustomFieldOnDoc[] }>(cfPath).catch(() => ({ data: [] })),
  ]);
  const statutSellsy = (docRes.data?.status as string | undefined) || null;
  const cfList = cfRes.data || [];
  const target = cfList.find(isEtatProduit);
  const etatProduit = target ? readValueLabel(target) : null;
  return { etatProduit, statutSellsy };
}

function parseNum(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? null : n;
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-sellsy-signature") || "";

    const sellsyWebhookSecret = process.env.SELLSY_WEBHOOK_SECRET;
    if (!sellsyWebhookSecret) {
      console.warn("[webhook sellsy] SELLSY_WEBHOOK_SECRET non configuré");
      return NextResponse.json({ error: "Secret non configuré" }, { status: 400 });
    }

    if (!validateSellsySignature(payload, signature, sellsyWebhookSecret)) {
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }

    const data = JSON.parse(payload);
    const event: string = data.event || data.event_type || "";
    const t0 = Date.now();
    console.log(`[webhook sellsy] event=${event}`);

    // Item events
    if (event.startsWith("item.")) {
      await handleItemEvent(event, data);
    }
    // Order events (BDC)
    else if (event.startsWith("order.")) {
      await handleOrderEvent(event, data);
    }
    // Estimate events (devis)
    else if (event.startsWith("estimate.") || event.startsWith("quote.")) {
      await handleEstimateEvent(event, data);
    }
    // Invoice events (legacy)
    else if (event === "invoice.created" || event === "invoice.updated") {
      await handleInvoiceEvent(data);
    } else {
      console.log(`[webhook sellsy] event ignoré: ${event}`);
    }

    console.log(`[webhook sellsy] ${event} traité en ${Date.now() - t0}ms`);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("[webhook sellsy] erreur:", error);
    // 200 pour éviter que Sellsy retry en boucle
    return NextResponse.json({ status: "error", message: (error as Error).message }, { status: 200 });
  }
}

// ============================================================
// ITEM (catalogue produits)
// ============================================================
async function handleItemEvent(event: string, data: any) {
  const itemId: number | undefined = data.item?.id || data.id || data.resource_id;
  if (!itemId) {
    console.warn("[webhook sellsy] item event sans id");
    return;
  }

  if (event === "item.deleted") {
    await prisma.sellsyItemCache.update({
      where: { id: itemId },
      data: { isArchived: true, syncedAt: new Date() },
    }).catch(() => {});
    await prisma.sellsyDeclinationCache.deleteMany({ where: { itemId } }).catch(() => {});
    return;
  }

  // Fetch canonique
  const itemRes = await getItem(itemId).catch(() => null);
  if (!itemRes?.data) {
    console.warn(`[webhook sellsy] item ${itemId} introuvable`);
    return;
  }
  const item = itemRes.data as any;

  await prisma.sellsyItemCache.upsert({
    where: { id: item.id },
    create: {
      id: item.id,
      type: item.type,
      reference: item.reference || "",
      name: item.name,
      description: item.description || null,
      priceHT: parseNum(item.reference_price_taxes_exc),
      priceTTC: parseNum(item.reference_price_taxes_inc),
      purchaseAmount: parseNum(item.purchase_amount),
      currency: item.currency || null,
      categoryId: item.category_id || null,
      standardQty: parseNum(item.standard_quantity),
      isArchived: item.is_archived || false,
      isDeclined: item.is_declined || false,
      createdAtSellsy: item.created ? new Date(item.created) : null,
      updatedAtSellsy: item.updated ? new Date(item.updated) : null,
    },
    update: {
      type: item.type,
      reference: item.reference || "",
      name: item.name,
      description: item.description || null,
      priceHT: parseNum(item.reference_price_taxes_exc),
      priceTTC: parseNum(item.reference_price_taxes_inc),
      purchaseAmount: parseNum(item.purchase_amount),
      currency: item.currency || null,
      categoryId: item.category_id || null,
      standardQty: parseNum(item.standard_quantity),
      isArchived: item.is_archived || false,
      isDeclined: item.is_declined || false,
      updatedAtSellsy: item.updated ? new Date(item.updated) : null,
      syncedAt: new Date(),
    },
  });

  // Si déclinés, on rafraîchit les déclinaisons aussi
  if (item.is_declined) {
    const [v2, v1] = await Promise.all([
      listDeclinations(item.id).catch(() => ({ data: [] as any[] })),
      getItemV1Declinations(item.id),
    ]);
    const v1ById = new Map<string, any>();
    const v1ByName = new Map<string, any>();
    for (const v of v1) {
      if (v.id) v1ById.set(String(v.id), v);
      if (v.name) v1ByName.set(String(v.name), v);
    }
    const parentHT = parseFloat(item.reference_price_taxes_exc || "0");
    const parentTTC = parseFloat(item.reference_price_taxes_inc || "0");
    const tvaMult = parentHT > 0 && parentTTC > parentHT ? parentTTC / parentHT : 1.085;

    for (const d of v2.data as any[]) {
      const v1d = v1ById.get(String(d.id)) || v1ByName.get(String(d.reference));
      const v1HT = v1d?.refPriceTaxesFree ? (v1d?.refPrice ?? v1d?.priceInc ?? null) : null;
      const v1TTCInc = !v1d?.refPriceTaxesFree ? (v1d?.priceInc ?? v1d?.refPrice ?? null) : null;
      const ht = parseNum(d.reference_price_taxes_exc) ?? parseNum(v1HT);
      let ttc = parseNum(d.reference_price_taxes_inc) ?? parseNum(v1TTCInc);
      if (!ttc && ht) ttc = +(Number(ht) * tvaMult).toFixed(4);
      const purch = parseNum(d.purchase_amount) ?? parseNum(v1d?.purchaseInc);

      await prisma.sellsyDeclinationCache.upsert({
        where: { id: d.id },
        create: {
          id: d.id,
          itemId: item.id,
          reference: d.reference || "",
          name: d.name,
          priceHT: ht,
          priceTTC: ttc,
          purchaseAmount: purch,
        },
        update: {
          itemId: item.id,
          reference: d.reference || "",
          name: d.name,
          priceHT: ht,
          priceTTC: ttc,
          purchaseAmount: purch,
          syncedAt: new Date(),
        },
      });
    }
  }
}

// ============================================================
// ORDER (BDC)
// ============================================================
async function handleOrderEvent(event: string, data: any) {
  const orderId: number | string | undefined =
    data.order?.id || data.id || data.resource_id;
  if (!orderId) return;

  if (event === "order.deleted") {
    await prisma.vente.updateMany({
      where: { sellsyInvoiceId: String(orderId) },
      data: { statutSellsy: "deleted" },
    }).catch(() => {});
    return;
  }

  // Fetch canonique
  const orderRes = await getOrder(Number(orderId)).catch(() => null);
  if (!orderRes?.data) return;
  const o = orderRes.data as any;

  const amount = parseNum(o.amounts?.total_excl_tax ?? o.amounts?.total_raw_excl_tax) || 0;
  const dateVente = o.date ? new Date(o.date) : new Date();

  // Custom field "Etat des produit" + statut
  const { etatProduit, statutSellsy } = await fetchEtatAndStatus("order", String(orderId));

  // Contact lookup ou création placeholder
  const contactSellsyId = o.related?.find((r: any) => r.type === "individual" || r.type === "company")?.id;
  let contact = null;
  if (contactSellsyId) {
    contact = await prisma.contact.findFirst({
      where: { sellsyContactId: String(contactSellsyId) },
    });
  }
  if (!contact) {
    contact = await prisma.contact.upsert({
      where: { email: `sellsy-${orderId}@placeholder.dimexoi.fr` },
      create: {
        nom: `Sellsy BDC ${orderId}`,
        prenom: "",
        email: `sellsy-${orderId}@placeholder.dimexoi.fr`,
        lifecycleStage: "CLIENT",
        sourcePremiere: "SHOWROOM",
      },
      update: {},
    });
  }

  await prisma.vente.upsert({
    where: { sellsyInvoiceId: String(orderId) },
    create: {
      contactId: contact.id,
      sellsyInvoiceId: String(orderId),
      montant: amount,
      dateVente,
      etatProduit,
      statutSellsy,
    },
    update: {
      montant: amount,
      dateVente,
      etatProduit,
      statutSellsy,
    },
  });

  checkAndNotifyScoring(contact.id).catch(() => {});
}

// ============================================================
// ESTIMATE (devis)
// ============================================================
async function handleEstimateEvent(event: string, data: any) {
  const estimateId: number | string | undefined =
    data.estimate?.id || data.quote?.id || data.id || data.resource_id;
  if (!estimateId) return;

  if (event === "estimate.deleted" || event === "quote.deleted") {
    await prisma.devis.updateMany({
      where: { sellsyQuoteId: String(estimateId) },
      data: { statutSellsy: "deleted" },
    }).catch(() => {});
    return;
  }

  const estRes = await sellsyFetch<{ data: any }>(`/estimates/${estimateId}`).catch(() => ({ data: null }));
  if (!estRes?.data) return;
  const e = estRes.data as any;

  const amount = parseNum(e.amounts?.total_excl_tax ?? e.amounts?.total_raw_excl_tax) || 0;
  const { etatProduit, statutSellsy } = await fetchEtatAndStatus("estimate", String(estimateId));

  const contactSellsyId = e.related?.find((r: any) => r.type === "individual" || r.type === "company")?.id;
  let contact = null;
  if (contactSellsyId) {
    contact = await prisma.contact.findFirst({
      where: { sellsyContactId: String(contactSellsyId) },
    });
  }
  if (!contact) {
    contact = await prisma.contact.upsert({
      where: { email: `sellsy-devis-${estimateId}@placeholder.dimexoi.fr` },
      create: {
        nom: `Sellsy Devis ${estimateId}`,
        prenom: "",
        email: `sellsy-devis-${estimateId}@placeholder.dimexoi.fr`,
        lifecycleStage: "PROSPECT",
        sourcePremiere: "SHOWROOM",
      },
      update: {},
    });
  }

  const statusMap: Record<string, any> = {
    draft: "EN_ATTENTE",
    sent: "ENVOYE",
    accepted: "ACCEPTE",
    refused: "REFUSE",
    expired: "EXPIRE",
  };

  await prisma.devis.upsert({
    where: { sellsyQuoteId: String(estimateId) },
    create: {
      contactId: contact.id,
      sellsyQuoteId: String(estimateId),
      montant: amount,
      statut: statusMap[statutSellsy || ""] || "EN_ATTENTE",
      etatProduit,
      statutSellsy,
    },
    update: {
      montant: amount,
      statut: statusMap[statutSellsy || ""] || undefined,
      etatProduit,
      statutSellsy,
    },
  });

  checkAndNotifyScoring(contact.id).catch(() => {});
}

// ============================================================
// INVOICE (legacy — facture émise)
// ============================================================
async function handleInvoiceEvent(data: any) {
  try {
    const invoiceId = data.invoice?.id;
    const contactId = data.invoice?.contactId;
    const amount = data.invoice?.amount;
    const invoiceDate = data.invoice?.date;

    if (!invoiceId || !contactId) return;

    const contact = await prisma.contact.findUnique({
      where: { sellsyContactId: contactId },
    });
    if (!contact) return;

    const existingVente = await prisma.vente.findUnique({
      where: { sellsyInvoiceId: invoiceId },
    });
    if (existingVente) return;

    const devis = await prisma.devis.findFirst({
      where: { contactId: contact.id },
      orderBy: { createdAt: "desc" },
    });

    await prisma.vente.create({
      data: {
        contactId: contact.id,
        devisId: devis?.id,
        sellsyInvoiceId: invoiceId,
        montant: amount || 0,
        dateVente: invoiceDate ? new Date(invoiceDate) : new Date(),
      },
    });

    if (devis?.leadId) {
      await prisma.lead.update({
        where: { id: devis.leadId },
        data: { statut: "VENTE" },
      });
    }
    await prisma.contact.update({
      where: { id: contact.id },
      data: { lifecycleStage: "CLIENT" },
    });

    checkAndNotifyScoring(contact.id).catch(() => {});
  } catch (error) {
    console.error("[webhook sellsy] invoice:", error);
  }
}

// GET — endpoint de healthcheck pour vérifier que le webhook répond
export async function GET() {
  return NextResponse.json({
    status: "ok",
    info: "Webhook Sellsy KOKPIT actif. Configure côté Sellsy avec SELLSY_WEBHOOK_SECRET.",
    events: [
      "item.created", "item.updated", "item.deleted",
      "order.created", "order.updated", "order.deleted",
      "estimate.created", "estimate.updated", "estimate.deleted",
      "invoice.created",
    ],
  });
}
