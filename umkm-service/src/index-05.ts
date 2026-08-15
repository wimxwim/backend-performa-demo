// umkm-service/src/index-05.ts — Branch 05 CDC + Elasticsearch geospasial
// Bahasa komentar: Indonesia
// ES geo_distance 5km <10ms, multi_match + highlight, fallback pg_trgm jika ES down
// Sumber: Modul Performa Bab 5 (ES) + Bab 6 (CDC), spec 05-cdc-streaming.md

import express from 'express';
import pg from 'pg';
import compression from 'compression';
import logger from './logger.js';
import { requestIdMiddleware, type RequestWithId } from './middleware/requestId.js';
import { metricsMiddleware, metricsHandler, dbQueryDuration } from '../../shared/metrics.js';

const app = express();
const PORT = Number(process.env.PORT || 3003);
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://demo:demo123@localhost:5432/gotongroyong_demo';
const ES_NODE = process.env.ES_NODE || 'http://localhost:9200';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  max: 25,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
pool.on('error', (err) => logger.error({ err }, 'pg pool error'));

app.use(compression({ level: 6, threshold: 1024 }));
app.use(express.json());
app.use(metricsMiddleware as any);
app.use(requestIdMiddleware as any);
app.use((req: RequestWithId, _res, next) => {
  const start = Date.now();
  _res.on('finish', () => {
    req.log.info({ latency_ms: Date.now() - start, status: _res.statusCode, method: req.method, path: req.path }, 'request completed');
  });
  next();
});
app.get('/metrics', metricsHandler as any);
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'umkm-service', branch: '05-cdc-es', es: ES_NODE, pgbouncer: DATABASE_URL.includes('6432') ? '6432:pool25' : 'direct' });
});

