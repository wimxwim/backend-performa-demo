// order-service/src/index.ts — Branch 01 ANTI-PATTERN (jangan tiru di produksi)
// Bahasa komentar: Indonesia
// Ciri jebakan P99: console.log tanpa level, tanpa requestId, card bocor, tanpa redact, tanpa latency, tanpa JSON
// Spec: Express POST /checkout -> fetch payment-service tanpa x-request-id propagation

import express from 'express';

const app = express();
const PORT = Number(process.env.PORT || 3001);
const PAYMENT_URL = process.env.PAYMENT_URL || 'http://localhost:3002/charge';

app.use(express.json());

// ANTI-PATTERN: tanpa middleware requestId, tanpa logger, tanpa latency tracker
// Semua log pakai console.log string concatenation — tidak bisa di-aggregate di Loki

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'order-service', branch: '01-console-log' });
});

// POST /checkout — simulasi checkout order -> panggil payment-service
// Body: { userId, amount, card, password, token }
app.post('/checkout', async (req, res) => {
  const { userId, amount, card, password, token } = req.body;

  // JEBAKAN 1: console.log tanpa level, tanpa JSON, tanpa requestId
  // JEBAKAN 2: card + password + token bocor plain di log (PII leak)
  console.log('user ' + userId + ' checkout ' + amount + ' card ' + card + ' password ' + password + ' token ' + token);
  console.log('checkout request body:', req.body);
  console.log('processing payment for user ' + userId + ' amount ' + amount);

  if (!userId || !amount || !card) {
    console.log('checkout failed: missing field userId=' + userId + ' amount=' + amount + ' card=' + card);
    return res.status(400).json({ error: 'userId, amount, card wajib' });
  }

  // ANTI-PATTERN: tanpa validasi card format, tanpa redact, langsung teruskan ke payment
  // ANTI-PATTERN: tanpa x-request-id propagation — payment tidak bisa di-trace
  // ANTI-PATTERN: tanpa timeout, tanpa retry, tanpa latency measurement
  try {
    console.log('calling payment service at ' + PAYMENT_URL + ' for user ' + userId);

    const resp = await fetch(PAYMENT_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId, amount, card, password, token }),
    });

    const data = await resp.json();

    // ANTI-PATTERN: log response tanpa level, card masih kebawa
    console.log('payment response for user ' + userId + ' card ' + card + ': ' + JSON.stringify(data));

    if (!resp.ok) {
      console.log('payment failed for user ' + userId + ' amount ' + amount + ' card ' + card);
      return res.status(402).json({ error: 'payment failed', detail: data });
    }

    console.log('checkout success user ' + userId + ' amount ' + amount + ' card ' + card);

    return res.json({
      success: true,
      orderId: 'ord_' + Date.now(),
      userId,
      amount,
      payment: data,
    });
  } catch (err: any) {
    // ANTI-PATTERN: console.log error tanpa stack structured, tanpa requestId
    console.log('checkout error user ' + userId + ' card ' + card + ' error ' + err.message);
    console.log(err);
    return res.status(500).json({ error: 'checkout gagal', detail: err.message });
  }
});

// GET /api/komunitas/:id — tanpa cache, tanpa index hint, console.log saja
app.get('/api/komunitas/:id', async (req, res) => {
  const id = req.params.id;
  console.log('get komunitas id=' + id);
  // Simulasi query tanpa cache — tiap request hit DB
  console.log('query SELECT * FROM communities WHERE id=' + id);
  res.json({ id, name: 'Komunitas ' + id, note: 'branch 01 tanpa cache Redis' });
});

app.listen(PORT, () => {
  console.log('order-service 01 listening on port ' + PORT);
  console.log('PAYMENT_URL=' + PAYMENT_URL);
});
