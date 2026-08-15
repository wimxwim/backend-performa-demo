# Demo 01 vs 02 — Before/After Logging & Performa

> Branch 01 = jebakan P99 bohong + password bocor. Branch 02 = Pino JSON proper + redact + trace.

## Ringkasan Before/After

| Aspek | Branch 01 `01-console-log` (JELEK) | Branch 02 `02-proper-logging` (BENAR) |
|-------|-------------------------------------|----------------------------------------|
| **Logger** | `console.log("user "+userId+" card "+card)` | `pino` JSON structured, stdout |
| **Level** | Tidak ada — semua log level sama | `trace/debug/info/warn/error/fatal` via `LOG_LEVEL` env |
| **Format** | String concatenation, tidak bisa di-parse | JSON `{level, time, service, requestId, msg}` |
| **PII / card** | Bocor plain di log & response | `redact: ['req.body.password','card','password','token','*.password']` -> `[Redacted]` |
| **requestId** | Tidak ada — trace putus order -> payment | `crypto.randomUUID()`, `x-request-id` header, `logger.child({requestId})` |
| **Propagasi** | `fetch(paymentUrl, {body: JSON.stringify({card})})` tanpa header | `fetch(paymentUrl, {headers:{'x-request-id':req.requestId}})` |
| **Latency** | Tidak diukur — P99 bohong | `latency_ms: Date.now()-start` di `res.on('finish')` |
| **Transport** | `console.log` ke stdout campur aduk | `pino-pretty` di dev (colorize), JSON murni di production |
| **Cari UMKM** | `LIKE '%keyword%'` Seq Scan 6k baris | Sama di 02 (optimasi pg_trgm di branch 03) — tapi log sudah JSON |
| **N+1** | `GET /api/umkm/:id` loop 3 query | Sama di 02 (optimasi JOIN di branch 03) |
| **Kas hash** | `hash_prev='no-hash-chain'` tanpa verify | Sama di 02 (trigger SHA-256 di branch 03) |
| **Observability** | Tidak bisa di-aggregate di Loki | Siap Alloy -> Loki -> Grafana (LogQL `| json | requestId="..."`) |

## Log Comparison

### Branch 01 — Bocor & Tidak Terstruktur

```
user u123 checkout 50000 card 4111111111111111 password rahasia123 token eyJhb...
checkout request body: { userId: 'u123', amount: 50000, card: '4111111111111111', password: 'rahasia123' }
payment response for user u123 card 4111111111111111: {"success":true}
```

- Tidak ada `level`, tidak ada `time`, tidak ada `requestId`.
- `card` + `password` + `token` plain — jika log bocor ke ELK/Loki, PII tersebar.
- Tidak bisa `grep requestId` — trace order -> payment putus.

### Branch 02 — JSON + Redact + Trace

```json
{"level":"info","time":"2026-08-15T00:00:00.000Z","service":"order-service","hostname":"gr-order-1","requestId":"550e8400-e29b-41d4-a716-446655440000","userId":"u123","amount":50000,"latency_ms":42,"msg":"checkout success"}
{"level":"info","time":"2026-08-15T00:00:00.010Z","service":"payment-service","hostname":"gr-payment-1","requestId":"550e8400-e29b-41d4-a716-446655440000","msg":"charge success"}
{"level":"info","time":"2026-08-15T00:00:00.010Z","service":"order-service","requestId":"550e8400-e29b-41d4-a716-446655440000","card":"[Redacted]","password":"[Redacted]","msg":"payment response"}
```

- `card` -> `[Redacted]` via `redact` Pino.
- `requestId` sama di order & payment — bisa `LogQL: {service="order-service"} | json | requestId="550e..."`.
- `latency_ms` untuk histogram p50/p95/p99 di Prometheus.

## P99 Bohong — Mengapa Branch 01 Menipu

