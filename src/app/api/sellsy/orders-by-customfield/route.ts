import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sellsyFetch, searchOrders } from "@/lib/sellsy";

/**
 * GET /api/sellsy/orders-by-customfield?name=SAV[&since=YYYY-MM-DD]
 *
 * 1) Découvre le `cf_id` du champ perso "SAV" (ou autre via ?name=) côté Sellsy.
 * 2) Itère tous les BDC (paginate) avec `embed[]=customfields`.
 * 3) Renvoie ceux dont la valeur SAV est non vide.
 *
 * Réservé aux admins / direction / Laurence.
 */

interface CustomFieldDef {
  id: number;
  code?: string;
  name?: string;
  label?: string;
  type?: string;
  related_type?: string;
  related_object_type?: string;
}

interface CustomFieldValue {
  cf_id: number;
  value: unknown;
}

function valueToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
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
  const s = valueToString(v).trim();
  return s.length > 0 && s !== "null" && s !== "false" && s !== "0";
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const email = session?.user?.email;
  if (
    !session?.user ||
    (email !== "laurence.payet@dimexoi.fr" &&
      email !== "admin@kokpit.re" &&
      !["ADMIN", "DIRECTION"].includes(role))
  ) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const url = new URL(request.url);
  const name = (url.searchParams.get("name") || "SAV").trim();
  const sinceParam = url.searchParams.get("since"); // optionnel YYYY-MM-DD
  const untilParam = url.searchParams.get("until"); // optionnel YYYY-MM-DD
  // Par défaut : 2025-01-01 → 2026-12-31 (la demande utilisateur "2025 et 2026")
  const since = sinceParam || "2025-01-01";
  const until = untilParam || "2026-12-31";

  // ====== ÉTAPE 1 : découvrir le cf_id du champ ======
  let allCfs: CustomFieldDef[] = [];
  try {
    let offset = 0;
    const limit = 100;
    while (true) {
      const res = await sellsyFetch<{ data: CustomFieldDef[]; pagination?: { total?: number } }>(
        `/custom-fields?limit=${limit}&offset=${offset}`
      );
      const batch = res.data || [];
      allCfs = allCfs.concat(batch);
      if (batch.length < limit) break;
      offset += limit;
      if (offset > 1000) break; // safety
    }
  } catch (e) {
    return NextResponse.json(
      { error: "Impossible de lister les custom fields Sellsy", detail: (e as Error).message },
      { status: 500 }
    );
  }

  const lower = name.toLowerCase();
  const matchingCfs = allCfs.filter(
    (cf) =>
      (cf.code && cf.code.toLowerCase().includes(lower)) ||
      (cf.name && cf.name.toLowerCase().includes(lower)) ||
      (cf.label && cf.label.toLowerCase().includes(lower))
  );

  // Privilégier ceux liés aux orders
  const orderRelated = matchingCfs.filter((cf) => {
    const t = (cf.related_type || cf.related_object_type || "").toLowerCase();
    return t.includes("order") || t.includes("item") || t.includes("document");
  });
  const targets = orderRelated.length > 0 ? orderRelated : matchingCfs;

  if (targets.length === 0) {
    return NextResponse.json({
      error: `Aucun champ perso Sellsy ne contient "${name}"`,
      hint: "Vérifie l'orthographe ou regarde la liste des custom fields ci-dessous",
      customFieldsSample: allCfs.slice(0, 50).map((cf) => ({
        id: cf.id,
        code: cf.code,
        name: cf.name,
        label: cf.label,
        related_type: cf.related_type || cf.related_object_type,
      })),
    }, { status: 404 });
  }

  const targetIds = new Set(targets.map((t) => t.id));

  // ====== ÉTAPE 2 : iter tous les BDC ======
  type FilteredOrder = {
    id: number;
    number: string;
    status: string;
    statusLabel: string;
    date: string | null;
    created: string;
    company_name: string;
    total_excl_tax: number;
    total: number;
    savValue: string;
    cfMatched: { id: number; label: string };
  };

  const results: FilteredOrder[] = [];
  const limit = 100;
  let offset = 0;

  const filters: Record<string, unknown> = {};
  filters.date = { start: since, end: until };

  while (true) {
    const res = await searchOrders({
      filters: filters as any,
      limit,
      offset,
      order: "created",
      direction: "desc",
      embed: ["customfields"],
    });
    const batch = res.data || [];

    for (const order of batch) {
      // Le tableau peut être à la racine OU dans _embed selon les versions
      const cfArr: CustomFieldValue[] =
        ((order as any).custom_fields_values as CustomFieldValue[]) ||
        ((order as any)._embed?.custom_fields_values as CustomFieldValue[]) ||
        [];

      const matchedCf = cfArr.find((v) => targetIds.has(v.cf_id) && isNonEmpty(v.value));
      if (!matchedCf) continue;

      const cfDef = targets.find((t) => t.id === matchedCf.cf_id);
      results.push({
        id: order.id,
        number: order.number,
        status: order.status,
        statusLabel: order.status, // Sellsy renvoie déjà un label lisible
        date: (order as any).date || null,
        created: (order as any).created || "",
        company_name: order.company_name || "",
        total_excl_tax: Number(order.amounts?.total_excl_tax || 0),
        total: Number(order.amounts?.total_incl_tax || 0),
        savValue: valueToString(matchedCf.value),
        cfMatched: { id: matchedCf.cf_id, label: cfDef?.label || cfDef?.name || cfDef?.code || "?" },
      });
    }

    const total = res.pagination?.total ?? batch.length;
    offset += batch.length;
    if (batch.length < limit || offset >= total) break;
    if (offset > 10000) break; // safety
  }

  // ====== ÉTAPE 3 : agrégation par statut ======
  const parStatut = new Map<string, number>();
  let caTotal = 0;
  for (const r of results) {
    parStatut.set(r.status, (parStatut.get(r.status) || 0) + 1);
    caTotal += r.total_excl_tax;
  }

  return NextResponse.json({
    customFieldName: name,
    matchedCustomFields: targets.map((t) => ({
      id: t.id,
      label: t.label || t.name || t.code,
      related: t.related_type || t.related_object_type,
    })),
    count: results.length,
    caTotalHT: Math.round(caTotal * 100) / 100,
    parStatut: Object.fromEntries(parStatut),
    orders: results,
  });
}
