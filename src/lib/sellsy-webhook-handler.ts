import { prisma } from "@/lib/prisma";

/**
 * Met à jour les tables locales (SellsyDocLink + SellsyInvoicePaid) à partir
 * d'un payload Sellsy. Réutilisable depuis le webhook et le backfill.
 *
 * Champs Sellsy utilisés :
 *  - sur une facture : id, number, status, amounts.total_incl_tax,
 *    amounts.total_remaining_due_incl_tax, parent: { type, id }
 *  - sur un BDL (delivery) : id, number, parent: { type, id }
 */

export interface SellsyDoc {
  id: number | string;
  number?: string;
  status?: string;
  amounts?: {
    total_incl_tax?: string | number;
    total_remaining_due_incl_tax?: string | number;
  };
  parent?: { type?: string; id?: number | string } | null;
}

export async function upsertDocLink(
  childType: "invoice" | "delivery" | "creditnote",
  doc: SellsyDoc
) {
  const childId = BigInt(doc.id);
  const parentType = doc.parent?.type;
  const parentId = doc.parent?.id ? BigInt(doc.parent.id) : null;
  if (!parentType || !parentId) return null;

  return prisma.sellsyDocLink.upsert({
    where: { childId_childType: { childId, childType } },
    create: {
      childId,
      childType,
      childNumber: doc.number || null,
      parentId,
      parentType,
    },
    update: {
      childNumber: doc.number || null,
      parentId,
      parentType,
      syncedAt: new Date(),
    },
  });
}

export async function upsertInvoicePaid(doc: SellsyDoc) {
  const total = Number(doc.amounts?.total_incl_tax || 0);
  const remaining = Number(doc.amounts?.total_remaining_due_incl_tax || 0);
  const paid = Math.max(0, total - remaining);
  return prisma.sellsyInvoicePaid.upsert({
    where: { invoiceId: BigInt(doc.id) },
    create: {
      invoiceId: BigInt(doc.id),
      invoiceNumber: doc.number || String(doc.id),
      status: doc.status || null,
      totalInclTax: total,
      remainingDueInclTax: remaining,
      paidInclTax: paid,
    },
    update: {
      invoiceNumber: doc.number || String(doc.id),
      status: doc.status || null,
      totalInclTax: total,
      remainingDueInclTax: remaining,
      paidInclTax: paid,
      syncedAt: new Date(),
    },
  });
}
