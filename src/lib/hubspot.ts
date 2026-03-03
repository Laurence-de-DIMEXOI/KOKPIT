/**
 * HubSpot API Client
 *
 * Private App Token authentication (EU region)
 * Base URL: https://api.hubapi.com
 *
 * Endpoints utilisés :
 * - GET /crm/v3/objects/contacts — Liste des contacts
 * - GET /crm/v3/objects/deals — Liste des deals (devis/commandes)
 * - GET /crm/v3/objects/contacts/:id/associations/deals — Deals d'un contact
 */

const HUBSPOT_BASE_URL = "https://api.hubapi.com";

function getToken(): string {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    throw new Error("HUBSPOT_ACCESS_TOKEN non configuré");
  }
  return token;
}

async function hubspotFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${HUBSPOT_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`HubSpot API ${response.status}: ${errorBody}`);
  }

  return response.json();
}

// ===== TYPES =====

export interface HubSpotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    company?: string;
    lifecyclestage?: string;
    hs_lead_status?: string;
    createdate?: string;
    lastmodifieddate?: string;
    num_associated_deals?: string;
    // UTM / source
    hs_analytics_source?: string;
    hs_analytics_first_url?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HubSpotDeal {
  id: string;
  properties: {
    dealname?: string;
    dealstage?: string;
    pipeline?: string;
    amount?: string;
    closedate?: string;
    createdate?: string;
    lastmodifieddate?: string;
    hs_analytics_source?: string;
    // Custom fields
    num_associated_contacts?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface HubSpotListResponse<T> {
  results: T[];
  paging?: {
    next?: {
      after: string;
      link: string;
    };
  };
}

// ===== CONTACTS =====

export async function listContacts(params?: {
  limit?: number;
  after?: string;
  properties?: string[];
}): Promise<HubSpotListResponse<HubSpotContact>> {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", String(params?.limit || 100));

  if (params?.after) searchParams.set("after", params.after);

  const defaultProps = [
    "firstname",
    "lastname",
    "email",
    "phone",
    "company",
    "lifecyclestage",
    "hs_lead_status",
    "createdate",
    "lastmodifieddate",
    "num_associated_deals",
    "hs_analytics_source",
    "utm_source",
    "utm_medium",
    "utm_campaign",
  ];

  const properties = params?.properties || defaultProps;
  for (const prop of properties) {
    searchParams.append("properties", prop);
  }

  return hubspotFetch<HubSpotListResponse<HubSpotContact>>(
    `/crm/v3/objects/contacts?${searchParams.toString()}`
  );
}

export async function getContact(
  id: string,
  properties?: string[]
): Promise<HubSpotContact> {
  const searchParams = new URLSearchParams();
  const props = properties || [
    "firstname",
    "lastname",
    "email",
    "phone",
    "company",
    "lifecyclestage",
    "hs_lead_status",
    "createdate",
    "num_associated_deals",
    "hs_analytics_source",
    "utm_source",
    "utm_medium",
    "utm_campaign",
  ];
  for (const prop of props) {
    searchParams.append("properties", prop);
  }

  return hubspotFetch<HubSpotContact>(
    `/crm/v3/objects/contacts/${id}?${searchParams.toString()}`
  );
}

export async function searchContacts(params: {
  query?: string;
  filters?: Array<{
    propertyName: string;
    operator: string;
    value: string;
  }>;
  limit?: number;
  after?: number;
}): Promise<HubSpotListResponse<HubSpotContact> & { total: number }> {
  const body: any = {
    limit: params.limit || 100,
    properties: [
      "firstname",
      "lastname",
      "email",
      "phone",
      "company",
      "lifecyclestage",
      "hs_lead_status",
      "createdate",
      "num_associated_deals",
      "hs_analytics_source",
      "utm_source",
      "utm_medium",
      "utm_campaign",
    ],
  };

  if (params.query) body.query = params.query;
  if (params.after) body.after = params.after;
  if (params.filters) {
    body.filterGroups = [{ filters: params.filters }];
  }

  return hubspotFetch<HubSpotListResponse<HubSpotContact> & { total: number }>(
    `/crm/v3/objects/contacts/search`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

// ===== DEALS =====

export async function listDeals(params?: {
  limit?: number;
  after?: string;
  properties?: string[];
}): Promise<HubSpotListResponse<HubSpotDeal>> {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", String(params?.limit || 100));

  if (params?.after) searchParams.set("after", params.after);

  const defaultProps = [
    "dealname",
    "dealstage",
    "pipeline",
    "amount",
    "closedate",
    "createdate",
    "lastmodifieddate",
    "hs_analytics_source",
  ];

  const properties = params?.properties || defaultProps;
  for (const prop of properties) {
    searchParams.append("properties", prop);
  }

  return hubspotFetch<HubSpotListResponse<HubSpotDeal>>(
    `/crm/v3/objects/deals?${searchParams.toString()}`
  );
}

export async function getDeal(
  id: string,
  properties?: string[]
): Promise<HubSpotDeal> {
  const searchParams = new URLSearchParams();
  const props = properties || [
    "dealname",
    "dealstage",
    "pipeline",
    "amount",
    "closedate",
    "createdate",
    "hs_analytics_source",
  ];
  for (const prop of props) {
    searchParams.append("properties", prop);
  }

  return hubspotFetch<HubSpotDeal>(
    `/crm/v3/objects/deals/${id}?${searchParams.toString()}`
  );
}

// ===== ASSOCIATIONS =====

export async function getContactDeals(
  contactId: string
): Promise<{ results: Array<{ id: string; type: string }> }> {
  return hubspotFetch<{ results: Array<{ id: string; type: string }> }>(
    `/crm/v3/objects/contacts/${contactId}/associations/deals`
  );
}

// ===== PIPELINE =====

export async function getDealPipelines(): Promise<{
  results: Array<{
    id: string;
    label: string;
    stages: Array<{ id: string; label: string; displayOrder: number }>;
  }>;
}> {
  return hubspotFetch(
    `/crm/v3/pipelines/deals`
  );
}

// ===== TEST =====

export async function testConnection(): Promise<{
  success: boolean;
  message: string;
  contactsCount?: number;
  dealsCount?: number;
}> {
  try {
    const [contacts, deals] = await Promise.all([
      listContacts({ limit: 1 }),
      listDeals({ limit: 1 }),
    ]);

    return {
      success: true,
      message: "Connecté à HubSpot",
      contactsCount: contacts.results.length,
      dealsCount: deals.results.length,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Erreur de connexion à HubSpot",
    };
  }
}
