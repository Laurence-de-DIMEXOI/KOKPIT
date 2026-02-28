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
  name: string;
  reference: string;
  description: string;
  reference_price_taxes_exc: number;
  reference_price_taxes_inc: number;
  purchase_amount: number;
  tax_id: number | null;
  unit_id: number | null;
  category_id: number | null;
  currency: string;
  is_archived: boolean;
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
  amounts?: SellsyAmounts;
  _embed?: {
    company?: { id: number; name: string };
    contact?: { id: number; first_name: string; last_name: string };
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
  amounts?: SellsyAmounts;
  _embed?: {
    company?: { id: number; name: string };
    contact?: { id: number; first_name: string; last_name: string };
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

export async function searchItems(filters: {
  name?: string;
  reference?: string;
  type?: string[];
  is_archived?: boolean;
}): Promise<SellsyListResponse<SellsyItem>> {
  return sellsyFetch<SellsyListResponse<SellsyItem>>("/items/search", {
    method: "POST",
    body: JSON.stringify({ filters }),
  });
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
}): Promise<SellsyListResponse<SellsyEstimate>> {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));
  if (params.order) searchParams.set("order", params.order);
  if (params.direction) searchParams.set("direction", params.direction);

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
  // Include amounts embed for orders
  searchParams.append("embed[]", "amounts");

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
  };
  limit?: number;
  offset?: number;
  order?: string;
  direction?: string;
}): Promise<SellsyListResponse<SellsyOrder>> {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));
  if (params.order) searchParams.set("order", params.order);
  if (params.direction) searchParams.set("direction", params.direction);

  const qs = searchParams.toString();
  return sellsyFetch<SellsyListResponse<SellsyOrder>>(
    `/orders/search${qs ? `?${qs}` : ""}`,
    {
      method: "POST",
      body: JSON.stringify({ filters: params.filters }),
    }
  );
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
