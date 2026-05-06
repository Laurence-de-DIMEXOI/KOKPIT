import { BetaAnalyticsDataClient } from "@google-analytics/data";

/**
 * Client GA4 Data API — utilise un service account.
 * Variables d'env requises :
 *   - GA4_PROPERTY_ID         : ID numérique de la propriété GA4 (Admin → Détails de la propriété)
 *   - GA4_SERVICE_ACCOUNT_JSON: tout le JSON du service account, sur une seule ligne (échapper \n du private_key)
 */

let cachedClient: BetaAnalyticsDataClient | null = null;

function getClient(): BetaAnalyticsDataClient | null {
  if (cachedClient) return cachedClient;
  const raw = process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const credentials = JSON.parse(raw);
    cachedClient = new BetaAnalyticsDataClient({ credentials });
    return cachedClient;
  } catch (e) {
    console.error("[GA4] Service account JSON invalide:", (e as Error).message);
    return null;
  }
}

function propertyName(): string | null {
  const id = process.env.GA4_PROPERTY_ID;
  return id ? `properties/${id}` : null;
}

export interface GA4PageViews {
  pagePath: string;
  pageTitle: string;
  views: number;
  activeUsers: number;
}

/**
 * Compte les vues d'une page (ou de pages dont le path matche un substring) sur une période.
 * @param pathContains - substring à chercher dans pagePath (ex: "teckdays", "/teck-days")
 * @param startDate    - YYYY-MM-DD ou format relatif "30daysAgo"
 * @param endDate      - YYYY-MM-DD ou "today"
 */
export async function getPageViewsByPath(
  pathContains: string,
  startDate: string = "30daysAgo",
  endDate: string = "today"
): Promise<{ total: number; users: number; pages: GA4PageViews[] } | null> {
  const client = getClient();
  const property = propertyName();
  if (!client || !property) return null;

  try {
    const [response] = await client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
      dimensionFilter: {
        filter: {
          fieldName: "pagePath",
          stringFilter: { matchType: "CONTAINS", value: pathContains, caseSensitive: false },
        },
      },
      limit: 50,
    });

    const pages: GA4PageViews[] =
      response.rows?.map((row) => ({
        pagePath: row.dimensionValues?.[0]?.value || "",
        pageTitle: row.dimensionValues?.[1]?.value || "",
        views: parseInt(row.metricValues?.[0]?.value || "0", 10),
        activeUsers: parseInt(row.metricValues?.[1]?.value || "0", 10),
      })) || [];

    const total = pages.reduce((s, p) => s + p.views, 0);
    const users = pages.reduce((s, p) => s + p.activeUsers, 0);
    return { total, users, pages };
  } catch (e) {
    console.error(`[GA4] runReport ${pathContains}:`, (e as Error).message);
    return null;
  }
}
