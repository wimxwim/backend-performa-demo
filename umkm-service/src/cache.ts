// umkm-service/src/cache.ts — Branch 03b CACHE API
// Redis Cache-Aside dengan TTL per-endpoint + tiering hot/warm/cold + invalidate
// Bahasa komentar: Indonesia
// Sumber: Modul Performa Bab 4 (Redis) + spec lock 7 Fondasi + SLA 16 endpoint

import Redis from 'ioredis';
import { createLogger } from '../../shared/logger.js';

const logger = createLogger('umkm-cache');

// ──────────────────────────────────────────────
// Redis client — ioredis, auto-reconnect, lazyConnect false agar fail fast di dev
// REDIS_URL: redis://localhost:6379 (compose) atau Upstash di Fase 2
// ──────────────────────────────────────────────
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 2,
  enableReadyCheck: true,
  retryStrategy: (times) => Math.min(times * 100, 2000),
});

redis.on('connect', () => logger.info('redis connected'));
redis.on('error', (err) => logger.error({ err: err.message }, 'redis error'));
redis.on('close', () => logger.warn('redis closed'));

// ──────────────────────────────────────────────
// TTL Table — per-endpoint, sesuai spec lock SLA (detik)
// ──────────────────────────────────────────────
export const TTL = {
  profil: 5 * 60,        // 5 menit — Fondasi #2 (profil)
  komunitas: 10 * 60,    // 10 menit — GET /api/komunitas/:id (SLA p50 <30ms)
  komunitas_list: 5 * 60,// 5 menit — GET /api/komunitas (list)
  pengumuman: 60,        // 1 menit — GET /api/pengumuman (ORDER BY pinned)
  pengumuman_detail: 5 * 60, // 5 menit — GET /api/pengumuman/:id
  jadwal: 60 * 60,       // 1 jam — GET /api/jadwal-sholat (endpoint tercepat, TTL terpanjang)
  laporan: 5 * 60,       // 5 menit — GET /api/kas laporan
  feature_flag: 30,      // 30 detik — Fondasi #7 (kill-switch, cache di memory + Redis)
  cari: 5 * 60,          // 5 menit — GET /api/cari (pencarian populer)
  umkm_list: 2 * 60,     // 2 menit — GET /api/umkm list
  umkm_detail: 5 * 60,   // 5 menit — GET /api/umkm/:id
} as const;

// ──────────────────────────────────────────────
// Tiering — hot/warm/cold untuk cache hit rate >80%
// hot  = 1 detik  — data yang berubah tiap detik (leaderboard, real-time)
// warm = 1 menit  — data semi-statis (pengumuman, cari populer)
// cold = 1 jam    — data jarang berubah (jadwal sholat, kategori)
// ──────────────────────────────────────────────
export const TIER_TTL = {
  hot: 1,          // 1 detik
  warm: 60,        // 1 menit
  cold: 60 * 60,   // 1 jam
} as const;

export type CacheTier = keyof typeof TIER_TTL;

// ──────────────────────────────────────────────
// Metrics — counter hit/miss (di-export via shared/metrics.ts prom-client)
// Di sini simpan lokal + log, prom-client di metrics.ts
// ──────────────────────────────────────────────
let hitCount = 0;
let missCount = 0;

export function getCacheStats() {
  const total = hitCount + missCount;
  return { hits: hitCount, misses: missCount, total, hitRate: total ? hitCount / total : 0 };
}

// ──────────────────────────────────────────────
// getCached — Cache-Aside pattern (bukan Write-Behind untuk kas)
// Flow: GET key -> hit ? return : fetcher() -> SETEX key ttl -> return
// Cache-Aside = aplikasi yang kontrol cache, bukan DB trigger
// Kelebihan: hanya cache yang diminta, TTL fleksibel per-endpoint
// ──────────────────────────────────────────────
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number,
  tier: CacheTier = 'warm'
): Promise<{ data: T; hit: boolean; tier: CacheTier }> {
  const start = Date.now();
  try {
    const hit = await redis.get(key);
    if (hit !== null) {
      hitCount++;
      const latency = Date.now() - start;
      logger.info({ key, tier, latency_ms: latency, hitRate: getCacheStats().hitRate.toFixed(2) }, 'cache HIT');
      // Lazy import metrics agar tidak circular
      try {
        const { cacheHitTotal } = await import('../../shared/metrics.js');
        cacheHitTotal.inc({ tier, hit: 'true' });
      } catch {}
      return { data: JSON.parse(hit) as T, hit: true, tier };
    }
  } catch (err: any) {
    logger.warn({ err: err.message, key }, 'redis GET gagal — fallback ke fetcher');
  }

  // MISS — panggil fetcher (query DB)
  missCount++;
  const fetchStart = Date.now();
  const data = await fetcher();
  const fetchLatency = Date.now() - fetchStart;

  try {
    await redis.setex(key, ttl, JSON.stringify(data));
    logger.info({ key, tier, ttl, fetch_latency_ms: fetchLatency }, 'cache MISS — setex');
    try {
      const { cacheHitTotal } = await import('../../shared/metrics.js');
      cacheHitTotal.inc({ tier, hit: 'false' });
    } catch {}
  } catch (err: any) {
    logger.warn({ err: err.message, key }, 'redis SETEX gagal — return data tanpa cache');
  }

  return { data, hit: false, tier };
}

// ──────────────────────────────────────────────
// invalidate — hapus cache saat POST/PUT/DELETE (Cache-Aside)
// Contoh: setelah POST /api/kas, invalidate kas:{community_id}:*
// ──────────────────────────────────────────────
export async function invalidate(pattern: string): Promise<number> {
  try {
    const keys = await redis.keys(pattern);
    if (!keys.length) return 0;
    const n = await redis.del(...keys);
    logger.info({ pattern, keys: keys.length, deleted: n }, 'cache invalidate');
    return n;
  } catch (err: any) {
    logger.warn({ err: err.message, pattern }, 'invalidate gagal');
    return 0;
  }
}

export async function invalidateExact(key: string): Promise<number> {
  try {
    const n = await redis.del(key);
    if (n) logger.info({ key }, 'cache invalidate exact');
    return n;
  } catch {
    return 0;
  }
}

// ──────────────────────────────────────────────
// createCache — factory untuk shared/cache.ts tiering
// ──────────────────────────────────────────────
export function createCache(redisClient: Redis, defaultTtl: number) {
  return {
    getCached: <T>(key: string, fetcher: () => Promise<T>, ttl = defaultTtl, tier: CacheTier = 'warm') =>
      getCached<T>(key, fetcher, ttl, tier),
    invalidate: (pattern: string) => invalidate(pattern),
    invalidateExact: (key: string) => invalidateExact(key),
    stats: () => getCacheStats(),
    redis: redisClient,
  };
}

export default { redis, TTL, TIER_TTL, getCached, invalidate, invalidateExact, getCacheStats, createCache };
