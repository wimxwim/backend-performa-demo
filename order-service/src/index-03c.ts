// order-service/src/index-03c.ts — Branch 03c PROTEKSI (5 proteksi + graceful degradation + feature flag)
// Bahasa komentar: Indonesia
// Proteksi: Token/Leaky Bucket (rateLimiter), Circuit Breaker, Bulkhead, Backpressure, Graceful Degradation
// Sumber: Studi Kasus Shopee Bab 4.2 (6 proteksi), Modul Performa Bab 8 (threshold), Poster #6 (10 metrik)

import express from 'express';
import compression from 'compression';
import crypto from 'crypto';
import client from 'prom-client';

// Shared proteksi
import { limiterGeneral, limiterHeavy, limiterAuth, kafkaLeakyBucket } from '../../shared/rateLimiter.js';
import { CircuitBreaker, paymentCircuit, circuitStateGauge } from '../../shared/circuitBreaker.js';
import { Bulkhead, orderBulkhead, bulkheadActiveGauge, bulkheadQueueGauge } from '../../shared/bulkhead.js';
import { Backpressure, orderBackpressure } from '../../shared/backpressure.js';
import { createLogger } from '../../shared/logger.js';
import { createRequestIdMiddleware, createLatencyMiddleware } from '../../shared/requestId.js';
import { register, httpRequestDuration, httpRequestsTotal, metricsMiddleware, metricsHandler } from '../../shared/metrics.js';
import { initTracing, tracingMiddleware } from '../../shared/tracing.js';

// ──────────────────────────────────────────────
// Konfigurasi
// ──────────────────────────────────────────────
const PORT = Number(process.env.PORT || 3001);
const PAYMENT_URL = process.env.PAYMENT_URL || 'http://localhost:3002/charge';
const SERVICE = 'order-service';

const logger = createLogger(SERVICE);

// OTEL tracing — best effort, jangan crash jika collector belum jalan
try { initTracing(SERVICE); } catch (e) { logger.warn({ err: e }, 'tracing init failed - lanjut tanpa trace'); }

const app = express();
app.set('trust proxy', 1); // penting untuk keyGenerator req.ip di belakang nginx

// ──────────────────────────────────────────────
// Feature Flag — graceful degradation
// Saat overload (circuit open / bulkhead penuh / backpressure), non-critical OFF
// critical: checkout, health, metrics — tetap ON
// non-critical: rekomendasi, riwayat lengkap, analytics — OFF saat degradasi
// ──────────────────────────────────────────────
const featureFlags: Record<string, boolean> = {
  recommendations: true,
  full_history: true,
  analytics: true,
  promo_banner: true,
};

function isOverloaded(): boolean {
  return paymentCircuit.state === 'open' || orderBulkhead.stats().queued >= 40 || orderBackpressure.isOverloaded();
}

function degradationMiddleware(req: any, res: any, next: any) {
  const degraded = isOverloaded();
  // header untuk Flutter tahu mode degradasi
  res.setHeader('x-degradation', degraded ? 'true' : 'false');
  if (degraded) {
    // matikan non-critical
    featureFlags.recommendations = false;
    featureFlags.analytics = false;
    featureFlags.promo_banner = false;
  } else {
    featureFlags.recommendations = true;
    featureFlags.analytics = true;
    featureFlags.promo_banner = true;
  }
  (req as any).degraded = degraded;
  (req as any).featureFlags = { ...featureFlags };
  next();
}

// ──────────────────────────────────────────────
// Global middleware — urutan penting
// 1. compression, json, requestId, latency, tracing, metrics, backpressure, degradation
// ──────────────────────────────────────────────
app.use(compression({ level: 6, threshold: 1024 }));
app.use(express.json());
app.use(createRequestIdMiddleware(logger));
app.use(createLatencyMiddleware());
app.use(tracingMiddleware(SERVICE));
app.use(metricsMiddleware);
app.use(orderBackpressure.middleware());
app.use(degradationMiddleware);

// Rate limiter — general untuk semua, heavy untuk /checkout, auth untuk /login (jika ada)
app.use('/checkout', limiterHeavy);
app.use('/auth', limiterAuth);
app.use(limiterGeneral); // fallback general 100/menit

// ──────────────────────────────────────────────
// Metrics tambahan — circuit + bulkhead + backpressure sudah via shared
// ──────────────────────────────────────────────
const degradationGauge = new client.Gauge({
  name: 'graceful_degradation_active',
  help: '1 jika graceful degradation aktif (non-critical OFF)',
  labelNames: ['service'] as const,
  registers: [register],
});
setInterval(() => {
  degradationGauge.set({ service: SERVICE }, isOverloaded() ? 1 : 0);
}, 5000);

// ──────────────────────────────────────────────
// GET /health — cek semua proteksi
// ──────────────────────────────────────────────
app.get('/health', (_req: any, res: any) => {
  res.json({
    status: 'ok',
    service: SERVICE,
    branch: '03c-proteksi-scaling',
    degraded: isOverloaded(),
    featureFlags: { ...featureFlags },
    circuit: paymentCircuit.getState(),
    bulkhead: orderBulkhead.stats(),
    backpressure: orderBackpressure.stats(),
    leakyBucket: { size: kafkaLeakyBucket.size(), capacity: 50 },
    uptime: process.uptime(),
  });
});

