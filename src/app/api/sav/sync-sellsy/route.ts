import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sellsyFetch, searchOrders } from "@/lib/sellsy";
import { genererNumeroDossier } from "@/lib/sav-numero";

/**
 * Mapping statuts Sellsy → statuts SAV KOKPIT
 * Règle simplifiée demandée par Laurence (24 avril 2026) :
 * - facturé → TRAITE
 * - annulé → CLOTURE
 * - tout le reste → A_TRAITER
 */
function mapSellsyStatut(sellsyStatus: string): string {
  const s = (sellsyStatus || "").toLowerCase();
  if (["invoiced", "billed", "completed", "partialinvoiced", "advanced"].includes(s)) {
    return "TRAITE";
  }
  if (["cancelled", "canceled", "refused", "rejected", "expired"].includes(s)) {
    return "CLOTURE";
  }
  return "A_TRAITER";
}

interface CustomFieldDef {
  id: number;
  code?: string;
  name?: string;
  label?: string;
  related_type?: string;
  related_object_type?: string;
}

interface CustomFieldValue {
  cf_id: number;
  value: unknown;
}

function valueToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(valueToString).filter(Boolean).join(", ");
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.value === "string") return obj.value;
    if (typeof obj.formatted_value === "string") return obj.formatted_value;
    if (typeof obj.label === "string") return obj.label;
    return JSON.stringify(value);
  }
  return "";
}

function isNonEmpty(v: unknown): boolean {
  const s = valueToString(v);
  return s.length > 0 && s !== "null" && s !== "false" && s !== "0";
}

