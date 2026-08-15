// umkm-service/src/index-03b.ts — Branch 03b CACHE + API OPTIMIZATION
// Redis Cache-Aside, GZIP/Brotli compression, payload shaping ?fields=, PgBouncer 6432
// Bahasa komentar: Indonesia

import express from 'express';
import pg from 'pg';
import compression from 'compression';
import logger from './logger.js';
import { requestIdMiddleware, type RequestWithId } from './middleware/requestId.js';
import { redis, TTL, getCached, invalidate, getCacheStats } from './cache.js';
import { metricsMiddleware, metricsHandler, dbQueryDuration } from '../../shared/metrics.js';

const app = express();
const PORT = Number(process.env.PORT || 3003);

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://demo:demo123@localhost:5432/gotongroyong_demo';
const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  max: 25,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
pool.on('error', (err) => logger.error({ err }, 'pg pool error'));

// ──────────────────────────────────────────────
// Middleware — GZIP/Brotli + metrics + requestId + RLS
// compression level 6, threshold 1024 — GZIP 70-80% saving, Brotli +20-30% via accept-encoding
// PgBouncer: DATABASE_URL port 6432, pool 25, transaction mode (lihat compose.yaml)
// ──────────────────────────────────────────────
app.use(compression({ level: 6, threshold: 1024 }));
app.use(express.json());
app.use(metricsMiddleware as any);
app.use(requestIdMiddleware as any);

app.use(async (req: RequestWithId, _res, next) => {
  const communityId = (req.headers['x-community-id'] as string) || (req.query.community_id as string) || '';
  const kelurahan = (req.headers['x-kelurahan'] as string) || (req.query.kelurahan as string) || '';
  try {
    if (communityId) await pool.query(`SELECT set_config('app.community_id', $1, true)`, [communityId]);
    if (kelurahan) await pool.query(`SELECT set_config('app.kelurahan', $1, true)`, [kelurahan]);
  } catch {}
  next();
});

app.use((req: RequestWithId, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    req.log.info({ latency_ms: Date.now() - start, status: res.statusCode, method: req.method, path: req.path }, 'request completed');
  });
  next();
});

// Metrics endpoint untuk Prometheus scrape
app.get('/metrics', metricsHandler as any);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'umkm-service', branch: '03b-cache-api', pgbouncer: DATABASE_URL.includes('6432') ? '6432:pool25:txn' : 'direct', cache: getCacheStats() });
});

