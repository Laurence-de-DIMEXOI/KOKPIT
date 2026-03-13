/**
 * Sellsy API v2 Client
 *
 * OAuth2 Client Credentials flow
 * Base URL: https://api.sellsy.com/v2
 * Token URL: https://login.sellsy.com/oauth2/access-tokens
 */

const SELLSY_BASE_URL = "https://api.sellsy.com/v2";
const SELLSY_TOKEN_URL = "https://login.sellsy.com/oauth2/access-tokens";

// Cache du token en mémoire
let cachedToken: { access_token: string; expires_at: number } | null = null;

// ===== AUTHENTIFICATION =====

async function getAccessToken(): Promise<string> {
  // Vérifier le cache (avec 60s de marge)
  if (cachedToken && Date.now() < cachedToken.expires_at - 60000) {
    return cachedToken.access_token;
  }

  const clientId = process.env.SELLSY_CLIENT_ID;
  const clientSecret = process.env.SELLSY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("SELLSY_CLIENT_ID et SELLSY_CLIENT_SECRET requis");
  }

  const response = await fetch(SELLSY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Sellsy OAuth error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
  };

  return cachedToken.access_token;
}

// ===== CACHE API =====

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const apiCache = new Map<string, { data: unknown; expiresAt: number }>();

function getCacheKey(path: string, body?: string): string {
  return body ? `${path}::${body}` : path;
}

/** Vider le cache Sellsy (appelé par le bouton Sync) */
export function invalidateSellsyCache() {
  apiCache.clear();
}

// ===== HELPER API =====

