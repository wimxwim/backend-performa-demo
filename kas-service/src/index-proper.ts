// kas-service/src/index-proper.ts — Branch 02 PROPER
// Bahasa komentar: Indonesia

import express from 'express';
import logger from './logger.js';
import { requestIdMiddleware, type RequestWithId } from './middleware/requestId.js';

const app = express();
const PORT = Number(process.env.PORT || 3004);

app.use(express.json());
app.use(requestIdMiddleware as any);
app.use((req: RequestWithId, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    req.log.info({ latency_ms: Date.now() - start, status: res.statusCode, method: req.method, path: req.path }, 'request completed');
  });
  next();
});

const LEDGER: Array<{ id: number; amount: string; description: string; recipient_id: string; actor_id: string; hash_prev: string; hash_self: string; timestamp: string }> = [];
let nextId = 1;

app.get('/health', (req: RequestWithId, res) => {
  req.log.debug('health check');
  res.json({ status: 'ok', service: 'kas-service', branch: '02-proper-logging' });
});

app.post('/api/kas', (req: RequestWithId, res) => {
  const { amount, description, recipient_id, recipientId, actor_id, actorId } = req.body;
  const recipient = recipient_id || recipientId;
  const actor = actor_id || actorId;

  // PROPER: log tanpa bocorkan amount/description plain — Pino redact akan [Redacted] jika ada di path
  req.log.info({ amount: '[Redacted]', recipient, actor }, 'kas input requested');

  if (!amount || !description || !recipient || !actor) {
    req.log.warn({ hasAmount: !!amount, hasDescription: !!description }, 'kas validation failed');
    return res.status(400).json({ error: 'amount, description, recipient_id, actor_id wajib' });
  }

  const entry = {
    id: nextId++,
    amount: String(amount),
    description: String(description),
    recipient_id: String(recipient),
    actor_id: String(actor),
    hash_prev: 'pending-proper-02',
    hash_self: 'pending-proper-' + Date.now(),
    timestamp: new Date().toISOString(),
  };
  LEDGER.push(entry);
  req.log.info({ kasId: entry.id }, 'kas created');

  res.status(201).json({ success: true, data: entry, note: '02 proper log, hash chain trigger di 03' });
});

app.get('/api/kas', (req: RequestWithId, res) => {
  const limit = Math.min(parseInt(String(req.query.limit || '20'), 10), 100);
  req.log.info({ limit, total: LEDGER.length }, 'get kas');
  res.json({ data: LEDGER.slice(-limit).reverse(), pagination: { limit, total: LEDGER.length } });
});

app.get('/api/ledger/verify', (req: RequestWithId, res) => {
  req.log.info({ total: LEDGER.length }, 'verify ledger');
  res.json({ valid: true, total: LEDGER.length, checked: 0, note: '02 proper — verify real di 03 via trigger SHA-256' });
});

app.post('/api/donasi', (req: RequestWithId, res) => {
  const { amount, description, recipient_id, actor_id } = req.body;
  req.log.info({ amount: '[Redacted]', recipient_id, actor_id }, 'donasi requested');
  if (!amount || !description) {
    req.log.warn('donasi validation failed');
    return res.status(400).json({ error: 'amount, description wajib' });
  }
  const entry = {
    id: nextId++,
    amount: String(amount),
    description: String(description),
    recipient_id: String(recipient_id || 'unknown'),
    actor_id: String(actor_id || 'unknown'),
    hash_prev: 'pending',
    hash_self: 'pending',
    timestamp: new Date().toISOString(),
  };
  LEDGER.push(entry);
  req.log.info({ donasiId: entry.id }, 'donasi created');
  res.status(201).json({ success: true, data: { ledger: entry, distributions: [] } });
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'kas-service 02 proper listening');
});
