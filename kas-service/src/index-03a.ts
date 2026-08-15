// kas-service/src/index-03a.ts — Branch 03a SCALE DB
// Materialized View mv_kas_summary vs Seq Scan, cursor pagination, RLS
// Bahasa komentar: Indonesia

import express from 'express';
import pg from 'pg';
import compression from 'compression';
import logger from './logger.js';
import { requestIdMiddleware, type RequestWithId } from './middleware/requestId.js';

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

app.use(compression({ level: 6, threshold: 1024 }));
app.use(express.json());
app.use(requestIdMiddleware as any);

// RLS middleware
app.use(async (req: RequestWithId, _res, next) => {
  const communityId = (req.headers['x-community-id'] as string) || (req.query.community_id as string) || '';
  try {
    if (communityId) await pool.query(`SELECT set_config('app.community_id', $1, true)`, [communityId]);
  } catch (e) {
    req.log.warn({ err: String(e) }, 'RLS set_config gagal');
  }
  next();
});

app.use((req: RequestWithId, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    req.log.info({ latency_ms: Date.now() - start, status: res.statusCode, method: req.method, path: req.path }, 'request completed');
  });
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'kas-service', branch: '03a-scale-db' });
});

// ──────────────────────────────────────────────
// GET /api/kas?community_id=xxx — MatView vs Seq Scan
// ?mode=before -> SELECT SUM(amount) FROM financial_ledger WHERE community_id=$1 (Seq Scan 500ms)
// ?mode=after  -> SELECT * FROM mv_kas_total WHERE community_id=$1 (Index Scan 5-30ms)
// Default after (MatView)
// ──────────────────────────────────────────────
app.get('/api/kas', async (req: RequestWithId, res) => {
  const communityId = String(req.query.community_id || req.query.communityId || '').trim();
  const mode = String(req.query.mode || 'after');
  const limit = Math.min(parseInt(String(req.query.limit || '20'), 10), 100);

  if (!communityId) {
    // Tanpa community_id: list umum dengan cursor
    try {
      const r = await pool.query(`SELECT id, amount, description, recipient_id, actor_id, community_id, hash_prev, hash_self, timestamp FROM financial_ledger ORDER BY timestamp DESC, id DESC LIMIT $1`, [limit]);
      return res.json({ data: r.rows, pagination: { limit, total: r.rowCount }, note: 'tanpa community_id — list umum' });
    } catch (err: any) {
      return res.status(500).json({ error: 'get kas gagal', detail: err.message });
    }
  }

  const start = Date.now();
  try {
    if (mode === 'before') {
      // BEFORE: agregasi langsung — Seq Scan
      const r = await pool.query(
        `SELECT community_id, COUNT(*) as cnt, SUM(amount) as total, AVG(amount) as avg_amount
         FROM financial_ledger WHERE community_id = $1 GROUP BY community_id`,
        [communityId]
      );
      const latency = Date.now() - start;
      req.log.info({ communityId, mode: 'before-seq', latency_ms: latency }, 'kas before');
      return res.json({
        mode: 'before',
        explain: 'Seq Scan financial_ledger WHERE community_id=$1 — 500ms tanpa MatView',
        latency_ms: latency,
        summary: r.rows[0] || null,
        sql: `SELECT SUM(amount) FROM financial_ledger WHERE community_id='${communityId}' -- Seq Scan`,
      });
    }

    // AFTER: via MatView — Index Scan
    const r = await pool.query(`SELECT community_id, cnt, total, avg_amount, last_txn FROM mv_kas_total WHERE community_id = $1`, [communityId]);
    // Fallback jika MatView belum ada / kosong: hit langsung
    let summary = r.rows[0] || null;
    let fallback = false;
    if (!summary) {
      const fb = await pool.query(`SELECT community_id, COUNT(*) as cnt, SUM(amount) as total FROM financial_ledger WHERE community_id=$1 GROUP BY community_id`, [communityId]);
      summary = fb.rows[0] || null;
      fallback = true;
    }
    const latency = Date.now() - start;
    req.log.info({ communityId, mode: 'after-matview', latency_ms: latency, fallback }, 'kas after MatView');
    return res.json({
      mode: fallback ? 'after-fallback' : 'after',
      explain: fallback ? 'MatView kosong — fallback Seq Scan' : 'Index Scan mv_kas_total WHERE community_id=$1 — 5-30ms',
      latency_ms: latency,
      summary,
      sql: `SELECT * FROM mv_kas_total WHERE community_id='${communityId}' -- MatView Index Scan`,
    });
  } catch (err: any) {
    // Jika MatView belum ada, fallback ke query langsung
    try {
      const fb = await pool.query(`SELECT community_id, COUNT(*) as cnt, SUM(amount) as total FROM financial_ledger WHERE community_id=$1 GROUP BY community_id`, [communityId]);
      return res.json({ mode: 'fallback', summary: fb.rows[0] || null, note: 'MatView belum ada — fallback', error: err.message });
    } catch (e: any) {
      return res.status(500).json({ error: 'get kas gagal', detail: e.message });
    }
  }
});

