// order-service/src/index-proper.ts — Branch 02 PROPER
// Bahasa komentar: Indonesia
// Fitur: Pino JSON, requestId propagation, latency_ms, level info/error, fetch payment dengan x-request-id

import express from 'express';
import logger from './logger.js';
import { requestIdMiddleware, type RequestWithId } from './middleware/requestId.js';

const app = express();
const PORT = Number(process.env.PORT || 3001);
const PAYMENT_URL = process.env.PAYMENT_URL || 'http://localhost:3002/charge';

app.use(express.json());
app.use(requestIdMiddleware as any);

// Latency middleware — ukur latency_ms tiap request, log saat finish
app.use((req: RequestWithId, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    req.log.info(
      { latency_ms: Date.now() - start, status: res.statusCode, method: req.method, path: req.path },
      'request completed'
    );
  });
  next();
});

app.get('/health', (req: RequestWithId, res) => {
  req.log.debug('health check');
  res.json({ status: 'ok', service: 'order-service', branch: '02-proper-logging' });
});

// POST /checkout — proper logging + requestId propagation
app.post('/checkout', async (req: RequestWithId, res) => {
  const { userId, amount, card, password, token } = req.body;

  // PROPER: log structured JSON, card/password akan di-redact jadi [Redacted] oleh Pino
  req.log.info({ userId, amount, card, password, token }, 'checkout requested');

  if (!userId || !amount || !card) {
    req.log.warn({ userId, amount, hasCard: !!card }, 'checkout validation failed');
    return res.status(400).json({ error: 'userId, amount, card wajib' });
  }

  const start = Date.now();
  try {
    req.log.info({ paymentUrl: PAYMENT_URL }, 'calling payment service');

    // PROPER: propagasi x-request-id ke payment-service — trace utuh
    const resp = await fetch(PAYMENT_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-request-id': req.requestId,
      },
      body: JSON.stringify({ userId, amount, card, password, token }),
    });

    const data = await resp.json();
    const latency_ms = Date.now() - start;

    // PROPER: log JSON dengan level, requestId, latency_ms — card sudah [Redacted]
    req.log.info({ latency_ms, status: resp.status, paymentOk: resp.ok }, 'payment response received');

    if (!resp.ok) {
      req.log.warn({ userId, amount, latency_ms, paymentError: data }, 'payment failed');
      return res.status(402).json({ error: 'payment failed', detail: data });
    }

    req.log.info({ userId, amount, latency_ms, orderId: 'ord_' + Date.now() }, 'checkout success');

    return res.json({
      success: true,
      orderId: 'ord_' + Date.now(),
      userId,
      amount,
      payment: data,
    });
  } catch (err: any) {
    const latency_ms = Date.now() - start;
    req.log.error({ err: err.message, stack: err.stack, latency_ms }, 'checkout error');
    return res.status(500).json({ error: 'checkout gagal', detail: err.message });
  }
});

app.get('/api/komunitas/:id', (req: RequestWithId, res) => {
  const id = req.params.id;
  req.log.info({ komunitasId: id }, 'get komunitas');
  res.json({ id, name: 'Komunitas ' + id, note: 'branch 02 proper logging' });
});

app.listen(PORT, () => {
  logger.info({ port: PORT, paymentUrl: PAYMENT_URL }, 'order-service 02 proper listening');
});
