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
  cf_id?: number;
  id?: number;
  code?: string;
  name?: string;
  label?: string;
  value: unknown;
  formatted_value?: unknown;
}

/**
 * Le champ perso identifiant un SAV côté Sellsy s'appelle :
 *   "Etat des produit" (variantes possibles : "État des produits", "Etat produit"…)
 *
 * On match sur n'importe quel CF dont le code/name/label contient "etat" et "produit"
 * (insensible à la casse / aux accents). On garde aussi un fallback "sav".
 *
 * Ce comportement peut être surchargé via le query param `?cfName=...` qui prend
 * un substring (ex: ?cfName=etat).
 */
function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function cfMatchesSav(cf: CustomFieldValue, override?: string): boolean {
  const fields = [cf.code, cf.name, cf.label].filter(Boolean) as string[];
  if (!fields.length) return false;
  const normalized = fields.map((v) => normalize(v));

  if (override) {
    const o = normalize(override);
    return normalized.some((v) => v.includes(o));
  }

  return normalized.some(
    (v) =>
      (v.includes("etat") && v.includes("produit")) ||
      v === "sav" ||
      v.includes("sav")
  );
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
  const url = new URL(req.url);
  const cfNameOverride = url.searchParams.get("cfName") || undefined;
  // On ne garde que les BDC dont la valeur du champ contient "sav" (case/accent insensitive)
  // override possible via ?value=...
  const cfValueFilter = (url.searchParams.get("value") || "sav").toLowerCase();

  try {
    // ====== 1. Mapping users KOKPIT par email (pour assigneId) ======
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

    // ====== 2. Itération paginée des BDC avec embed customfields + owner + contact ======
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

    // Diagnostic : capter les noms de CF rencontrés + les valeurs prises par "Etat des produit"
    const seenCfNames = new Set<string>();
    const seenSavValues = new Set<string>();
    let totalScanned = 0;

    let offset = 0;
    const limit = 100;
    while (true) {
      const res = await searchOrders({
        filters: {} as any,
        limit,
        offset,
        order: "created",
        direction: "desc",
        embed: ["customfields", "contact", "company"],
      });
      const batch = res.data || [];
      totalScanned += batch.length;
      for (const order of batch) {
        const o = order as any;
        // Sellsy V2 peut renvoyer ces champs sous différents noms selon la version
        const cfArr: CustomFieldValue[] =
          (o.custom_fields_values as CustomFieldValue[]) ||
          (o.custom_field_values as CustomFieldValue[]) ||
          (o.customFieldValues as CustomFieldValue[]) ||
          (o.customfields as CustomFieldValue[]) ||
          (o._embed?.custom_fields_values as CustomFieldValue[]) ||
          (o._embed?.custom_field_values as CustomFieldValue[]) ||
          (o._embed?.customfields as CustomFieldValue[]) ||
          [];

        for (const cf of cfArr) {
          for (const k of [cf.code, cf.name, cf.label].filter(Boolean) as string[]) {
            seenCfNames.add(k);
          }
          // Capter les valeurs du champ "Etat des produit" (ou override) pour debug
          if (cfMatchesSav(cf, cfNameOverride)) {
            const v = valueToString(cf.value);
            if (v) seenSavValues.add(v);
          }
        }

        const matched = cfArr.find((cf) => {
          if (!cfMatchesSav(cf, cfNameOverride)) return false;
          if (!isNonEmpty(cf.value)) return false;
          // Filtrer aussi sur la valeur — par défaut "sav"
          const valStr = normalize(valueToString(cf.value));
          return valStr.includes(normalize(cfValueFilter));
        });
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
      ordersScanned: totalScanned,
      found: ordersToImport.length,
      created,
      updated,
      assignedFromOwner,
      // Si 0 trouvés : noms des champs perso + valeurs "Etat des produit" rencontrés
      ...(ordersToImport.length === 0
        ? {
            customFieldNamesSeen: Array.from(seenCfNames).sort(),
            etatProduitValuesSeen: Array.from(seenSavValues).sort(),
            filterUsed: { cfName: cfNameOverride || "etat des produit / sav", value: cfValueFilter },
          }
        : {}),
    });
  } catch (error: any) {
    console.error("[SAV sync] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la synchronisation" },
      { status: 500 }
    );
  }
}
