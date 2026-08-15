// kas-service/src/index-01.ts — Branch 01 ANTI-PATTERN
// Bahasa komentar: Indonesia
// Jebakan: POST /api/kas tanpa hash chain verify, console.log amount|description full, tanpa requestId, tanpa level

import express from 'express';

const app = express();
const PORT = Number(process.env.PORT || 3004);

app.use(express.json());

// Simulasi ledger in-memory (branch 03 pakai Postgres + trigger SHA-256)
const LEDGER: Array<{ id: number; amount: string; description: string; recipient_id: string; actor_id: string; hash_prev: string; hash_self: string; timestamp: string }> = [];
let nextId = 1;

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'kas-service', branch: '01-console-log' });
});

// POST /api/kas — ANTI-PATTERN: tanpa hash chain verify, tanpa trigger, console.log full
app.post('/api/kas', (req, res) => {
  const { amount, description, recipient_id, recipientId, actor_id, actorId } = req.body;
  const recipient = recipient_id || recipientId;
  const actor = actor_id || actorId;

  // JEBAKAN: console.log amount + description full tanpa redact — bocor nominal sensitif di log
  console.log('kas input amount=' + amount + ' description=' + description + ' recipient=' + recipient + ' actor=' + actor);
  console.log('kas body:', req.body);
  console.log('processing kas for actor ' + actor + ' amount ' + amount);

  if (!amount || !description || !recipient || !actor) {
    console.log('kas failed: missing field amount=' + amount + ' description=' + description);
    return res.status(400).json({ error: 'amount, description, recipient_id, actor_id wajib' });
  }

  // ANTI-PATTERN: hash_prev + hash_self asal-asalan, tanpa SHA-256, tanpa chain verify
  // Branch 03: trigger secure_ledger_hash() hitung SHA256(amount|description|recipient|actor|hash_prev)
  const entry = {
    id: nextId++,
    amount: String(amount),
    description: String(description),
    recipient_id: String(recipient),
    actor_id: String(actor),
    hash_prev: 'no-hash-chain-01',
    hash_self: 'no-verify-' + Date.now(),
    timestamp: new Date().toISOString(),
  };
  LEDGER.push(entry);

  console.log('kas created id=' + entry.id + ' amount=' + entry.amount + ' description=' + entry.description);
  console.log('ledger size now ' + LEDGER.length);

  res.status(201).json({ success: true, data: entry, note: 'ANTI-PATTERN: tanpa SHA-256 hash chain' });
});

// GET /api/kas — tanpa verify, tanpa pagination proper
app.get('/api/kas', (req, res) => {
  const limit = Math.min(parseInt(String(req.query.limit || '20'), 10), 100);
  console.log('get kas limit=' + limit + ' total=' + LEDGER.length);
  console.log('query: SELECT * FROM financial_ledger LIMIT ' + limit + ' (tanpa ORDER BY index)');
  res.json({ data: LEDGER.slice(-limit).reverse(), pagination: { limit, total: LEDGER.length } });
});

// GET /api/ledger/verify — ANTI-PATTERN: tidak ada verifikasi hash chain sama sekali
app.get('/api/ledger/verify', (_req, res) => {
  console.log('verify ledger called, total=' + LEDGER.length);
  // ANTI-PATTERN: selalu return valid tanpa cek
  console.log('verify result: always valid (no real check)');
  res.json({ valid: true, total: LEDGER.length, checked: 0, note: 'ANTI-PATTERN: tidak ada hash chain verify' });
});

// POST /api/donasi — sama anti-pattern
app.post('/api/donasi', (req, res) => {
  const { amount, description, recipient_id, actor_id } = req.body;
  console.log('donasi amount=' + amount + ' description=' + description + ' recipient=' + recipient_id + ' actor=' + actor_id);
  console.log('donasi body:', req.body);

  if (!amount || !description) {
    console.log('donasi failed missing amount/description');
    return res.status(400).json({ error: 'amount, description wajib' });
  }

  const entry = {
    id: nextId++,
    amount: String(amount),
    description: String(description),
    recipient_id: String(recipient_id || 'unknown'),
    actor_id: String(actor_id || 'unknown'),
    hash_prev: 'no-hash',
    hash_self: 'no-verify',
    timestamp: new Date().toISOString(),
  };
  LEDGER.push(entry);
  console.log('donasi created id=' + entry.id);

  res.status(201).json({ success: true, data: { ledger: entry, distributions: [] } });
});

app.listen(PORT, () => {
  console.log('kas-service 01 listening on port ' + PORT);
});