// GET /metrics — Prometheus scrape
app.get('/metrics', metricsHandler);

// GET /api/komunitas/:id — contoh endpoint dengan bulkhead + cache header
app.get('/api/komunitas/:id', async (req: any, res: any) => {
  const id = req.params.id;
  const degraded = req.degraded as boolean;
  try {
    const data = await orderBulkhead.run(async () => {
      // simulasi DB/Redis fetch — jika degraded, skip rekomendasi
      const base = { id, name: `Komunitas ${id}`, degraded };
      if (degraded) return { ...base, recommendations: null, note: 'degraded - rekomendasi dimatikan' };
      return { ...base, recommendations: ['umkm_1', 'umkm_2'], note: 'full' };
    });
    res.setHeader('x-cache', 'MISS');
    res.json(data);
  } catch (e: any) {
    if (e.code === 'BULKHEAD_FULL' || e.code === 'CIRCUIT_OPEN') {
      return res.status(503).setHeader('Retry-After', '10').json({ error: e.message, code: e.code });
    }
    res.status(500).json({ error: e.message });
  }
});

// POST /checkout — 5 proteksi sekaligus
// 1. Rate limit (heavy 10/menit) 2. Leaky bucket 3. Bulkhead 4. Circuit breaker 5. Backpressure 6. Degradation
app.post('/checkout', async (req: any, res: any) => {
  const { userId, amount, card } = req.body;
  const requestId = req.requestId as string;

  // Leaky bucket — jika Kafka queue penuh -> 429
  if (!kafkaLeakyBucket.tryAdd()) {
    res.setHeader('Retry-After', '5');
    return res.status(429).json({ error: 'Too Many Requests - queue penuh', retryAfter: 5, requestId });
  }

  if (!userId || !amount || !card) {
    return res.status(400).json({ error: 'userId, amount, card wajib', requestId });
  }

  // Degradation — jika overload, tolak non-critical field promo
  if (req.degraded && req.body.promoCode) {
    logger.warn({ requestId, userId }, 'degraded - promo diabaikan');
  }

  try {
    const result = await orderBulkhead.run(async () => {
      return paymentCircuit.call(async () => {
        // propagate x-request-id ke payment-service untuk tracing
        const resp = await fetch(PAYMENT_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-request-id': requestId },
          body: JSON.stringify({ userId, amount, card, requestId }),
          signal: AbortSignal.timeout(3000),
        });
        const data: any = await resp.json();
        if (!resp.ok) throw Object.assign(new Error(data.error || 'payment failed'), { status: resp.status, detail: data });
        return data;
      });
    });

    return res.json({
      success: true,
      orderId: 'ord_' + Date.now(),
      userId,
      amount,
      degraded: req.degraded,
      featureFlags: req.featureFlags,
      payment: result,
      requestId,
    });
  } catch (err: any) {
    const status = err.status || 500;
    // Circuit open -> 503 + Retry-After 30s (halfOpenAfter)
    if (err.code === 'CIRCUIT_OPEN') {
      res.setHeader('Retry-After', '30');
      return res.status(503).json({ error: 'Payment service unavailable - circuit OPEN', code: err.code, retryAfter: 30, requestId });
    }
    if (err.code === 'BULKHEAD_FULL') {
      res.setHeader('Retry-After', '10');
      return res.status(503).json({ error: 'Order service overloaded - bulkhead penuh', code: err.code, retryAfter: 10, requestId });
    }
    if (status === 503) {
      res.setHeader('Retry-After', '10');
    }
    logger.error({ err, requestId, userId }, 'checkout gagal');
    return res.status(status).json({ error: 'checkout gagal', detail: err.message, requestId });
  }
});

// GET /api/rekomendasi — non-critical, dimatikan saat degradasi
app.get('/api/rekomendasi', (req: any, res: any) => {
  if (req.degraded) {
    return res.status(200).json({ data: [], degraded: true, message: 'Rekomendasi dimatikan saat overload - graceful degradation' });
  }
  res.json({ data: [{ id: 'umkm_1', name: 'Ayam Geprek' }], degraded: false });
});

// ──────────────────────────────────────────────
// Graceful shutdown — drain queue
// ──────────────────────────────────────────────
let server: any;
async function shutdown(signal: string) {
  logger.info({ signal }, 'shutdown - drain bulkhead & backpressure');
  try { await orderBackpressure.startDrain(5000); } catch {}
  try { await orderBulkhead.drainAll(5000); } catch {}
  server?.close(() => {
    logger.info('server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server = app.listen(PORT, () => {
  logger.info({ port: PORT, paymentUrl: PAYMENT_URL }, `order-service 03c listening on ${PORT} - 5 proteksi aktif`);
});

export default app;
