# Backend Performa Demo — Gotong Royong | 02 UMKM SOP — pino JSON

> **Babak 2 dari 4 — UMKM SOP 6.081 (Shalih: rapi & terstruktur)**

> ⚠️ 99 detik = waktu BIKIN 5 juta data fake untuk test (seeding), BUKAN waktu buka aplikasi. User cari 'ayam' cuma 10ms (200x lebih cepat).

![Branch 02 UMKM SOP](https://img.shields.io/badge/Branch-02%20UMKM%20SOP%20pino%20JSON-blue) ![TIGA INSAN Shalih](https://img.shields.io/badge/TIGA%20INSAN-Shalih%20rapi-green)

## Filosofi — TIGA INSAN

| INSAN | Makna | Branch |
|-------|-------|--------|
| **Muttaqin** | Jujur, amanah, tapi manual | 01 Warung — console.log |
| **Shalih** | **Rapi, terstruktur, SOP** | **02 UMKM SOP — pino JSON** |
| **Nafi'** | Bermanfaat scale untuk umat | 03 Pasar 6.081 + 04 SAKTI 5M |

Branch 02 adalah **Shalih** — rapi & terstruktur seperti UMKM 6.081 yang pakai SOP. Setiap log punya `level`, `requestId`, `timestamp ISO`, `service`, `hostname`, dan PII di-redact.

## Branch vs Slide Mapping

| Branch | Nama GotongRoyong | Slide | Fokus | Analogi |
|--------|-------------------|-------|-------|---------|
| `01-warung` | 01 Warung — console.log | 4-5 | console.log jebakan 3 pertanyaan | Warung catat buku tulis |
| `02-umkm-sop` | **02 UMKM SOP — pino JSON** | **6-14** | **pino JSON + requestId + redact** | **UMKM 6.081 SOP — log terstruktur bisa di-query** |
| `03-pasar-scale` | 03 Pasar 6.081 — scale | 15-17 | 3 container + nginx LB + hostname | Pasar 6.081 scale — 3 lapak, 1 pintu masuk |
| `04-sakti-centralized` | 04 SAKTI 5M — centralized | 18-22 | Alloy→Loki→Grafana | SAKTI 5M — 5 juta log terpusat, query 10ms |

> **Website 1 atap v2**: `website/index.html` 615 baris + `website/app.js` 294 baris — branch switcher 4 opsi, 5 tabs, mermaid, LogQL. Buka: `cd website && python3 -m http.server 8000` → `http://localhost:8000/?branch=02-umkm-sop&tab=code`

## Babak 2: UMKM SOP — pino JSON + requestId + redact

### Apa yang berubah dari 01

| 01 Warung (console.log) | 02 UMKM SOP (pino JSON) |
|--------------------------|--------------------------|
| `console.log('user ' + userId + ' card ' + card)` | `logger.info({ userId, card, requestId }, 'checkout requested')` |
| Card bocor plain | Card → `[Redacted]` via `redact: ['card','password','token']` |
| Tanpa requestId | `requestId: crypto.randomUUID()` + `x-request-id` propagation ke payment-service |
| Tanpa level | `level: info/warn/error` — bisa filter `level=error` |
| Tanpa latency | `latency_ms: Date.now() - start` tiap request |
| String concatenation | JSON terstruktur — bisa di-query via `jq` / LogQL |

### File Delta Minimal (seperti PZN)

- `order-service/src/index.ts` — **diganti** dari `index-proper.ts` (pino + requestId + latency + x-request-id propagation)
- `order-service/src/logger.ts` — **baru**: `pino({ level, base:{service,hostname}, formatters.level, redact, transport: pino-pretty })`
- `order-service/src/middleware/requestId.ts` — **baru**: `crypto.randomUUID()` + `logger.child({requestId})`
- `shared/logger.ts` + `shared/requestId.ts` — factory untuk 4 service (sudah ada di main, tetap)
- `compose.yaml` — tetap infra inti (postgres+redis+pgbouncer), belum scale
- `website/` — tetap 615+294 baris, branch switcher `?branch=02-umkm-sop`

### Cara Jalan — Branch 02

```bash
git checkout 02-umkm-sop
podman-compose up -d
bun install && bun run dev
curl -X POST http://localhost:3001/checkout -H "content-type: application/json" -H "x-request-id: demo-123" -d '{"userId":"u1","amount":50000,"card":"4111111111111111","password":"rahasia"}'
# lihat log: card sudah [Redacted], ada requestId demo-123, ada level info, ada latency_ms
podman logs gr-order-service | jq  # JSON terstruktur!
```

### Demo Live — Bandingkan 01 vs 02

```bash
# 01: grep manual, card bocor
podman logs gr-order-service | grep "card 4111"  # bocor!

# 02: query terstruktur, card aman
podman logs gr-order-service | jq 'select(.card=="[Redacted]")'  # aman
podman logs gr-order-service | jq 'select(.requestId=="demo-123")'  # korelasi antar service
podman logs gr-order-service | jq 'select(.level=="error")'  # filter error saja
```

### Analogi GotongRoyong

- **Warung (01)**: 1 warung catat manual — masih bisa cari manual.
- **UMKM SOP 6.081 (02)**: 6.081 UMKM pakai SOP — log JSON terstruktur, bisa di-query via LogQL `{job="warung-service"} |= "CARD_DECLINED"` di Grafana (branch 04). Tanpa SOP, 6.081 warung hancur.
- **Pasar 6.081 (03)**: Next — 3 container + nginx LB, log dari 3 container harus terpusat.
- **SAKTI 5M (04)**: Next — Alloy→Loki→Grafana, 5 juta log terpusat.

## Cara Verifikasi

```bash
git checkout 02-umkm-sop && ls README.md website/index.html  # exist
cat order-service/src/logger.ts | grep redact  # [Redacted]
cat order-service/src/middleware/requestId.ts | grep randomUUID  # requestId
cat order-service/src/index.ts | grep "x-request-id"  # propagation
podman-compose up -d && curl -s http://localhost:3001/health | jq
```

## Next / Prev

```bash
git checkout 01-warung      # prev: console.log jebakan
git checkout 03-pasar-scale # next: 3 container + LB
```

## Referensi

- `website/index.html` — Website 1 atap v2, branch switcher `?branch=02-umkm-sop`
- `presentasi/index.html#slide-6` — Slide 6-14: Poster 200ms, P99, 10 Metrik, B-Tree, Data Flow
- `docs/BUKU_BELAJAR_GOTONGROYONG_LENGKAP.md` — 2119 baris, TIGA INSAN Shalih
- PZN logging-management-demo branch 02 — pino JSON + requestId

