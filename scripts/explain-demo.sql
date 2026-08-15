-- scripts/explain-demo.sql — Demo EXPLAIN ANALYZE untuk 03a-scale-DB
-- Jalankan: psql $DATABASE_URL -f scripts/explain-demo.sql
-- Atau: docker exec gr-postgres psql -U demo -d gotongroyong_demo -f /scripts/explain-demo.sql
-- Bahasa komentar: Indonesia
-- Sumber: Modul Performa Bab 3 — benchmark kuantitatif

\echo '=== 03a EXPLAIN ANALYZE Demo — Gotong Royong Scale DB ==='
\echo 'Data: 6.081 UMKM Pesanggrahan + 256 masjid + ledger (seed dulu)'
\echo ''

-- ──────────────────────────────────────────────
-- Setup: pastikan extension & statistik fresh
-- ──────────────────────────────────────────────
\timing on
\echo '--- VACUUM ANALYZE (refresh statistik planner) ---'
VACUUM ANALYZE umkm;
VACUUM ANALYZE masjid;
VACUUM ANALYZE financial_ledger;
ANALYZE mv_kas_summary;
ANALYZE mv_kas_total;

-- ──────────────────────────────────────────────
-- 1. LIKE tanpa index vs B-Tree vs pg_trgm GIN
-- Demo pencarian: q = 'ayam' (banyak di KULINER)
-- ──────────────────────────────────────────────
\echo ''
\echo '================================================================'
\echo '1a. LIKE tanpa index (Seq Scan) — ANTI-PATTERN 01'
\echo '    SELECT * FROM umkm WHERE name LIKE ''%ayam%'' LIMIT 20'
\echo '    Expected: Seq Scan 6.081 baris ~500-2000ms'
\echo '================================================================'
-- Paksa Seq Scan dengan disable index scan (untuk demo before)
-- BEGIN; SET LOCAL enable_indexscan = off; SET LOCAL enable_bitmapscan = off;
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT * FROM umkm WHERE name LIKE '%ayam%' LIMIT 20;
-- ROLLBACK;

\echo ''
\echo '================================================================'
\echo '1b. LIKE dengan B-Tree (tidak efektif untuk %keyword%)'
\echo '    B-Tree hanya untuk prefix LIKE ''ayam%'' — tetap Seq Scan untuk ''%ayam%'''
\echo '    Expected: tetap Seq Scan ~500-2000ms (B-Tree tidak bantu suffix)'
\echo '================================================================'
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT * FROM umkm WHERE name LIKE '%ayam%' LIMIT 20;

\echo ''
\echo '================================================================'
\echo '1c. pg_trgm GIN — AFTER (03a)'
\echo '    SELECT * FROM umkm WHERE name % ''ayam'' ORDER BY similarity(name,''ayam'') DESC LIMIT 20'
\echo '    Expected: Bitmap Index Scan via idx_umkm_name_trgm ~10-50ms (50-200x lebih cepat)'
\echo '================================================================'
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT id, name, similarity(name, 'ayam') AS sml
FROM umkm
WHERE name % 'ayam'
ORDER BY sml DESC
LIMIT 20;

\echo ''
\echo '--- Actual rows GIN ---'
SELECT id, name, kelurahan, category0, similarity(name, 'ayam') AS sml
FROM umkm WHERE name % 'ayam' ORDER BY sml DESC LIMIT 5;

-- ──────────────────────────────────────────────
-- 2. Cursor vs OFFSET 10000 (Bab 3.5)
-- OFFSET 10000: scan + discard 10k baris — 2000ms
-- Cursor: WHERE (created_at, id) > cursor — Index Scan 20ms
-- ──────────────────────────────────────────────
\echo ''
\echo '================================================================'
\echo '2a. OFFSET 10000 — ANTI-PATTERN (lambat di halaman dalam)'
\echo '    SELECT * FROM umkm ORDER BY created_at, id LIMIT 20 OFFSET 10000'
\echo '    Expected: scan 10.020 baris, discard 10.000 — ~500-2000ms'
\echo '================================================================'
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT * FROM umkm ORDER BY created_at, id LIMIT 20 OFFSET 10000;

\echo ''
\echo '================================================================'
\echo '2b. Cursor pagination — AFTER (03a)'
\echo '    SELECT * FROM umkm WHERE (created_at, id) > (NOW()-30d, ''0'') ORDER BY created_at, id LIMIT 20'
\echo '    Expected: Index Scan via idx_umkm_created_id — ~5-20ms (100x lebih cepat)'
\echo '================================================================'
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT * FROM umkm
WHERE (created_at, id) > (NOW() - INTERVAL '30 days', 'umkm_0000')
ORDER BY created_at, id
LIMIT 20;