- Branch 01 tanpa `latency_ms` — p99 dihitung dari `load.ts` saja, tidak ada server-side histogram.
- `LIKE '%ayam%'` Seq Scan: p50 20ms saat 100 baris, p99 800ms saat 6.081 baris — tanpa `pg_trgm GIN` + tanpa log, tidak ketahuan.
- N+1 `GET /api/umkm/:id`: 1 + 3 query = 4 round-trip DB — p99 naik 4x, tapi log 01 tidak tunjukkan query count.
- Branch 03 akan buktikan: `pg_trgm GIN` + `JOIN` + `Redis` turunkan p99 10x.

## Cara Demo 01 vs 02

### 1. Jalankan Branch 01

```bash
git checkout 01-console-log
# atau tetap di main, jalankan file 01:
bun run --cwd order-service src/index.ts &
bun run --cwd payment-service src/index.ts &
bun run --cwd umkm-service src/index.ts &
bun run --cwd kas-service src/index-01.ts &

# Hit checkout — lihat card bocor
curl -X POST http://localhost:3001/checkout -H 'content-type: application/json' \
  -d '{"userId":"u123","amount":50000,"card":"4111111111111111","password":"rahasia123","token":"tok123"}'

# Cek log — card plain
# Hit cari — Seq Scan
curl 'http://localhost:3003/api/cari?q=ayam'
# Hit umkm N+1
curl http://localhost:3003/api/umkm/umkm_1
```

### 2. Jalankan Branch 02

```bash
git checkout 02-proper-logging
# atau jalankan proper:
LOG_LEVEL=debug NODE_ENV=development bun run --cwd order-service src/index-proper.ts &
bun run --cwd payment-service src/index-proper.ts &
# umkm/kas proper juga (jika ada)

curl -X POST http://localhost:3001/checkout -H 'content-type: application/json' \
  -d '{"userId":"u123","amount":50000,"card":"4111111111111111","password":"rahasia123"}'
# Log JSON, card=[Redacted], requestId propagasi

# Trace via x-request-id
curl -X POST http://localhost:3001/checkout -H 'x-request-id: demo-123' -H 'content-type: application/json' \
  -d '{"userId":"u123","amount":50000,"card":"4111111111111111"}'
# Response header x-request-id: demo-123, log payment juga requestId=demo-123
```

### 3. Load Test — Buktikan p99

```bash
TARGET=http://localhost:8080 VUS=100 REQUESTS_PER_VU=20 bun run --cwd load load.ts
# atau via nginx:
TARGET=http://localhost:8080 bun --cwd load run load.ts

# Output: p50/p95/p99/p99.9 + error rate + per-endpoint breakdown
# Bandingkan 01 vs 03: p99 01 ~800ms, p99 03 ~80ms (setelah pg_trgm + Redis + MatView)
```

### 4. Loki Query (Branch 04)

```logql
{service="order-service"} | json | requestId="550e8400-e29b-41d4-a716-446655440000"
{service="payment-service"} | json | level="error"
{service="umkm-service"} | json | latency_ms > 500
```

## Checklist Verifikasi

- [ ] `cat order-service/src/logger.ts` — pastikan `redact` ada `[Redacted]`, `censor:'[Redacted]'`
- [ ] `cat order-service/src/middleware/requestId.ts` — pastikan `crypto.randomUUID()` + `x-request-id`
- [ ] `cat load/load.ts` — pastikan hitung `p50/p95/p99/p99.9` via `percentile(sorted, 0.5/0.95/0.99/0.999)`
- [ ] `node --check order-service/src/index.ts` — syntax ok
- [ ] `node --check load/load.ts` — syntax ok

## Referensi

- PZN logging-management-demo branch 01 & 02
- Spec lock `docs/spec-backend-performa.md` Bab 10.1 (SLA 16 endpoint), Bab 8.5 (3 pilar observabilitas)
- Prisma schema `prisma/schema.prisma` — Umkm 6.081 baris, Masjid 256 baris, financial_ledger hash chain
