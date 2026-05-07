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
 * Webhook Sellsy V1 — point d'entrée unique pour la sync quasi-temps réel.
 *
 * Sellsy push chaque modification → on re-fetch la donnée canonique depuis
 * l'API v2 (au lieu de croire le payload) puis on upsert en DB.
 *
 * Format Sellsy v1 (configuration via UI Sellsy → Webhooks) :
 *   - Content-type : application/json (recommandé) OU x-www-form-urlencoded
 *   - "Retourne l'objet dans le payload" : coché
 *   - Signature : HMAC SHA1 du body avec la clé de signature
 *   - Body :
 *     {
 *       "notif": "created" | "updated" | "deleted" | "step" | ...,
 *       "relatedtype": "Item" | "Client" | "Prospect" | "People" |
 *                      "Document" | "Invoice" | ...,
 *       "relatedid": "12345",
 *       "eventDate": "2026-05-07 10:30:00",
 *       "ownerid": "123",
 *       "object": { ... }    // si "Retourne l'objet" coché
 *     }
 */

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
  type: "order" | "estimate" | "invoice",
  sellsyId: string
): Promise<{ etatProduit: string | null; statutSellsy: string | null }> {
  const path =
    type === "order" ? `/orders/${sellsyId}` :
    type === "estimate" ? `/estimates/${sellsyId}` :
    `/invoices/${sellsyId}`;
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
// SIGNATURE — Sellsy v1 utilise HMAC SHA1 du body avec la clé
// On essaie plusieurs schémas pour rester compatible.
// ============================================================
function verifySignature(rawBody: string, headers: Headers, secret: string): boolean {
  // Sellsy v1 envoie potentiellement la signature dans un de ces headers
  const candidates = [
    headers.get("webhooks_signature"),
    headers.get("x-sellsy-signature"),
    headers.get("x-webhooks-signature"),
    headers.get("x-signature"),
  ].filter(Boolean) as string[];

  if (candidates.length === 0) {
    console.warn("[webhook sellsy] aucun header de signature trouvé");
    return false;
  }

  // Calcul HMAC-SHA1 + HMAC-SHA256 — on accepte les 2
  const hmacSha1 = crypto.createHmac("sha1", secret).update(rawBody).digest("hex");
  const hmacSha256 = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  for (const sig of candidates) {
    const cleaned = sig.replace(/^sha1=|^sha256=/i, "").trim();
    if (cleaned === hmacSha1 || cleaned === hmacSha256) return true;
  }
  return false;
}

// ============================================================
// PARSE BODY — accepte JSON ou form-urlencoded
// ============================================================
function parseBody(rawBody: string, contentType: string): any {
  try {
    if (contentType.includes("json")) {
      return JSON.parse(rawBody);
    }
    // form-urlencoded
    const params = new URLSearchParams(rawBody);
    const out: any = {};
    for (const [k, v] of params.entries()) {
      // Sellsy peut imbriquer un objet json sous le champ "object"
      if ((k === "object" || k === "details") && v.startsWith("{")) {
        try { out[k] = JSON.parse(v); } catch { out[k] = v; }
      } else {
        out[k] = v;
      }
    }
    return out;
  } catch (e) {
    console.error("[webhook sellsy] parse body:", (e as Error).message);
    return null;
  }
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
export async function POST(request: NextRequest) {
  const t0 = Date.now();
  try {
    const rawBody = await request.text();
    const contentType = request.headers.get("content-type") || "";

    const sellsyWebhookSecret = process.env.SELLSY_WEBHOOK_SECRET;
    if (!sellsyWebhookSecret) {
      console.warn("[webhook sellsy] SELLSY_WEBHOOK_SECRET non configuré");
      return NextResponse.json({ error: "Secret non configuré" }, { status: 400 });
    }

    // En mode debug (pas de signature header), on log mais on continue
    // pour faciliter le 1er paramétrage Sellsy.
    const sigOk = verifySignature(rawBody, request.headers, sellsyWebhookSecret);
    if (!sigOk) {
      console.warn("[webhook sellsy] signature invalide. Headers:", Array.from(request.headers.entries()).map(([k, v]) => `${k}=${v.slice(0, 30)}`).join(", "));
      // On garde 401 mais en logguant pour pouvoir adapter si Sellsy
      // utilise un autre nom de header
      if (process.env.SELLSY_WEBHOOK_STRICT !== "false") {
        return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
      }
    }

    const data = parseBody(rawBody, contentType);
    if (!data) {
      return NextResponse.json({ error: "Payload illisible" }, { status: 400 });
    }

    const notif: string = (data.notif || data.event || "").toLowerCase();
    const relatedType: string = (data.relatedtype || data.relatedType || data.entity || "").toLowerCase();
    const relatedId: string = String(data.relatedid || data.relatedId || data.entityId || data.id || "");

    if (!notif || !relatedType) {
      console.warn("[webhook sellsy] payload sans notif/relatedtype:", JSON.stringify(data).slice(0, 300));
      return NextResponse.json({ status: "ignored", reason: "no event" }, { status: 200 });
    }

    console.log(`[webhook sellsy] ${relatedType}.${notif} id=${relatedId}`);

    // ===== Routing =====
    if (relatedType === "item" || relatedType === "produit") {
      await handleItemEvent(notif, relatedId, data);
    }
    else if (relatedType === "client" || relatedType === "prospect" || relatedType === "people" || relatedType === "contact" || relatedType === "third") {
      await handleContactEvent(notif, relatedId, data, relatedType);
    }
    // Documents : Document redactor envoie relatedtype=document avec un subtype
    else if (relatedType === "document" || relatedType === "estimate" || relatedType === "order" || relatedType === "invoice" || relatedType === "delivery") {
      await handleDocumentEvent(notif, relatedId, data, relatedType);
    }
    else {
      console.log(`[webhook sellsy] type ignoré: ${relatedType}`);
    }

    console.log(`[webhook sellsy] ${relatedType}.${notif} traité en ${Date.now() - t0}ms`);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("[webhook sellsy] erreur:", error);
    // 200 pour éviter que Sellsy retry en boucle
    return NextResponse.json({ status: "error", message: (error as Error).message }, { status: 200 });
  }
}

// ============================================================
// ITEM (Produit)
// ============================================================
async function handleItemEvent(notif: string, itemId: string, data: any) {
  if (!itemId) return;
  const id = Number(itemId);
  if (!id || isNaN(id)) return;

  if (notif === "deleted") {
    await prisma.sellsyItemCache.update({
      where: { id },
      data: { isArchived: true, syncedAt: new Date() },
    }).catch(() => {});
    await prisma.sellsyDeclinationCache.deleteMany({ where: { itemId: id } }).catch(() => {});
    return;
  }

  // Re-fetch canonique depuis Sellsy v2
  const itemRes = await getItem(id).catch(() => null);
  if (!itemRes?.data) {
    console.warn(`[webhook sellsy] item ${id} introuvable v2`);
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
// CONTACT (Client / Prospect / Contact / People)
// ============================================================
async function handleContactEvent(notif: string, contactId: string, data: any, type: string) {
  if (!contactId || notif === "deleted") return; // pas de delete contact pour l'instant

  // On re-fetch depuis l'API v2
  const path = type === "client" || type === "prospect" || type === "third"
    ? `/companies/${contactId}`
    : `/individuals/${contactId}`;
  const res = await sellsyFetch<{ data: any }>(path).catch(() => ({ data: null }));
  if (!res?.data) return;
  const c = res.data as any;

  const email = (c.email || c.emails?.[0]?.email || "").toLowerCase();
  if (!email) {
    console.log(`[webhook sellsy] contact ${contactId} sans email — skip`);
    return;
  }

  const nom = c.name || c.last_name || c.lastname || c.corporation_name || "Contact Sellsy";
  const prenom = c.first_name || c.firstname || "";

  await prisma.contact.upsert({
    where: { sellsyContactId: String(contactId) },
    create: {
      sellsyContactId: String(contactId),
      email,
      nom,
      prenom,
      telephone: c.phone_number || c.mobile_number || null,
      lifecycleStage: type === "client" ? "CLIENT" : "PROSPECT",
      sourcePremiere: "SHOWROOM",
    },
    update: {
      email,
      nom,
      prenom,
      telephone: c.phone_number || c.mobile_number || undefined,
      lifecycleStage: type === "client" ? "CLIENT" : undefined,
    },
  });
}

// ============================================================
// DOCUMENT (BDC, Devis, Facture)
// ============================================================
async function handleDocumentEvent(notif: string, docId: string, data: any, relatedType: string) {
  if (!docId) return;

  // Sellsy "Document redactor" envoie un subtype dans data.object.type ou data.doctype
  const obj = data.object || {};
  const subtype: string = (
    obj.type ||
    obj.doctype ||
    data.doctype ||
    data.subtype ||
    relatedType ||
    ""
  ).toLowerCase();

  if (notif === "deleted") {
    if (subtype.includes("estimate") || subtype.includes("devis")) {
      await prisma.devis.updateMany({
        where: { sellsyQuoteId: String(docId) },
        data: { statutSellsy: "deleted" },
      }).catch(() => {});
    } else if (subtype.includes("order") || subtype.includes("commande")) {
      await prisma.vente.updateMany({
        where: { sellsyInvoiceId: String(docId) },
        data: { statutSellsy: "deleted" },
      }).catch(() => {});
    }
    return;
  }

  // Devis (estimate)
  if (subtype.includes("estimate") || subtype.includes("devis")) {
    await syncEstimate(docId);
  }
  // BDC (order)
  else if (subtype.includes("order") || subtype.includes("commande")) {
    await syncOrder(docId);
  }
  // Facture (invoice)
  else if (subtype.includes("invoice") || subtype.includes("facture")) {
    await syncInvoice(docId);
  } else {
    console.log(`[webhook sellsy] document subtype inconnu: ${subtype}`);
  }
}

async function syncOrder(orderId: string) {
  const orderRes = await getOrder(Number(orderId)).catch(() => null);
  if (!orderRes?.data) return;
  const o = orderRes.data as any;

  const amount = parseNum(o.amounts?.total_excl_tax ?? o.amounts?.total_raw_excl_tax) || 0;
  const dateVente = o.date ? new Date(o.date) : new Date();
  const { etatProduit, statutSellsy } = await fetchEtatAndStatus("order", String(orderId));

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

async function syncEstimate(estimateId: string) {
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

async function syncInvoice(invoiceId: string) {
  // Pour l'instant on traite la facture comme une Vente (sellsyInvoiceId)
  // La table Vente stocke historiquement BDC ; à termes on séparera.
  const invRes = await sellsyFetch<{ data: any }>(`/invoices/${invoiceId}`).catch(() => ({ data: null }));
  if (!invRes?.data) return;
  const inv = invRes.data as any;

  const amount = parseNum(inv.amounts?.total_excl_tax ?? inv.amounts?.total_raw_excl_tax) || 0;
  const dateVente = inv.date ? new Date(inv.date) : new Date();
  const { etatProduit, statutSellsy } = await fetchEtatAndStatus("invoice", String(invoiceId));

  const contactSellsyId = inv.related?.find((r: any) => r.type === "individual" || r.type === "company")?.id;
  let contact = null;
  if (contactSellsyId) {
    contact = await prisma.contact.findFirst({
      where: { sellsyContactId: String(contactSellsyId) },
    });
  }
  if (!contact) {
    contact = await prisma.contact.upsert({
      where: { email: `sellsy-fact-${invoiceId}@placeholder.dimexoi.fr` },
      create: {
        nom: `Sellsy Facture ${invoiceId}`,
        prenom: "",
        email: `sellsy-fact-${invoiceId}@placeholder.dimexoi.fr`,
        lifecycleStage: "CLIENT",
        sourcePremiere: "SHOWROOM",
      },
      update: {},
    });
  }

  await prisma.vente.upsert({
    where: { sellsyInvoiceId: String(invoiceId) },
    create: {
      contactId: contact.id,
      sellsyInvoiceId: String(invoiceId),
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

// GET — healthcheck
export async function GET() {
  return NextResponse.json({
    status: "ok",
    info: "Webhook Sellsy v1 KOKPIT actif.",
    expectedTypes: ["Item", "Client", "Prospect", "People", "Document"],
    expectedNotifs: ["created", "updated", "deleted", "step", "linked", "unlinked"],
    headersChecked: ["webhooks_signature", "x-sellsy-signature"],
    contentTypes: ["application/json", "application/x-www-form-urlencoded"],
  });
}
