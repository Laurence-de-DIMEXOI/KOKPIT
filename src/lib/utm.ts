export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}

export interface ClickIdParams {
  fbclid?: string;
  gclid?: string;
}

/**
 * Parse UTM parameters from a URL
 */
export function parseUtmParams(url: string): UtmParams {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    return {
      source: params.get("utm_source") || undefined,
      medium: params.get("utm_medium") || undefined,
      campaign: params.get("utm_campaign") || undefined,
      content: params.get("utm_content") || undefined,
      term: params.get("utm_term") || undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Parse Meta (Facebook) click ID from URL
 */
export function parseMetaClickId(url: string): string | undefined {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("fbclid") || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Parse Google click ID from URL
 */
export function parseGclid(url: string): string | undefined {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("gclid") || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Extract all click IDs from a URL
 */
export function parseClickIds(url: string): ClickIdParams {
  return {
    fbclid: parseMetaClickId(url),
    gclid: parseGclid(url),
  };
}
