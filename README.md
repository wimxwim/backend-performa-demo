# Backend Performa Demo — Gotong Royong

![5M Synthetic Streaming 99s 50457 rows/s](https://img.shields.io/badge/5M%20Synthetic-Streaming%2099s%2050457%20rows%2Fs-brightgreen) [BENCH_5M.md](docs/BENCH_5M.md) | [TUNING_5M.md](docs/TUNING_5M.md)

> **Logging + Performa, 4 branch** — Demo terintegrasi untuk pembelajaran backend Gotong Royong. Menggabungkan **PZN logging-management-demo (4 tahap)** + **Poster 20 Istilah Performa** + **Modul Performa Backend GR 10 Bab**. Rp0-friendly, jalan di Podman/Docker lokal tanpa cloud.

> **TERUJI 5 JUTA — 99 detik 50K rows/s streaming flat 64MB heap** — Generate 5M NDJSON 2.5GB distribusi Bintaro 32% OK. Lihat [docs/BENCH_5M.md](docs/BENCH_5M.md) (100k 2.66s, 1M 22.4s, 5M 99.1s) dan [docs/TUNING_5M.md](docs/TUNING_5M.md) (22 param BULK). Cara generate: `npx tsx seed/generate.ts --synthetic 5000000 --out /tmp/test_5m.ndjson` (hapus setelah verifikasi, simpan sample 1k 513K).

## Filosofi

Gotong Royong adalah **OS Kehidupan Komunitas** (masjid, RT/RW, keluarga, UMKM) dengan nilai **TIGA INSAN: Muttaqin, Shalih, Nafi'**. Performa adalah wujud **kepercayaan (trust)** — setiap milidetik keterlambatan adalah pengkhianatan amanah data komunitas. Prinsip UX #46: *berfungsi di 3G*, #50: *loading < 3 detik*. Backend harus < 200ms agar total dengan latency 3G (500-1000ms) tetap di bawah 3 detik.

Demo ini mensimulasikan **order-service / payment-service / umkm-service / kas-service** dengan logging bertahap dan optimasi performa, mirip struktur PZN tapi dengan domain Gotong Royong (kas masjid SHA-256, jadwal sholat cache, pencarian pg_trgm).

## 5M Synthetic — Teruji 99 Detik 50K rows/s

> **TERUJI 5 JUTA - 99 detik 50K rows/s streaming flat 64MB heap** — Pipeline P5M-1..P5M-7 COMPLETED, skor 38.5->92/100. Rujuk [docs/BENCH_5M.md](docs/BENCH_5M.md) dan [docs/TUNING_5M.md](docs/TUNING_5M.md).

| Count | Waktu | rows/s | RSS | Heap | File | Status |
|-------|-------|--------|-----|------|------|--------|
| 100k | 2.66s | 37.600 | 205 MB | 13 MB | ~50 MB | PASS |
| 1M | 22.4s | 44.557 | 208 MB | 64.7 MB | 502 MB | PASS |
| 5M | 99.1s | 50.457 | ~210 MB | 64.7 MB | 2.5 GB | PASS |

Cara generate:

```bash
npx tsx seed/generate.ts --synthetic 5000000 --out /tmp/test_5m.ndjson
ls -lh /tmp/test_5m.ndjson # 2.5G
wc -l /tmp/test_5m.ndjson  # 5000000
# distribusi Bintaro 32% Petukangan Utara 27.8% Selatan 17.3% Ulujami 13.5% Pesanggrahan 9.4% OK
# heap flat 64MB, RSS ~210MB (sebelum streaming OOM 9GB)
# file 2.5G deleted hemat disk, sample 1k 513K retained
```

Before vs After: array OOM 9GB + batch 41 menit vs streaming 205MB + COPY 1.6 menit (25x), shared_buffers 256MB->2GB, wal_level logical->minimal, batch 1000->COPY, GIN 40m->12m. Disk budget 19.6GB untuk 5M (data 2.1+ GIN 1.5+WAL 10+temp 6), sisa 17GB dari 90G aman. Untuk 70M butuh 48GB mepet. Tuning apply: `docker compose up -d` + `sudo bash scripts/swap-setup.sh` + `psql -c "SHOW shared_buffers; SHOW wal_level;"`, revert via `compose.production.yaml` atau edit compose.yaml (wal_level minimal->replica, synchronous_commit off->on, max_wal_size 10GB->1GB).

## Arsitektur Singkat

```
Flutter App (single codebase)
      |
 API Gateway (Kong / Supabase Edge)
      |
 7 Fondasi Bersama ──> 6 Database Layer
      |                    |
      |              Postgres 16 (ACID+RLS) ──CDC/Debezium──> ES + ClickHouse
      |              Redis (<10ms)  MongoDB  Influx/Timescale
      |
 Audit SHA-256 Hash Chain (trigger pgcrypto)
```

Detail lengkap: [`docs/spec-backend-performa.md`](docs/spec-backend-performa.md) — spec lock 7 fondasi + 6 DB + 16 endpoint SLA + throughput + threshold + checklist 10.

## 4 Branch Plan (mengikuti PZN + 05 CDC)

| Branch | Nama | Fokus | Stack |
|--------|------|-------|-------|
| `01-console-log` | Anti-pattern | `console.log` tanpa struktur, tanpa level, tanpa correlation-id | Node.js + Express |
| `02-proper-logging` | Proper Logging | **Pino JSON** structured logging, level (trace/debug/info/warn/error/fatal), pretty di dev, file rotation | `pino`, `pino-pretty`, `pino/file` |
| `03-scale` | DB + Cache + Proteksi | Postgres 16 + **PgBouncer pool 25** + **Redis cache-aside** + **pg_trgm GIN** + **MatView** + **rate limiting** + **GZIP** + **cursor pagination** | `pg`, `ioredis`, `express-rate-limit`, `compression` |
| `04-observability` | Observabilitas | **Alloy -> Loki -> Grafana** (logs) + **Prometheus** (metrics) + **OTEL Collector -> Jaeger** (traces) + **pg_stat_statements** | Grafana Alloy, Loki, Prometheus, OTEL, Jaeger |
| `05-cdc` | CDC & OLAP | **Debezium (WAL) -> Kafka -> Elasticsearch (geo_distance) + ClickHouse (OLAP)** — hindari dual-write | Debezium, Kafka, ES 8, ClickHouse |

> Branch `04-observability` dan `05-cdc` digabung di `compose.observability.yaml` (profile `observability`/`cdc`) agar tetap Rp0: nyalakan hanya saat butuh.

### Per Branch — Apa yang Dipelajari

- **01**: Mengapa `console.log` gagal di produksi — tidak ada level, tidak ada JSON, tidak ada trace-id, log hilang saat restart, tidak bisa di-aggregate.
- **02**: Pino JSON — setiap log punya `level`, `time`, `msg`, `traceId`, `service`, `latencyMs`. Di dev pakai `pino-pretty`, di prod JSON ke stdout -> Alloy -> Loki.
- **03**: Optimasi yang bikin p50 turun 10x — index B-Tree & GIN, MatView agregasi kas, Redis cache jadwal sholat (TTL 1 jam), PgBouncer transaction pooling, cursor pagination, GZIP/Brotli, rate limiting.
- **04+05**: Tiga pilar observabilitas (metrics/logs/traces) + CDC — satu-satunya cara sinkronisasi aman (anti dual-write), ES untuk `geo_distance` masjid terdekat, ClickHouse untuk dashboard OKR miliaran baris.

## Cara Menjalankan

### Prasyarat

- **Bun** >= 1.1 atau Node >= 20
- **Podman** (`podman-compose`) atau Docker (`docker compose`)

### 1. Install

```bash
bun install
# atau: npm install
```

### 2. Nyalakan infra inti (Rp0, tanpa observability)

```bash
podman-compose -f compose.yaml up -d
# atau: docker compose up -d
# cek: podman ps / docker ps
```

Layanan inti:

| Service | Port | Kredensial |
|---------|------|------------|
| Postgres 16 | 5432 | `gotongroyong_demo` / `demo` / `demo123` |
| Redis 7 | 6379 | tanpa password (lokal) |
| PgBouncer | 6432 | pool 25, transaction mode |

### 3. Seed data (kas + komunitas + pengumuman)

```bash
bun run seed
# membuat 5 komunitas, 100 kas_entries dengan SHA-256 hash chain, 50 pengumuman
```

### 4. Jalankan service (dev)

```bash
bun run dev
# order-service :3001  payment-service :3002  umkm-service :3003  kas-service :3004
```

### 5. Observabilitas & CDC (opsional, profile)

```bash
# butuh ~4GB RAM tambahan — jalankan hanya saat butuh
podman-compose -f compose.yaml -f compose.observability.yaml --profile observability up -d
podman-compose -f compose.yaml -f compose.observability.yaml --profile cdc up -d
# Grafana http://localhost:3000 (admin/admin)
# Prometheus http://localhost:9090
# Jaeger http://localhost:16686
# Loki http://localhost:3100
# OTEL collector http://localhost:4317 (gRPC)
# Elasticsearch http://localhost:9200
# Kafka http://localhost:9092
# ClickHouse http://localhost:8123
```

### 6. Load test

```bash
bun run load
# atau: k6 run load/k6.js  /  autocannon -c 50 -d 30 http://localhost:3001/api/komunitas/demo
# target: p95 < 500ms, error < 0.1% (lihat Bab 10.1)
```

### Hentikan

```bash
podman-compose down -v
podman-compose -f compose.yaml -f compose.observability.yaml --profile observability --profile cdc down -v
```

## Mapping 20 Istilah Poster -> Bab Docs

Poster performa GR memuat 20 istilah yang harus dikuasai. Berikut mapping ke Modul Performa 10 Bab:

| # | Istilah Poster | Bab | Penjelasan Singkat |
|---|---------------|-----|---------------------|
| 1 | Latency | Bab 1.4.1, 10.1 | Waktu server proses request (diukur server-side) |
| 2 | p50 / Median | Bab 1.4.2 | 50% request lebih cepat |
| 3 | p95 | Bab 1.4.2, 10.1 | 95% request lebih cepat — target SLA |
| 4 | p99 | Bab 1.4.2, 10.1 | 99% request lebih cepat — worst-case |
| 5 | Throughput (RPS/QPS) | Bab 1.4.3, 10.2 | Request/detik — target 100 -> 200k |
| 6 | Endpoint | Bab 1.4.4, 10.1 | URL API — 16 endpoint dengan SLA beda |
| 7 | SLA / SLO / SLI | Bab 1.4.5 | Kontrak -> target internal -> metrik aktual |
| 8 | Cache Hit / Miss | Bab 1.4.7, Bab 4 | Hit > 80% target, miss = query DB |
| 9 | Cold / Warm / Hot Path | Bab 1.4.6 | Cold = DB, Hot = Redis < 5ms |
| 10 | Connection Pool | Bab 1.4.9, Bab 3.5 | PgBouncer pool 25, cegah exhaustion |
| 11 | Index Scan vs Seq Scan | Bab 1.4.10, Bab 3.1 | Index = 20 langkah vs 1M (50.000x) |
| 12 | GIN (pg_trgm) | Bab 3.2 | Trigram GIN untuk LIKE '%keyword%' |
| 13 | Materialized View | Bab 3.3 | Agregasi kas bulanan pre-computed |
| 14 | Cursor Pagination | Bab 3.4, 7.3 | Ganti OFFSET yang lambat di halaman dalam |
| 15 | EXPLAIN ANALYZE | Bab 3.6, 10.4 | Wajib sebelum rilis — no Seq Scan >1000 |
| 16 | Redis (Cache-Aside) | Bab 4.3 | TTL 1 jam jadwal sholat, 5 menit profil |
| 17 | Elasticsearch (Inverted Index) | Bab 5.1, 5.4 | geo_distance masjid terdekat |
| 18 | CDC / Debezium / WAL | Bab 6.1, 6.2 | Baca WAL Postgres -> Kafka -> ES/ClickHouse |
| 19 | GZIP / Brotli | Bab 7.2, 10.4 | Kompresi 70-80%, wajib checklist |
| 20 | Prometheus / Grafana / OTEL | Bab 8.3, 8.5 | Tiga pilar: metrics, logs, traces |

> Semua istilah di atas diukur dengan **alat**: `EXPLAIN ANALYZE`, `pg_stat_statements`, `Redis INFO`, `Prometheus`, `Grafana`, `Jaeger`, `k6/autocannon`.

## Struktur Repo

```
backend-performa-demo/
  README.md
  docs/spec-backend-performa.md   # spec lock (400 baris)
  compose.yaml                    # postgres+redis+pgbouncer
  compose.observability.yaml      # prometheus+grafana+loki+alloy+otel+jaeger+es+kafka+debezium+clickhouse
  package.json                    # workspaces: order/payment/umkm/kas/load/seed
  .env.example
  .gitignore
  order-service/   payment-service/   umkm-service/   kas-service/   load/   seed/  (dibuat di branch 01+)
```

## Referensi

- Ringkasan Backend GR Bab 2,4,5 — 7 fondasi, 6 DB, SHA-256 hash chain
- Modul Performa Backend GR 10 Bab — SLA 16 endpoint, throughput, checklist 10
- Studi Kasus Shopee Bab 3.4 — threshold kuantitatif 1TB/10M/1000 QPS (GR: 500GB/5M/500)
- PZN logging-management-demo — 4 tahap logging (console -> Pino -> scale -> observability)
- GotongRoyong Docs: `Docs-wa/Ringkasan_Komprehensif_Backend_GotongRoyong.md`

## Lisensi

Demo internal Gotong Royong — bukan untuk produksi tanpa review keamanan.
