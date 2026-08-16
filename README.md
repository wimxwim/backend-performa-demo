# Backend Performa Demo — Gotong Royong | 04 SAKTI 5M — centralized

> **Babak 4 dari 4 — SAKTI 5M centralized (Nafi': bermanfaat scale, puncak)**

> ⚠️ 99 detik = waktu BIKIN 5 juta data fake untuk test (seeding), BUKAN waktu buka aplikasi. User cari 'ayam' cuma 10ms (200x lebih cepat).

![Branch 04 SAKTI](https://img.shields.io/badge/Branch-04%20SAKTI%205M%20centralized-purple) ![TIGA INSAN Nafi'](https://img.shields.io/badge/TIGA%20INSAN-Nafi'%20bermanfaat-orange) ![TERUJI 5M](https://img.shields.io/badge/TERUJI-5M%2099s%2050K%2Fs-brightgreen)

## Filosofi — TIGA INSAN

| INSAN | Makna | Branch |
|-------|-------|--------|
| **Muttaqin** | Jujur, amanah, tapi manual | 01 Warung — console.log |
| **Shalih** | Rapi, terstruktur, SOP | 02 UMKM SOP — pino JSON |
| **Nafi'** | **Bermanfaat scale untuk umat** | **03 Pasar 6.081 + 04 SAKTI 5M** |

Branch 04 adalah **Nafi' puncak** — bermanfaat untuk 5 juta warga. Semua log dari 3 container terpusat via **Alloy → Loki → Grafana**, query 10ms via LogQL, dashboard, alert.

## Branch vs Slide Mapping

| Branch | Nama GotongRoyong | Slide | Fokus | Analogi |
|--------|-------------------|-------|-------|---------|
| `01-warung` | 01 Warung — console.log | 4-5 | console.log jebakan 3 pertanyaan | Warung catat buku tulis |
| `02-umkm-sop` | 02 UMKM SOP — pino JSON | 6-14 | pino JSON + requestId + redact | UMKM 6.081 SOP |
| `03-pasar-scale` | 03 Pasar 6.081 — scale | 15-17 | 3 container + nginx LB + hostname | Pasar 6.081 — 3 lapak |
| `04-sakti-centralized` | **04 SAKTI 5M — centralized** | **18-22** | **Alloy→Loki→Grafana** | **SAKTI 5M — 5 juta log terpusat, query 10ms** |

> **Website 1 atap v2**: `website/index.html` 615 baris + `website/app.js` 294 baris — branch switcher 4 opsi, 5 tabs, mermaid, LogQL. Buka: `cd website && python3 -m http.server 8000` → `http://localhost:8000/?branch=04-sakti-centralized&tab=logql`

## Babak 4: SAKTI 5M — Alloy → Loki → Grafana

### Apa yang berubah dari 03

| 03 Pasar 6.081 (3 container, log terpisah) | 04 SAKTI 5M (centralized) |
|---------------------------------------------|----------------------------|
| Log terpisah di 3 container — cek 1 per 1 | **Alloy kumpulkan semua → Loki terpusat → Grafana query 1x** |
| `podman logs gr-order-1/2/3` manual | `LogQL: {job="order-service"} |= "CARD_DECLINED"` — 10ms |
| Tanpa dashboard | **Grafana dashboard** `observability/grafana/dashboards/performa.json` |
| Tanpa alert | **Prometheus + alerts.yml** — alert jika error rate > 1% |
| Tanpa trace | **OTEL Collector → Jaeger** (opsional, profile observability) |

### File Delta Minimal (seperti PZN)

- `compose.observability.yaml` — **tetap** (sudah ada di main): `prometheus` + `grafana` + `loki` + `alloy` + `otel-collector` + `jaeger` (profile observability)
- `observability/alloy/config.alloy` — **tetap**: `discovery.docker` + `loki.source.docker` + `stage.json` + `stage.labels` + `loki.write` → Loki 3100
- `observability/loki/loki.yml` — **tetap**: Boltdb shipper, retention 31 hari, `allow_structured_metadata: true`
- `observability/grafana/dashboards/performa.json` — **tetap**: dashboard performa + LogQL
- `observability/grafana/dashboards/loki.json` — **tetap**: dashboard Loki logs
- `compose.yaml` — **tetap** dari 03 (3 container + nginx LB) — tidak diubah, delta minimal
- `order-service/src/index.ts` — **tetap** pino dari 02/03 — tidak diubah
- `website/` — tetap 615+294 baris, branch switcher `?branch=04-sakti-centralized`

### Cara Jalan — Branch 04

```bash
git checkout 04-sakti-centralized
podman-compose -f compose.yaml -f compose.observability.yaml --profile observability up -d
# atau: docker compose -f compose.yaml -f compose.observability.yaml --profile observability up -d
# cek semua jalan
podman ps | grep gr-  # gr-postgres, gr-redis, gr-order-1/2/3, gr-nginx, gr-loki, gr-alloy, gr-grafana, gr-prometheus
# buka Grafana
open http://localhost:3000  # admin/admin
# buka Loki
curl -s http://localhost:3100/ready  # ready
# test checkout via LB — log otomatis ke Loki via Alloy
curl -X POST http://localhost:8080/checkout -H "content-type: application/json" -H "x-request-id: demo-123" -d '{"userId":"u1","amount":50000,"card":"4111111111111111"}' | jq
# query di Grafana Explore → Loki → LogQL:
# {job="order-service"} |= "demo-123"  — korelasi antar service via requestId!
# {job="order-service"} | json | level="error"  — filter error saja
# {job="warung-service"} |= "CARD_DECLINED"  — preset UMKM
```

### Demo Live — Centralized vs Terpisah

```bash
# 03: cek 3 container manual — repot!
podman logs gr-order-1 | grep demo-123
podman logs gr-order-2 | grep demo-123
podman logs gr-order-3 | grep demo-123

# 04: query 1x di Grafana — 10ms!
# Grafana → Explore → Loki → {job="order-service"} |= "demo-123"
# Semua log dari 3 container terpusat, bisa filter by requestId, level, latency_ms
# Dashboard: p50/p95/p99 latency, error rate, throughput — auto dari Loki + Prometheus
```

### Analogi GotongRoyong

- **Warung (01)**: 1 warung catat manual.
- **UMKM SOP 6.081 (02)**: 6.081 UMKM pakai SOP — log terstruktur.
- **Pasar 6.081 (03)**: 6.081 lapak di pasar — 3 container + LB.
- **SAKTI 5M (04)**: **5 juta warga** — Alloy→Loki→Grafana terpusat. Seperti SAKTI (Sistem Aplikasi Keuangan Tingkat Instansi) yang kelola 5 juta transaksi — semua log terpusat, query 10ms, dashboard real-time, alert jika error. Tanpa centralized, 5 juta log tidak bisa di-manage.

## Cara Verifikasi

```bash
git checkout 04-sakti-centralized && ls README.md website/index.html  # exist
cat observability/alloy/config.alloy | grep "loki.source.docker"  # Alloy pipeline
cat observability/loki/loki.yml | grep "allow_structured_metadata"  # Loki config
cat observability/grafana/dashboards/performa.json | grep "loki" | head -3  # dashboard
podman-compose -f compose.yaml -f compose.observability.yaml --profile observability up -d
curl -s http://localhost:3100/ready && curl -s http://localhost:3000/api/health | jq
```

## Next / Prev

```bash
git checkout 03-pasar-scale  # prev: 3 container + LB
git checkout main             # kembali ke main (website v2 + semua docs)
```

## Referensi

- `website/index.html` — Website 1 atap v2, branch switcher `?branch=04-sakti-centralized`
- `presentasi/index.html#slide-18` — Slide 18-22: Caching L1/L2/L3, ES, CDC, Observabilitas
- `observability/alloy/config.alloy` — Alloy pipeline: Docker logs → Loki
- `observability/loki/loki.yml` — Loki single instance, Boltdb shipper
- `observability/grafana/dashboards/performa.json` — Dashboard Grafana
- `docs/BUKU_BELAJAR_GOTONGROYONG_LENGKAP.md` — 2119 baris, TIGA INSAN Nafi'
- PZN logging-management-demo branch 04 — centralized Alloy→Loki→Grafana

