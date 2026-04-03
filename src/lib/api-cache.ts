/**
 * Cache mémoire serveur simple pour les routes API.
 * Évite de re-appeler Sellsy à chaque chargement de page.
 *
 * Utilisation :
 *   const cache = new ApiCache<MyType>(10 * 60 * 1000); // 10 minutes
 *   const cached = cache.get("my-key");
 *   if (cached) return cached;
 *   const data = await fetchFromSellsy();
 *   cache.set("my-key", data);
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class ApiCache<T = any> {
  private store = new Map<string, CacheEntry<T>>();
  private ttl: number;

  constructor(ttlMs: number) {
    this.ttl = ttlMs;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T): void {
    this.store.set(key, { data, timestamp: Date.now() });
  }

  invalidate(key?: string): void {
    if (key) {
      this.store.delete(key);
    } else {
      this.store.clear();
    }
  }

  /** Retourne les données même expirées (stale-while-revalidate) */
  getStale(key: string): { data: T; fresh: boolean } | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    const fresh = Date.now() - entry.timestamp <= this.ttl;
    return { data: entry.data, fresh };
  }
}

// ===== Caches globaux partagés =====

/** Estimates (devis Sellsy) — 10 minutes */
export const estimatesCache = new ApiCache(10 * 60 * 1000);

/** Orders (BDC Sellsy) — 10 minutes */
export const ordersCache = new ApiCache(10 * 60 * 1000);

/** Items (produits catalogue) — 1 heure (ne changent presque jamais) */
export const itemsCache = new ApiCache(60 * 60 * 1000);

/** Funnel — 10 minutes */
export const funnelCache = new ApiCache(10 * 60 * 1000);

/** Stock (tous les produits) — 30 minutes */
export const stockCache = new ApiCache(30 * 60 * 1000);