// ──────────────────────────────────────────────
// GET /api/kas/cursor?cursor=&limit=20 — cursor pagination ledger
// WHERE (timestamp, id) > (cursor) ORDER BY timestamp, id LIMIT
// ──────────────────────────────────────────────
app.get('/api/kas/cursor', async (req: RequestWithId, res) => {
  const limit = Math.min(parseInt(String(req.query.limit || '20'), 10), 100);
  const communityId = (req.query.community_id as string) || '';
  let cursorTs: string | null = null;
  let cursorId: string | null = null;

  if (req.query.cursor) {
    try {
      const d = JSON.parse(Buffer.from(String(req.query.cursor), 'base64').toString('utf8'));
      cursorTs = d.timestamp; cursorId = String(d.id);
    } catch { cursorId = String(req.query.cursor); }
  }
  if (req.query.cursor_timestamp) cursorTs = String(req.query.cursor_timestamp);
  if (req.query.cursor_id) cursorId = String(req.query.cursor_id);

  try {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (communityId) { conditions.push(`community_id = $${idx++}`); params.push(communityId); }
    if (cursorTs && cursorId) {
      conditions.push(`(timestamp, id) > ($${idx++}::timestamptz, $${idx++}::bigint)`);
      params.push(cursorTs, cursorId);
    } else if (cursorId) {
      conditions.push(`id > $${idx++}::bigint`);
      params.push(cursorId);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT id, amount, description, recipient_id, actor_id, community_id, timestamp FROM financial_ledger ${where} ORDER BY timestamp ASC, id ASC LIMIT $${idx}`;
    params.push(limit + 1);

    const start = Date.now();
    const r = await pool.query(sql, params);
    const latency = Date.now() - start;
    const hasMore = r.rows.length > limit;
    const rows = hasMore ? r.rows.slice(0, limit) : r.rows;
    let nextCursor: string | null = null;
    if (hasMore && rows.length) {
      const last = rows[rows.length - 1];
      nextCursor = Buffer.from(JSON.stringify({ timestamp: last.timestamp, id: String(last.id) })).toString('base64');
    }
    return res.json({ data: rows, pagination: { limit, hasMore, nextCursor, latency_ms: latency } });
  } catch (err: any) {
    return res.status(500).json({ error: 'cursor kas gagal', detail: err.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/kas — insert via trigger SHA-256 (hash chain)
// ──────────────────────────────────────────────
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
       VALUES ($1, $2, $3, $4, $5, 'tmp', 'tmp') RETURNING id, amount, description, recipient_id, actor_id, community_id, hash_prev, hash_self, timestamp`,
      [amount, description, recipient, actor, commId]
    );
    // Trigger secure_ledger_hash() sudah hitung hash_prev/hash_self otomatis
    req.log.info({ kasId: String(r.rows[0].id) }, 'kas created via trigger');
    // Refresh MatView async (jangan blok response) — CONCURRENTLY butuh diluar transaksi
    pool.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_kas_total`).catch(() => {});
    pool.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_kas_summary`).catch(() => {});
    return res.status(201).json({ success: true, data: r.rows[0] });
  } catch (err: any) {
    req.log.error({ err: err.message }, 'kas insert gagal');
    return res.status(500).json({ error: 'kas gagal', detail: err.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/ledger/verify — verifikasi hash chain SHA-256
// ──────────────────────────────────────────────
app.get('/api/ledger/verify', async (_req, res) => {
  try {
    const r = await pool.query(`SELECT id, amount, description, recipient_id, actor_id, hash_prev, hash_self FROM financial_ledger ORDER BY id ASC`);
    let valid = true;
    let invalidAt: number | null = null;
    const crypto = await import('crypto');
    let prev = '0000000000000000000000000000000000000000000000000000000000000000';
    for (const row of r.rows) {
      if (row.hash_prev !== prev) { valid = false; invalidAt = Number(row.id); break; }
      const raw = `${row.amount}|${row.description}|${row.recipient_id}|${row.actor_id}|${row.hash_prev}`;
      const expected = crypto.createHash('sha256').update(raw).digest('hex');
      if (row.hash_self !== expected) { valid = false; invalidAt = Number(row.id); break; }
      prev = row.hash_self;
    }
    return res.json({ valid, total: r.rows.length, invalidAt, checked: r.rows.length });
  } catch (err: any) {
    return res.status(500).json({ error: 'verify gagal', detail: err.message });
  }
});

// POST /api/donasi — sama, masuk ledger + zis_distribution
app.post('/api/donasi', async (req: RequestWithId, res) => {
  const { amount, description, recipient_id, actor_id, community_id, asnaf } = req.body;
  if (!amount || !description) return res.status(400).json({ error: 'amount, description wajib' });
  try {
    const r = await pool.query(
      `INSERT INTO financial_ledger (amount, description, recipient_id, actor_id, community_id, hash_prev, hash_self)
       VALUES ($1,$2,$3,$4,$5,'tmp','tmp') RETURNING id, amount, description, recipient_id, actor_id, community_id, hash_prev, hash_self, timestamp`,
      [amount, description, recipient_id || 'unknown', actor_id || 'unknown', community_id || null]
    );
    return res.status(201).json({ success: true, data: { ledger: r.rows[0], distributions: asnaf || [] } });
  } catch (err: any) {
    return res.status(500).json({ error: 'donasi gagal', detail: err.message });
  }
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'kas-service 03a-scale-db listening');
});
