/**
 * Cache persistant via Supabase (table stock_cache).
 * Partagé entre toutes les instances Vercel et tous les utilisateurs.
 * TTL configurable. Tombe en fallback sur in-memory si DB inaccessible.
 */

import { prisma } from "./prisma";
import { ApiCache } from "./api-cache";

const TTL_MS = 30 * 60 * 1000; // 30 minutes

// Fallback in-memory en cas d'erreur DB
const memoryFallback = new ApiCache(TTL_MS);

export const dbStockCache = {
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const row = await prisma.stockCache.findUnique({ where: { key } });
      if (!row) return null;
      if (row.expiresAt < new Date()) {
        // Expiré — supprimer en arrière-plan
        prisma.stockCache.delete({ where: { key } }).catch(() => {});
        return null;
      }
      return row.data as T;
    } catch {
      // DB inaccessible → fallback mémoire
      return memoryFallback.get(key) as T | null;
    }
  },

  async set<T = any>(key: string, data: T): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TTL_MS);
    try {
      await prisma.stockCache.upsert({
        where: { key },
        update: { data: data as any, cachedAt: now, expiresAt },
        create: { key, data: data as any, cachedAt: now, expiresAt },
      });
      // Aussi stocker en mémoire pour les appels rapides de la même instance
      memoryFallback.set(key, data);
    } catch {
      // DB inaccessible → stocker uniquement en mémoire
      memoryFallback.set(key, data);
    }
  },

  async getStale<T = any>(key: string): Promise<{ data: T; fresh: boolean } | null> {
    try {
      const row = await prisma.stockCache.findUnique({ where: { key } });
      if (!row) {
        const mem = memoryFallback.getStale(key);
        return mem ? { data: mem.data as T, fresh: mem.fresh } : null;
      }
      const fresh = row.expiresAt > new Date();
      return { data: row.data as T, fresh };
    } catch {
      const mem = memoryFallback.getStale(key);
      return mem ? { data: mem.data as T, fresh: mem.fresh } : null;
    }
  },
};