// ──────────────────────────────────────────────
// GET /api/cari?q=ayam&cursor=&limit=20 — dengan cache + GIN
// Cache key: cari:{q}:{cursor}:{limit}:{kelurahan}
// TTL 5 menit (pencarian populer), tier warm
// ──────────────────────────────────────────────
app.get('/api/cari', async (req: RequestWithId, res) => {
  const q = String(req.query.q || req.query.keyword || '').trim();
  const limit = Math.min(parseInt(String(req.query.limit || '20'), 10), 50);
  const cursor = String(req.query.cursor || '');
  const kelurahan = String(req.query.kelurahan || '');
  const fields = (req.query.fields as string)?.split(',').map((s) => s.trim()).filter(Boolean);

  if (!q) return res.json({ data: [], total: 0, q });

  const cacheKey = `cari:${q}:${cursor}:${limit}:${kelurahan}:${fields?.join(',') || ''}`;

  try {
    const { data, hit, tier } = await getCached(
      cacheKey,
      async () => {
        const end = dbQueryDuration.startTimer({ query: 'cari_gin' });
        const r = await pool.query(
          `SELECT id, name, kelurahan, category0, alamat, lat, lng, created_at,
                  similarity(name, $1) AS sml
           FROM umkm
           WHERE name % $1 OR (name || ' ' || alamat) % $1
           ORDER BY sml DESC, created_at DESC
           LIMIT $2`,
          [q, limit]
        );
        end();
        let rows: any[] = r.rows;
        if (fields && fields.length) {
          rows = rows.map((row: any) => Object.fromEntries(fields.filter((f) => f in row).map((f) => [f, row[f]])));
        }
        return { rows, total: r.rowCount };
      },
      TTL.cari,
      'warm'
    );

    res.setHeader('X-Cache', hit ? 'HIT' : 'MISS');
    res.setHeader('X-Cache-Tier', tier);
    req.log.info({ q, hit, tier, cacheKey }, hit ? 'cache HIT cari' : 'cache MISS cari');
    return res.json({ data: (data as any).rows, total: (data as any).total, q, cache: { hit, tier, key: cacheKey } });
  } catch (err: any) {
    req.log.error({ err: err.message, q }, 'cari error');
    return res.status(500).json({ error: 'cari gagal', detail: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/komunitas/:id — cache TTL 10 menit (paling lama, data jarang berubah)
// Cache key: komunitas:{id}:{fields}
// ──────────────────────────────────────────────
app.get('/api/komunitas/:id', async (req: RequestWithId, res) => {
  const id = req.params.id;
  const fields = (req.query.fields as string)?.split(',').map((s) => s.trim()).filter(Boolean);
  const cacheKey = `komunitas:${id}:${fields?.join(',') || 'full'}`;

  try {
    const { data, hit } = await getCached(
      cacheKey,
      async () => {
        const end = dbQueryDuration.startTimer({ query: 'komunitas_by_id' });
        const r = await pool.query(`SELECT id, slug, name, type, kelurahan, alamat, member_count, created_at FROM communities WHERE id = $1`, [id]);
        end();
        if (!r.rows.length) return null;
        let row: any = r.rows[0];
        if (fields && fields.length) row = Object.fromEntries(fields.filter((f) => f in row).map((f) => [f, row[f]]));
        return row;
      },
      TTL.komunitas,
      'cold'
    );

    if (!data) return res.status(404).json({ error: 'Komunitas tidak ditemukan' });
    res.setHeader('X-Cache', hit ? 'HIT' : 'MISS');
    req.log.info({ komunitasId: id, hit }, hit ? 'cache HIT komunitas' : 'cache MISS komunitas');
    return res.json({ data, cache: { hit, key: cacheKey } });
  } catch (err: any) {
    return res.status(500).json({ error: 'get komunitas gagal', detail: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/umkm?cursor=&limit=20&fields=name,lat,lng — cursor + payload shaping + cache
// ──────────────────────────────────────────────
app.get('/api/umkm', async (req: RequestWithId, res) => {
  const limit = Math.min(parseInt(String(req.query.limit || '20'), 10), 100);
  const kelurahan = String(req.query.kelurahan || '');
  const category0 = String(req.query.category0 || '');
  const fields = (req.query.fields as string)?.split(',').map((s) => s.trim()).filter(Boolean);
  let cursorCreatedAt: string | null = null;
  let cursorId: string | null = null;

  if (req.query.cursor) {
    try {
      const d = JSON.parse(Buffer.from(String(req.query.cursor), 'base64').toString('utf8'));
      cursorCreatedAt = d.created_at; cursorId = d.id;
    } catch { cursorId = String(req.query.cursor); }
  }

  const cacheKey = `umkm:list:${kelurahan}:${category0}:${cursorCreatedAt || ''}:${cursorId || ''}:${limit}:${fields?.join(',') || ''}`;

  try {
    const { data, hit } = await getCached(
      cacheKey,
      async () => {
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;
        if (kelurahan) { conditions.push(`kelurahan = $${idx++}`); params.push(kelurahan); }
        if (category0) { conditions.push(`category0 = $${idx++}`); params.push(category0); }
        if (cursorCreatedAt && cursorId) {
          conditions.push(`(created_at, id) > ($${idx++}::timestamptz, $${idx++})`);
          params.push(cursorCreatedAt, cursorId);
        } else if (cursorId) {
          conditions.push(`id > $${idx++}`); params.push(cursorId);
        }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const sql = `SELECT id, data_id, name, kelurahan, category0, alamat, lat, lng, created_at FROM umkm ${where} ORDER BY created_at ASC, id ASC LIMIT $${idx}`;
        params.push(limit + 1);
        const end = dbQueryDuration.startTimer({ query: 'umkm_list_cursor' });
        const r = await pool.query(sql, params);
        end();
        const hasMore = r.rows.length > limit;
        let rows: any[] = hasMore ? r.rows.slice(0, limit) : r.rows;
        if (fields && fields.length) {
          rows = rows.map((row: any) => Object.fromEntries(fields.filter((f) => f in row).map((f) => [f, row[f]])));
        }
        let nextCursor: string | null = null;
        if (hasMore && rows.length) {
          const last = r.rows[limit - 1];
          nextCursor = Buffer.from(JSON.stringify({ created_at: last.created_at, id: last.id })).toString('base64');
        }
        return { rows, hasMore, nextCursor };
      },
      TTL.umkm_list,
      'warm'
    );

    res.setHeader('X-Cache', hit ? 'HIT' : 'MISS');
    return res.json({ data: (data as any).rows, pagination: { limit, hasMore: (data as any).hasMore, nextCursor: (data as any).nextCursor }, cache: { hit } });
  } catch (err: any) {
    return res.status(500).json({ error: 'list umkm gagal', detail: err.message });
  }
});

app.get('/api/umkm/:id', async (req: RequestWithId, res) => {
  const id = req.params.id;
  const fields = (req.query.fields as string)?.split(',').map((s) => s.trim()).filter(Boolean);
  const cacheKey = `umkm:${id}:${fields?.join(',') || 'full'}`;
  try {
    const { data, hit } = await getCached(
      cacheKey,
      async () => {
        const r = await pool.query(`SELECT id, data_id, name, kelurahan, category0, category1, alamat, telepon, lat, lng, zip_code, kecamatan_id, created_at FROM umkm WHERE id = $1`, [id]);
        if (!r.rows.length) return null;
        let row: any = r.rows[0];
        if (fields && fields.length) row = Object.fromEntries(fields.filter((f) => f in row).map((f) => [f, row[f]]));
        return row;
      },
      TTL.umkm_detail,
      'warm'
    );
    if (!data) return res.status(404).json({ error: 'UMKM tidak ditemukan' });
    res.setHeader('X-Cache', hit ? 'HIT' : 'MISS');
    return res.json({ data, cache: { hit } });
  } catch (err: any) {
    return res.status(500).json({ error: 'get umkm gagal', detail: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/umkm — invalidate cache setelah create/update
// ──────────────────────────────────────────────
app.post('/api/umkm', async (req: RequestWithId, res) => {
  const { name, kelurahan, category0, alamat, lat, lng } = req.body;
  if (!name || !kelurahan) return res.status(400).json({ error: 'name, kelurahan wajib' });
  try {
    const id = `umkm_${Date.now()}`;
    await pool.query(
      `INSERT INTO umkm (id, data_id, name, kelurahan, category0, alamat, lat, lng, kecamatan_id, zip_code, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
      [id, `data_${Date.now()}`, name, kelurahan, category0 || 'OTHER', alamat || '', lat || 0, lng || 0, '3171040', '12345']
    );
    await invalidate('umkm:list:*');
    await invalidate('cari:*');
    req.log.info({ umkmId: id }, 'umkm created, cache invalidated');
    return res.status(201).json({ success: true, data: { id, name, kelurahan } });
  } catch (err: any) {
    return res.status(500).json({ error: 'create umkm gagal', detail: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/cache/stats — hit rate metric
// ──────────────────────────────────────────────
app.get('/api/cache/stats', (_req, res) => {
  res.json({ ...getCacheStats(), ttl: TTL });
});

app.listen(PORT, () => {
  logger.info({ port: PORT, db: DATABASE_URL.replace(/:[^@]+@/, ':***@'), redis: process.env.REDIS_URL || 'redis://localhost:6379' }, 'umkm-service 03b-cache-api listening');
});
