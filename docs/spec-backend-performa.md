# Spec Lock — Backend Performa Demo Gotong Royong

> **Status: LOCK** — Dokumen ini mengunci arsitektur demo `backend-performa-demo`. Setiap perubahan harus via ADR. Sumber: Ringkasan Backend Bab 2/4/5, Modul Performa 10 Bab (10.1-10.4), Studi Kasus Shopee Bab 3.4, Poster 20 Istilah.

---

## Daftar Isi

1. [Tujuan & Prinsip](#1-tujuan--prinsip)
2. [7 Fondasi Bersama](#2-7-fondasi-bersama-shared-foundation)
3. [6 Database Layer](#3-6-database-layer)
4. [Diagram Arsitektur ASCII](#4-diagram-arsitektur-ascii)
5. [16 Endpoint SLA](#5-16-endpoint-sla-bab-101)
6. [Throughput per Fase](#6-throughput-per-fase-bab-102)
7. [Threshold Kuantitatif (Shopee -> GR)](#7-threshold-kuantitatif-shopee--gr-bab-34)
8. [10 Metrik Poster #6](#8-10-metrik-poster-6)
9. [Checklist 10 Definition of Done](#9-checklist-10-definition-of-done-bab-104)
10. [Strategi Observabilitas & CDC](#10-strategi-observabilitas--cdc)
11. [Branch Plan & Rp0 Policy](#11-branch-plan--rp0-policy)
12. [Referensi Silang](#12-referensi-silang)

---

## 1. Tujuan & Prinsip

Demo ini adalah **laboratorium performa** Gotong Royong — bukan produksi. Tujuan: membuktikan bahwa optimasi **Postgres + Redis + pg_trgm + MatView + PgBouncer** cukup untuk MVP-Fase 2 tanpa cloud mahal, dan bahwa **observabilitas + CDC** siap saat skala Fase 3+.

Prinsip:

- **Performa = Kepercayaan (Muttaqin)** — TIGA INSAN. Lambat = khianat amanah.
- **Konteks Indonesia**: 3G (500-1000ms RTT), Android RAM 2-3GB, kuota terbatas. Backend harus < 200ms agar total < 3 detik (UX #46, #50).
- **Rp0 friendly**: semua infra jalan lokal via Podman/Docker. Alloy/Loki/Prometheus/OTEL/Jaeger/ES/Kafka/ClickHouse hanya via profile — tidak wajib untuk MVP.
- **Diukur server-side**: p50/p95/p99 tidak termasuk latency jaringan. Alat ukur: `EXPLAIN ANALYZE`, `pg_stat_statements`, `prom-client`, `k6/autocannon`.
- **PZN 4 tahap + 05 CDC**: 01-console-log (anti-pattern) -> 02-proper-logging (Pino JSON) -> 03-scale (DB+cache+proteksi) -> 04-observability -> 05-cdc.

---

## 2. 7 Fondasi Bersama (Shared Foundation)

Diambil dari **Ringkasan Backend Bab 2 — Arsitektur Plug-and-Play**. Fondasi dibangun sekali, 40+ plugin tinggal colok. Semua request Flutter lewat **API Gateway (Kong / Supabase Edge)** yang validasi JWT lalu teruskan `user_id`.

| # | Fondasi | Tugas Backend | Implementasi MVP | Fase Lanjut | Dampak Performa |
|---|---------|---------------|------------------|-------------|-----------------|
| 1 | **Auth & Identity Service** | Login/register terpusat (Email, Google, Apple, WA OTP), RBAC `user`/`admin_masjid`/`admin_market`/`super_admin` | **Supabase Auth** — JWT, OAuth, MFA out-of-the-box, **RLS** di DB | Migrasi ke **Keycloak SSO** enterprise | Cache JWT di Redis, validasi < 5ms, jangan hit DB auth tiap request |
| 2 | **User Profile & Community Service** | Tabel tunggal `profiles` (`id`,`name`,`phone`,`avatar_url`,`community_type`,`preferences` JSON) — Single Source of Truth. Relasi `memberships` ke masjid/RT/RW | Postgres `profiles` + `memberships` | — | **Cache profil** TTL 5 menit di Redis; query profil lambat = semua plugin lambat |
| 3 | **Payment Engine (HarmoniPay)** | API terpusat `POST /payment/charge|transfer|payout`, `GET /balance`. Metadata JSON `{type: donasi_zakat, masjid_id, asnaf}`. Shariah layer: validasi riba/gharar/maysir, akad wadiah/mudharabah | **Xendit** di satu tempat | — | ACID mutlak untuk write; cache untuk read. **Idempotency key di Redis** cegah double-charge |
| 4 | **Notification Engine** | `POST /notifications/send` -> FCM (push), Wablas/Fazz (WA), SendGrid (email), SMS. Opt-out, queue broadcast, throttling | **FCM + Wablas** | Kafka/Redis Streams queue | **Async queue** — jangan blok response. Rate limit per-user |
| 5 | **Storage Engine** | Upload S3-compatible (Supabase Storage / R2 / MinIO), virus scan, resize thumbnail, path `/{plugin}/{entity_id}/{filename}` | **Supabase Storage** | Cloudflare R2 + CDN | CDN untuk aset statis, kompresi gambar saat upload |
| 6 | **Audit & Logging Engine** | Tabel `audit_log` (`actor`,`action`,`timestamp`,`ip`,`old_data`/`new_data` JSON) + **SHA-256 hash chain** (`hash_prev`/`hash_self`). Trigger hitung hash, endpoint `GET /ledger/verify` | **pgcrypto + trigger PL/pgSQL** (lihat Bab 5 Ringkasan) | — | Hash via **trigger DB** bukan aplikasi — hindari latency tambahan |
| 7 | **Feature Flag & Config Engine** | Tabel `feature_flags` — toggle tanpa deploy. Use case: gradual rollout 5%, regional gating, kill-switch | Postgres `feature_flags` | — | **Cache di memory** — jangan query DB tiap request |

> Detail trigger SHA-256 ada di Ringkasan Bab 5: `secure_ledger_hash()` BEFORE INSERT, `hash_self = SHA256(amount|description|recipient|actor|hash_prev)`, genesis `hash_prev = 0x00..00`.

---

## 3. 6 Database Layer

Diambil dari **Ringkasan Bab 4 — Multi-Database**. Prinsip: *the right database for the right job*.

| # | Database | Peran | Spesifikasi Teknis | Kapan Dipakai di Demo | Kelemahan & Antisipasi |
|---|----------|-------|--------------------|-----------------------|------------------------|
| 1 | **PostgreSQL 16** (Supabase) | **Jantung sistem** — System of Record | ACID, RLS, JSONB, `pgcrypto`, `pg_trgm`, `pg_stat_statements` | Semua transaksi operasional & keuangan (kas, donasi, komunitas, pengumuman, posts) | Bottleneck write-heavy -> **PgBouncer pool 25**, read replica, offload ke ClickHouse |
| 2 | **MongoDB** | Fleksibilitas konten schema-less | Dokumen JSON dinamis | Kajian, profil masjid dinamis, kurikulum 300 fitur | Inkonsistensi FK -> validasi ketat di aplikasi (Prisma) |
| 3 | **Redis 7** | Kecepatan kilat in-memory | Cache-Aside, Write-Through, TTL, pub/sub, leaderboard, rate limiting | Cache jadwal sholat (TTL 1 jam), profil (5 menit), komunitas (10 menit), session, rate limit, idempotency key | Volatil (RAM) -> AOF + sync krusial ke Postgres |
| 4 | **Elasticsearch 8** | Pencarian cerdas (Inverted Index) | `geo_distance`, full-text, stemming | Pencarian pengumuman/produk + **masjid terdekat radius** | Bukan source of truth -> **CDC Debezium** dari Postgres WAL |
| 5 | **ClickHouse** | Analitik super cepat (Columnar OLAP) | Miliaran baris/detik, agregasi | Dashboard OKR, agregasi keuangan transparan, laporan statistik | Tidak cocok UPDATE/DELETE sering -> batch write dari Postgres |
| 6 | **InfluxDB / TimescaleDB** | Denyut nadi real-time (Time-series) | Telemetri IoT, sensor, monitoring server | Listrik PLN masjid, telemetri kesehatan jamaah | InfluxDB v3 proprietary -> **TimescaleDB** (ekstensi Postgres) sebagai alternatif open source |

### Strategi Sinkronisasi (Ringkasan Bab 4.2)

1. **CDC (Debezium)** — baca WAL Postgres -> kirim ke ES & ClickHouse real-time.
2. **Event-Driven (Kafka / Redis Streams)** — event transaksi -> consumer tulis Redis leaderboard + ClickHouse.
3. **Batch ETL** — worker jam 12 malam ekstrak harian Postgres -> ClickHouse (untuk non-real-time).
4. **Hindari Dual-Write** — tulis ke 2 DB di kode aplikasi = inkonsistensi jika salah satu gagal. Selalu CDC atau queue.

---

## 4. Diagram Arsitektur ASCII

```
                        +---------------------+
                        |   Flutter App       |
                        | (single codebase)   |
                        +----------+----------+
                                   |
                    HTTP/HTTPS (GZIP/Brotli, Rate Limit)
                                   |
                        +----------v----------+
                        |   API Gateway       |
                        |  Kong / Supabase    |
                        |  Edge Functions     |
                        |  - JWT validate     |
                        |  - Rate limiting    |
                        |  - GZIP/Brotli      |
                        +----------+----------+
                                   |
              +----------------------------------------------+
              |         7 FONDASI BERSAMA (Shared)           |
              +----------------------------------------------+
              | 1. Auth (JWT/RBAC)    2. Profile (SSO)       |
              | 3. Payment (Xendit+Syariah)  4. Notification |
              |    (FCM/Wablas)  5. Storage (S3/R2)          |
              | 6. Audit (SHA-256 hash chain)                |
              | 7. Feature Flag (kill-switch)                |
              +----------------------------------------------+
                                   |
              +----------------------------------------------+
              |           6 DATABASE LAYER                   |
              +----------------------------------------------+
              |                                              |
   +----------+----------+   +-----------+   +------------+  |
   | PostgreSQL 16       |   |  Redis 7  |   | MongoDB    |  |
   | ACID + RLS + JSONB  +--->+ <10ms    |   | (kajian)   |  |
   | pgcrypto/pg_trgm/   |   | Cache     |   +------------+  |
   | pg_stat_statements  |   | Session   |                    |
   |  + PgBouncer :6432  |   | RateLimit |   +------------+  |
   |  | pool 25, txn     |   +-----+-----+   | Influx/    |  |
   +----------+----------+         |         | Timescale  |  |
              |                   |         | (IoT)      |  |
              | CDC (Debezium/WAL)|         +------------+  |
              +---------+---------+                          |
                        |                                    |
              +---------v---------+   +------------------+   |
              |  Kafka (event)    +--->+  Elasticsearch  |   |
              |  Debezium Connect |   |  geo_distance   |   |
              +---------+---------+   +------------------+   |
                        |                                    |
              +---------v---------+                          |
              |  ClickHouse (OLAP)|                          |
              |  agregasi miliaran|                          |
              +-------------------+                           |
              +----------------------------------------------+
                                   |
              +----------------------------------------------+
              |     OBSERVABILITAS (3 Pilar)                 |
              +----------------------------------------------+
              | Metrics: Prometheus + Grafana                |
              | Logs:    Alloy -> Loki -> Grafana            |
              | Traces:  OTEL Collector -> Jaeger            |
              | DB:      pg_stat_statements + slow log       |
              +----------------------------------------------+
```

**Aliran baca (hot path)**: Flutter -> Gateway (JWT cache) -> Fondasi (profile cache) -> **Redis** (< 5ms) -> response.
**Aliran tulis (kas/donasi)**: Flutter -> Gateway -> Fondasi -> **Postgres** (ACID, trigger SHA-256) -> WAL -> Debezium -> Kafka -> ES/ClickHouse (async).
**Aliran cari**: Flutter -> Gateway -> Fondasi -> **pg_trgm GIN** (MVP) / **ES** (Fase 3) -> Redis cache populer.

---

## 5. 16 Endpoint SLA (Bab 10.1)

> Diukur **server-side** (tidak termasuk latency jaringan 3G 500-1000ms). Target total ke pengguna tetap < 3 detik (UX #50). Semua endpoint wajib `EXPLAIN ANALYZE` sebelum rilis.

| # | Endpoint | Metode | Fungsi | p50 | p95 | p99 | Strategi Utama |
|---|----------|--------|--------|-----|-----|-----|----------------|
| 1 | `/api/komunitas/:id` | GET | Profil komunitas (nama, alamat, deskripsi, logo, statistik anggota) | < 30ms | < 100ms | < 200ms | Redis cache TTL 10 menit, index `slug_publik`, single row + join memberships |
| 2 | `/api/komunitas` | GET | Daftar komunitas (filter kelurahan, pagination) | < 50ms | < 150ms | < 300ms | Index `kelurahan`, cursor pagination |
| 3 | `/api/kas` | GET | Laporan kas (daftar transaksi, ringkasan/bulan, saldo) | < 50ms | < 200ms | < 500ms | **Materialized View** agregasi bulanan (refresh 5 menit), index `(community_id, tgl)` |
| 4 | `/api/kas` | POST | Input kas (trigger SHA-256 hash chain) | < 100ms | < 300ms | < 500ms | Trigger `secure_ledger_hash()` di DB, minimal index write |
| 5 | `/api/pengumuman` | GET | Daftar pengumuman (ORDER BY pinned, created_at, LIMIT 20) | < 30ms | < 100ms | < 200ms | Cursor pagination, index `(community_id, pinned, created_at)`, cache TTL 1 menit |
| 6 | `/api/pengumuman/:id` | GET | Detail pengumuman | < 20ms | < 80ms | < 150ms | Index PK, cache TTL 5 menit |
| 7 | `/api/posts` | GET | Feed komunitas (join reactions + comments count) | < 50ms | < 200ms | < 500ms | Cursor pagination, index `(community_id, created_at)`, denormalisasi count / cache |
| 8 | `/api/posts` | POST | Buat postingan | < 80ms | < 200ms | < 400ms | Minimal index, async notification via queue |
| 9 | `/api/donasi` | GET | Riwayat donasi | < 40ms | < 150ms | < 300ms | Index `(donatur_id, status)` |
| 10 | `/api/donasi` | POST | Input donasi (validasi nominal, upload bukti) | < 100ms | < 300ms | < 500ms | Trigger hash chain, async upload Storage |
| 11 | `/api/jadwal-sholat` | GET | Jadwal sholat (TTL 1 jam) | < 20ms | < 50ms | < 100ms | **Redis `prayer_cache` TTL 1 jam** — endpoint tercepat |
| 12 | `/api/cari` | GET | Pencarian (pengumuman, kontak, komunitas) | < 50ms | < 200ms | < 500ms | **pg_trgm GIN** index, batasi 20 item, cache pencarian populer TTL 5 menit |
| 13 | `/api/profil` | GET | Profil pengguna | < 20ms | < 80ms | < 150ms | Redis cache TTL 5 menit |
| 14 | `/api/profil` | PUT | Update profil | < 80ms | < 200ms | < 400ms | Invalidate cache setelah update |
| 15 | `/api/notifikasi` | GET | Daftar notifikasi | < 30ms | < 100ms | < 200ms | Index `(profile_id, dibaca)` |
| 16 | `/api/lapor` | POST | Lapor RT/RW (dengan foto) | < 100ms | < 300ms | < 500ms | Async upload foto, minimal index |

**Catatan SLA**:

- p50 < 50ms (read) / < 100ms (write), p95 < 200ms, p99 < 500ms — target global Bab 1.3.
- Availability: MVP 99,5% -> Fase 3+ 99,9%. Error rate < 0,1% semua endpoint.
- Jika p95 > 500ms -> incident, cek `pg_stat_statements` + `EXPLAIN ANALYZE`.

---

## 6. Throughput per Fase (Bab 10.2)

Rumus: `Throughput = (DAU x req_per_user) / (peak_hours x 3600)`. Asumsi: 20-50 req/user/sesi, peak 4-6 jam, burst 5x. Target dirancang **10x estimasi** untuk safety margin.

| Fase | Komunitas | Anggota | DAU (est.) | Req/detik rata-rata | Req/detik peak | Target Throughput | Koneksi DB | Server | Biaya/Bulan |
|------|-----------|---------|------------|---------------------|----------------|-------------------|------------|--------|-------------|
| **MVP** (Bln 1-6) | 5-10 | 500-2.000 | 500-1.000 | 2-5 | 10-25 | **100 req/s** | 10-20 | 1 instance | **Rp 0** (Supabase Free) |
| **Fase 2** (Bln 7-12) | 50+ | 5.000-20.000 | 5.000-10.000 | 20-50 | 100-250 | **500 req/s** | 50-100 | 2-3 instance | **Rp 0-500rb** (Supabase Pro + Upstash Redis Free) |
| **Fase 3** (Bln 13-24) | 500+ | 50.000-200.000 | 50.000-100.000 | 200-500 | 1.000-2.500 | **5.000 req/s** | 200-500 | 5-10 instance | **Rp 1,5-5jt** (Pro + Redis + ES + ClickHouse) |
| **Fase 4** (Bln 25+) | 5.000+ | 500.000-2jt | 500.000-1jt | 2.000-5.000 | 10.000-25.000 | **50.000 req/s** | 500-1.000 | 20-50 instance | **Rp 10jt+** (Enterprise + Full Stack) |
| **Fase 5** (Bln 25+) | 50.000+ | 5jt+ | 5jt+ | 20.000+ | 100.000+ | **200.000+ req/s** | 2.000+ | Auto-scale | — |

**Strategi scaling**:

- MVP-Fase 2: **Vertical** (tambah RAM/CPU satu server) — cukup untuk < 1.000 req/s.
- Fase 3: **Horizontal** (tambah server + load balancer) — perlu untuk > 1.000 req/s.
- Fase 4-5: **Auto-scaling** (server otomatis bertambah saat beban naik).

---

## 7. Threshold Kuantitatif (Shopee -> GR) (Bab 3.4)

Aturan seleksi database kuantitatif Shopee (dari PingCAP case study, ditulis DBA Shopee [V2]) — diadaptasi konservatif untuk GR.

| Metrik | Threshold Shopee | Threshold GR (Konservatif) | Tindakan Saat Tercapai | Monitor |
|--------|-----------------|---------------------------|------------------------|---------|
| **Data size** | > 1 TB (buffer pool InnoDB tidak muat) | **> 500 GB** | Pertimbangkan sharding / distributed SQL (TiDB) / read replica | `pg_database_size()`, Grafana disk |
| **Single table rows** | > 10M rows (full scan > 1 detik) | **> 5M rows** | Partitioning (range/hash), archiving, MatView | `SELECT reltuples FROM pg_class` |
| **Write QPS** | > 1.000 writes/detik | **> 500 writes/detik** | Pisah write/read, Kafka queue, batch insert | `pg_stat_database`, Prometheus |
| **P99 latency cache** | > 1ms -> Redis | **> 5ms -> Redis** | Wajib cache untuk hot data (jadwal sholat, profil, komunitas) | `Redis INFO`, `prom-client` histogram |
| **Monitor alert** | — | **80% threshold** | Alert otomatis, jangan tunggu 100% | Prometheus alert rule |

> **Mengapa threshold penting**: menghilangkan guessing. Tidak perlu debat "apakah perlu Redis?" — lihat metrik. GR lebih konservatif karena tidak punya GMV US$47,9 miliar seperti Shopee; 500GB/5M/500 sudah cukup untuk trigger evaluasi. **Alert di 80%**, bukan 100%.

---

## 8. 10 Metrik Poster #6

Poster performa GR Bab 6 memuat 10 metrik yang wajib diukur. Berikut target & alat ukur:

| # | Metrik | Definisi | Target GR | Alat Ukur |
|---|--------|----------|-----------|-----------|
| 1 | **Response Time** | Waktu server proses request (server-side) | p50 < 50ms read / < 100ms write | `prom-client` histogram, `X-Response-Time` header |
| 2 | **P95 / P99** | 95%/99% request lebih cepat dari nilai ini | p95 < 200ms, p99 < 500ms | Prometheus histogram_quantile, Grafana |
| 3 | **Throughput (RPS/QPS)** | Request/detik yang diproses | MVP 100 -> Fase 5 200k+ | Prometheus `http_requests_total`, `k6` |
| 4 | **Latency (RTT/TTFB)** | Network + server processing | TTFB < 200ms (same region) | `curl -w %{time_total}`, Grafana |
| 5 | **Error Rate** | % request gagal (5xx) | < 0,1% | Prometheus `http_requests_total{status=~"5.."}`, Loki |
| 6 | **Availability** | % waktu layanan up | 99,5% MVP -> 99,9% Fase 3+ | Prometheus `up`, Grafana SLO dashboard |
| 7 | **CPU Usage** | % CPU server | < 70% rata-rata, alert 80% | Prometheus `node_cpu`, Grafana |
| 8 | **Memory Usage** | % RAM terpakai | < 70% rata-rata, alert 80% | Prometheus `node_memory`, Grafana |
| 9 | **DB Query Time** | Waktu query Postgres | < 50ms p95, no Seq Scan > 1000 rows | `pg_stat_statements`, `EXPLAIN ANALYZE`, slow log |
| 10 | **Cache Hit Rate** | % request terlayani dari cache | > 80% untuk endpoint cache | `Redis INFO stats`, `prom-client` counter `cache_hit_total` |

---

## 9. Checklist 10 Definition of Done (Bab 10.4)

> Wajib diverifikasi sebelum setiap rilis ke production. Backend developer penanggung jawab rilis harus **menandatangani** checklist ini sebelum deployment. Setiap item yang tidak terpenuhi = risiko degradasi performa.

| # | Checklist | Cara Verifikasi | Alat |
|---|-----------|-----------------|------|
| 1 | Semua query baru sudah di-**EXPLAIN ANALYZE** dan tidak bottleneck | Jalankan `EXPLAIN (ANALYZE, BUFFERS) SELECT ...` — cek `Execution Time` | `psql` |
| 2 | Tidak ada **Sequential Scan** pada tabel > 1000 baris | `EXPLAIN` tidak mengandung `Seq Scan` untuk tabel besar | `psql`, `pg_stat_user_tables` |
| 3 | Semua **foreign key** memiliki index | Query `pg_constraint` vs `pg_index` — tidak ada FK tanpa index | SQL audit |
| 4 | Ekstensi **pg_trgm** aktif jika ada fitur pencarian | `SELECT * FROM pg_extension WHERE extname='pg_trgm'` | `psql` |
| 5 | **Materialized View** di-refresh sesuai jadwal | `SELECT schemaname, matviewname, last_refresh FROM pg_matviews` / cron 5 menit | `psql`, cron |
| 6 | **Autovacuum** berjalan normal tanpa dead tuple menumpuk | `SELECT relname, n_dead_tup FROM pg_stat_all_tables WHERE n_dead_tup > 1000` | `psql` |
| 7 | **p95 latency** semua endpoint < 500ms | Cek Prometheus `histogram_quantile(0.95, ...)` | Grafana, `k6` |
| 8 | Tidak ada **N+1 query** pattern | Review kode — tidak ada query di loop; gunakan `JOIN` atau `IN (...)` | Code review, OTEL trace |
| 9 | Response terkompresi **GZIP/Brotli** | `curl -H "Accept-Encoding: gzip" -I` -> `Content-Encoding: gzip` | `curl`, `compression` middleware |
| 10 | **Rate limiting** aktif dan dikonfigurasi benar | `curl` burst -> `429 Too Many Requests` setelah threshold | `express-rate-limit`, Redis store |

---

## 10. Strategi Observabilitas & CDC

### 10.1 Tiga Pilar Observabilitas (Bab 8.5)

| Pilar | Stack Demo | Port | Fungsi |
|-------|-----------|------|--------|
| **Metrics** | **Prometheus** (9090) + **Grafana** (3000) + `prom-client` di app | 9090, 3000 | RPS, latency histogram, CPU/memory, DB pool, cache hit rate |
| **Logs** | **Grafana Alloy** (12345) -> **Loki** (3100) -> Grafana | 3100, 12345 | Structured JSON logs dari Pino, query via LogQL |
| **Traces** | **OTEL Collector** (4317 gRPC) -> **Jaeger** (16686) | 4317, 16686 | Distributed tracing, identifikasi N+1, bottleneck span |

Tambahan: `pg_stat_statements` + slow query log untuk DB-level observability (Bab 8.1-8.2).

### 10.2 CDC & Event Streaming (Bab 6)

```
Postgres WAL --(Debezium)--> Kafka (9092) --+--> Elasticsearch (9200) [geo_distance]
                                            +--> ClickHouse (8123)  [OLAP]
                                            +--> Redis Streams (alternative)
```

- **Debezium** baca WAL Postgres (logical replication) — tidak ada dual-write di aplikasi.
- **Kafka** sebagai broker event — consumer terpisah tulis ke ES & ClickHouse.
- **Elasticsearch** untuk pencarian + `geo_distance` masjid terdekat (Bab 5.4).
- **ClickHouse** untuk agregasi miliaran baris (Bab 5 di Ringkasan).
- **Batch ETL** alternatif untuk data non-real-time (cron jam 12 malam).

---

## 11. Branch Plan & Rp0 Policy

| Branch | Infra yang Jalan | Biaya |
|--------|-----------------|-------|
| `01-console-log` | Postgres + Redis (tanpa observability) | Rp 0 |
| `02-proper-logging` | + Pino JSON | Rp 0 |
| `03-scale` | + PgBouncer + pg_trgm + MatView + rate limiting + GZIP | Rp 0 |
| `04-observability` | + Alloy/Loki/Prometheus/OTEL/Jaeger (`--profile observability`) | Rp 0 (lokal, butuh ~2GB RAM) |
| `05-cdc` | + Kafka/Zookeeper/Debezium/ES/ClickHouse (`--profile cdc`) | Rp 0 (lokal, butuh ~4GB RAM) |

> Semua layanan observabilitas & CDC **opsional** via `compose.observability.yaml` dengan `profiles: [observability]` / `[cdc]`. MVP cukup `compose.yaml` saja.

---

## 12. Referensi Silang

| Dokumen | Bagian Relevan |
|---------|----------------|
| `Ringkasan_Komprehensif_Backend_GotongRoyong.md` | Bab 2 (7 fondasi), Bab 4 (6 DB), Bab 5 (SHA-256 trigger) |
| `Modul_Performa_Backend_GR.docx` | Bab 1 (SLA), Bab 3 (Postgres), Bab 4 (Redis), Bab 5 (ES), Bab 6 (CDC), Bab 10 (SLA 16 endpoint, throughput, checklist) |
| `Studi_Kasus_Shopee_Backend_Performa_GR.docx` | Bab 3.4 (threshold kuantitatif 1TB/10M/1000) |
| `SINTESIS_EKSTRAKSI_ARSITEKTUR_BISNIS_ANALISIS.md` | Roadmap 5 fase, 300 fitur |
| Poster 20 Istilah Performa | Glosarium Modul Performa — 20 istilah mapping di README |
| PZN `logging-management-demo` | 4 tahap: console -> Pino -> scale -> observability |

---

*Spec ini adalah **single source of truth** untuk demo. Jika ada konflik antara README dan spec ini, spec ini yang menang. Update spec = update README mapping.*
