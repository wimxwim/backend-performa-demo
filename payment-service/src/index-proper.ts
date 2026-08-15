// payment-service/src/index-proper.ts — Branch 02 PROPER
// Bahasa komentar: Indonesia

import express from 'express';
import logger from './logger.js';
import { requestIdMiddleware, type RequestWithId } from './middleware/requestId.js';

const app = express();
const PORT = Number(process.env.PORT || 3002);

app.use(express.json());
app.use(requestIdMiddleware as any);
app.use((req: RequestWithId, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    req.log.info({ latency_ms: Date.now() - start, status: res.statusCode, method: req.method, path: req.path }, 'request completed');
  });
  next();
});

app.get('/health', (req: RequestWithId, res) => {
  req.log.debug('health check');
  res.json({ status: 'ok', service: 'payment-service', branch: '02-proper-logging' });
});

app.post('/charge', async (req: RequestWithId, res) => {
  const { userId, amount, card, password, token } = req.body;
  req.log.info({ userId, amount, card, password, token }, 'charge requested');

  if (!userId || !amount || !card) {
    req.log.warn({ userId, amount, hasCard: !!card }, 'charge validation failed');
    return res.status(400).json({ error: 'userId, amount, card wajib' });
  }

  const cardStr = String(card);
  if (cardStr.endsWith('0000') || cardStr === '4000000000000002') {
    req.log.warn({ userId, amount }, 'CARD_DECLINED');
    return res.status(402).json({ error: 'CARD_DECLINED', userId });
  }

  const delay = Math.random() * 80 + 10;
  await new Promise((r) => setTimeout(r, delay));

  req.log.info({ userId, amount, latency_ms: Math.round(delay) }, 'charge success');

  return res.json({
    success: true,
    transactionId: 'txn_' + Date.now(),
    userId,
    amount,
    cardLast4: cardStr.slice(-4),
    processedAt: new Date().toISOString(),
  });
});

app.post('/refund', (req: RequestWithId, res) => {
  const { transactionId } = req.body;
  req.log.info({ transactionId }, 'refund requested');
  res.json({ success: true, transactionId, refundedAt: new Date().toISOString() });
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'payment-service 02 proper listening');
});
