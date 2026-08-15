// kas-service/src/index-03b.ts — Branch 03b CACHE + MatView
// Redis Cache-Aside + MatView mv_kas_total, POST invalidate, hit rate metric
// Bahasa komentar: Indonesia

import express from 'express';
import pg from 'pg';
import compression from 'compression';
import Redis from 'ioredis';
import logger from './logger.js';
import { requestIdMiddleware, type RequestWithId } from './middleware/requestId.js';
import { metricsMiddleware, metricsHandler, dbQueryDuration, cacheHitTotal } from '../../shared/metrics.js';

const app = express();
const PORT = Number(process.env.PORT || 3004);

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://demo:demo123@localhost:5432/gotongroyong_demo';
const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  max: 25,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
pool.on('error', (err) => logger.error({ err }, 'pg pool error'));

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 2,
  enableReadyCheck: true,
  retryStrategy: (times) => Math.min(times * 100, 2000),
});
redis.on('error', (err) => logger.error({ err: err.message }, 'redis error'));

const TTL = {
  kas_summary: 5 * 60,   // 5 menit — laporan kas
  kas_list: 60,          // 1 menit — list ledger
  ledger_verify: 30,     // 30 detik
} as const;

let cacheHits = 0;
let cacheMisses = 0;
function cacheStats() {
  const total = cacheHits + cacheMisses;
  return { hits: cacheHits, misses: cacheMisses, total, hitRate: total ? cacheHits / total : 0 };
}

async function getCached<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<{ data: T; hit: boolean }> {
  try {
    const raw = await redis.get(key);
    if (raw !== null) {
      cacheHits++;
      try { cacheHitTotal.inc({ tier: 'warm', hit: 'true' }); } catch {}
      return { data: JSON.parse(raw) as T, hit: true };
    }
  } catch {}
  cacheMisses++;
  const data = await fetcher();
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
    try { cacheHitTotal.inc({ tier: 'warm', hit: 'false' }); } catch {}
  } catch {}
  return { data, hit: false };
}

async function invalidate(pattern: string): Promise<number> {
  try {
    const keys = await redis.keys(pattern);
    if (!keys.length) return 0;
    return await redis.del(...keys);
  } catch { return 0; }
}

app.use(compression({ level: 6, threshold: 1024 }));
app.use(express.json());
app.use(metricsMiddleware as any);
app.use(requestIdMiddleware as any);

app.use(async (req: RequestWithId, _res, next) => {
  const communityId = (req.headers['x-community-id'] as string) || (req.query.community_id as string) || '';
  try { if (communityId) await pool.query(`SELECT set_config('app.community_id', $1, true)`, [communityId]); } catch {}
  next();
});

app.use((req: RequestWithId, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    req.log.info({ latency_ms: Date.now() - start, status: res.statusCode, method: req.method, path: req.path }, 'request completed');
  });
  next();
});

app.get('/metrics', metricsHandler as any);
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'kas-service', branch: '03b-cache-api', cache: cacheStats() });
});

// ──────────────────────────────────────────────
// GET /api/kas?community_id=xxx — via MatView + Redis cache (Cache-Aside)
// Cache key: kas:summary:{community_id}
// TTL 5 menit — laporan kas tidak perlu real-time detik
// ──────────────────────────────────────────────
app.get('/api/kas', async (req: RequestWithId, res) => {
  const communityId = String(req.query.community_id || req.query.communityId || '').trim();
  const limit = Math.min(parseInt(String(req.query.limit || '20'), 10), 100);

  if (!communityId) {
    const cacheKey = `kas:list:${limit}`;
    try {
      const { data, hit } = await getCached(cacheKey, async () => {
        const end = dbQueryDuration.startTimer({ query: 'kas_list' });
        const r = await pool.query(`SELECT id, amount, description, recipient_id, actor_id, community_id, timestamp FROM financial_ledger ORDER BY timestamp DESC, id DESC LIMIT $1`, [limit]);
        end();
        return r.rows;
      }, TTL.kas_list);
      res.setHeader('X-Cache', hit ? 'HIT' : 'MISS');
      return res.json({ data, pagination: { limit, total: (data as any[]).length }, cache: { hit } });
    } catch (err: any) {
      return res.status(500).json({ error: 'get kas gagal', detail: err.message });
    }
  }

  const cacheKey = `kas:summary:${communityId}`;
  try {
    const { data, hit } = await getCached(cacheKey, async () => {
      const end = dbQueryDuration.startTimer({ query: 'kas_summary_matview' });
      // Coba MatView dulu, fallback ke agregasi langsung
      try {
        const r = await pool.query(`SELECT community_id, cnt, total, avg_amount, last_txn FROM mv_kas_total WHERE community_id = $1`, [communityId]);
        if (r.rows.length) { end(); return r.rows[0]; }
      } catch {}
      const r = await pool.query(`SELECT community_id, COUNT(*) as cnt, SUM(amount) as total, AVG(amount) as avg_amount, MAX(timestamp) as last_txn FROM financial_ledger WHERE community_id=$1 GROUP BY community_id`, [communityId]);
      end();
      return r.rows[0] || null;
    }, TTL.kas_summary);

    res.setHeader('X-Cache', hit ? 'HIT' : 'MISS');
    req.log.info({ communityId, hit }, hit ? 'cache HIT kas summary' : 'cache MISS kas summary');
    return res.json({ summary: data, cache: { hit, key: cacheKey }, note: hit ? 'Redis HIT ~2ms' : 'MatView ~5-30ms atau Seq Scan 500ms' });
  } catch (err: any) {
    return res.status(500).json({ error: 'get kas gagal', detail: err.message });
  }
});

