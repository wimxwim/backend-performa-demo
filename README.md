# Backend Performa Demo — Gotong Royong | 03 Pasar 6.081 — scale

> **Babak 3 dari 4 — Pasar 6.081 scale (Nafi': bermanfaat scale)**

> ⚠️ 99 detik = waktu BIKIN 5 juta data fake untuk test (seeding), BUKAN waktu buka aplikasi. User cari 'ayam' cuma 10ms (200x lebih cepat).

![Branch 03 Pasar](https://img.shields.io/badge/Branch-03%20Pasar%206.081%20scale-green) ![TIGA INSAN Nafi'](https://img.shields.io/badge/TIGA%20INSAN-Nafi'%20bermanfaat-orange)

## Filosofi — TIGA INSAN

| INSAN | Makna | Branch |
|-------|-------|--------|
| **Muttaqin** | Jujur, amanah, tapi manual | 01 Warung — console.log |
| **Shalih** | Rapi, terstruktur, SOP | 02 UMKM SOP — pino JSON |
| **Nafi'** | **Bermanfaat scale untuk umat** | **03 Pasar 6.081 — 3 container + LB** |

Branch 03 adalah **Nafi'** — bermanfaat scale. Pino tetap (dari 02), tapi scale horizontal: 3 container `order-service` + `nginx` LB. Log dari 3 container harus terpusat (next: 04 Alloy→Loki).

## Branch vs Slide Mapping

| Branch | Nama GotongRoyong | Slide | Fokus | Analogi |
|--------|-------------------|-------|-------|---------|
| `01-warung` | 01 Warung — console.log | 4-5 | console.log jebakan 3 pertanyaan | Warung catat buku tulis |
| `02-umkm-sop` | 02 UMKM SOP — pino JSON | 6-14 | pino JSON + requestId + redact | UMKM 6.081 SOP |
| `03-pasar-scale` | **03 Pasar 6.081 — scale** | **15-17** | **3 container + nginx LB + hostname** | **Pasar 6.081 — 3 lapak, 1 pintu masuk** |
| `04-sakti-centralized` | 04 SAKTI 5M — centralized | 18-22 | Alloy→Loki→Grafana | SAKTI 5M — 5 juta log terpusat |

> **Website 1 atap v2**: `website/index.html` 615 baris + `website/app.js` 294 baris — branch switcher 4 opsi, 5 tabs, mermaid, LogQL. Buka: `cd website && python3 -m http.server 8000` → `http://localhost:8000/?branch=03-pasar-scale&tab=diagram`

## Babak 3: Pasar 6.081 — 3 container + nginx LB + hostname

### Apa yang berubah dari 02

| 02 UMKM SOP (1 container) | 03 Pasar 6.081 (3 container + LB) |
|----------------------------|-------------------------------------|
| 1x `order-service` :3001 | 3x `order-service-1/2/3` :3001/:3002/:3003 + `nginx` :8080 LB |
| Log dari 1 container | Log dari 3 container — harus terpusat (next 04) |
| Tanpa hostname | `hostname: order-1/2/3` + `base: {service, hostname}` di pino |
| Tanpa LB | `nginx/nginx.conf` upstream round-robin + `proxy_set_header X-Request-Id` |
| `compose.yaml` infra inti saja | `compose.yaml` + 3 service + nginx |

### File Delta Minimal (seperti PZN)

- `compose.yaml` — **diganti**: tambah `order-service-1/2/3` (hostname order-1/2/3) + `nginx` LB
- `order-service/Dockerfile` — **baru**: `FROM node:20-alpine` + `npx tsx order-service/src/index.ts`
- `nginx/nginx.conf` — **tetap** (sudah ada di main, upstream 3 replica)
- `order-service/src/index.ts` — **tetap** pino JSON dari 02 (tidak diubah, delta minimal)
- `order-service/src/logger.ts` — **tetap** pino dengan `hostname: os.hostname()` (sudah ada)
- `website/` — tetap 615+294 baris, branch switcher `?branch=03-pasar-scale`

### Cara Jalan — Branch 03

```bash
git checkout 03-pasar-scale
podman-compose up -d          # atau docker compose up -d
# cek 3 container + LB
podman ps | grep gr-order     # gr-order-1, gr-order-2, gr-order-3
podman ps | grep gr-nginx     # gr-nginx :8080
# test LB round-robin
for i in 1 2 3 4 5; do curl -s http://localhost:8080/health | jq .hostname; done
# harus bergantian: order-1, order-2, order-3, order-1, order-2
# test checkout via LB
curl -X POST http://localhost:8080/checkout -H "content-type: application/json" -H "x-request-id: demo-123" -d '{"userId":"u1","amount":50000,"card":"4111111111111111"}' | jq
# lihat log dari 3 container — hostname beda!
podman logs gr-order-1 | jq 'select(.requestId=="demo-123")'
podman logs gr-order-2 | jq 'select(.requestId=="demo-123")'
podman logs gr-order-3 | jq 'select(.requestId=="demo-123")'
# masalah: log terpisah di 3 container — next 04: Alloy→Loki terpusat!
```

### Demo Live — Scale Problem

```bash
# 02: 1 container — log di 1 tempat
podman logs gr-order-service | jq 'select(.level=="error")'  # 1 container

# 03: 3 container — log terpisah, harus cek 3x!
podman logs gr-order-1 | jq 'select(.level=="error")'
podman logs gr-order-2 | jq 'select(.level=="error")'
podman logs gr-order-3 | jq 'select(.level=="error")'
# repot! next 04: Alloy kumpulkan semua → Loki → Grafana query 1x: {job="order-service"} |= "error"
```

### Analogi GotongRoyong

- **Warung (01)**: 1 warung catat manual.
- **UMKM SOP 6.081 (02)**: 6.081 UMKM pakai SOP — log terstruktur.
- **Pasar 6.081 (03)**: 6.081 lapak di pasar — 3 container + nginx LB (1 pintu masuk, 3 lapak). Log dari 3 lapak harus terpusat, tidak bisa cek 1 per 1.
- **SAKTI 5M (04)**: Next — 5 juta warga, Alloy→Loki→Grafana terpusat, query 10ms.

## Cara Verifikasi

```bash
git checkout 03-pasar-scale && ls README.md website/index.html  # exist
cat compose.yaml | grep "order-service-1"  # 3 container
cat compose.yaml | grep "nginx"  # LB
cat order-service/Dockerfile | grep "FROM node"  # Dockerfile
podman-compose up -d && curl -s http://localhost:8080/health | jq
```

## Next / Prev

```bash
git checkout 02-umkm-sop          # prev: pino JSON
git checkout 04-sakti-centralized # next: Alloy→Loki→Grafana
```

## Referensi

- `website/index.html` — Website 1 atap v2, branch switcher `?branch=03-pasar-scale`
- `presentasi/index.html#slide-15` — Slide 15-17: pg_trgm GIN, MatView, PgBouncer
- `nginx/nginx.conf` — Upstream 3 replica + X-Request-Id propagation
- `docs/BUKU_BELAJAR_GOTONGROYONG_LENGKAP.md` — 2119 baris, TIGA INSAN Nafi'