// ──────────────────────────────────────────────
// Helper — fetch ES dengan timeout + fallback signal
// ──────────────────────────────────────────────
async function esFetch(path: string, body?: any, method: string = 'GET'): Promise<any> {
  const url = `${ES_NODE}${path}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`ES ${res.status} ${res.statusText}`);
    return await res.json();
  } finally { clearTimeout(t); }
}

// ──────────────────────────────────────────────
// GET /api/masjid-terdekat?lat=-6.25&lng=106.75&radius=5km
// ES geo_distance 5km sort _geo_distance -> <10ms (vs PostGIS ~50ms)
// ──────────────────────────────────────────────
app.get('/api/masjid-terdekat', async (req: RequestWithId, res) => {
  const lat = parseFloat(String(req.query.lat || ''));
  const lng = parseFloat(String(req.query.lng || ''));
  const radius = String(req.query.radius || '5km');
  const limit = Math.min(parseInt(String(req.query.limit || '20'), 10), 50);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: 'lat & lng wajib (contoh: ?lat=-6.25&lng=106.75&radius=5km)' });
  }
  const start = Date.now();
  try {
    const body = {
      size: limit,
      query: {
        bool: {
          filter: { geo_distance: { distance: radius, lat_lng: { lat, lon: lng } } }
        }
      },
      sort: [{ _geo_distance: { lat_lng: { lat, lon: lng }, order: 'asc', unit: 'km', mode: 'min', distance_type: 'arc' } }],
      _source: ['name', 'tipe', 'kelurahan', 'alamat', 'lat_lng', 'kode_pos'],
    };
    const data: any = await esFetch('/masjid/_search', body, 'POST');
    const hits = (data.hits?.hits || []).map((h: any) => ({
      ...h._source,
      sort_km: h.sort?.[0] != null ? Number(Number(h.sort[0]).toFixed(2)) : undefined,
      _score: h._score,
    }));
    const tookMs = data.took ?? (Date.now() - start);
    req.log.info({ lat, lng, radius, tookMs, count: hits.length }, 'ES geo_distance masjid-terdekat');
    res.setHeader('X-ES-Took-Ms', String(tookMs));
    res.setHeader('X-Source', 'elasticsearch');
    return res.json({ data: hits, meta: { lat, lng, radius, took_ms: tookMs, count: hits.length, source: 'elasticsearch' } });
  } catch (err: any) {
    // Fallback: Postgres lat/lng haversine sederhana (kurang akurat, tapi tetap jalan)
    req.log.warn({ err: err.message, lat, lng }, 'ES down, fallback ke Postgres haversine');
    try {
      const end = dbQueryDuration.startTimer({ query: 'masjid_haversine_fallback' });
      // Haversine via SQL — 6371 * acos(...), filter radius 5km = 0.045 deg approx
      const r = await pool.query(
        `SELECT id, name, tipe, kelurahan, alamat, lat, lng, kode_pos,
                (6371 * acos(cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2)) + sin(radians($1)) * sin(radians(lat)))) AS distance_km
         FROM masjid
         WHERE lat BETWEEN $1 - 0.05 AND $1 + 0.05 AND lng BETWEEN $2 - 0.05 AND $2 + 0.05
         ORDER BY distance_km ASC LIMIT $3`,
        [lat, lng, limit]
      );
      end();
      const filtered = r.rows.filter((x: any) => Number(x.distance_km) <= parseFloat(radius) || radius.includes('km') && Number(x.distance_km) <= parseFloat(radius));
      return res.json({ data: filtered, meta: { lat, lng, radius, source: 'postgres-fallback', note: 'ES down, fallback pg haversine' } });
    } catch (e: any) {
      return res.status(500).json({ error: 'masjid-terdekat gagal', detail: e.message });
    }
  }
});

// ──────────────────────────────────────────────
// GET /api/cari-es?q=ayam&kelurahan=Bintaro
// ES multi_match + highlight -> <10ms untuk 6k+ dokumen
// Fallback pg_trgm jika ES down (similarity >0.3, ORDER BY similarity DESC)
// ──────────────────────────────────────────────
app.get('/api/cari-es', async (req: RequestWithId, res) => {
  const q = String(req.query.q || req.query.keyword || '').trim();
  const kelurahan = String(req.query.kelurahan || '');
  const limit = Math.min(parseInt(String(req.query.limit || '20'), 10), 50);
  if (!q) return res.json({ data: [], total: 0, q, source: 'none' });
  const start = Date.now();
  try {
    const must: any[] = [{
      multi_match: {
        query: q,
        fields: ['name^3', 'alamat^1', 'category0^2'],
        type: 'best_fields',
        operator: 'or',
        fuzziness: 'AUTO',
      }
    }];
    if (kelurahan) must.push({ term: { kelurahan } });
    const body = {
      size: limit,
      query: { bool: { must } },
      highlight: { fields: { name: {}, alamat: {} }, pre_tags: ['<em>'], post_tags: ['</em>'] },
      sort: [{ _score: 'desc' }, { created_at: 'desc' }],
    };
    const data: any = await esFetch('/umkm/_search', body, 'POST');
    const hits = (data.hits?.hits || []).map((h: any) => ({ ...h._source, _score: h._score, highlight: h.highlight }));
    const tookMs = data.took ?? (Date.now() - start);
    req.log.info({ q, tookMs, count: hits.length }, 'ES multi_match cari-es');
    res.setHeader('X-ES-Took-Ms', String(tookMs));
    res.setHeader('X-Source', 'elasticsearch');
    return res.json({ data: hits, total: data.hits?.total?.value ?? hits.length, q, meta: { took_ms: tookMs, source: 'elasticsearch' } });
  } catch (err: any) {
    req.log.warn({ err: err.message, q }, 'ES down, fallback pg_trgm');
    try {
      const end = dbQueryDuration.startTimer({ query: 'cari_pg_trgm_fallback' });
      const params: any[] = [q, limit];
      let sql = `SELECT id, data_id, name, kelurahan, category0, alamat, lat, lng, created_at, similarity(name, $1) AS sml
                 FROM umkm WHERE name % $1 OR (name || ' ' || alamat) % $1`;
      if (kelurahan) {
        sql += ` AND kelurahan = $3`;
        params.push(kelurahan);
      }
      sql += ` ORDER BY sml DESC, created_at DESC LIMIT $2`;
      const r = await pool.query(sql, params);
      end();
      return res.json({ data: r.rows, total: r.rowCount, q, meta: { source: 'postgres-pg_trgm-fallback', note: 'ES down, fallback GIN trigram 10-50ms' } });
    } catch (e: any) {
      return res.status(500).json({ error: 'cari-es gagal', detail: e.message });
    }
  }
});

// ──────────────────────────────────────────────
// GET /api/cari?q=... — alias ke /api/cari-es dengan fallback yang sama
// ──────────────────────────────────────────────
app.get('/api/cari', async (req, res) => {
  // redirect internal ke cari-es
  (req as any).url = `/api/cari-es?q=${encodeURIComponent(String(req.query.q || ''))}&kelurahan=${encodeURIComponent(String(req.query.kelurahan || ''))}&limit=${encodeURIComponent(String(req.query.limit || '20'))}`;
  // @ts-ignore — re-dispatch not trivial, just call handler inline
  res.redirect(307, `/api/cari-es?q=${encodeURIComponent(String(req.query.q || ''))}&kelurahan=${encodeURIComponent(String(req.query.kelurahan || ''))}&limit=${encodeURIComponent(String(req.query.limit || '20'))}`);
});

// ──────────────────────────────────────────────
// GET /api/umkm/:id — tetap via Postgres (source of truth)
// ──────────────────────────────────────────────
app.get('/api/umkm/:id', async (req: RequestWithId, res) => {
  try {
    const r = await pool.query(`SELECT id, data_id, name, kelurahan, category0, category1, alamat, telepon, lat, lng, zip_code, kecamatan_id, created_at FROM umkm WHERE id = $1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'UMKM tidak ditemukan' });
    return res.json({ data: r.rows[0] });
  } catch (e: any) { return res.status(500).json({ error: 'get umkm gagal', detail: e.message }); }
});

