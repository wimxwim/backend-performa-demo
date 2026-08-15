// shared/cache.ts — Factory cache tiering hot/warm/cold (dipakai umkm + kas service)
// Bahasa komentar: Indonesia
// Tiering: hot 1s (real-time), warm 1m (semi-statis), cold 1jam (jarang berubah)

import type { Redis } from 'ioredis';

export const TIER_TTL = {
  hot: 1,        // 1 detik  — leaderboard, real-time counter
  warm: 60,      // 1 menit  — pengumuman, pencarian populer
  cold: 60 * 60, // 1 jam    — jadwal sholat, kategori, komunitas
} as const;

export type CacheTier = keyof typeof TIER_TTL;

export const TTL = {
  profil: 5 * 60,
  komunitas: 10 * 60,
  komunitas_list: 5 * 60,
  pengumuman: 60,
  pengumuman_detail: 5 * 60,
  jadwal: 60 * 60,
  laporan: 5 * 60,
  feature_flag: 30,
  cari: 5 * 60,
  umkm_list: 2 * 60,
  umkm_detail: 5 * 60,
} as const;

// ──────────────────────────────────────────────
// createCache — factory: createCache(redis, defaultTtl) -> { getCached, invalidate, stats }
// Dipakai: const cache = createCache(redis, TTL.komunitas);
//          const { data, hit } = await cache.getCached(key, fetcher, TTL.komunitas, 'warm');
// ──────────────────────────────────────────────
export function createCache(redis: Redis, defaultTtl: number) {
  let hits = 0;
  let misses = 0;

  async function getCached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = defaultTtl,
    tier: CacheTier = 'warm'
  ): Promise<{ data: T; hit: boolean; tier: CacheTier }> {
    try {
      const raw = await redis.get(key);
      if (raw !== null) {
        hits++;
        return { data: JSON.parse(raw) as T, hit: true, tier };
      }
    } catch {
      // Redis down — fallback ke fetcher tanpa cache
    }
    misses++;
    const data = await fetcher();
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch {
      // SETEX gagal — tetap return data
    }
    return { data, hit: false, tier };
  }

  async function invalidate(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern);
      if (!keys.length) return 0;
      return await redis.del(...keys);
    } catch {
      return 0;
    }
  }

  async function invalidateExact(key: string): Promise<number> {
    try {
      return await redis.del(key);
    } catch {
      return 0;
    }
  }

  function stats() {
    const total = hits + misses;
    return { hits, misses, total, hitRate: total ? hits / total : 0 };
  }

  return { getCached, invalidate, invalidateExact, stats, redis, TTL, TIER_TTL };
}

export default createCache;
