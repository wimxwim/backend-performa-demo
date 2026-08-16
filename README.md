# Backend Performa Demo — Gotong Royong

> ⚠️ 99 detik = waktu BIKIN 5 juta data fake untuk test (seeding), BUKAN waktu buka aplikasi. User cari 'ayam' cuma 10ms (200x lebih cepat).

![5M Synthetic Streaming 99s 50457 rows/s](https://img.shields.io/badge/5M%20Synthetic-Streaming%2099s%2050457%20rows%2Fs-brightgreen) [BENCH_5M.md](docs/BENCH_5M.md) | [TUNING_5M.md](docs/TUNING_5M.md) | ![Sudut Pandang Terluas - 7 Lensa](https://img.shields.io/badge/Sudut%20Pandang%20Terluas-7%20Lensa-blue) [SUDUT_PANDANG_TERLUAS.md](docs/SUDUT_PANDANG_TERLUAS.md)
![10M Synthetic Streaming 4m08s 40322 rows/s](https://img.shields.io/badge/10M%20Synthetic-Streaming%204m08s%2040322%20rows%2Fs-brightgreen) [BENCH_10M.md](docs/BENCH_10M.md) | TERUJI 10M — 10.000.000 baris 5,0GB 4m08s 91 kategori tiap 10k+ (Generate 2x5M streaming heap flat 64MB) | Query 10ms p99<500ms

> **Logging + Performa, 5 Branch Seirama — 01 Warung → 02 UMKM SOP → 03 Pasar 6.081 → 04 Observability → 05 CDC (04+05 digabung profile observability/cdc)** — Demo terintegrasi untuk pembelajaran backend Gotong Royong. Menggabungkan **PZN (Programmer Zaman Now) logging-management-demo (4 tahap)** + **Poster 20 Istilah Performa** + **Modul Performa Backend GR 10 Bab** + **Website Lokal 1 Atap v2** ([website/index.html](./website/index.html) branch switcher+5 tabs+tab baru+Back, [website/praktik/index.html](./website/praktik/index.html) 18 teknik LEMOT vs KENCENG tanpa terminal). Rp0-friendly, jalan di Podman/Docker lokal tanpa cloud, 100% offline.

> **TERUJI 5 JUTA — Generate 5M 99s (50K/s) | Query 10ms (200x) p99<500ms — *99s = seeding data test, bukan loading user*** — Generate 5M NDJSON 2.5GB distribusi Bintaro 32% OK. Lihat [docs/BENCH_5M.md](docs/BENCH_5M.md) (100k 2.66s, 1M 22.4s, 5M 99.1s) dan [docs/TUNING_5M.md](docs/TUNING_5M.md) (22 param BULK). Cara generate: `npx tsx seed/generate.ts --synthetic 5000000 --out /tmp/test_5m.ndjson` (hapus setelah verifikasi, simpan sample 1k 513K).

> **TERUJI 10M — 10.000.000 baris 5,0GB 4m08s 91 kategori tiap 10k+ (Generate 2x5M streaming heap flat 64MB) | Query 10ms p99<500ms** — Generate 10M NDJSON 5,0GB distribusi Bintaro 32% OK. Lihat [docs/BENCH_10M.md](docs/BENCH_10M.md) (10M 4m08s 40.322 rows/s heap 35-89MB flat, 2x5M 1m59s+2m00s+8s cat) dan [docs/BENCH_5M.md](docs/BENCH_5M.md). File `data/synthetic_10M.ndjson` lokal tidak di-git (5,0GB, 10.000.000 baris).

## Filosofi

Gotong Royong adalah **OS Kehidupan Komunitas** (masjid, RT/RW, keluarga, UMKM) dengan nilai **TIGA INSAN: Muttaqin (jujur — kepercayaan yang bisa diverifikasi via hash chain & RLS), Shalih (amal — rapi & ihsan, setiap fitur memudahkan ibadah/transaksi), Nafi' (kebermanfaatan — memberdayakan komunitas, bukan ekstraksi)**. Performa adalah wujud **kepercayaan (trust)** — setiap milidetik keterlambatan adalah pengkhianatan amanah data komunitas. Prinsip UX #46: *berfungsi di 3G*, #50: *loading < 3 detik*. Backend harus < 200ms agar total dengan latency 3G (500-1000ms) tetap di bawah 3 detik. **Generate 99s seeding vs Query 10ms** selalu bersama — 99s = bikin data test (seeding, bukan loading user), Query 10ms = narik data real — tanpa hosting, cukup **Website Lokal 1 Atap v2** offline 100%.

Demo ini mensimulasikan **order-service / payment-service / umkm-service / kas-service** dengan logging bertahap dan optimasi performa, mirip struktur **PZN (Programmer Zaman Now)** tapi dengan domain Gotong Royong (kas masjid SHA-256, jadwal sholat cache, pencarian pg_trgm). Coba langsung tanpa terminal: [website/praktik/index.html](./website/praktik/index.html) 18 teknik LEMOT vs KENCENG.

## 5M Synthetic — Teruji 99 Detik 50K rows/s

> **TERUJI 5 JUTA — Generate 5M 99s (50K/s) | Query 10ms (200x) p99<500ms — *99s = seeding data test, bukan loading user*** — Pipeline P5M-1..P5M-7 COMPLETED, skor 38.5->92/100. Rujuk [docs/BENCH_5M.md](docs/BENCH_5M.md) dan [docs/TUNING_5M.md](docs/TUNING_5M.md).

| Count | Waktu | rows/s | RSS | Heap | File | Status |
|-------|-------|--------|-----|------|------|--------|
| 100k | 2.66s | 37.600 | 205 MB | 13 MB | ~50 MB | PASS |
| 1M | 22.4s | 44.557 | 208 MB | 64.7 MB | 502 MB | PASS |
| 5M | 99.1s *seeding, bukan loading | 50.457 | ~210 MB | 64.7 MB | 2.5 GB | PASS |
| 10M | 4m08s (248s) *seeding 2x5M streaming | 40.322 | ~210 MB | 35-89 MB flat | 5,0 GB data/synthetic_10M.ndjson | PASS |

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

## Sudut Pandang Terluas - Dari 5M ke 280 Juta

> Demo 5M (99s 50K rows/s, GIN 200x, COPY 25x) baru 5% visi - bukti performa, bukan seluruh OS. Visi lengkap adalah **OS Kehidupan Komunitas 280 juta warga** (70.4jt keluarga, 800rb masjid, 64jt UMKM) dengan 7 lensa terluas: filosofi TIGA INSAN sebagai filter keputusan, Piagam Madinah 10 pasal sebagai konstitusi digital, socio corporation inverted 11 level, teknologi 7 fondasi + 6DB + 514 masjid hub-and-spoke, data Pesanggrahan 6.081 titik (KULINER 44%), UX 100 prinsip 7 tier untuk 3G 1-2Mbps, dan roadmap 300 fitur 5 fase + Brand 56 bab. Rujuk [docs/SUDUT_PANDANG_TERLUAS.md](./docs/SUDUT_PANDANG_TERLUAS.md) (898 baris, 7 lensa) dan [docs/DEMO_ZIS_RLS.md](./docs/DEMO_ZIS_RLS.md) (546 baris, 8 asnaf + hash + RLS).

| # | Lensa | Inti 1 Baris | Link Demo | vs Global |
|---|-------|--------------|-----------|-----------|
| 1 | Filosofi TIGA INSAN | Muttaqin-Shalih-Nafi' prisma 6 ranah, filter 3 pertanyaan, siklus Belajar->Memimpin | [DEMO_ZIS_RLS.md TIGA INSAN](./docs/DEMO_ZIS_RLS.md#tiga-insan-mapping--demo-live) | vs WeChat wu-wei, Gojek pragmatik, Shopee growth-at-all-cost |
| 2 | Piagam Madinah 10 Pasal | Konstitusi digital + 5 Layer Trust (RLS + hash chain + verify) | [DEMO_ZIS_RLS.md RLS](./docs/DEMO_ZIS_RLS.md#rls-diagram--isolasi-per-komunitas-prinsip-31) | vs GDPR (individu) - GR komunitas + verifiable moat |
| 3 | Socio Corp Inverted 11 Level | 70.4jt keluarga, 2.6jt PJ, inverted gaji puncak mengalir ke bawah, biaya 127T | [SUDUT_PANDANG_TERLUAS.md Lensa 3](./docs/SUDUT_PANDANG_TERLUAS.md#lensa-3--socio-corporation-inverted-11-level-vs-buurtzorgmondragon) | vs Buurtzorg flat 15k, Mondragon koperasi 1:6 |
| 4 | Teknologi 7 Fondasi + 6DB + 514 Masjid | 7 fondasi build-once, 6DB (PG+Mongo+Redis+ES+ClickHouse+Influx), 514 masjid hub-and-spoke | [presentasi slide-3 OS 4 pilar](./presentasi/index.html#slide-3) | vs Stack 2026 modular monolith 42% fewer conflicts, Fabric 3500 TPS |
| 5 | Data Pesanggrahan 6.081 | KULINER 44% dominan, Bintaro 31.7%, 256 masjid 1:24, ekstrapolasi 1.7jt vs Kemenkop 64jt | [presentasi slide-17 Pesanggrahan](./presentasi/index.html#slide-17) | vs Data lapangan vs registrasi nasional |
| 6 | UX 100 Prinsip 7 Tier | 7 tier piramida, 5 segmen, 3G 1-2Mbps RAM 2GB WA 98%, #31 isolasi #46 3G-ready | [SUDUT_PANDANG_TERLUAS.md Lensa 6](./docs/SUDUT_PANDANG_TERLUAS.md#lensa-6--ux-100-prinsip-7-tier-vs-nielsen-10) | vs Nielsen 10 heuristics (1994) - GR spesifik Indonesia |
| 7 | Roadmap 300 Fitur 5 Fase + Brand 56 Bab | 18 domain, MVP 32 -> F5 11 peradaban, 7 revenue, TAM 280jt | [presentasi slide-37 Roadmap](./presentasi/index.html#slide-37) | vs Shopee TiDB US$47.9B GMV, over-expansion 8 pasar exit |

> **3 Slide Baru (40 Slides):** [slide-3 OS 4 pilar](./presentasi/index.html#slide-3) (7 fondasi + 6DB + 514 masjid) | [slide-17 Pesanggrahan 44%](./presentasi/index.html#slide-17) (KULINER 44% + 5 kelurahan) | [slide-37 Roadmap 300 fitur](./presentasi/index.html#slide-37) (5 fase + 7 revenue + TAM 280jt) - total 40 Slides (37 -> 40, +4.5m). Demo live: [DEMO_ZIS_RLS.md](./docs/DEMO_ZIS_RLS.md) - `POST /api/zis/distribute` (8 asnaf) -> `GET /api/ledger/verify` (valid true 5) -> `GET /api/demo/rls-test` (isolated true).

> Skor sudut luas: **5% -> 85% visi ter-cover** dengan 7 lensa + 3 slide + demo ZIS/RLS. Demo 5M tetap valid sebagai bukti performa, tapi tidak lagi dikira "aplikasi kas RT yang ngebut".

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

## 5 Branch Seirama — 01 Warung → 02 UMKM SOP → 03 Pasar 6.081 → 04 Observability → 05 CDC (04+05 digabung profile observability/cdc)

| Branch | Nama | Fokus | Stack |
|--------|------|-------|-------|
| `01-console-log` | 01 Warung (console.log) | `console.log` tanpa struktur, tanpa level, tanpa correlation-id | Node.js + Express |
| `02-proper-logging` | 02 UMKM SOP 6.081 (pino) | **Pino JSON** structured logging, level (trace/debug/info/warn/error/fatal), pretty di dev, file rotation | `pino`, `pino-pretty`, `pino/file` |
| `03-scale` | 03 Pasar 6.081 (scale) | Postgres 16 + **PgBouncer pool 25** + **Redis cache-aside** + **pg_trgm GIN** + **MatView** + **rate limiting** + **GZIP** + **cursor pagination** | `pg`, `ioredis`, `express-rate-limit`, `compression` |
| `04-observability` | 04 SAKTI 5M (Alloy→Loki→Grafana) | **Alloy -> Loki -> Grafana** (logs) + **Prometheus** (metrics) + **OTEL Collector -> Jaeger** (traces) + **pg_stat_statements** | Grafana Alloy, Loki, Prometheus, OTEL, Jaeger |
| `05-cdc` | 05 CDC (Debezium) | **Debezium (WAL) -> Kafka -> Elasticsearch (geo_distance) + ClickHouse (OLAP)** — hindari dual-write | Debezium, Kafka, ES 8, ClickHouse |

> Branch `04-observability` (04 SAKTI 5M) dan `05-cdc` (05 CDC Debezium) digabung di `compose.observability.yaml` (profile `observability`/`cdc`) agar tetap Rp0: nyalakan hanya saat butuh — 5 branch seirama Warung→SAKTI 5M.

### Per Branch — Apa yang Dipelajari

- **01 Warung (console.log)**: Mengapa `console.log` gagal di produksi — tidak ada level, tidak ada JSON, tidak ada trace-id, log hilang saat restart, tidak bisa di-aggregate.
- **02 UMKM SOP 6.081 (pino)**: Pino JSON — setiap log punya `level`, `time`, `msg`, `traceId`, `service`, `latencyMs`. Di dev pakai `pino-pretty`, di prod JSON ke stdout -> Alloy -> Loki.
- **03 Pasar 6.081 (scale)**: Optimasi yang bikin p50 turun 10x — index B-Tree & GIN, MatView agregasi kas, Redis cache jadwal sholat (TTL 1 jam), PgBouncer transaction pooling, cursor pagination, GZIP/Brotli, rate limiting.
- **04 SAKTI 5M (Alloy→Loki→Grafana) + 05 CDC (Debezium)**: Tiga pilar observabilitas (metrics/logs/traces) + CDC — satu-satunya cara sinkronisasi aman (anti dual-write), ES untuk `geo_distance` masjid terdekat, ClickHouse untuk dashboard OKR miliaran baris. 04+05 digabung profile observability/cdc.

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
| Redis 7 | 6380 (host -> 6379 container) | tanpa password (lokal) |
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

## Struktur Repo — Website Lokal 1 Atap v2

```
backend-performa-demo/
  README.md
  website/index.html              # Website Lokal 1 Atap v2 — branch switcher+5 tabs+tab baru+Back, 100% offline
  website/praktik/index.html      # 18 teknik LEMOT vs KENCENG tanpa terminal (GIN, B-Tree, Cursor, Cache, GZIP, Edge, Rate, Payload, PgBouncer, VACUUM, TTL, ES Geo, CDC, RLS, Logging, Proteksi)
  presentasi/index.html           # 40 Slides 60 Menit (102 hal 896K buku, 88 hal 942K naskah, 1 hal 67K cheat)
  docs/BUKU_BELAJAR_GOTONGROYONG_LENGKAP.md  # 2119 baris 102 hal 896K — v2.1
  docs/NASKAH_PRESENTASI_VERBATIM.md         # 2355 baris 88 hal 942K
  docs/CHEAT_SHEET_DEMO_1_HALAMAN.md         # 1 hal 67K
  docs/spec-backend-performa.md   # spec lock (400 baris)
  compose.yaml                    # postgres+redis+pgbouncer
  compose.observability.yaml      # prometheus+grafana+loki+alloy+otel+jaeger+es+kafka+debezium+clickhouse (profile observability/cdc)
  package.json                    # workspaces: order/payment/umkm/kas/load/seed — 40 Slides 60 Menit
  .env.example
  .gitignore                      # PDF ignored — generate lokal via pandoc
  order-service/   payment-service/   umkm-service/   kas-service/   load/   seed/  (dibuat di branch 01+)
```

## Referensi — Website Lokal 1 Atap v2 + Praktik 18 Teknik + Buku

- [Website Lokal 1 Atap v2](./website/index.html) — branch switcher+5 tabs+tab baru+Back, 100% offline, 5 branch seirama
- [Praktik 18 Teknik LEMOT vs KENCENG](./website/praktik/index.html) — tanpa terminal, tanpa docker, cukup ketik (GIN, B-Tree, Cursor, Cache, GZIP, Edge, Rate, Payload, PgBouncer, VACUUM, TTL, ES Geo, CDC, RLS, Logging, Proteksi)
- [Buku Belajar v2.1 2119 baris 102 hal](./docs/BUKU_BELAJAR_GOTONGROYONG_LENGKAP.md) — 40 Slides 60 Menit, 18 teknik, Generate 99s seeding vs Query 10ms
- [Sudut Pandang Terluas - 7 Lensa](./docs/SUDUT_PANDANG_TERLUAS.md) - OS 4 pilar + TIGA INSAN + 514 masjid
- [Demo ZIS 8 Asnaf + RLS](./docs/DEMO_ZIS_RLS.md) - hash verify + RLS isolasi + 8 asnaf QS 9:60
- Ringkasan Backend GR Bab 2,4,5 — 7 fondasi, 6 DB, SHA-256 hash chain
- Modul Performa Backend GR 10 Bab — SLA 16 endpoint, throughput, checklist 10
- Studi Kasus Shopee Bab 3.4 — threshold kuantitatif 1TB/10M/1000 QPS (GR: 500GB/5M/500)
- PZN (Programmer Zaman Now) logging-management-demo — 4 tahap logging (console -> Pino -> scale -> observability)
- GotongRoyong Docs: `Docs-wa/Ringkasan_Komprehensif_Backend_GotongRoyong.md`

## Lisensi

Demo internal Gotong Royong — bukan untuk produksi tanpa review keamanan.
