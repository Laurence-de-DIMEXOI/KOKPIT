/**
 * Sellsy API v2 Client — Bois d'Orient
 *
 * Client séparé pour le Sellsy Bois d'Orient (enseigne qui ferme).
 * Même pattern que sellsy.ts mais avec credentials BDO.
 * Fichier temporaire — supprimable après migration terminée.
 */

const SELLSY_BASE_URL = "https://api.sellsy.com/v2";
const SELLSY_TOKEN_URL = "https://login.sellsy.com/oauth2/access-tokens";

// Cache du token BDO en mémoire (séparé de DIMEXOI)
let cachedTokenBdo: { access_token: string; expires_at: number } | null = null;

// ===== AUTHENTIFICATION =====

async function getAccessTokenBdo(): Promise<string> {
  if (cachedTokenBdo && Date.now() < cachedTokenBdo.expires_at - 60000) {
    return cachedTokenBdo.access_token;
  }

  const clientId = process.env.SELLSY_BDO_CLIENT_ID;
  const clientSecret = process.env.SELLSY_BDO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("SELLSY_BDO_CLIENT_ID et SELLSY_BDO_CLIENT_SECRET requis");
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
    throw new Error(`Sellsy BDO OAuth error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  cachedTokenBdo = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
  };

  return cachedTokenBdo.access_token;
}

// ===== CACHE API BDO =====

const CACHE_TTL = 5 * 60 * 1000;
const apiCacheBdo = new Map<string, { data: unknown; expiresAt: number }>();

export function invalidateSellsyBdoCache() {
  apiCacheBdo.clear();
}

// ===== HELPER API =====

async function sellsyFetchBdo<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const body = typeof options.body === "string" ? options.body : undefined;
  const cacheKey = body ? `${path}::${body}` : path;

  const cached = apiCacheBdo.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data as T;
  }

  const token = await getAccessTokenBdo();

  const response = await fetch(`${SELLSY_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // Retry sur 429 — max 3 tentatives avec backoff
  if (response.status === 429) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const waitMs = attempt * 15000;
      console.log(`[BDO] Sellsy 429 — attente ${waitMs / 1000}s (tentative ${attempt}/3)`);
      await new Promise((r) => setTimeout(r, waitMs));
      const retryToken = await getAccessTokenBdo();
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
        apiCacheBdo.set(cacheKey, { data: retryData, expiresAt: Date.now() + CACHE_TTL });
        return retryData;
      }
      if (retryResponse.status !== 429) {
        const errorBody = await retryResponse.text();
        throw new Error(`Sellsy BDO API ${retryResponse.status}: ${errorBody}`);
      }
    }
    throw new Error(`Sellsy BDO API 429: rate limit toujours dépassé après 3 tentatives`);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Sellsy BDO API ${response.status}: ${errorBody}`);
  }

  if (response.status === 204) return {} as T;

  const data = await response.json();
  apiCacheBdo.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL });
  return data;
}

// ===== TYPES =====

interface SellsyListResponse<T> {
  data: T[];
  pagination: {
    total: number;
    count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  };
}

export interface SellsyBdoContact {
  id: number;
  first_name?: string;
  last_name?: string;
  name?: string; // pour companies
  email?: string;
  phone_number?: string;
  mobile_number?: string;
  website?: string;
  note?: string;
  type?: string;
  addresses?: Array<{
    name?: string;
    part_1?: string;
    part_2?: string;
    zip?: string;
    city?: string;
    country?: string;
    is_invoicing_default?: boolean;
  }>;
}

export interface SellsyBdoDocument {
  id: number;
  number?: string; // numéro du document (FA-2024-001, etc.)
  reference?: string;
  status?: string;
  created?: string;
  due_date?: string;
  note?: string;
  amounts?: {
    total_incl_tax?: string;
    total_excl_tax?: string;
    currency?: string;
  };
  related?: Array<{ id: number; type: string }>;
  _embed?: {
    contact?: { first_name?: string; last_name?: string; email?: string };
    company?: { name?: string; email?: string };
  };
}

// ===== CONTACTS (Individuals) =====

export async function listAllIndividualsBdo(): Promise<SellsyBdoContact[]> {
  const pageSize = 100;
  const page1 = await sellsyFetchBdo<SellsyListResponse<SellsyBdoContact>>(
    `/individuals/search?limit=${pageSize}&offset=0`,
    { method: "POST", body: JSON.stringify({ filters: {} }) }
  );

  const all: SellsyBdoContact[] = [...page1.data];
  const total = page1.pagination.total;

  if (total > pageSize) {
    const offsets: number[] = [];
    for (let offset = pageSize; offset < total; offset += pageSize) {
      offsets.push(offset);
    }
    for (let i = 0; i < offsets.length; i += 5) {
      const batch = offsets.slice(i, i + 5);
      const results = await Promise.all(
        batch.map((offset) =>
          sellsyFetchBdo<SellsyListResponse<SellsyBdoContact>>(
            `/individuals/search?limit=${pageSize}&offset=${offset}`,
            { method: "POST", body: JSON.stringify({ filters: {} }) }
          )
        )
      );
      for (const res of results) all.push(...res.data);
    }
  }

  console.log(`[BDO] ${all.length} individuals récupérés (${Math.ceil(total / pageSize)} pages)`);
  return all;
}

// ===== CONTACTS (Companies) =====

export async function listAllCompaniesBdo(): Promise<SellsyBdoContact[]> {
  const pageSize = 100;
  const page1 = await sellsyFetchBdo<SellsyListResponse<SellsyBdoContact>>(
    `/companies/search?limit=${pageSize}&offset=0`,
    { method: "POST", body: JSON.stringify({ filters: {} }) }
  );

  const all: SellsyBdoContact[] = [...page1.data];
  const total = page1.pagination.total;

  if (total > pageSize) {
    const offsets: number[] = [];
    for (let offset = pageSize; offset < total; offset += pageSize) {
      offsets.push(offset);
    }
    for (let i = 0; i < offsets.length; i += 5) {
      const batch = offsets.slice(i, i + 5);
      const results = await Promise.all(
        batch.map((offset) =>
          sellsyFetchBdo<SellsyListResponse<SellsyBdoContact>>(
            `/companies/search?limit=${pageSize}&offset=${offset}`,
            { method: "POST", body: JSON.stringify({ filters: {} }) }
          )
        )
      );
      for (const res of results) all.push(...res.data);
    }
  }

  console.log(`[BDO] ${all.length} companies récupérées`);
  return all;
}

// ===== DOCUMENTS =====

async function searchDocumentsBdo(
  type: "invoices" | "orders" | "estimates",
  pageSize: number,
  offset: number,
  embed: string[] = []
): Promise<SellsyListResponse<SellsyBdoDocument>> {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", String(pageSize));
  searchParams.set("offset", String(offset));
  embed.forEach((e) => searchParams.append("embed[]", e));

  return sellsyFetchBdo<SellsyListResponse<SellsyBdoDocument>>(
    `/${type}/search?${searchParams.toString()}`,
    { method: "POST", body: JSON.stringify({ filters: {} }) }
  );
}

async function listAllDocumentsBdo(
  type: "invoices" | "orders" | "estimates"
): Promise<SellsyBdoDocument[]> {
  const pageSize = 100;
  const embed = ["contact", "company"];

  const page1 = await searchDocumentsBdo(type, pageSize, 0, embed);
  const all: SellsyBdoDocument[] = [...page1.data];
  const total = page1.pagination.total;

  if (total > pageSize) {
    const offsets: number[] = [];
    for (let offset = pageSize; offset < total; offset += pageSize) {
      offsets.push(offset);
    }
    for (let i = 0; i < offsets.length; i += 5) {
      const batch = offsets.slice(i, i + 5);
      const results = await Promise.all(
        batch.map((offset) => searchDocumentsBdo(type, pageSize, offset, embed))
      );
      for (const res of results) all.push(...res.data);
    }
  }

  console.log(`[BDO] ${all.length} ${type} récupérés`);
  return all;
}

export async function listAllInvoicesBdo(): Promise<SellsyBdoDocument[]> {
  return listAllDocumentsBdo("invoices");
}

export async function listAllOrdersBdo(): Promise<SellsyBdoDocument[]> {
  return listAllDocumentsBdo("orders");
}

export async function listAllEstimatesBdo(): Promise<SellsyBdoDocument[]> {
  return listAllDocumentsBdo("estimates");
}

// ===== DETAILS CONTACT =====

export async function fetchIndividualDetailsBdo(id: number): Promise<{
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
}> {
  const data = await sellsyFetchBdo<SellsyBdoContact>(
    `/individuals/${id}`
  );

  const address = data.addresses?.[0];

  return {
    nom: data.last_name || "Inconnu",
    prenom: data.first_name || "",
    email: data.email || "",
    telephone: data.phone_number || data.mobile_number || "",
    adresse: address ? [address.part_1, address.part_2].filter(Boolean).join(", ") : "",
    ville: address?.city || "",
  };
}

// ===== PDF DOWNLOAD =====

/**
 * Télécharge le PDF d'un document Sellsy BDO.
 * Retourne le Buffer du PDF.
 */
export async function downloadDocumentPdfBdo(
  docType: "invoices" | "orders" | "estimates",
  docId: number
): Promise<Buffer> {
  const token = await getAccessTokenBdo();

  const response = await fetch(`${SELLSY_BASE_URL}/${docType}/${docId}/document`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/pdf",
    },
  });

  if (!response.ok) {
    throw new Error(`[BDO] PDF download failed for ${docType}/${docId}: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