\echo ''
\echo '--- Cursor benchmark: ambil cursor tengah, lalu next page ---'
-- Simulasi: ambil 1 baris tengah sebagai cursor
SELECT id, created_at FROM umkm ORDER BY created_at, id LIMIT 1 OFFSET 3000;
-- Lalu next page pakai cursor (ganti nilai di bawah dengan hasil di atas)
-- SELECT * FROM umkm WHERE (created_at, id) > ('2024-01-15T00:00:00Z','umkm_3000') ORDER BY created_at, id LIMIT 20;

-- ──────────────────────────────────────────────
-- 3. Materialized View vs Seq Scan agregasi (Bab 3.3)
-- ──────────────────────────────────────────────
\echo ''
\echo '================================================================'
\echo '3a. Agregasi kas tanpa MatView — Seq Scan financial_ledger'
\echo '    SELECT community_id, SUM(amount) FROM financial_ledger GROUP BY community_id'
\echo '    Expected: Seq Scan + HashAggregate ~200-500ms (tergantung jumlah baris)'
\echo '================================================================'
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT community_id, COUNT(*) AS cnt, SUM(amount) AS total
FROM financial_ledger
WHERE community_id IS NOT NULL
GROUP BY community_id;

\echo ''
\echo '================================================================'
\echo '3b. Agregasi via MatView — Index Scan mv_kas_total'
\echo '    SELECT * FROM mv_kas_total WHERE community_id = $1'
\echo '    Expected: Index Scan ~5-30ms (10-50x lebih cepat)'
\echo '================================================================'
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT * FROM mv_kas_total LIMIT 20;

-- Jika ada data komunitas, test spesifik:
-- EXPLAIN (ANALYZE, BUFFERS, TIMING) SELECT * FROM mv_kas_total WHERE community_id = 'xxx';

\echo ''
\echo '--- MatView content sample ---'
SELECT * FROM mv_kas_total LIMIT 5;
SELECT * FROM mv_kas_summary LIMIT 5;

-- ──────────────────────────────────────────────
-- 4. RLS overhead — <0.1ms setelah index (Bab 3.7)
-- ──────────────────────────────────────────────
\echo ''
\echo '================================================================'
\echo '4. RLS — overhead isolasi per komunitas'
\echo '    SET app.community_id = ''test''; SELECT * FROM financial_ledger LIMIT 5;'
\echo '    Expected: Index Scan + Filter RLS <0.1ms overhead setelah idx_ledger_community'
\echo '================================================================'
-- Simpan setting lama
SELECT current_setting('app.community_id', true) AS before_rls;
-- Set RLS
SELECT set_config('app.community_id', 'test-community-123', true);
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT * FROM financial_ledger LIMIT 5;
-- Reset
SELECT set_config('app.community_id', '', true);

-- ──────────────────────────────────────────────
-- 5. Index usage audit — pastikan semua FK punya index (Checklist #3)
-- ──────────────────────────────────────────────
\echo ''
\echo '================================================================'
\echo '5. Audit index — semua FK harus punya index (Checklist #3)'
\echo '================================================================'
SELECT tablename, indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public' AND tablename IN ('umkm','masjid','communities','memberships','announcements','financial_ledger','zis_distribution')
ORDER BY tablename, indexname;

\echo ''
\echo '--- GIN trigram indexes ---'
SELECT indexname, indexdef FROM pg_indexes WHERE indexdef LIKE '%gin_trgm_ops%';

\echo ''
\echo '--- MatViews ---'
SELECT schemaname, matviewname, ispopulated FROM pg_matviews WHERE matviewname LIKE 'mv_%';

\echo ''
\echo '--- RLS policies ---'
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE schemaname='public';

\echo ''
\echo '--- pg_stat_statements top 10 slowest (jika ada data) ---'
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%umkm%' OR query LIKE '%financial_ledger%'
ORDER BY mean_exec_time DESC LIMIT 10;

\echo ''
\echo '=== Ringkasan Benchmark (klaim spec) ==='
\echo 'LIKE %ayam%  : 2000ms (Seq Scan) -> 10ms (GIN)      = 200x'
\echo 'OFFSET 10000 : 2000ms (scan+discard) -> 20ms (cursor)= 100x'
\echo 'MatView kas  : 500ms (Seq Scan agg) -> 30ms (MatView) = 16x'
\echo 'RLS overhead : <0.1ms setelah index FK'
\echo 'Cache Hit    : >80% untuk endpoint cache (lihat 03b)'
\echo 'GZIP         : 100KB -> 20KB (70-80% saving)'
\echo 'PgBouncer    : pool 25 vs direct 500MB RAM per 100 koneksi'
\echo ''
\echo '=== Selesai — jalankan VACUUM ANALYZE berkala & REFRESH MatView tiap 5 menit ==='