app.get('/api/umkm', async (req: RequestWithId, res) => {
  const limit = Math.min(parseInt(String(req.query.limit || '20'), 10), 100);
  const kelurahan = String(req.query.kelurahan || '');
  const category0 = String(req.query.category0 || '');
  let cursorCreatedAt: string | null = null;
  let cursorId: string | null = null;
  if (req.query.cursor) {
    try { const d = JSON.parse(Buffer.from(String(req.query.cursor), 'base64').toString('utf8')); cursorCreatedAt = d.created_at; cursorId = d.id; } catch { cursorId = String(req.query.cursor); }
  }
  try {
    const cond: string[] = []; const params: any[] = []; let idx = 1;
    if (kelurahan) { cond.push(`kelurahan = $${idx++}`); params.push(kelurahan); }
    if (category0) { cond.push(`category0 = $${idx++}`); params.push(category0); }
    if (cursorCreatedAt && cursorId) { cond.push(`(created_at, id) > ($${idx++}::timestamptz, $${idx++})`); params.push(cursorCreatedAt, cursorId); }
    else if (cursorId) { cond.push(`id > $${idx++}`); params.push(cursorId); }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';
    const sql = `SELECT id, data_id, name, kelurahan, category0, alamat, lat, lng, created_at FROM umkm ${where} ORDER BY created_at ASC, id ASC LIMIT $${idx}`;
    params.push(limit + 1);
    const r = await pool.query(sql, params);
    const hasMore = r.rows.length > limit;
    const rows = hasMore ? r.rows.slice(0, limit) : r.rows;
    let nextCursor: string | null = null;
    if (hasMore && rows.length) { const last = r.rows[limit - 1]; nextCursor = Buffer.from(JSON.stringify({ created_at: last.created_at, id: last.id })).toString('base64'); }
    return res.json({ data: rows, pagination: { limit, hasMore, nextCursor } });
  } catch (e: any) { return res.status(500).json({ error: 'list umkm gagal', detail: e.message }); }
});

app.listen(PORT, () => {
  logger.info({ port: PORT, es: ES_NODE, db: DATABASE_URL.replace(/:[^@]+@/, ':***@') }, 'umkm-service 05-cdc-es listening — geo_distance <10ms');
});