async function sellsyFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const body = typeof options.body === "string" ? options.body : undefined;
  const cacheKey = getCacheKey(path, body);

  // Vérifier le cache
  const cached = apiCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data as T;
  }

  const token = await getAccessToken();

  const response = await fetch(`${SELLSY_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // Retry automatique sur 429 (rate limit) — max 3 tentatives avec backoff
  if (response.status === 429) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const waitMs = attempt * 15000; // 15s, 30s, 45s
      console.log(`Sellsy 429 rate limit — attente ${waitMs / 1000}s (tentative ${attempt}/3)`);
      await new Promise((r) => setTimeout(r, waitMs));
      const retryToken = await getAccessToken();
      const retryResponse = await fetch(`${SELLSY_BASE_URL}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${retryToken}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
      if (retryResponse.ok) {
        if (retryResponse.status === 204) return {} as T;
        const retryData = await retryResponse.json();
        apiCache.set(cacheKey, { data: retryData, expiresAt: Date.now() + CACHE_TTL });
        return retryData;
      }
      if (retryResponse.status !== 429) {
        const errorBody = await retryResponse.text();
        throw new Error(`Sellsy API ${retryResponse.status}: ${errorBody}`);
      }
    }
    throw new Error(`Sellsy API 429: rate limit toujours dépassé après 3 tentatives`);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Sellsy API ${response.status}: ${errorBody}`);
  }

  // 204 No Content
  if (response.status === 204) return {} as T;

  const data = await response.json();

  // Mettre en cache
  apiCache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL });

  return data;
}

// ===== TYPES =====

export interface SellsyPagination {
  limit: number;
  total: number;
  count: number;
  offset: number | string;
}

export interface SellsyItem {
  id: number;
  type: "product" | "service" | "shipping" | "packaging";
  name: string | null;
  reference: string;
  description: string;
  reference_price: string;
  price_excl_tax: string;
  reference_price_taxes_exc: string;
  reference_price_taxes_inc: string;
  purchase_amount: string;
  is_reference_price_taxes_free: boolean;
  tax_id: number | null;
  unit_id: number | null;
  category_id: number;
  currency: string;
  standard_quantity: string;
  is_archived: boolean;
  is_declined: boolean;
  is_einvoicing_compliant: boolean;
  is_name_included_in_description: boolean;
  accounting_code_id: number | null;
  accounting_purchase_code_id: number | null;
  accounting_analytic_code: string | null;
  created: string;
  updated: string;
}

export interface SellsyAmounts {
  total_raw_excl_tax: number;
  total_after_discount_excl_tax: number;
  total_excl_tax: number;
  total_incl_tax: number;
  total_tax: number;
  total_packaging?: number;
  total_shipping?: number;
}

export interface SellsyOwnerEmbed {
  id: number;
  type: string; // "staff"
}

export interface SellsyRelated {
  id: number;
  type: string; // "individual" | "company" | "contact"
}

export interface SellsyEstimate {
  id: number;
  number: string;
  date: string;
  due_date: string;
  status: string;
  subject: string;
  contact_id: number;
  company_name: string;
  currency: string;
  created: string;
  owner_id?: number;
  owner?: SellsyOwnerEmbed;
  assigned_staff_id?: number;
  amounts?: SellsyAmounts;
  related?: SellsyRelated[];
  _embed?: {
    company?: { id: number; name: string };
    contact?: { id: number; first_name: string; last_name: string };
    owner?: SellsyOwnerEmbed;
  };
}

export interface SellsyOrder {
  id: number;
  number: string;
  date: string;
  due_date: string;
  status: string;
  order_status: string;
  subject: string;
  contact_id: number;
  company_name: string;
  currency: string;
  created: string;
  owner_id?: number;
  owner?: SellsyOwnerEmbed;
  assigned_staff_id?: number;
  amounts?: SellsyAmounts;
  related?: SellsyRelated[];
  _embed?: {
    company?: { id: number; name: string };
    contact?: { id: number; first_name: string; last_name: string };
    owner?: SellsyOwnerEmbed;
  };
}

interface SellsyListResponse<T> {
  data: T[];
  pagination: SellsyPagination;
}

// ===== DATE RANGE HELPERS =====

export interface DateRange {
  start: string; // ISO 8601 datetime
  end: string;
}

// ===== PRODUITS =====

export async function listItems(params?: {
  limit?: number;
  offset?: number;
}): Promise<SellsyListResponse<SellsyItem>> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));

  const qs = searchParams.toString();
  return sellsyFetch<SellsyListResponse<SellsyItem>>(
    `/items${qs ? `?${qs}` : ""}`
  );
}

export async function getItem(id: number): Promise<{ data: SellsyItem }> {
  return sellsyFetch<{ data: SellsyItem }>(`/items/${id}`);
}

export async function searchItems(params: {
  filters: {
    name?: string;
    reference?: string;
    type?: string[];
    is_archived?: boolean;
  };
  limit?: number;
  offset?: number | string;
}): Promise<SellsyListResponse<SellsyItem>> {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset !== undefined) searchParams.set("offset", String(params.offset));

  const qs = searchParams.toString();
  return sellsyFetch<SellsyListResponse<SellsyItem>>(
    `/items/search${qs ? `?${qs}` : ""}`,
    {
      method: "POST",
      body: JSON.stringify({ filters: params.filters }),
    }
  );
}

/**
 * Récupère TOUS les produits Sellsy (product + service uniquement, non archivés).
 * Exclut shipping et packaging. Pagination numérique standard.
 */
export async function listAllItems(): Promise<SellsyItem[]> {
  const all: SellsyItem[] = [];
  const pageSize = 100;
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const res = await searchItems({
      filters: {
        type: ["product", "service"],
        is_archived: false,
      },
      limit: pageSize,
      offset,
    });
    all.push(...res.data);
    total = res.pagination.total;
    offset += pageSize;
  }

  // Dédupliquer par ID (sécurité)
  const seen = new Set<number>();
  const unique = all.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  console.log(`Fetched ${unique.length} unique items out of ${all.length} (product/service, non-archived)`);
  return unique;
}

// ===== DEVIS (ESTIMATES) =====

export async function listEstimates(params?: {
  limit?: number;
  offset?: number;
  order?: string;
  direction?: string;
}): Promise<SellsyListResponse<SellsyEstimate>> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  if (params?.order) searchParams.set("order", params.order);
  if (params?.direction) searchParams.set("direction", params.direction);

  const qs = searchParams.toString();
  return sellsyFetch<SellsyListResponse<SellsyEstimate>>(
    `/estimates${qs ? `?${qs}` : ""}`
  );
}

export async function getEstimate(
  id: number
): Promise<{ data: SellsyEstimate }> {
  return sellsyFetch<{ data: SellsyEstimate }>(`/estimates/${id}`);
}

export async function searchEstimates(params: {
  filters: {
    status?: string[];
    contact_id?: number;
    created?: DateRange;
    date?: { start?: string; end?: string };
  };
  limit?: number;
  offset?: number;
  order?: string;
  direction?: string;
  embed?: string[];
}): Promise<SellsyListResponse<SellsyEstimate>> {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));
  if (params.order) searchParams.set("order", params.order);
  if (params.direction) searchParams.set("direction", params.direction);
  if (params.embed) {
    params.embed.forEach((e) => searchParams.append("embed[]", e));
  }

  const qs = searchParams.toString();
  return sellsyFetch<SellsyListResponse<SellsyEstimate>>(
    `/estimates/search${qs ? `?${qs}` : ""}`,
    {
      method: "POST",
      body: JSON.stringify({ filters: params.filters }),
    }
  );
}

// ===== BONS DE COMMANDE (ORDERS) =====

export async function listOrders(params?: {
  limit?: number;
  offset?: number;
  order?: string;
  direction?: string;
}): Promise<SellsyListResponse<SellsyOrder>> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  if (params?.order) searchParams.set("order", params.order);
  if (params?.direction) searchParams.set("direction", params.direction);

  const qs = searchParams.toString();
  return sellsyFetch<SellsyListResponse<SellsyOrder>>(
    `/orders${qs ? `?${qs}` : ""}`
  );
}

export async function getOrder(id: number): Promise<{ data: SellsyOrder }> {
  return sellsyFetch<{ data: SellsyOrder }>(`/orders/${id}`);
}

/**
 * Récupère les détails bruts d'un order en V2 (tous les champs, non typé)
 * pour diagnostiquer les champs de liaison disponibles.
 */
export async function getOrderRaw(id: number): Promise<Record<string, unknown>> {
  return sellsyFetch<Record<string, unknown>>(`/orders/${id}?embed[]=company&embed[]=contact`);
}

/**
 * Récupère les documents liés à un document via l'API V2.
 * Essaie /orders/{id}/linked-documents ou /estimates/{id}/linked-documents
 */
export async function getLinkedDocumentsV2(
  doctype: "estimate" | "order",
  id: number
): Promise<{ linked: Array<{ id: number; type: string; number: string }> } | null> {
  try {
    const result = await sellsyFetch<any>(`/${doctype}s/${id}/linked-documents`);
    return result;
  } catch {
    // Endpoint may not exist — fallback silently
    return null;
  }
}

export async function searchOrders(params: {
  filters: {
    status?: string[];
    order_status?: string[];
    contact_id?: number;
    date?: { start?: string; end?: string };
    created?: DateRange;
  };
  limit?: number;
  offset?: number;
  order?: string;
  direction?: string;
  embed?: string[];
}): Promise<SellsyListResponse<SellsyOrder>> {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));
  if (params.order) searchParams.set("order", params.order);
  if (params.direction) searchParams.set("direction", params.direction);
  if (params.embed) {
    params.embed.forEach((e) => searchParams.append("embed[]", e));
  }

  const qs = searchParams.toString();
  return sellsyFetch<SellsyListResponse<SellsyOrder>>(
    `/orders/search${qs ? `?${qs}` : ""}`,
    {
      method: "POST",
      body: JSON.stringify({ filters: params.filters }),
    }
  );
}

/**
 * Cherche les devis et BDC liés à un individual/company par le champ `related`.
 *
 * IMPORTANT : Les filtres `third_ids`, `contact_id`, `individual_ids` de l'API Sellsy V2
 * sont TOUS CASSÉS pour ce compte — ils retournent TOUS les documents.
 * La seule méthode fiable : récupérer les N derniers documents et filtrer
 * côté serveur par `related[].id`.
 *
 * @param thirdId - L'ID de l'individual ou company Sellsy
 * @param limit - Nombre de documents récents à scanner (défaut 200)
 */
export async function findDocumentsByRelated(
  thirdId: number,
  limit = 200
): Promise<{ estimates: SellsyEstimate[]; orders: SellsyOrder[] }> {
  // Récupérer les N derniers devis et BDC
  const [estimatesRes, ordersRes] = await Promise.all([
    searchEstimates({
      filters: {} as any,
      limit: Math.min(limit, 100),
      order: "created",
      direction: "desc",
    }),
    searchOrders({
      filters: {} as any,
      limit: Math.min(limit, 100),
      order: "created",
      direction: "desc",
    }),
  ]);

  // Filtrer par related[].id === thirdId
  const matchEstimates = (estimatesRes.data || []).filter((e) =>
    e.related?.some((r) => r.id === thirdId)
  );

  const matchOrders = (ordersRes.data || []).filter((o) =>
    o.related?.some((r) => r.id === thirdId)
  );

  console.log(`[findDocsByRelated] thirdId=${thirdId}: ${matchEstimates.length}/${estimatesRes.data?.length || 0} devis, ${matchOrders.length}/${ordersRes.data?.length || 0} BDC`);

  return { estimates: matchEstimates, orders: matchOrders };
}

// ===== ENTREPRISES (COMPANIES) =====

export interface SellsyCompany {
  id: number;
  name: string;
  email: string;
  phone: string;
  type: string;
  status: string;
  created: string;
  updated: string;
  note?: string;
  website?: string;
}

export async function listCompanies(params?: {
  limit?: number;
  offset?: number;
  order?: string;
  direction?: string;
}): Promise<SellsyListResponse<SellsyCompany>> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  if (params?.order) searchParams.set("order", params.order);
  if (params?.direction) searchParams.set("direction", params.direction);

  const qs = searchParams.toString();
  return sellsyFetch<SellsyListResponse<SellsyCompany>>(
    `/companies${qs ? `?${qs}` : ""}`
  );
}

export async function searchCompanies(params: {
  filters: {
    name?: string;
    created?: DateRange;
  };
  limit?: number;
  offset?: number;
  order?: string;
  direction?: string;
}): Promise<SellsyListResponse<SellsyCompany>> {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));
  if (params.order) searchParams.set("order", params.order);
  if (params.direction) searchParams.set("direction", params.direction);

  const qs = searchParams.toString();
  return sellsyFetch<SellsyListResponse<SellsyCompany>>(
    `/companies/search${qs ? `?${qs}` : ""}`,
    {
      method: "POST",
      body: JSON.stringify({ filters: params.filters }),
    }
  );
}

// ===== INDIVIDUALS (PARTICULIERS B2C) =====

export interface SellsyIndividual {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  mobile_number: string;
  type: string;
  created: string;
  updated: string;
}

/**
 * Recherche un particulier (individual) dans Sellsy par email, téléphone ou nom.
 * Les individuals sont des clients B2C — les devis/BDC sont liés directement à eux.
 */
export async function searchIndividuals(filters: Record<string, unknown>): Promise<SellsyListResponse<SellsyIndividual>> {
  return sellsyFetch<SellsyListResponse<SellsyIndividual>>(
    `/individuals/search?limit=5`,
    {
      method: "POST",
      body: JSON.stringify({ filters }),
    }
  );
}

/**
 * Récupère TOUS les individuals Sellsy (particuliers B2C).
 * Utilise la pagination pour tout récupérer.
 */
export async function listAllIndividuals(): Promise<SellsyIndividual[]> {
  const pageSize = 100;
  const page1 = await sellsyFetch<SellsyListResponse<SellsyIndividual>>(
    `/individuals/search?limit=${pageSize}&offset=0`,
    { method: "POST", body: JSON.stringify({ filters: {} }) }
  );
  const all: SellsyIndividual[] = [...page1.data];
  const total = page1.pagination.total;
  if (total > pageSize) {
    for (let offset = pageSize; offset < total; offset += pageSize) {
      const res = await sellsyFetch<SellsyListResponse<SellsyIndividual>>(
        `/individuals/search?limit=${pageSize}&offset=${offset}`,
        { method: "POST", body: JSON.stringify({ filters: {} }) }
      );
      all.push(...res.data);
    }
  }
  console.log(`Fetched ${all.length} individuals (${Math.ceil(total / pageSize)} pages)`);
  return all;
}

// ===== CONTACTS (PERSONNES) =====

export interface SellsyContact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  created: string;
  updated: string;
}

/**
 * Récupère un contact Sellsy par ID, avec embed company ET individual.
 * Retourne le contact avec company_id ou individual_id si disponible.
 * En Sellsy V2, les documents sont liés aux "tiers" (third) qui peuvent être
 * une entreprise (company) OU un particulier (individual).
 */
export async function getContact(id: number): Promise<(SellsyContact & {
  company_id?: number;
  individual_id?: number;
  _embed?: {
    company?: { id: number; name: string };
    individual?: { id: number; name: string };
  };
}) | null> {
  // Essayer d'abord avec embed company + individual
  try {
    const res = await sellsyFetch<SellsyContact & {
      company_id?: number;
      individual_id?: number;
      _embed?: {
        company?: { id: number; name: string };
        individual?: { id: number; name: string };
      };
    }>(
      `/contacts/${id}?embed[]=company&embed[]=individual`
    );
    return res || null;
  } catch {
    // Si embed cause une 400, fallback progressif
    try {
      const res = await sellsyFetch<SellsyContact & {
        company_id?: number;
        individual_id?: number;
        _embed?: {
          company?: { id: number; name: string };
        };
      }>(
        `/contacts/${id}?embed[]=company`
      );
      return res || null;
    } catch {
      // Dernier essai sans embed
      try {
        const res = await sellsyFetch<SellsyContact & {
          company_id?: number;
          individual_id?: number;
        }>(
          `/contacts/${id}`
        );
        return res || null;
      } catch {
        return null;
      }
    }
  }
}

/**
 * Cherche un contact Sellsy par email.
 * Retourne le premier contact trouvé ou null.
 */
export async function searchContactByEmail(email: string): Promise<SellsyContact | null> {
  try {
    const res = await sellsyFetch<SellsyListResponse<SellsyContact>>(
      `/contacts/search?limit=1`,
      {
        method: "POST",
        body: JSON.stringify({ filters: { email } }),
      }
    );
    return res.data?.[0] || null;
  } catch {
    return null;
  }
}

/**
 * Recherche multi-critères d'un contact/individual Sellsy.
 * Essaie : email → téléphone → nom/prénom.
 * Cherche dans CONTACTS ET INDIVIDUALS (particuliers B2C).
 *
 * IMPORTANT : Les documents Sellsy (devis, BDC) sont liés aux "tiers" (third_ids).
 * - Pour un contact, le tiers est la company liée.
 * - Pour un individual, l'individual EST le tiers directement.
 *
 * Retourne { thirdId, resolvedVia, entityType } ou null.
 */
export async function findSellsyContact(params: {
  email?: string | null;
  telephone?: string | null;
  nom?: string | null;
  prenom?: string | null;
}): Promise<{
  contact: SellsyContact | SellsyIndividual;
  resolvedVia: "email" | "phone" | "name";
  entityType: "contact" | "individual";
  thirdId: number | null; // L'ID du tiers pour chercher les documents
} | null> {
  // Normaliser l'email en lowercase (les commerciaux saisissent parfois en MAJUSCULES)
  if (params.email) {
    params = { ...params, email: params.email.toLowerCase().trim() };
  }

  // Helper : normaliser un téléphone en variants (0/262/+262)
  function phoneVariants(tel: string): string[] {
    const phone = tel.replace(/[\s\-\.+]+/g, "");
    const variants = [phone];
    if (phone.startsWith("0")) variants.push("262" + phone.slice(1));
    if (phone.startsWith("262")) variants.push("0" + phone.slice(3));
    return variants;
  }

  // Helper : distance de Levenshtein pour matching souple
  function levenshtein(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const m: number[][] = [];
    for (let j = 0; j <= b.length; j++) {
      m[j] = [];
      for (let i = 0; i <= a.length; i++) {
        if (j === 0) { m[j][i] = i; continue; }
        if (i === 0) { m[j][i] = j; continue; }
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        m[j][i] = Math.min(m[j][i - 1] + 1, m[j - 1][i] + 1, m[j - 1][i - 1] + cost);
      }
    }
    return m[b.length][a.length];
  }

  // Helper : vérifier que le prénom correspond (souple — gère "Cécile" vs "Celine", typos etc.)
  function prenomMatch(found: string, expected: string | null | undefined): boolean {
    if (!expected) return true; // Pas de prénom à vérifier
    const a = found.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const b = expected.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // Match exact (sans accents)
    if (a === b) return true;
    // Match par distance d'édition ≤ 2 (gère Cécile/Celine, fautes de frappe)
    if (Math.abs(a.length - b.length) <= 2 && levenshtein(a, b) <= 2) return true;
    // Match par préfixe commun (Jean-François → Jean, Marie-Claire → Marie)
    const aBase = a.split(/[-\s]/)[0];
    const bBase = b.split(/[-\s]/)[0];
    if (aBase === bBase && aBase.length >= 3) return true;
    return false;
  }

  // ============================================
  // A. Chercher dans les INDIVIDUALS (B2C)
  //    Les individuals SONT les tiers directement
  // ============================================

  // A1. Par email
  if (params.email) {
    try {
      const res = await searchIndividuals({ email: params.email });
      if (res.data?.[0]) {
        return {
          contact: res.data[0] as any,
          resolvedVia: "email",
          entityType: "individual",
          thirdId: res.data[0].id,
        };
      }
    } catch { /* email search not supported or failed */ }
  }

  // A2. Par téléphone (essayer les deux noms de champ possibles)
  if (params.telephone) {
    for (const variant of phoneVariants(params.telephone)) {
      for (const field of ["phone", "mobile", "phone_number"]) {
        try {
          const res = await searchIndividuals({ [field]: variant });
          if (res.data?.[0]) {
            return {
              contact: res.data[0] as any,
              resolvedVia: "phone",
              entityType: "individual",
              thirdId: res.data[0].id,
            };
          }
        } catch { /* essayer le champ suivant */ }
      }
    }
  }

  // A3. Par nom (essayer "name" pour le nom complet, car individuals n'ont peut-être pas first_name/last_name comme filtres)
  if (params.nom) {
    // Essai 1 : filtre "name" (nom complet)
    const nameVariants = [
      params.prenom ? `${params.prenom} ${params.nom}` : params.nom,
      params.prenom ? `${params.nom} ${params.prenom}` : null,
      params.nom, // Juste le nom de famille
    ].filter(Boolean);
    for (const nameQuery of nameVariants) {
      try {
        const res = await searchIndividuals({ name: nameQuery });
        if (res.data?.[0]) {
          const match = res.data.find((i: any) => {
            const fname = i.first_name || (i as any).name?.split(' ')[0] || '';
            return prenomMatch(fname, params.prenom);
          });
          if (match) {
            return {
              contact: match as any,
              resolvedVia: "name",
              entityType: "individual",
              thirdId: match.id,
            };
          }
        }
      } catch { /* essayer le variant suivant */ }
    }
    // Essai 2 : filtres séparés last_name/first_name (au cas où)
    try {
      const filters: Record<string, string> = { last_name: params.nom };
      if (params.prenom) filters.first_name = params.prenom;
      const res = await searchIndividuals(filters);
      if (res.data?.[0]) {
        return { contact: res.data[0] as any, resolvedVia: "name", entityType: "individual", thirdId: res.data[0].id };
      }
    } catch { /* pas supporté */ }
  }

  // A4. Chercher dans les COMPANIES par nom (B2C = company de type "individual/person")
  if (params.nom) {
    try {
      const nameQuery = params.prenom ? `${params.prenom} ${params.nom}` : params.nom;
      const res = await searchCompanies({ filters: { name: nameQuery }, limit: 5 });
      if (res.data?.[0]) {
        // Pour les companies, l'ID de la company EST le thirdId
        return {
          contact: res.data[0] as any,
          resolvedVia: "name",
          entityType: "individual", // C'est un tiers direct
          thirdId: res.data[0].id,
        };
      }
      // Aussi essayer juste le nom de famille
      if (params.prenom) {
        const res2 = await searchCompanies({ filters: { name: params.nom }, limit: 5 });
        const companyMatch = res2.data?.find((c) => {
          const nameParts = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/);
          const prenomNorm = (params.prenom || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return nameParts.some(part => part.length >= 3 && prenomNorm.length >= 3 && part.substring(0, 3) === prenomNorm.substring(0, 3));
        });
        if (companyMatch) {
          return {
            contact: companyMatch as any,
            resolvedVia: "name",
            entityType: "individual",
            thirdId: companyMatch.id,
          };
        }
      }
    } catch { /* company search failed */ }
  }

  // ============================================
  // B. Chercher dans les CONTACTS (B2B)
  //    Pour les contacts, il faut ensuite trouver la company liée
  // ============================================

  // B1. Par email
  if (params.email) {
    const c = await searchContactByEmail(params.email);
    if (c) {
      const thirdId = await resolveContactThirdId(c.id);
      return { contact: c, resolvedVia: "email", entityType: "contact", thirdId };
    }
  }

  // B2. Par téléphone
  if (params.telephone) {
    try {
      for (const variant of phoneVariants(params.telephone)) {
        const res = await sellsyFetch<SellsyListResponse<SellsyContact>>(
          `/contacts/search?limit=1`,
          { method: "POST", body: JSON.stringify({ filters: { phone_number: variant } }) }
        );
        if (res.data?.[0]) {
          const thirdId = await resolveContactThirdId(res.data[0].id);
          return { contact: res.data[0], resolvedVia: "phone", entityType: "contact", thirdId };
        }
      }
    } catch { /* silently fail */ }
  }

  // B3. Par nom + prénom (vérifier le prénom !)
  if (params.nom) {
    try {
      const filters: Record<string, string> = { last_name: params.nom };
      if (params.prenom) filters.first_name = params.prenom;
      const res = await sellsyFetch<SellsyListResponse<SellsyContact>>(
        `/contacts/search?limit=5`,
        { method: "POST", body: JSON.stringify({ filters }) }
      );
      const match = res.data?.find((c) => prenomMatch(c.first_name, params.prenom));
      if (match) {
        const thirdId = await resolveContactThirdId(match.id);
        return { contact: match, resolvedVia: "name", entityType: "contact", thirdId };
      }
    } catch { /* silently fail */ }
  }

  return null;
}

/**
 * Résout le third_id (company) pour un contact Sellsy.
 * Appelle getContact avec embed pour trouver la company liée.
 */
async function resolveContactThirdId(contactId: number): Promise<number | null> {
  try {
    const detail = await getContact(contactId);
    return detail?.company_id
      || detail?._embed?.company?.id
      || (detail as any)?.individual_id
      || detail?._embed?.individual?.id
      || null;
  } catch {
    return null;
  }
}

export async function listContacts(params?: {
  limit?: number;
  offset?: number;
  order?: string;
  direction?: string;
}): Promise<SellsyListResponse<SellsyContact>> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  if (params?.order) searchParams.set("order", params.order);
  if (params?.direction) searchParams.set("direction", params.direction);

  const qs = searchParams.toString();
  return sellsyFetch<SellsyListResponse<SellsyContact>>(
    `/contacts${qs ? `?${qs}` : ""}`
  );
}

/**
 * Récupère TOUS les contacts Sellsy en paginant automatiquement.
 * Retourne null si l'API contacts n'est pas accessible.
 */
export async function listAllContacts(): Promise<SellsyContact[] | null> {
  try {
    const allContacts: SellsyContact[] = [];
    const pageSize = 100;
    let offset = 0;
    let total = Infinity;

    while (offset < total) {
      const res = await listContacts({
        limit: pageSize,
        offset,
        order: "created",
        direction: "desc",
      });
      allContacts.push(...res.data);
      total = res.pagination.total;
      offset += pageSize;
    }

    return allContacts;
  } catch {
    console.warn("Sellsy contacts API non disponible, fallback companies");
    return null;
  }
}

/**
 * Récupère TOUTES les entreprises Sellsy en paginant.
 * Note: pas de order/direction — cause 400 sur certains comptes Sellsy
 */
export async function listAllCompanies(): Promise<SellsyCompany[]> {
  const all: SellsyCompany[] = [];
  const pageSize = 100;
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const res = await listCompanies({ limit: pageSize, offset });
    all.push(...res.data);
    total = res.pagination.total;
    offset += pageSize;
  }

  return all;
}

/**
 * Récupère TOUS les devis Sellsy depuis une date donnée (défaut: 6 mois).
 * Page 1 en séquentiel pour connaître le total, puis pages 2-N en parallèle.
 */
export async function listAllEstimates(since?: string): Promise<SellsyEstimate[]> {
  const pageSize = 100;
  // Pas de limite de date par défaut — tout l'historique Sellsy
  const sinceDate = since || undefined;

  const filters: Record<string, any> = {};
  if (sinceDate) filters.date = { start: sinceDate };

  // Page 1 — séquentielle pour connaître le total
  const page1 = await searchEstimates({
    filters,
    limit: pageSize,
    offset: 0,
    order: "created",
    direction: "desc",
  });

  const all: SellsyEstimate[] = [...page1.data];
  const total = page1.pagination.total;

  // Pages restantes — en parallèle (max 5 simultanées)
  if (total > pageSize) {
    const remainingPages: number[] = [];
    for (let offset = pageSize; offset < total; offset += pageSize) {
      remainingPages.push(offset);
    }

    // Batch par 5 pour ne pas surcharger l'API
    for (let i = 0; i < remainingPages.length; i += 5) {
      const batch = remainingPages.slice(i, i + 5);
      const results = await Promise.all(
        batch.map((offset) =>
          searchEstimates({
            filters,
            limit: pageSize,
            offset,
            order: "created",
            direction: "desc",
          })
        )
      );
      for (const res of results) {
        all.push(...res.data);
      }
    }
  }

  console.log(`Fetched ${all.length} estimates (${sinceDate ? `since ${sinceDate}` : "all"}, ${Math.ceil(total / pageSize)} pages)`);
  return all;
}

/**
 * Récupère TOUS les bons de commande Sellsy (tout l'historique).
 * Page 1 en séquentiel pour connaître le total, puis pages 2-N en parallèle.
 */
export async function listAllOrders(since?: string): Promise<SellsyOrder[]> {
  const pageSize = 100;
  // Pas de limite de date par défaut — tout l'historique Sellsy
  const sinceDate = since || undefined;

  const filters: Record<string, any> = {};
  if (sinceDate) filters.date = { start: sinceDate };

  // Page 1 — séquentielle pour connaître le total
  const page1 = await searchOrders({
    filters,
    limit: pageSize,
    offset: 0,
  });

  const all: SellsyOrder[] = [...page1.data];
  const total = page1.pagination.total;

  // Pages restantes — en parallèle (max 5 simultanées)
  if (total > pageSize) {
    const remainingPages: number[] = [];
    for (let offset = pageSize; offset < total; offset += pageSize) {
      remainingPages.push(offset);
    }

    for (let i = 0; i < remainingPages.length; i += 5) {
      const batch = remainingPages.slice(i, i + 5);
      const results = await Promise.all(
        batch.map((offset) =>
          searchOrders({
            filters,
            limit: pageSize,
            offset,
          })
        )
      );
      for (const res of results) {
        all.push(...res.data);
      }
    }
  }

  console.log(`Fetched ${all.length} orders (${sinceDate ? `since ${sinceDate}` : "all"}, ${Math.ceil(total / pageSize)} pages)`);
  return all;
}

// ===== STAFFS (Collaborateurs) =====

export interface SellsyStaff {
  id: number;
  firstname: string;
  lastname: string;
  email?: string;
  status?: string; // "ok" | "blocked"
}

export async function listStaffs(): Promise<SellsyStaff[]> {
  try {
    const res = await sellsyFetch<SellsyListResponse<SellsyStaff>>("/staffs?limit=100");
    return res.data;
  } catch (err) {
    console.warn("Staffs API non disponible:", err);
    return [];
  }
}

// ===== API V1 VIA TOKEN V2 =====
// Ref: https://help.sellsy.com/fr/articles/8544417-utiliser-l-api-v1-via-des-acces-api-v2
// Prérequis : activer le scope "API V1" dans Sellsy > Paramètres > Portail développeur

const SELLSY_V1_URL = "https://apifeed.sellsy.com/0/";

export async function sellsyV1Call(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
  const token = await getAccessToken();

  const doIn = JSON.stringify({ method, params });
  const formData = new FormData();
  formData.append("request", "1");
  formData.append("io_mode", "json");
  formData.append("do_in", doIn);

  const response = await fetch(SELLSY_V1_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Sellsy V1 ${response.status}: ${err}`);
  }

  const data = await response.json();

  if (data.status === "error") {
    const errDetail = typeof data.error === "object" ? JSON.stringify(data.error) : (data.error || JSON.stringify(data));
    throw new Error(`Sellsy V1 error: ${errDetail}`);
  }

  return data.response;
}

