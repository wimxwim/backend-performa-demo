# Backend Performa Demo — Gotong Royong | 01 Warung — console.log

> **Babak 1 dari 4 — Warung catat buku (Muttaqin: jujur tapi berantakan)**

> ⚠️ 99 detik = waktu BIKIN 5 juta data fake untuk test (seeding), BUKAN waktu buka aplikasi. User cari 'ayam' cuma 10ms (200x lebih cepat).

![Branch 01 Warung](https://img.shields.io/badge/Branch-01%20Warung%20console.log-orange) ![TIGA INSAN Muttaqin](https://img.shields.io/badge/TIGA%20INSAN-Muttaqin%20jujur-blue)

## Filosofi — TIGA INSAN

Gotong Royong adalah **OS Kehidupan Komunitas** dengan nilai **TIGA INSAN: Muttaqin, Shalih, Nafi'**. Branch 01 adalah **Muttaqin** — jujur mencatat, tapi berantakan seperti warung catat di buku tulis tanpa SOP.

| INSAN | Makna | Branch |
|-------|-------|--------|
| **Muttaqin** | Jujur, amanah, tapi manual | 01 Warung — console.log |
| **Shalih** | Rapi, terstruktur, SOP | 02 UMKM SOP — pino JSON |
| **Nafi'** | Bermanfaat scale untuk umat | 03 Pasar 6.081 + 04 SAKTI 5M |

## Branch vs Slide Mapping (seperti PZN main README)

| Branch | Nama GotongRoyong | Slide | Fokus | Analogi |
|--------|-------------------|-------|-------|---------|
| `01-warung` | **01 Warung — console.log** | 4-5 | console.log jebakan 3 pertanyaan | Warung catat buku tulis — 1 warung ok, 6.081 warung hancur |
| `02-umkm-sop` | **02 UMKM SOP — pino JSON** | 6-14 | pino JSON + requestId + redact | UMKM 6.081 SOP — log terstruktur bisa di-query |
| `03-pasar-scale` | **03 Pasar 6.081 — scale** | 15-17 | 3 container + nginx LB + hostname | Pasar 6.081 scale — 3 lapak, 1 pintu masuk |
| `04-sakti-centralized` | **04 SAKTI 5M — centralized** | 18-22 | Alloy→Loki→Grafana | SAKTI 5M — 5 juta log terpusat, query 10ms |

> **Website 1 atap v2**: `website/index.html` 615 baris + `website/app.js` 294 baris — branch switcher 4 opsi, 5 tabs, mermaid, LogQL. Buka: `cd website && python3 -m http.server 8000` → `http://localhost:8000/?branch=01-warung&tab=readme`

## Babak 1: Warung — console.log Jebakan 3 Pertanyaan

### Apa yang ada di branch ini

- `order-service/src/index.ts` — **ANTI-PATTERN** (jangan tiru di produksi): `console.log` tanpa level, tanpa requestId, card bocor, tanpa redact, tanpa latency, tanpa JSON
- `compose.yaml` — infra inti saja (postgres+redis+pgbouncer), tanpa observability
- `website/` — Website 1 atap v2 (branch switcher 4 opsi, 5 tabs)

### 3 Pertanyaan Jebakan (seperti PZN)

1. **"Log ini dari request mana?"** — Tidak ada `requestId`, tidak bisa korelasi antar service. `console.log('user 123 checkout 50000')` — request mana? Tidak tahu.
2. **"Level-nya apa?"** — Semua `console.log` sama, tidak ada `info/warn/error`. Tidak bisa filter `level=error` di Grafana.
3. **"Card bocor tidak?"** — `console.log('card ' + card)` — PII bocor plain di log! Di 02 akan di-redact jadi `[Redacted]`.

### Cara Jalan — Branch 01

```bash
git checkout 01-warung
podman-compose up -d          # atau docker compose up -d
bun install && bun run dev    # order-service :3001
curl -X POST http://localhost:3001/checkout -H "content-type: application/json" -d '{"userId":"u1","amount":50000,"card":"4111111111111111","password":"rahasia"}'
# lihat log: card bocor plain! tidak ada requestId!
podman logs gr-order-service  # atau docker logs
```

### Apa yang Salah (Demo Live)

```bash
# 01: log berantakan, tidak bisa di-query
console.log('user ' + userId + ' checkout ' + amount + ' card ' + card)
# output: "user u1 checkout 50000 card 4111111111111111" — card bocor!

# 02 (next): log terstruktur, card di-redact
logger.info({ userId, amount, card, requestId }, 'checkout requested')
# output: {"level":"info","requestId":"abc-123","card":"[Redacted]","msg":"checkout requested"}
```

### Analogi GotongRoyong

- **Warung (01)**: 1 warung catat manual di buku tulis — masih bisa cari manual. Tapi 6.081 warung (data Pesanggrahan) catat manual? Hancur. Tidak bisa audit, tidak bisa cari "CARD_DECLINED" di 5 juta log.
- **UMKM SOP 6.081 (02)**: 6.081 UMKM pakai SOP — log JSON terstruktur, bisa di-query via LogQL `{job="warung-service"} |= "CARD_DECLINED"`.
- **Pasar 6.081 (03)**: 6.081 lapak di pasar — 3 container + nginx LB, log dari 3 container harus terpusat.
- **SAKTI 5M (04)**: 5 juta warga — Alloy→Loki→Grafana, query 10ms, dashboard, alert.

## Cara Verifikasi

```bash
git checkout 01-warung && ls README.md website/index.html  # exist
cat order-service/src/index.ts | grep console.log | head -5  # jebakan
podman-compose up -d && curl -s http://localhost:3001/health | jq
```

## Next: 02 UMKM SOP

```bash
git checkout 02-umkm-sop  # pino JSON + requestId + redact
```

## Referensi

- `website/index.html` — Website 1 atap v2, branch switcher `?branch=01-warung`
- `presentasi/index.html#slide-4` — Slide 4-5: Konteks Indonesia 3G + SLA p50/p95/p99
- `docs/BUKU_BELAJAR_GOTONGROYONG_LENGKAP.md` — 2119 baris, TIGA INSAN
- PZN logging-management-demo — 4 tahap (console → pino → scale → centralized)

