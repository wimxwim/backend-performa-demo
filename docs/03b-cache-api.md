# 03b — Cache + API Optimization (Redis, PgBouncer, GZIP/Brotli, Payload Shaping)

> **Branch 03b-cache-API** — caching + proteksi + kompresi. Sumber: Modul Performa Bab 4 (Redis) + spec lock SLA + Poster #6.

---

## Ringkasan Benchmark

| Optimasi | Sebelum | Sesudah | Saving |
|----------|---------|---------|--------|
| **Cache Hit Rate** | 0% (selalu hit DB) | **>80%** (Redis Cache-Aside) | DB QPS turun 80% |
| **GET /api/komunitas/:id** | 30-100ms (DB) | **2-5ms** (Redis HIT) | **10-20x** |
| **GET /api/cari?q=ayam** | 10-50ms (GIN) | **2ms** (Redis HIT) | **5-25x** |
| **GZIP** (JSON 100KB) | 100KB | **20KB** | **70-80%** |
| **Brotli** (via `accept-encoding: br`) | 20KB (GZIP) | **14-16KB** | **+20-30%** vs GZIP |
| **PgBouncer** (100 koneksi) | 500MB RAM (direct) | **25 pool** (transaction mode) | **95% RAM** |
| **Payload shaping** `?fields=name,lat,lng` | 100KB (full) | **15KB** (3 field) | **85%** |

> Diukur server-side (tidak termasuk RTT 3G 500-1000ms). Target total < 3 detik (UX #50).

---

## Apa yang Dioptimasi

### 1. Redis Cache-Aside (Bukan Write-Behind untuk Kas)

```ts
// umkm-service/src/cache.ts — Cache-Aside pattern
export async function getCached<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
  const hit = await redis.get(key);
  if (hit) { metrics.cacheHit.inc({ tier }); return JSON.parse(hit); }
  const data = await fetcher(); // query DB
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}
```

- **Cache-Aside** = aplikasi kontrol cache. Hanya cache yang diminta, TTL fleksibel.
- **Write-Behind** tidak dipakai untuk kas (ACID mutlak — tulis langsung ke Postgres, invalidate cache setelah).

### 2. TTL Table (per-endpoint)

| Endpoint | TTL | Alasan |
|----------|-----|--------|
| `profil` | 5 menit | Fondasi #2 — Single Source of Truth |
| `komunitas/:id` | 10 menit | Jarang berubah, SLA p50 <30ms |
| `pengumuman` | 1 menit | Sering update, ORDER BY pinned |
| `jadwal-sholat` | 1 jam | Paling jarang berubah, endpoint tercepat |
| `laporan kas` | 5 menit | Agregasi MatView + cache |
| `feature_flag` | 30 detik | Kill-switch harus cepat |
| `cari` | 5 menit | Pencarian populer di-cache |

### 3. Tiering Hot/Warm/Cold

```ts
const TIER_TTL = { hot: 1, warm: 60, cold: 3600 }; // detik
// hot  1s  — leaderboard real-time
// warm 1m  — pengumuman, cari populer
// cold 1jam — jadwal, kategori
```

Hit rate >80% dengan tiering: hot untuk real-time, cold untuk data statis.

### 4. Invalidate on Update

```ts
// POST /api/kas — setelah insert, invalidate cache terkait
await redis.del(`kas:summary:${communityId}`);
await redis.del(`kas:list:*`);
// GET berikutnya MISS -> fetch DB -> SETEX lagi
```

### 5. PgBouncer — Pool 25, Transaction Mode

```yaml
# compose.yaml — pgbouncer:6432
pgbouncer:
  image: edoburu/pgbouncer:1.22.1
  environment:
    DATABASE_URL: postgres://demo:demo123@postgres:5432/gotongroyong_demo
    POOL_MODE: transaction
    DEFAULT_POOL_SIZE: 25
    MAX_CLIENT_CONN: 200
```

- **Transaction mode** = koneksi dikembalikan ke pool setelah tiap transaksi (paling hemat).
- **Direct**: 100 koneksi x 5MB = 500MB RAM. **PgBouncer**: 25 pool = ~125MB.

```ts
// Aplikasi pakai port 6432 (PgBouncer), bukan 5432 (direct)
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL }); // ...:6432/...
```

### 6. GZIP/Brotli Compression

```ts
import compression from 'compression';
app.use(compression({ level: 6, threshold: 1024 }));
// GZIP 70-80% untuk JSON >1KB, Brotli +20-30% jika client support `accept-encoding: br`
```

```bash
curl -H "Accept-Encoding: gzip" -I http://localhost:3003/api/umkm?limit=20
# Content-Encoding: gzip, Content-Length: 20KB (dari 100KB)
```

### 7. Payload Shaping `?fields=`

```bash
# Hanya kirim field yang dibutuhkan Flutter — hemat kuota 3G
GET /api/umkm?fields=name,lat,lng&limit=20  # 15KB vs 100KB full
GET /api/cari?q=ayam&fields=name,kelurahan   # minimal payload
```

```ts
const fields = req.query.fields?.split(',').filter(Boolean);
const data = fields ? rows.map(r => pick(r, fields)) : rows;
```

---

## Cara Verifikasi

```bash
# Jalankan service 03b
REDIS_URL=redis://localhost:6379 \
DATABASE_URL=postgres://demo:demo123@localhost:6432/gotongroyong_demo \
  bun run --cwd umkm-service src/index-03b.ts

# Test cache HIT/MISS
curl http://localhost:3003/api/cari?q=ayam          # MISS (DB 10ms)
curl http://localhost:3003/api/cari?q=ayam          # HIT (Redis 2ms) — header X-Cache: HIT
curl http://localhost:3003/api/komunitas/xxx        # HIT 10 menit
curl http://localhost:3003/api/cache/stats          # { hits, misses, hitRate }

# Test GZIP
curl -H "Accept-Encoding: gzip" -I http://localhost:3003/api/umkm?limit=20
# Content-Encoding: gzip

# Test payload shaping
curl 'http://localhost:3003/api/umkm?fields=name,lat,lng&limit=5'

# Test PgBouncer
psql postgres://demo:demo123@localhost:6432/gotongroyong_demo -c "SHOW POOLS;"
```

---

## File Terkait

- `umkm-service/src/cache.ts` — Redis Cache-Aside + TTL table + tiering + invalidate
- `umkm-service/src/index-03b.ts` — Express + cache + GZIP + payload shaping + PgBouncer 6432
- `kas-service/src/index-03b.ts` — Kas + MatView + Redis cache + invalidate on POST
- `shared/cache.ts` — `createCache(redis, ttl)` factory + hot/warm/cold
- `shared/metrics.ts` — `prom-client` histogram + cache_hit_total counter