/**
 * POST /api/sav/sync-sellsy
 *
 * Synchronise les BDC Sellsy ayant le champ personnalisé "SAV" rempli
 * vers les dossiers DossierSAV. Pour chaque BDC :
 *  - numero       = valeur du champ SAV (fallback : auto-généré)
 *  - titre        = "BCDI-XXXX — Objet"
 *  - description  = subject (Objet du document Sellsy)
 *  - statut       = mapping facturé/annulé/autre
 *  - sellsyStatut = statut brut Sellsy
 *  - createdAt    = date du document
 *  - assigneId    = user KOKPIT correspondant au owner Sellsy (par email)
 *  - contactId    = contact KOKPIT lié au BDC (via sellsyContactId)
 *
 * Préserve les modifications manuelles : si un dossier existe déjà
 * (par sellsyBdcId), on met à jour uniquement sellsyStatut + sellsyBdcRef
 * sans toucher au statut SAV ni à la description édités.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  try {
    // ====== 1. Découvrir le cf_id du champ "SAV" ======
    let allCfs: CustomFieldDef[] = [];
    try {
      let offset = 0;
      const limit = 100;
      while (true) {
        const res = await sellsyFetch<{ data: CustomFieldDef[] }>(
          `/custom-fields?limit=${limit}&offset=${offset}`
        );
        const batch = res.data || [];
        allCfs = allCfs.concat(batch);
        if (batch.length < limit) break;
        offset += limit;
        if (offset > 1000) break;
      }
    } catch (e) {
      console.warn("[SAV sync] Impossible de lister custom-fields:", e);
    }

    // Recherche permissive : exact d'abord, puis substring
    const exact = allCfs.filter((cf) =>
      [cf.code, cf.name, cf.label]
        .filter(Boolean)
        .some((v) => v!.toLowerCase() === "sav")
    );
    const fuzzy = allCfs.filter((cf) =>
      [cf.code, cf.name, cf.label]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes("sav"))
    );
    const savCfs = exact.length > 0 ? exact : fuzzy;

    if (savCfs.length === 0) {
      return NextResponse.json(
        {
          error: "Champ perso 'SAV' introuvable côté Sellsy",
          hint: "Aucun custom field n'a 'sav' dans son code/name/label.",
          totalCustomFields: allCfs.length,
          customFieldsSample: allCfs.slice(0, 100).map((cf) => ({
            id: cf.id,
            code: cf.code,
            name: cf.name,
            label: cf.label,
            related: cf.related_type || cf.related_object_type,
          })),
        },
        { status: 404 }
      );
    }
    const savCfIds = new Set(savCfs.map((cf) => cf.id));

    // ====== 2. Mapping users KOKPIT par email (pour assigneId) ======
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true },
    });
    const userByEmail = new Map(allUsers.map((u) => [u.email.toLowerCase(), u.id]));

    // Mapping owner staff Sellsy → email (via /staffs)
    const staffByOwnerId = new Map<number, string>();
    try {
      const staffRes = await sellsyFetch<{ data: Array<{ id: number; email?: string }> }>(
        "/staffs?limit=100"
      );
      for (const s of staffRes.data || []) {
        if (s.email) staffByOwnerId.set(s.id, s.email.toLowerCase());
      }
    } catch (e) {
      console.warn("[SAV sync] Liste staffs Sellsy indisponible:", e);
    }

    // Mapping sellsy contact id → kokpit contact id
    const allContacts = await prisma.contact.findMany({
      select: { id: true, sellsyContactId: true },
    });
    const contactBySellsyId = new Map<string, string>();
    for (const c of allContacts) {
      if (c.sellsyContactId) {
        for (const sid of c.sellsyContactId.split(",")) {
          contactBySellsyId.set(sid.trim(), c.id);
        }
      }
    }

    // ====== 3. Itération paginée des BDC avec embed customfields + owner + contact ======
    type ProcessedOrder = {
      id: number;
      number: string;
      status: string;
      date: string | null;
      subject: string | null;
      company_name: string | null;
      contact_id?: number;
      owner_id?: number;
      cfValue: string;
      amounts?: { total_excl_tax?: number };
    };
    const ordersToImport: ProcessedOrder[] = [];

    let offset = 0;
    const limit = 100;
    while (true) {
      const res = await searchOrders({
        filters: {} as any,
        limit,
        offset,
        order: "created",
        direction: "desc",
        embed: ["customfields", "owner", "contact", "company"],
      });
      const batch = res.data || [];
      for (const order of batch) {
        const cfArr: CustomFieldValue[] =
          ((order as any).custom_fields_values as CustomFieldValue[]) ||
          ((order as any)._embed?.custom_fields_values as CustomFieldValue[]) ||
          [];
        const matched = cfArr.find((v) => savCfIds.has(v.cf_id) && isNonEmpty(v.value));
        if (!matched) continue;

        ordersToImport.push({
          id: order.id,
          number: order.number,
          status: order.status,
          date: (order as any).date || (order as any).created || null,
          subject: (order as any).subject || null,
          company_name: order.company_name || null,
          contact_id: (order as any).contact_id,
          owner_id: (order as any).owner_id || (order as any).owner?.id,
          cfValue: valueToString(matched.value),
          amounts: order.amounts as any,
        });
      }
      const total = res.pagination?.total ?? batch.length;
      offset += batch.length;
      if (batch.length < limit || offset >= total) break;
      if (offset > 10000) break;
    }

    // ====== 4. Upsert DossierSAV ======
    let created = 0;
    let updated = 0;
    let assignedFromOwner = 0;

    for (const order of ordersToImport) {
      const bdcId = String(order.id);
      const bdcRef = order.number || bdcId;
      const sellsyStatus = order.status || "draft";
      const newStatut = mapSellsyStatut(sellsyStatus);
      const subject = order.subject?.trim() || null;
      const contactName = order.company_name || null;
      const titre = subject ? `${bdcRef} — ${subject}` : `BDC ${bdcRef}`;
      const description = subject || null;
      const dateDoc = order.date ? new Date(order.date) : null;

      // Résolution assigné
      let assigneId: string | null = null;
      if (order.owner_id) {
        const ownerEmail = staffByOwnerId.get(order.owner_id);
        if (ownerEmail) {
          const matchedUserId = userByEmail.get(ownerEmail);
          if (matchedUserId) {
            assigneId = matchedUserId;
            assignedFromOwner++;
          }
        }
      }

      // Résolution contact KOKPIT
      const contactId = order.contact_id
        ? contactBySellsyId.get(String(order.contact_id)) || null
        : null;

      const existing = await prisma.dossierSAV.findFirst({
        where: { sellsyBdcId: bdcId, deletedAt: null },
      });

      if (existing) {
        // Conserver les éventuelles éditions manuelles : on ne touche que sellsyStatut + bdcRef + contactNom (si vide)
        await prisma.dossierSAV.update({
          where: { id: existing.id },
          data: {
            sellsyStatut: sellsyStatus,
            sellsyBdcRef: bdcRef,
            contactNom: existing.contactNom || contactName,
            assigneId: existing.assigneId || assigneId,
            contactId: existing.contactId || contactId,
          },
        });
        updated++;
      } else {
        // Numéro = valeur SAV ; fallback auto si collision avec un autre dossier
        let numero = order.cfValue || "";
        if (numero) {
          const collide = await prisma.dossierSAV.findUnique({
            where: { numero },
            select: { id: true },
          });
          if (collide) numero = `${numero}-${bdcRef}`;
        } else {
          numero = await genererNumeroDossier();
        }
        // Garde-fou : assurer l'unicité finale
        const stillCollide = await prisma.dossierSAV.findUnique({
          where: { numero },
          select: { id: true },
        });
        if (stillCollide) numero = await genererNumeroDossier();

        await prisma.dossierSAV.create({
          data: {
            numero,
            titre,
            type: "AUTRE",
            statut: newStatut,
            sellsyBdcId: bdcId,
            sellsyBdcRef: bdcRef,
            sellsyStatut: sellsyStatus,
            contactNom: contactName,
            contactId,
            description,
            assigneId,
            creePar: userId,
            ...(dateDoc ? { createdAt: dateDoc } : {}),
          },
        });
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      found: ordersToImport.length,
      created,
      updated,
      assignedFromOwner,
      customFieldsMatched: savCfs.map((cf) => ({
        id: cf.id,
        label: cf.label || cf.name || cf.code,
      })),
    });
  } catch (error: any) {
    console.error("[SAV sync] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la synchronisation" },
      { status: 500 }
    );
  }
}