// GET /api/kas/cursor — dengan cache per cursor
app.get('/api/kas/cursor', async (req: RequestWithId, res) => {
  const limit = Math.min(parseInt(String(req.query.limit || '20'), 10), 100);
  const communityId = String(req.query.community_id || '');
  const cursor = String(req.query.cursor || '');
  const cacheKey = `kas:cursor:${communityId}:${cursor}:${limit}`;

  try {
    const { data, hit } = await getCached(cacheKey, async () => {
      let cursorTs: string | null = null; let cursorId: string | null = null;
      if (cursor) {
        try { const d = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8')); cursorTs = d.timestamp; cursorId = String(d.id); } catch { cursorId = cursor; }
      }
      const conditions: string[] = []; const params: any[] = []; let idx = 1;
      if (communityId) { conditions.push(`community_id = $${idx++}`); params.push(communityId); }
      if (cursorTs && cursorId) { conditions.push(`(timestamp, id) > ($${idx++}::timestamptz, $${idx++}::bigint)`); params.push(cursorTs, cursorId); }
      else if (cursorId) { conditions.push(`id > $${idx++}::bigint`); params.push(cursorId); }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const sql = `SELECT id, amount, description, recipient_id, actor_id, community_id, timestamp FROM financial_ledger ${where} ORDER BY timestamp ASC, id ASC LIMIT $${idx}`;
      params.push(limit + 1);
      const r = await pool.query(sql, params);
      const hasMore = r.rows.length > limit;
      const rows = hasMore ? r.rows.slice(0, limit) : r.rows;
      let nextCursor: string | null = null;
      if (hasMore && rows.length) {
        const last = rows[rows.length - 1];
        nextCursor = Buffer.from(JSON.stringify({ timestamp: last.timestamp, id: String(last.id) })).toString('base64');
      }
      return { rows, hasMore, nextCursor };
    }, TTL.kas_list);

    res.setHeader('X-Cache', hit ? 'HIT' : 'MISS');
    return res.json({ data: (data as any).rows, pagination: { limit, hasMore: (data as any).hasMore, nextCursor: (data as any).nextCursor }, cache: { hit } });
  } catch (err: any) {
    return res.status(500).json({ error: 'cursor kas gagal', detail: err.message });
  }
});

// POST /api/kas — Cache-Aside invalidate on update (bukan Write-Behind)
app.post('/api/kas', async (req: RequestWithId, res) => {
  const { amount, description, recipient_id, recipientId, actor_id, actorId, community_id, communityId } = req.body;
  const recipient = recipient_id || recipientId;
  const actor = actor_id || actorId;
  const commId = community_id || communityId || null;

  if (!amount || !description || !recipient || !actor) {
    return res.status(400).json({ error: 'amount, description, recipient_id, actor_id wajib' });
  }

  try {
    const r = await pool.query(
      `INSERT INTO financial_ledger (amount, description, recipient_id, actor_id, community_id, hash_prev, hash_self)
       VALUES ($1,$2,$3,$4,$5,'tmp','tmp') RETURNING id, amount, description, recipient_id, actor_id, community_id, hash_prev, hash_self, timestamp`,
      [amount, description, recipient, actor, commId]
    );
    // Invalidate cache yang terkait
    if (commId) await invalidate(`kas:summary:${commId}`);
    await invalidate('kas:list:*');
    await invalidate('kas:cursor:*');
    req.log.info({ kasId: String(r.rows[0].id), communityId: commId }, 'kas created, cache invalidated');

    // Refresh MatView async (jangan blok response)
    pool.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_kas_total`).catch(() => {});
    pool.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_kas_summary`).catch(() => {});

    return res.status(201).json({ success: true, data: r.rows[0], cache: { invalidated: true } });
  } catch (err: any) {
    return res.status(500).json({ error: 'kas gagal', detail: err.message });
  }
});

// POST /api/cache/invalidate — manual invalidate (opsional)
app.post('/api/cache/invalidate', async (req: RequestWithId, res) => {
  const pattern = String(req.body.pattern || req.query.pattern || 'kas:*');
  const n = await invalidate(pattern);
  req.log.info({ pattern, deleted: n }, 'manual cache invalidate');
  return res.json({ success: true, pattern, deleted: n });
});

// GET /api/cache/stats — hit rate metric
app.get('/api/cache/stats', (_req, res) => {
  res.json({ ...cacheStats(), ttl: TTL });
});

// GET /api/ledger/verify — dengan cache 30 detik
app.get('/api/ledger/verify', async (req: RequestWithId, res) => {
  const cacheKey = 'kas:verify';
  try {
    const { data, hit } = await getCached(cacheKey, async () => {
      const r = await pool.query(`SELECT id, amount, description, recipient_id, actor_id, hash_prev, hash_self FROM financial_ledger ORDER BY id ASC`);
      const crypto = await import('crypto');
      let valid = true; let invalidAt: number | null = null;
      let prev = '0000000000000000000000000000000000000000000000000000000000000000';
      for (const row of r.rows) {
        if (row.hash_prev !== prev) { valid = false; invalidAt = Number(row.id); break; }
        const raw = `${row.amount}|${row.description}|${row.recipient_id}|${row.actor_id}|${row.hash_prev}`;
        const expected = crypto.createHash('sha256').update(raw).digest('hex');
        if (row.hash_self !== expected) { valid = false; invalidAt = Number(row.id); break; }
        prev = row.hash_self;
      }
      return { valid, total: r.rows.length, invalidAt, checked: r.rows.length };
    }, TTL.ledger_verify);
    res.setHeader('X-Cache', hit ? 'HIT' : 'MISS');
    return res.json({ ...(data as any), cache: { hit } });
  } catch (err: any) {
    return res.status(500).json({ error: 'verify gagal', detail: err.message });
  }
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'kas-service 03b-cache-api listening');
});
