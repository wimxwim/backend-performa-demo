// shared/metrics.ts — Prometheus metrics (prom-client)
// Histogram latency, counter cache hit, DB query duration
// Bahasa komentar: Indonesia
// Port metrics: 9090 (Prometheus scrape /metrics)

import client from 'prom-client';

// Registry terpisah agar tidak bentrok antar service saat test
export const register = new client.Registry();
client.collectDefaultMetrics({ register });

// ──────────────────────────────────────────────
// http_request_duration_seconds — histogram latency per endpoint
// Buckets: 0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5 (detik) — sesuai spec Poster #6
// ──────────────────────────────────────────────
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durasi request HTTP per method+route+status (detik)',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  registers: [register],
});

// ──────────────────────────────────────────────
// cache_hit_total — counter hit/miss per tier
// ──────────────────────────────────────────────
export const cacheHitTotal = new client.Counter({
  name: 'cache_hit_total',
  help: 'Total cache hit/miss per tier',
  labelNames: ['tier', 'hit'] as const, // hit = 'true' | 'false'
  registers: [register],
});

// Alias untuk kompatibilitas spec (cache_hit_total)
export const cacheHit = cacheHitTotal;

// ──────────────────────────────────────────────
// db_query_duration_seconds — histogram durasi query DB
// ──────────────────────────────────────────────
export const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Durasi query Postgres per query name',
  labelNames: ['query'] as const,
  buckets: [0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2],
  registers: [register],
});

// ──────────────────────────────────────────────
// http_requests_total — counter total request
// ──────────────────────────────────────────────
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total request HTTP per method+route+status',
  labelNames: ['method', 'route', 'status'] as const,
  registers: [register],
});

// ──────────────────────────────────────────────
// Middleware helper — pasang di Express untuk auto-observe
// app.use(metricsMiddleware); app.get('/metrics', metricsHandler);
// ──────────────────────────────────────────────
export function metricsMiddleware(req: any, res: any, next: any) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    const labels = { method: req.method, route, status: String(res.statusCode) };
    httpRequestDuration.observe(labels, duration);
    httpRequestsTotal.inc(labels);
  });
  next();
}

export async function metricsHandler(_req: any, res: any) {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
}

export default { register, httpRequestDuration, cacheHitTotal, cacheHit, dbQueryDuration, httpRequestsTotal, metricsMiddleware, metricsHandler };
