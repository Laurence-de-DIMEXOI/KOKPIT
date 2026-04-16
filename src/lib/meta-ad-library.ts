/**
 * Client Meta Ad Library API.
 *
 * Docs : https://www.facebook.com/ads/library/api
 * Auth : App Access Token (format `{app_id}|{app_secret}`) — n'expire pas.
 *        ⚠️ Ne PAS utiliser META_ACCESS_TOKEN (user token) qui expire.
 * Rate limit : 200 appels/h par app.
 * Couverture : toutes les pubs commerciales FR/UE depuis août 2023 (DSA).
 */

const META_GRAPH_URL = "https://graph.facebook.com/v19.0";

function getAppAccessToken(): string {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error(
      "META_APP_ID et META_APP_SECRET sont requis pour l'API Ad Library. " +
        "Les configurer sur Vercel (pas de user token).",
    );
  }
  return `${appId}|${appSecret}`;
}

export function isMetaAdLibraryConfigured(): boolean {
  return !!(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

// ────────────────────────────────────────────────────────────────────────────
// Résolution Page ID depuis une URL Facebook
// ────────────────────────────────────────────────────────────────────────────

/**
 * Extrait le slug (username ou id) depuis une URL Facebook.
 * Formats supportés :
 *   - facebook.com/{slug}
 *   - facebook.com/pages/{name}/{id}
 *   - facebook.com/profile.php?id={id}
 *   - fb.com/{slug}
 *   - m.facebook.com/{slug}
 */
export function extractPageSlugFromUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (!/facebook\.com$|fb\.com$/.test(u.hostname.replace(/^(www|m|web)\./, ""))) {
      return null;
    }
    // profile.php?id=XXX
    const idParam = u.searchParams.get("id");
    if (u.pathname.startsWith("/profile.php") && idParam) return idParam;
    // /pages/{name}/{id}
    const pagesMatch = u.pathname.match(/^\/pages\/[^/]+\/(\d+)/);
    if (pagesMatch) return pagesMatch[1];
    // /{slug} ou /{slug}/
    const slugMatch = u.pathname.match(/^\/([^/?#]+)/);
    if (slugMatch) return slugMatch[1];
    return null;
  } catch {
    return null;
  }
}

/**
 * Résout un Page ID depuis un slug via l'API Graph.
 * Retourne `{ id, name }` ou null si non résolu.
 */
export async function resolvePageId(
  slug: string,
): Promise<{ id: string; name: string } | null> {
  try {
    const url = new URL(`${META_GRAPH_URL}/${encodeURIComponent(slug)}`);
    url.searchParams.set("fields", "id,name");
    url.searchParams.set("access_token", getAppAccessToken());
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[meta-ad-library] resolvePageId(${slug}) HTTP ${res.status}: ${body.slice(0, 200)}`);
      return null;
    }
    const data = (await res.json()) as { id?: string; name?: string; error?: unknown };
    if (data.error || !data.id) {
      console.warn(`[meta-ad-library] resolvePageId(${slug}) error:`, data.error);
      return null;
    }
    return { id: data.id, name: data.name || slug };
  } catch (e) {
    console.warn(`[meta-ad-library] resolvePageId(${slug}) fetch error:`, (e as Error).message);
    return null;
  }
}

/**
 * Fallback HTML : parse la page FB publique pour extraire le Page ID via
 * `<meta property="al:android:url" content="fb://page/{id}">` ou JSON-LD.
 * Utile si l'API Graph échoue (slug masqué, page restreinte…).
 */
export async function resolvePageIdFromHtml(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    // 1) al:android:url → fb://page/{id}
    const alMatch = html.match(/al:android:url"\s+content="fb:\/\/page\/(\d+)/);
    if (alMatch) return alMatch[1];
    // 2) "pageID":"{id}" dans le bundle JS
    const pageIdMatch = html.match(/"pageID":"(\d{6,})"/);
    if (pageIdMatch) return pageIdMatch[1];
    // 3) entity_id
    const entityMatch = html.match(/"entity_id":"(\d{6,})"/);
    if (entityMatch) return entityMatch[1];
    return null;
  } catch {
    return null;
  }
}

/**
 * Résout un Page ID depuis une URL Facebook avec double fallback :
 *   1. API Graph via le slug extrait
 *   2. Parsing HTML de la page publique
 */
export async function resolvePageIdFromUrl(
  pageUrl: string,
): Promise<{ pageId: string; name?: string } | null> {
  const slug = extractPageSlugFromUrl(pageUrl);
  if (!slug) return null;

  // Tentative 1 : API Graph
  if (isMetaAdLibraryConfigured()) {
    const viaApi = await resolvePageId(slug);
    if (viaApi) return { pageId: viaApi.id, name: viaApi.name };
  }

  // Tentative 2 : si le slug est déjà un ID numérique, on le retourne
  if (/^\d+$/.test(slug)) {
    return { pageId: slug };
  }

  // Tentative 3 : scraping HTML
  const viaHtml = await resolvePageIdFromHtml(pageUrl);
  if (viaHtml) return { pageId: viaHtml };

  return null;
}

// ────────────────────────────────────────────────────────────────────────────
// Ad Library — fetch des pubs d'une page
// ────────────────────────────────────────────────────────────────────────────

export interface AdLibraryAd {
  id: string;
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  ad_creative_link_captions?: string[];
  ad_snapshot_url?: string;
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  publisher_platforms?: string[];
  page_id?: string;
  page_name?: string;
}

export interface AdLibraryPage {
  data: AdLibraryAd[];
  paging?: { next?: string; cursors?: { after?: string } };
}

const AD_LIBRARY_FIELDS = [
  "id",
  "ad_creative_bodies",
  "ad_creative_link_titles",
  "ad_creative_link_captions",
  "ad_snapshot_url",
  "ad_delivery_start_time",
  "ad_delivery_stop_time",
  "publisher_platforms",
  "page_id",
  "page_name",
].join(",");

interface FetchAdsOptions {
  pageId: string;
  countries?: string[];        // défaut : FR + RE
  sinceISO?: string;           // ad_delivery_date_min
  activeStatus?: "ALL" | "ACTIVE" | "INACTIVE";
  limit?: number;              // 100 par page par défaut, max Meta 200
  maxPages?: number;           // safety cap (défaut 10 → 1000 pubs max)
}

/**
 * Récupère toutes les pubs d'une page (paginé) depuis l'Ad Library.
 * Respecte le rate limit via retry backoff sur 429.
 */
export async function fetchAdsForPage(opts: FetchAdsOptions): Promise<AdLibraryAd[]> {
  if (!isMetaAdLibraryConfigured()) {
    throw new Error("META_APP_ID/META_APP_SECRET manquants — impossible de requêter Ad Library");
  }
  const {
    pageId,
    countries = ["FR", "RE"],
    sinceISO = "2025-01-01",
    activeStatus = "ALL",
    limit = 100,
    maxPages = 10,
  } = opts;

  const url = new URL(`${META_GRAPH_URL}/ads_archive`);
  url.searchParams.set("search_page_ids", pageId);
  url.searchParams.set("ad_reached_countries", JSON.stringify(countries));
  url.searchParams.set("ad_active_status", activeStatus);
  url.searchParams.set("ad_delivery_date_min", sinceISO);
  url.searchParams.set("fields", AD_LIBRARY_FIELDS);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", getAppAccessToken());

  const all: AdLibraryAd[] = [];
  let next: string | null = url.toString();
  let pages = 0;

  while (next && pages < maxPages) {
    const res = await fetchWithRetry(next);
    const data = (await res.json()) as AdLibraryPage;
    if (Array.isArray(data.data)) all.push(...data.data);
    next = data.paging?.next || null;
    pages++;
  }

  return all;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.status === 429) {
        // Rate limit — backoff exponentiel (2s, 4s, 8s)
        const waitMs = 2000 * Math.pow(2, attempt);
        console.warn(`[meta-ad-library] 429 rate limited, retry dans ${waitMs}ms`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Meta Ad Library HTTP ${res.status}: ${body.slice(0, 300)}`);
      }
      return res;
    } catch (e) {
      lastError = e;
      if (attempt === maxRetries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw lastError ?? new Error("fetchWithRetry failed");
}
