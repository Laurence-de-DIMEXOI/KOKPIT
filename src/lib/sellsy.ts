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

// ===== HELPER API =====

async function sellsyFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  const response = await fetch(`${SELLSY_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Sellsy API ${response.status}: ${errorBody}`);
  }

  // 204 No Content
  if (response.status === 204) return {} as T;

  return response.json();
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
  amounts?: SellsyAmounts;
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
  amounts?: SellsyAmounts;
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
 * Récupère TOUS les devis Sellsy depuis une date donnée (défaut: 2024-01-01).
 * Utilise l'endpoint search avec filtre date pour limiter les résultats.
 */
export async function listAllEstimates(since?: string): Promise<SellsyEstimate[]> {
  const all: SellsyEstimate[] = [];
  const pageSize = 100;
  let offset = 0;
  let total = Infinity;
  const sinceDate = since || "2024-01-01";

  while (offset < total) {
    const res = await searchEstimates({
      filters: {
        date: { start: sinceDate },
      },
      limit: pageSize,
      offset,
      order: "created",
      direction: "desc",
      embed: ["owner"],
    });
    all.push(...res.data);
    total = res.pagination.total;
    offset += pageSize;
  }

  console.log(`Fetched ${all.length} estimates since ${sinceDate}`);
  return all;
}

/**
 * Récupère TOUS les bons de commande Sellsy depuis une date donnée (défaut: 2024-01-01).
 * Utilise l'endpoint search avec filtre date pour limiter les résultats.
 */
export async function listAllOrders(since?: string): Promise<SellsyOrder[]> {
  const all: SellsyOrder[] = [];
  const pageSize = 100;
  let offset = 0;
  let total = Infinity;
  const sinceDate = since || "2024-01-01";

  while (offset < total) {
    const res = await searchOrders({
      filters: {
        date: { start: sinceDate },
      },
      limit: pageSize,
      offset,
      embed: ["owner"],
    });
    all.push(...res.data);
    total = res.pagination.total;
    offset += pageSize;
  }

  console.log(`Fetched ${all.length} orders since ${sinceDate}`);
  return all;
}

// ===== STAFFS (Collaborateurs) =====

export interface SellsyStaff {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  is_active?: boolean;
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
