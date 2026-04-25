import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sellsyFetch } from "@/lib/sellsy";
import { genererNumeroDossier } from "@/lib/sav-numero";

/**
 * Mapping statuts Sellsy → statuts SAV KOKPIT.
 * Règle Laurence (24 avril 2026) :
 *  - facturé → TRAITE
 *  - annulé  → CLOTURE
 *  - reste   → A_TRAITER
 */
function mapSellsyStatut(sellsyStatus: string): string {
  const s = (sellsyStatus || "").toLowerCase();
  if (["invoiced", "billed", "completed", "partialinvoiced", "advanced"].includes(s)) return "TRAITE";
  if (["cancelled", "canceled", "refused", "rejected", "expired"].includes(s)) return "CLOTURE";
  return "A_TRAITER";
}

interface CustomFieldDef {
  id: number;
  code?: string;
  name?: string;
  label?: string;
  type?: string;
  related_objects?: string[];
  parameters?: {
    items?: Array<{ id: number | string; label: string; checked?: boolean; rank?: number }>;
  };
}

interface CustomFieldOnOrder {
  id: number;        // cf_id
  code?: string;
  name?: string;
  label?: string;
  type?: string;
  value: unknown;
  parameters?: { items?: Array<{ id: number | string; label: string }> };
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Lit la valeur "humaine" d'un CF — résout les select/radio en label. */
function readCfValue(cf: CustomFieldOnOrder): string {
  if (cf.value == null) return "";
  if (typeof cf.value === "string" || typeof cf.value === "number" || typeof cf.value === "boolean") {
    const raw = String(cf.value).trim();
    // Si c'est un select/radio, mapper l'id de l'item vers son label
    const items = cf.parameters?.items || [];
    if (items.length > 0) {
      const matched = items.find((it) => String(it.id) === raw);
      if (matched) return matched.label;
    }
    return raw;
  }
  if (Array.isArray(cf.value)) {
    return cf.value.map((v) => (typeof v === "string" ? v : JSON.stringify(v))).join(", ");
  }
  return JSON.stringify(cf.value);
}

/**
 * POST /api/sav/sync-sellsy
 *
 * Trouve les BDC Sellsy avec le champ perso "Etat des produit" = "SAV"
 * et crée/MAJ les dossiers DossierSAV correspondants.
 *
 * Optimisation : limite la fenêtre de scan via ?since=YYYY-MM-DD (défaut 24 mois)
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const url = new URL(req.url);
  const cfNameOverride = url.searchParams.get("cfName") || "etat";
  const cfNameOverride2 = url.searchParams.get("cfName2") || "produit";
  const cfValueFilter = (url.searchParams.get("value") || "sav").toLowerCase();
  // Fenêtre temporelle pour limiter le nombre d'appels Sellsy
  const since = url.searchParams.get("since") || (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 24); // 24 mois par défaut
    return d.toISOString().slice(0, 10);
  })();

  try {
    // ====== ÉTAPE 1 : Découvrir le cf_id "Etat des produit" via /custom-fields ======
    let allCfs: CustomFieldDef[] = [];
    let cfOffset = 0;
    while (true) {
      const cfRes = await sellsyFetch<{ data: CustomFieldDef[]; pagination?: { total?: number } }>(
        `/custom-fields?limit=100&offset=${cfOffset}`
      );
      const batch = cfRes.data || [];
      allCfs = allCfs.concat(batch);
      const total = cfRes.pagination?.total ?? batch.length;
      cfOffset += batch.length;
      if (batch.length === 0 || cfOffset >= total) break;
      if (cfOffset > 1000) break;
    }

    const targetCfs = allCfs.filter((cf) => {
      const fields = [cf.code, cf.name, cf.label].filter(Boolean) as string[];
      const normalized = fields.map(normalize);
      const tokens = [normalize(cfNameOverride), normalize(cfNameOverride2)].filter(Boolean);
      return tokens.every((t) => normalized.some((v) => v.includes(t)));
    });

    if (targetCfs.length === 0) {
      return NextResponse.json(
        {
          error: `Aucun champ perso ne contient "${cfNameOverride}" + "${cfNameOverride2}"`,
          totalCustomFields: allCfs.length,
          customFieldsSample: allCfs.slice(0, 50).map((cf) => ({
            id: cf.id,
            name: cf.name,
            code: cf.code,
            label: cf.label,
            type: cf.type,
            related: cf.related_objects,
          })),
        },
        { status: 404 }
      );
    }

    // Privilégier ceux liés aux documents (orders/BDC)
    const docTargets = targetCfs.filter((cf) =>
      (cf.related_objects || []).some((r) => normalize(r).includes("document"))
    );
    const finalTargets = docTargets.length > 0 ? docTargets : targetCfs;
    const targetCfIds = new Set(finalTargets.map((t) => t.id));

    // Identifier l'item id correspondant à la valeur "SAV" dans les options de chaque CF
    const savItemIdsByCf = new Map<number, Set<string>>();
    for (const cf of finalTargets) {
      const items = cf.parameters?.items || [];
      const matchedItems = items
        .filter((it) => normalize(String(it.label)).includes(normalize(cfValueFilter)))
        .map((it) => String(it.id));
      if (matchedItems.length > 0) {
        savItemIdsByCf.set(cf.id, new Set(matchedItems));
      }
    }

    // ====== ÉTAPE 2 : Mapping users + contacts KOKPIT ======
    const allUsers = await prisma.user.findMany({ select: { id: true, email: true } });
    const userByEmail = new Map(allUsers.map((u) => [u.email.toLowerCase(), u.id]));

    const staffByOwnerId = new Map<number, string>();
    try {
      const staffRes = await sellsyFetch<{ data: Array<{ id: number; email?: string }> }>(
        "/staffs?limit=100"
      );
      for (const s of staffRes.data || []) {
        if (s.email) staffByOwnerId.set(s.id, s.email.toLowerCase());
      }
    } catch (e) {
      console.warn("[SAV sync] /staffs indisponible:", e);
    }

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

    // ====== ÉTAPE 3 : Lister les BDC dans la fenêtre ======
    type RawOrder = {
      id: number;
      number: string;
      status: string;
      date?: string;
      created?: string;
      subject?: string;
      company_name?: string;
      contact_id?: number;
      owner?: { id?: number };
      owner_id?: number;
    };

    const orders: RawOrder[] = [];
    let oOffset = 0;
    const oLimit = 100;
    while (true) {
      const res = await sellsyFetch<{ data: RawOrder[]; pagination?: { total?: number } }>(
        `/orders/search?limit=${oLimit}&offset=${oOffset}&order=created&direction=desc`,
        {
          method: "POST",
          body: JSON.stringify({ filters: { date: { start: since } } }),
        }
      );
      const batch = res.data || [];
      orders.push(...batch);
      const total = res.pagination?.total ?? batch.length;
      oOffset += batch.length;
      if (batch.length === 0 || oOffset >= total) break;
      if (oOffset > 5000) break; // safety
    }

    // ====== ÉTAPE 4 : Pour chaque BDC, fetch ses CFs et filtrer ======
    type Matched = { order: RawOrder; cfValueLabel: string };
    const matches: Matched[] = [];
    let totalCfQueries = 0;
    let cfErrors = 0;

    // Parallélisation par batch de 10 pour ne pas saturer Sellsy
    const PARALLEL = 10;
    for (let i = 0; i < orders.length; i += PARALLEL) {
      const slice = orders.slice(i, i + PARALLEL);
      const results = await Promise.allSettled(
        slice.map(async (order) => {
          const res = await sellsyFetch<{ data: CustomFieldOnOrder[] }>(
            `/orders/${order.id}/custom-fields?limit=100`
          );
          totalCfQueries++;
          const list = res.data || [];
          const target = list.find((cf) => targetCfIds.has(cf.id));
          if (!target) return null;
          if (target.value == null || target.value === "") return null;

          // 2 stratégies de matching :
          //  a) si on a mappé un item id pour "SAV" → vérifier que value === item id
          //  b) sinon, matcher la valeur lue (label ou texte) sur "sav"
          const itemIds = savItemIdsByCf.get(target.id);
          let matched = false;
          let label = "";
          if (itemIds && itemIds.has(String(target.value))) {
            matched = true;
            label = readCfValue(target);
          } else {
            const labelOrText = readCfValue(target);
            if (normalize(labelOrText).includes(normalize(cfValueFilter))) {
              matched = true;
              label = labelOrText;
            }
          }
          if (!matched) return null;
          return { order, cfValueLabel: label } as Matched;
        })
      );
      for (const r of results) {
        if (r.status === "fulfilled") {
          if (r.value) matches.push(r.value);
        } else {
          cfErrors++;
        }
      }
    }

    // ====== ÉTAPE 5 : Upsert DossierSAV ======
    let created = 0;
    let updated = 0;
    let assignedFromOwner = 0;

    for (const m of matches) {
      const order = m.order;
      const bdcId = String(order.id);
      const bdcRef = order.number || bdcId;
      const sellsyStatus = order.status || "draft";
      const newStatut = mapSellsyStatut(sellsyStatus);
      const subject = order.subject?.trim() || null;
      const contactName = order.company_name || null;
      const titre = subject ? `${bdcRef} — ${subject}` : `BDC ${bdcRef}`;
      const description = subject || null;
      const dateDoc = order.date
        ? new Date(order.date)
        : order.created
          ? new Date(order.created)
          : null;

      // Assigné via owner
      let assigneId: string | null = null;
      const ownerId = order.owner?.id || order.owner_id;
      if (ownerId) {
        const ownerEmail = staffByOwnerId.get(ownerId);
        if (ownerEmail) {
          const matchedUserId = userByEmail.get(ownerEmail);
          if (matchedUserId) {
            assigneId = matchedUserId;
            assignedFromOwner++;
          }
        }
      }

      const contactId = order.contact_id
        ? contactBySellsyId.get(String(order.contact_id)) || null
        : null;

      const existing = await prisma.dossierSAV.findFirst({
        where: { sellsyBdcId: bdcId, deletedAt: null },
      });

      if (existing) {
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
        // Numero du dossier — préfixé par la valeur du CF (ex: "SAV-BCDI-05741")
        let numero = `${m.cfValueLabel.toUpperCase()}-${bdcRef}`.replace(/\s+/g, "-");
        const collide = await prisma.dossierSAV.findUnique({
          where: { numero },
          select: { id: true },
        });
        if (collide) numero = await genererNumeroDossier();

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
      since,
      ordersScanned: orders.length,
      cfQueries: totalCfQueries,
      cfErrors,
      found: matches.length,
      created,
      updated,
      assignedFromOwner,
      cfsTargeted: finalTargets.map((t) => ({
        id: t.id,
        name: t.name || t.label || t.code,
        type: t.type,
        savItemIds: savItemIdsByCf.get(t.id) ? Array.from(savItemIdsByCf.get(t.id)!) : [],
      })),
    });
  } catch (error: any) {
    console.error("[SAV sync] Erreur:", error);
    return NextResponse.json(
      {
        error: error.message || "Erreur lors de la synchronisation",
        errorName: error.name,
        errorStack: typeof error.stack === "string" ? error.stack.split("\n").slice(0, 5) : undefined,
      },
      { status: 500 }
    );
  }
}
