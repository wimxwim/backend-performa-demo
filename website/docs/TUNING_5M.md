# TUNING_5M — Postgres 16 untuk 5M Synthetic (Ryzen 13GB RAM / 90GB NVMe 1.3GB/s — 68G used 17G avail)

> **Mode: BULK LOAD** — `compose.yaml` di-tune untuk ingest 5M baris secepat mungkin. Setelah load selesai, **revert ke production** (lihat bagian Revert).

## 1. Ringkasan

- **Target**: 5.000.000 baris synthetic (umkm + ledger + masjid + communities) via `COPY` / `pg-copy-streams`.
- **Hardware**: Ryzen, 13GB RAM, 90GB NVMe (1.3GB/s, 68G used 17G avail 81% — df -h 2026-05-13), swap 8G.
- **Prinsip**: hemat WAL (wal_level minimal), tunda fsync (synchronous_commit off), long checkpoint (30min/10GB), RAM besar untuk sort/index build, NVMe concurrency 200.
- **Safety**: hanya untuk bulk load lokal. Jangan pakai `synchronous_commit off` + `wal_level minimal` di production (risiko hilang data + tidak bisa replica/CDC).

## 2. Tabel Parameter Sebelum vs Sesudah

| # | Parameter | Sebelum | Sesudah (BULK) | Production Revert | Alasan 1 baris |
|---|-----------|---------|----------------|-------------------|----------------|
| 1 | `shared_buffers` | 256MB | **2GB** | 2GB (tetap) | 15% RAM — cache data/index di RAM, kurangi read NVMe saat COPY + CREATE INDEX |
| 2 | `effective_cache_size` | default (4GB) | **6GB** | 6GB | Hint planner: OS cache + shared_buffers ~6GB, pilih Index Scan lebih agresif |
| 3 | `work_mem` | default 4MB | **64MB** | 32-64MB | Sort/hash per operasi (ORDER BY, CREATE INDEX) di RAM, hindari spill ke disk |
| 4 | `maintenance_work_mem` | default 64MB | **1GB** | 512MB-1GB | CREATE INDEX / VACUUM / REFRESH MatView 16x lebih cepat, build GIN/B-Tree di RAM |
| 5 | `wal_buffers` | default -1 (auto) | **16MB** | 16MB | Buffer WAL 16MB kurangi write syscall saat COPY batch besar |
| 6 | `max_wal_size` | default 1GB | **10GB** | **1GB** | Checkpoint jarang (10GB) — hindari checkpoint tiap 1GB yang stall COPY 5M |
| 7 | `min_wal_size` | default 80MB | **1GB** | 80MB | Jaga WAL tidak di-recycle terlalu agresif saat burst COPY |
| 8 | `checkpoint_timeout` | default 5min | **30min** | 15min | Checkpoint tiap 30 menit, bukan 5 menit — kurangi fsync + sort checkpoint |
| 9 | `checkpoint_completion_target` | default 0.9 | **0.9** | 0.9 | Spread checkpoint I/O 90% interval, hindari spike I/O |
| 10 | `wal_compression` | off | **on** | on | Kompres WAL (lz4) hemat disk + I/O NVMe, CPU Ryzen cukup |
| 11 | `synchronous_commit` | on | **off** | **on** | Tidak tunggu WAL fsync per commit — 3-5x lebih cepat COPY, risiko hilang 1 transaksi jika crash |
| 12 | `wal_level` | logical | **minimal** | **replica** (logical jika butuh Debezium) | Minimal hemat WAL 34GB untuk 5M (logical tulis full WAL untuk CDC), ganti ke logical setelah load jika butuh replica |
| 13 | `effective_io_concurrency` | default 1 | **200** | 200 | NVMe bisa 200 I/O paralel (bukan HDD 1-2), percepat Bitmap Heap Scan + VACUUM |
| 14 | `maintenance_io_concurrency` | default 10 | **200** | 200 | VACUUM/CREATE INDEX paralel I/O di NVMe |
| 15 | `random_page_cost` | default 4.0 | **1.1** | 1.1 | NVMe random ~ sequential (1.1 vs 1.0), planner pilih Index Scan lebih sering |
| 16 | `seq_page_cost` | default 1.0 | **1.0** | 1.0 | Eksplisit 1.0 untuk NVMe (baseline sequential) |
| 17 | `max_parallel_workers` | default 8 | **8** | 8 | 8 worker paralel untuk query + maintenance (sesuai vCPU Ryzen) |
| 18 | `max_parallel_maintenance_workers` | default 2 | **4** | 4 | 4 worker untuk CREATE INDEX CONCURRENTLY / VACUUM paralel |
| 19 | `max_parallel_workers_per_gather` | default 2 | **4** | 4 | 4 worker per Gather node (SELECT paralel) |
| 20 | `max_connections` | 200 | **100** | 100 | Hemat work_mem (100 x 64MB = 6.4GB worst-case vs 200 x 64MB = 12.8GB OOM) |
| 21 | `max_replication_slots` | 4 | 4 (tetap) | 4 | Slot untuk Debezium/CDC setelah revert ke logical |
| 22 | `max_wal_senders` | 4 | 4 (tetap) | 4 | Sender untuk replica/CDC |