export interface DocumentParentInfo {
  parentid: string | null;
  linkedid: string | null;
  linkedtype: string | null;
}

/**
 * Récupère les infos de parenté d'un document via l'API V1.
 * doctype: "estimate" | "order" | "delivery" | "invoice"
 * docid: l'ID Sellsy du document
 */
export async function getDocumentParent(
  doctype: string,
  docid: string
): Promise<DocumentParentInfo | null> {
  try {
    const result = await sellsyV1Call("Document.getOne", { doctype, docid }) as Record<string, unknown>;

    return {
      parentid: result.parentid ? String(result.parentid) : null,
      linkedid: result.linkedid ? String(result.linkedid) : null,
      linkedtype: result.linkedtype ? String(result.linkedtype) : null,
    };
  } catch (err) {
    console.warn(`getDocumentParent(${doctype}, ${docid}) failed:`, err);
    return null;
  }
}

// ===== UTILITAIRE DE TEST =====

export async function testConnection(): Promise<{
  success: boolean;
  message: string;
  itemsCount?: number;
}> {
  try {
    const result = await listItems({ limit: 1 });
    return {
      success: true,
      message: `Connecté à Sellsy. ${result.pagination.total} produits trouvés.`,
      itemsCount: result.pagination.total,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Erreur de connexion à Sellsy",
    };
  }
}
