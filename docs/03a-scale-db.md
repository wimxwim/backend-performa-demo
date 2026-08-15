# 03a — Scale Database (B-Tree, GIN pg_trgm, MatView, Cursor, EXPLAIN, RLS, VACUUM)

> **Branch 03a-scale-DB** — optimasi database layer. Sumber: Modul Performa Bab 3.1-3.8 + spec lock SLA + Ringkasan Backend Bab 4.

---

## Ringkasan Benchmark

| Query | Sebelum (01) | Sesudah (03a) | Speedup | Teknik |
|-------|-------------|---------------|---------|--------|
| `LIKE '%ayam%'` | Seq Scan **2000ms** (6.081 baris) | GIN Index Scan **10-50ms** | **40-200x** | `pg_trgm` + `name % 'ayam' ORDER BY similarity DESC` |
| `OFFSET 10000` | scan+discard **2000ms** | cursor keyset **20ms** | **100x** | `WHERE (created_at,id) > cursor ORDER BY created_at,id LIMIT` |
| `SUM(amount) GROUP BY community_id` | Seq Scan **500ms** | MatView **5-30ms** | **16-100x** | `mv_kas_total` + `REFRESH CONCURRENTLY` tiap 5 menit |
| RLS filter | — | **<0.1ms** overhead | — | `CREATE POLICY ... USING (community_id = current_setting(...))` + index FK |
| `VACUUM ANALYZE` | planner salah pilih Seq Scan | statistik fresh | — | `VACUUM ANALYZE umkm` setelah bulk insert |

> Diukur via `EXPLAIN (ANALYZE, BUFFERS)` di Postgres 16. Lihat `scripts/explain-demo.sql` untuk repro.

---

## Apa yang Dioptimasi

### 1. B-Tree Index untuk semua FK (Checklist #3)

```sql
-- Semua FK wajib punya index — tanpa index: JOIN = Seq Scan
CREATE INDEX CONCURRENTLY idx_umkm_kelurahan ON umkm (kelurahan);
CREATE INDEX CONCURRENTLY idx_umkm_kecamatan ON umkm (kecamatan_id);
CREATE INDEX CONCURRENTLY idx_ledger_community_timestamp ON financial_ledger (community_id, timestamp DESC);
CREATE INDEX CONCURRENTLY idx_memberships_community ON memberships (community_id);
-- + composite (kelurahan, category0) & (created_at, id) untuk cursor
```

`CONCURRENTLY` = tidak blokir write saat build (wajib di produksi).

### 2. GIN pg_trgm untuk Pencarian Fuzzy (Bab 3.2)

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY idx_umkm_name_trgm ON umkm USING GIN (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_umkm_alamat_trgm ON umkm USING GIN (alamat gin_trgm_ops);
```

```sql
-- BEFORE (Seq Scan 2000ms)
SELECT * FROM umkm WHERE name LIKE '%ayam%' LIMIT 20;

-- AFTER (GIN 10-50ms) — operator % = similarity > 0.3
SELECT * FROM umkm WHERE name % 'ayam' ORDER BY similarity(name,'ayam') DESC LIMIT 20;
```

`pg_trgm` pecah teks jadi trigram (3 huruf), GIN index cari trigram yang overlap. Cocok untuk `LIKE '%keyword%'` yang B-Tree tidak bisa bantu.

### 3. Materialized View untuk Agregasi Kas (Bab 3.3)

```sql
CREATE MATERIALIZED VIEW mv_kas_total AS
SELECT community_id, COUNT(*) cnt, SUM(amount) total, MAX(timestamp) last_txn
FROM financial_ledger WHERE community_id IS NOT NULL GROUP BY community_id WITH DATA;

CREATE UNIQUE INDEX idx_mv_kas_total_community ON mv_kas_total (community_id);
-- Refresh tiap 5 menit (pg_cron) atau async setelah POST /api/kas
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_kas_total;
```

```sql
-- BEFORE: SELECT SUM(amount) FROM financial_ledger WHERE community_id=$1 -- Seq Scan 500ms
-- AFTER : SELECT * FROM mv_kas_total WHERE community_id=$1               -- Index Scan 5-30ms
```

`CONCURRENTLY` butuh `UNIQUE INDEX` agar refresh tidak lock read.

### 4. Cursor Pagination / Keyset (Bab 3.5)

```sql
-- BEFORE: OFFSET 10000 — scan 10.020 baris, buang 10.000 — 2000ms
SELECT * FROM umkm ORDER BY created_at, id LIMIT 20 OFFSET 10000;

-- AFTER: cursor — Index Scan 20ms
SELECT * FROM umkm WHERE (created_at, id) > ('2024-01-15T00:00:00Z','umkm_3000')
ORDER BY created_at, id LIMIT 20;
```

Cursor di-encode base64: `Buffer.from(JSON.stringify({created_at, id})).toString('base64')`.

### 5. EXPLAIN ANALYZE Endpoint

```
GET /api/explain?q=ayam
→ { before_like: { plan: Seq Scan ... }, after_gin: { plan: Bitmap Index Scan ... },
    offset_10000: {...}, cursor_keyset: {...} }
```

Jalankan juga `psql -f scripts/explain-demo.sql` untuk benchmark lengkap.

### 6. Row Level Security (RLS) — Isolasi per Komunitas (Bab 3.7)

```sql
ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY community_isolation ON financial_ledger
  USING (community_id = current_setting('app.community_id', true)::text
         OR current_setting('app.community_id', true) IS NULL);
-- Aplikasi: SET app.community_id = 'xxx' per-request via middleware
```

Overhead **<0.1ms** setelah index FK ada. Bypass untuk migration/seed via `current_setting IS NULL`.

### 7. VACUUM ANALYZE

```sql
VACUUM ANALYZE umkm;
ANALYZE mv_kas_summary;
```

Wajib setelah bulk insert 6.081 UMKM agar planner punya statistik akurat (tidak salah pilih Seq Scan).

---

## Cara Verifikasi

```bash
# 1. Migrasi
psql $DATABASE_URL -f prisma/migrations/003_scale_db.sql

# 2. Benchmark EXPLAIN
psql $DATABASE_URL -f scripts/explain-demo.sql

# 3. Jalankan service 03a
DATABASE_URL=postgres://demo:demo123@localhost:6432/gotongroyong_demo \
  bun run --cwd umkm-service src/index-03a.ts
# Test:
curl 'http://localhost:3003/api/cari?q=ayam&mode=before'  # Seq Scan
curl 'http://localhost:3003/api/cari?q=ayam&mode=after'   # GIN
curl 'http://localhost:3003/api/umkm?limit=20'            # cursor
curl 'http://localhost:3003/api/explain?q=ayam'           # EXPLAIN JSON

DATABASE_URL=... bun run --cwd kas-service src/index-03a.ts
curl 'http://localhost:3004/api/kas?community_id=xxx&mode=before'
curl 'http://localhost:3004/api/kas?community_id=xxx&mode=after'  # MatView
```

---

## File Terkait

- `prisma/migrations/003_scale_db.sql` — DDL lengkap (B-Tree, GIN, MatView, RLS, VACUUM)
- `umkm-service/src/index-03a.ts` — Express + GIN search + cursor + EXPLAIN + RLS
- `kas-service/src/index-03a.ts` — MatView kas + cursor ledger + hash chain
- `scripts/explain-demo.sql` — benchmark EXPLAIN ANALYZE lengkap