> Catatan: `shared_preload_libraries=pg_stat_statements` tetap aktif untuk observability.

## 3. Cara Apply

### 3.1 Restart Postgres dengan config baru

```bash
cd backend-performa-demo
cat compose.yaml          # cek valid YAML
docker compose config     # validasi compose (butuh docker)
# atau yamllint compose.yaml
docker compose up -d      # recreate postgres dengan param baru
docker compose logs -f postgres  # tunggu "database system is ready"
```

Jika Postgres sudah jalan dan hanya param reloadable yang berubah (work_mem, effective_cache_size, dll — bukan shared_buffers/wal_level yang butuh restart):

```sql
-- di psql
SELECT pg_reload_conf();
SHOW shared_buffers;              -- butuh restart, tidak berubah via reload
SHOW effective_cache_size;        -- reloadable
SHOW work_mem;
SHOW maintenance_work_mem;
SHOW wal_level;                   -- butuh restart
SHOW synchronous_commit;
SHOW max_wal_size;
SHOW checkpoint_timeout;
```

Cek semua param:

```sql
SHOW shared_buffers; SHOW effective_cache_size; SHOW work_mem; SHOW maintenance_work_mem;
SHOW wal_buffers; SHOW max_wal_size; SHOW min_wal_size; SHOW checkpoint_timeout;
SHOW checkpoint_completion_target; SHOW wal_compression; SHOW synchronous_commit;
SHOW wal_level; SHOW effective_io_concurrency; SHOW maintenance_io_concurrency;
SHOW random_page_cost; SHOW seq_page_cost;
SHOW max_parallel_workers; SHOW max_parallel_maintenance_workers; SHOW max_parallel_workers_per_gather;
SHOW max_connections;
```

### 3.2 Swap 8G (wajib untuk 13GB RAM + 5M index build)

```bash
sudo bash scripts/swap-setup.sh
free -h
swapon --show
cat /proc/sys/vm/swappiness          # harus 10
cat /proc/sys/vm/dirty_bytes         # 2147483648
```

Detail di `scripts/swap-setup.sh` (fallocate 8G + chmod 600 + mkswap + swapon + fstab + sysctl).

### 3.3 Bulk Load 5M

```bash
# contoh
bun run seed:5m        # atau node seed/generate.ts --rows 5000000
# atau COPY via psql
psql $DATABASE_URL -c "\COPY umkm FROM 'data/umkm_5m.csv' WITH (FORMAT csv, HEADER true)"
VACUUM ANALYZE umkm;
ANALYZE mv_kas_summary; ANALYZE mv_kas_total;
```

## 4. Cara Revert ke Production (setelah bulk load selesai)

**Opsi A — edit compose.yaml manual (paling simpel):**

```bash
# di compose.yaml ganti 3 baris:
# wal_level: minimal -> replica  (atau logical jika butuh Debezium/CDC)
# synchronous_commit: off -> on
# max_wal_size: 10GB -> 1GB
# min_wal_size: 1GB -> 80MB
# checkpoint_timeout: 30min -> 15min
docker compose up -d
psql -c "SHOW wal_level; SHOW synchronous_commit; SHOW max_wal_size;"
```

**Opsi B — pakai compose.production.yaml (tanpa edit compose.yaml):**

```bash
docker compose -f compose.yaml -f compose.production.yaml up -d
# override sudah set wal_level replica, synchronous_commit on, max_wal_size 1GB
psql -c "SHOW wal_level; SHOW synchronous_commit;"
```

> `wal_level` butuh **restart** (bukan reload). `synchronous_commit` dan `max_wal_size` bisa `SELECT pg_reload_conf()` tapi restart lebih aman setelah bulk.

**Checklist revert:**

- [ ] `wal_level = replica` (atau `logical` jika pakai Debezium/Kafka CDC)
- [ ] `synchronous_commit = on`
- [ ] `max_wal_size = 1GB`, `min_wal_size = 80MB`, `checkpoint_timeout = 15min`
- [ ] `VACUUM ANALYZE` semua tabel setelah load
- [ ] `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_kas_summary; REFRESH MATERIALIZED VIEW CONCURRENTLY mv_kas_total;`

## 5. Disk Budget 19.6GB untuk 5M

Estimasi untuk 5M baris (umkm 5M + ledger 500k + masjid/communities kecil + index):

