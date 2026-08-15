// payment-service/src/index.ts — Branch 01 ANTI-PATTERN
// Bahasa komentar: Indonesia
// Jebakan: console.log payment, card bocor plain, tanpa requestId propagation, tanpa level, tanpa JSON

import express from 'express';

const app = express();
const PORT = Number(process.env.PORT || 3002);

app.use(express.json());

// ANTI-PATTERN: tanpa middleware requestId, tanpa logger Pino, tanpa redact

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'payment-service', branch: '01-console-log' });
});

// POST /charge — proses pembayaran (simulasi kadang gagal CARD_DECLINED)
app.post('/charge', async (req, res) => {
  const { userId, amount, card, password, token } = req.body;

  // JEBAKAN: card + password bocor di log plain, tanpa redact
  // JEBAKAN: tanpa requestId — tidak bisa trace dari order-service
  console.log('charge request user=' + userId + ' amount=' + amount + ' card=' + card + ' password=' + password + ' token=' + token);
  console.log('charge body:', req.body);
  console.log('processing charge for user ' + userId + ' card ' + card);

  if (!userId || !amount || !card) {
    console.log('charge failed: missing field userId=' + userId + ' amount=' + amount);
    return res.status(400).json({ error: 'userId, amount, card wajib' });
  }

  // Simulasi validasi card — kadang gagal (untuk demo error rate)
  const cardStr = String(card);
  if (cardStr.endsWith('0000') || cardStr === '4000000000000002') {
    console.log('CARD_DECLINED user ' + userId + ' card ' + card + ' amount ' + amount);
    return res.status(402).json({ error: 'CARD_DECLINED', card, userId });
  }

  // Simulasi latency acak — tanpa diukur, tanpa log latency_ms
  const delay = Math.random() * 80 + 10;
  await new Promise((r) => setTimeout(r, delay));

  // JEBAKAN: log success masih bocorkan card
  console.log('charge success user ' + userId + ' card ' + card + ' amount ' + amount + ' delay ' + delay + 'ms');
  console.log('payment completed for card ' + card);

  return res.json({
    success: true,
    transactionId: 'txn_' + Date.now(),
    userId,
    amount,
    cardLast4: cardStr.slice(-4),
    // ANTI-PATTERN: kembalikan card full di response (bocor lagi)
    card,
    processedAt: new Date().toISOString(),
  });
});

// POST /refund — tanpa requestId juga
app.post('/refund', (req, res) => {
  const { transactionId, card } = req.body;
  console.log('refund transactionId=' + transactionId + ' card=' + card);
  console.log('refund body:', req.body);
  res.json({ success: true, transactionId, refundedAt: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log('payment-service 01 listening on port ' + PORT);
});