| Komponen | Estimasi | Keterangan |
|----------|----------|------------|
| Tabel `umkm` (5M rows) | ~8.5GB | 5M x ~1.7KB/row (name, alamat, kelurahan, lat/lng, JSON) |
| B-Tree indexes umkm (8 index) | ~4.2GB | kelurahan, kecamatan, category, zip, lat_lng, composite, created_id |
| GIN trigram umkm (3 index) | ~3.8GB | name, alamat, name+alamat (GIN ~45% ukuran tabel) |
| `financial_ledger` + indexes | ~1.5GB | 500k rows + 4 B-Tree |
| `masjid`/`communities`/`memberships` + MatView | ~0.8GB | Kecil + mv_kas_summary/total |
| WAL (minimal, max_wal_size 10GB) | ~2-4GB | Dengan minimal hemat ~34GB vs logical; peak 10GB sebelum checkpoint |
| **Total** | **~19.6GB** | Muat di 90G total (68G used + 19.6G = 87.6G / 90G = 97% — WARNING hampir penuh, sisa ~2.4G) |
| WAL jika logical | ~38GB | logical tulis 2-3x lebih banyak WAL — alasan pakai minimal saat bulk |
| Untuk 70M | ~48GB+ | Butuh 100G+ NVMe atau sharding — 68G + 48G = 116G > 90G tidak muat |

> WARNING: df -h real 90G 68G used 17G avail 81%. Load 5M penuh 19.6GB -> 87.6G/90G 97% hampir penuh. Untuk 70M butuh 100G+.
> Jika NVMe hampir penuh: `VACUUM FULL` setelah load, atau `TRUNCATE` data dummy sebelum load ulang. Monitor: `SELECT pg_database_size('gotongroyong_demo')/1024/1024/1024 AS gb;` dan `df -h`.

## 6. Swap 8G Setup

File: `scripts/swap-setup.sh` (executable, idempotent).

```bash
sudo bash scripts/swap-setup.sh
# isi script: fallocate 8G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=8192
# chmod 600 /swapfile; mkswap /swapfile; swapon /swapfile
# echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
# sysctl -w vm.swappiness=10 vm.vfs_cache_pressure=50
# sysctl -w vm.dirty_background_bytes=536870912 vm.dirty_bytes=2147483648
# verifikasi: free -h; swapon --show
```

Sysctl:

- `vm.swappiness=10` — jangan swap agresif, hanya saat RAM >90%
- `vm.vfs_cache_pressure=50` — pertahankan dentry/inode cache (penting untuk banyak file WAL)
- `vm.dirty_background_bytes=512MB` — flush background tiap 512MB dirty
- `vm.dirty_bytes=2GB` — throttle write jika dirty >2GB (hindari stall 30 detik)

## 7. Verifikasi Performa

### 7.1 EXPLAIN ANALYZE (wajib sebelum klaim p95 < 200ms)

```sql
-- Cari UMKM by kelurahan + category (pakai composite index)
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT * FROM umkm WHERE kelurahan='Bintaro' AND category0='kuliner' LIMIT 20;

-- Pencarian trigram (pakai GIN)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM umkm WHERE name % 'ayam bakar' ORDER BY similarity(name,'ayam bakar') DESC LIMIT 20;

-- MatView kas (harus Index Scan, bukan Seq Scan)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM mv_kas_total WHERE community_id='xxx';

-- Cek index terpakai
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read FROM pg_stat_user_indexes WHERE schemaname='public' ORDER BY idx_scan DESC;

-- Cek Seq Scan yang masih ada (harus 0 untuk tabel >1000 rows)
SELECT relname, seq_scan, seq_tup_read FROM pg_stat_user_tables WHERE seq_scan > 0 ORDER BY seq_tup_read DESC;

-- Slow query
SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

Target:

- `idx_umkm_kelurahan_category` hit: `Index Scan` < 5ms untuk 5M
- `idx_umkm_name_trgm` hit: `Bitmap Index Scan` 10-50ms (vs Seq Scan 2000ms)
- `mv_kas_total`: `Index Scan` 5-30ms (vs `SUM()` 500ms)
- Tidak ada `Seq Scan` di tabel >1000 rows

### 7.2 Load test

```bash
bun run load:k6   # atau autocannon
# cek p50/p95/p99 di Grafana / k6 output — target p95 < 200ms read, < 500ms write
```

## 8. Referensi

- `compose.yaml` — config BULK (minimal, off, 10GB)
- `compose.production.yaml` — config PRODUCTION (replica, on, 1GB)
- `prisma/migrations/003_scale_db.sql` — 31 indexes (7 GIN) + 2 MatView + RLS
- `scripts/swap-setup.sh` — swap 8G + sysctl
- `docs/spec-backend-performa.md` — SLA 16 endpoint, threshold 5M rows

---
*Generated P5M-5 — TUNED FOR 5M BULK - Ryzen 13GB NVMe 1.3GB/s*
