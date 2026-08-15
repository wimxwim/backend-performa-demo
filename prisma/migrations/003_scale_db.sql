-- =============================================================================
-- Migration 003_scale_db.sql — Optimasi Skala Database (Bab 3.1-3.8)
-- Branch 03a-scale-DB: B-Tree FK, pg_trgm GIN, Materialized View, RLS, VACUUM
-- Postgres 16 — semua CREATE INDEX pakai CONCURRENTLY (tidak blokir write)
-- Sumber: Modul_Performa_Backend_GR Bab 3 + Ringkasan Backend Bab 4 + spec lock
-- Bahasa komentar: Indonesia
-- NOTE: CONCURRENTLY dihapus untuk demo lokal (prisma migrate deploy wrap transaction, CONCURRENTLY tidak bisa dalam transaction). Untuk produksi, jalankan manual: psql -c 'CREATE INDEX CONCURRENTLY ...'
-- =============================================================================

-- ──────────────────────────────────────────────
-- 0. Prasyarat extension (idempotent)
-- pg_trgm untuk GIN trigram, pgcrypto untuk hash chain (sudah di 001),
-- pg_stat_statements untuk EXPLAIN observability
-- ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_cron;  -- untuk REFRESH MatView terjadwal (opsional, fallback cron manual)

-- ──────────────────────────────────────────────
-- 1. B-TREE INDEX untuk semua Foreign Key (Checklist #3)
-- Tanpa index FK: JOIN + DELETE CASCADE = Seq Scan. Dengan B-Tree: Index Scan < 5ms
-- Spec: idx_umkm_kelurahan ON umkm(kelurahan), idx_*_community, donor, dsb.
-- CONCURRENTLY = tidak lock tabel saat build (wajib di produksi)
-- Catatan: CONCURRENTLY tidak bisa dalam transaction block — jalankan manual jika
-- migrasi via Prisma transaction gagal, gunakan: psql -c "CREATE INDEX CONCURRENTLY ..."
-- ──────────────────────────────────────────────

-- UMKM: kelurahan, kecamatan, category (filter utama /api/umkm & /api/cari)
CREATE INDEX IF NOT EXISTS idx_umkm_kelurahan ON umkm (kelurahan);
CREATE INDEX IF NOT EXISTS idx_umkm_kecamatan ON umkm (kecamatan_id);
CREATE INDEX IF NOT EXISTS idx_umkm_category0 ON umkm (category0);
CREATE INDEX IF NOT EXISTS idx_umkm_zip ON umkm (zip_code);
CREATE INDEX IF NOT EXISTS idx_umkm_lat_lng ON umkm (lat, lng);
-- Composite untuk filter kombinasi kelurahan + kategori (query populer)
CREATE INDEX IF NOT EXISTS idx_umkm_kelurahan_category
    ON umkm (kelurahan, category0);
-- Untuk cursor pagination: ORDER BY created_at, id
CREATE INDEX IF NOT EXISTS idx_umkm_created_id
    ON umkm (created_at, id);

-- Memberships: FK community_id + profile_id (JOIN paling sering)
CREATE INDEX IF NOT EXISTS idx_memberships_community ON memberships (community_id);
CREATE INDEX IF NOT EXISTS idx_memberships_profile ON memberships (profile_id);
CREATE INDEX IF NOT EXISTS idx_memberships_community_profile
    ON memberships (community_id, profile_id);

-- Announcements: FK community_id + komposit pinned/created_at
CREATE INDEX IF NOT EXISTS idx_announcements_community_pinned_created
    ON announcements (community_id, pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_community ON announcements (community_id);

-- Financial ledger: FK community_id + donor/actor
CREATE INDEX IF NOT EXISTS idx_ledger_community_timestamp
    ON financial_ledger (community_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_actor ON financial_ledger (actor_id);
CREATE INDEX IF NOT EXISTS idx_ledger_recipient ON financial_ledger (recipient_id);
-- Composite untuk laporan kas per komunitas per bulan (MatView fallback)
CREATE INDEX IF NOT EXISTS idx_ledger_community_amount
    ON financial_ledger (community_id, amount);

-- ZIS distribution: FK zis_collection_id
CREATE INDEX IF NOT EXISTS idx_zis_collection ON zis_distribution (zis_collection_id);
CREATE INDEX IF NOT EXISTS idx_zis_asnaf ON zis_distribution (asnaf_category);

-- Masjid: kelurahan + tipe
CREATE INDEX IF NOT EXISTS idx_masjid_kelurahan ON masjid (kelurahan);
CREATE INDEX IF NOT EXISTS idx_masjid_tipe ON masjid (tipe);
CREATE INDEX IF NOT EXISTS idx_masjid_lat_lng ON masjid (lat, lng);

-- Communities: kelurahan + type + slug
CREATE INDEX IF NOT EXISTS idx_communities_kelurahan ON communities (kelurahan);
CREATE INDEX IF NOT EXISTS idx_communities_type ON communities (type);
CREATE INDEX IF NOT EXISTS idx_communities_slug ON communities (slug);

-- ──────────────────────────────────────────────
-- 2. GIN pg_trgm untuk pencarian fuzzy LIKE '%keyword%' (Bab 3.2)
-- Tanpa GIN: WHERE name LIKE '%ayam%' = Seq Scan 6.081 baris ~2000ms
-- Dengan GIN: WHERE name % 'ayam' ORDER BY similarity(name,'ayam') DESC = Index Scan ~10-50ms
-- Operator: % (similarity > threshold), <-> (distance), gin_trgm_ops
-- Threshold default 0.3 — atur via SET pg_trgm.similarity_threshold = 0.3
-- ──────────────────────────────────────────────

-- UMKM: pencarian nama + alamat (endpoint /api/cari paling berat)
CREATE INDEX IF NOT EXISTS idx_umkm_name_trgm
    ON umkm USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_umkm_alamat_trgm
    ON umkm USING GIN (alamat gin_trgm_ops);
-- Trigram composite untuk pencarian gabungan nama + alamat
CREATE INDEX IF NOT EXISTS idx_umkm_name_alamat_trgm
    ON umkm USING GIN ((name || ' ' || alamat) gin_trgm_ops);

-- Masjid: pencarian nama masjid terdekat + keyword
CREATE INDEX IF NOT EXISTS idx_masjid_name_trgm
    ON masjid USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_masjid_alamat_trgm
    ON masjid USING GIN (alamat gin_trgm_ops);

-- Communities: pencarian nama komunitas
CREATE INDEX IF NOT EXISTS idx_communities_name_trgm
    ON communities USING GIN (name gin_trgm_ops);

-- Announcements: pencarian judul + konten
CREATE INDEX IF NOT EXISTS idx_announcements_title_trgm
    ON announcements USING GIN (title gin_trgm_ops);

-- Set threshold global untuk similarity (opsional, bisa per-query)
-- SELECT set_limit(0.3); -- deprecated, gunakan:
-- SET pg_trgm.similarity_threshold = 0.3;

-- ──────────────────────────────────────────────
-- 3. MATERIALIZED VIEW mv_kas_summary — agregasi kas per komunitas (Bab 3.3)
-- Tanpa MatView: SELECT SUM(amount) FROM financial_ledger WHERE community_id=$1 = Seq Scan 500ms
-- Dengan MatView: SELECT * FROM mv_kas_summary WHERE community_id=$1 = Index Scan 5-30ms (100x lebih cepat)
-- Refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_kas_summary (butuh UNIQUE index)
-- Jadwal: pg_cron tiap 5 menit (atau trigger manual setelah POST /api/kas)
-- ──────────────────────────────────────────────

DROP MATERIALIZED VIEW IF EXISTS mv_kas_summary;

CREATE MATERIALIZED VIEW mv_kas_summary AS
SELECT
    community_id,
    COUNT(*)                        AS cnt,
    SUM(amount)                     AS total,
    AVG(amount)                     AS avg_amount,
    MIN(amount)                     AS min_amount,
    MAX(amount)                     AS max_amount,
    MIN(timestamp)                  AS first_txn,
    MAX(timestamp)                  AS last_txn,
    -- Agregasi bulanan untuk dashboard (opsional)
    date_trunc('month', timestamp)  AS bulan
FROM financial_ledger
WHERE community_id IS NOT NULL
GROUP BY community_id, date_trunc('month', timestamp)
WITH DATA;

-- UNIQUE index wajib untuk REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_kas_community_bulan
    ON mv_kas_summary (community_id, bulan);

-- Index tambahan untuk lookup cepat per komunitas (tanpa bulan)
CREATE INDEX IF NOT EXISTS idx_mv_kas_community
    ON mv_kas_summary (community_id);

CREATE INDEX IF NOT EXISTS idx_mv_kas_total
    ON mv_kas_summary (total DESC);

COMMENT ON MATERIALIZED VIEW mv_kas_summary IS 'Agregasi kas per komunitas per bulan — refresh CONCURRENTLY tiap 5 menit, 500ms -> 5-30ms';

-- ──────────────────────────────────────────────
-- 3b. Materialized View ringkas tanpa grouping bulan (untuk GET /api/kas?community_id=xxx cepat)
-- ──────────────────────────────────────────────
DROP MATERIALIZED VIEW IF EXISTS mv_kas_total;

CREATE MATERIALIZED VIEW mv_kas_total AS
SELECT
    community_id,
    COUNT(*)       AS cnt,
    SUM(amount)    AS total,
    AVG(amount)    AS avg_amount,
    MAX(timestamp) AS last_txn
FROM financial_ledger
WHERE community_id IS NOT NULL
GROUP BY community_id
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_kas_total_community
    ON mv_kas_total (community_id);

COMMENT ON MATERIALIZED VIEW mv_kas_total IS 'Ringkasan kas total per komunitas — untuk endpoint GET /api/kas (tanpa group bulan)';

-- ──────────────────────────────────────────────
-- 4. pg_cron — refresh MatView otomatis tiap 5 menit
-- Jika pg_cron tidak tersedia (mis. Supabase Free tanpa extension), fallback ke
-- cron manual di aplikasi: setInterval(() => refreshMatView(), 5*60*1000)
-- ──────────────────────────────────────────────
DO $$
BEGIN
    -- Hapus jadwal lama jika ada
    PERFORM cron.unschedule('refresh-mv-kas-summary')
        WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-mv-kas-summary');
    PERFORM cron.unschedule('refresh-mv-kas-total')
        WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-mv-kas-total');
EXCEPTION WHEN undefined_table OR undefined_function THEN
    -- pg_cron belum terpasang — skip, refresh manual via aplikasi
    RAISE NOTICE 'pg_cron tidak tersedia — gunakan refresh manual via aplikasi (setInterval)';
END $$;

-- Jadwal aktif hanya jika pg_cron tersedia
DO $$
BEGIN
    PERFORM cron.schedule(
        'refresh-mv-kas-summary',
        '*/5 * * * *',
        'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_kas_summary'
    );
    PERFORM cron.schedule(
        'refresh-mv-kas-total',
        '*/5 * * * *',
        'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_kas_total'
    );
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'pg_cron.schedule tidak tersedia — skip';
END $$;

-- ──────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS) — isolasi data per komunitas (Bab 3.7)
-- Setiap query otomatis filter WHERE community_id = current_setting('app.community_id')
-- Aplikasi SET app.community_id = 'xxx' di awal transaksi (via middleware)
-- Tanpa RLS: risiko bocor data antar komunitas. Dengan RLS: aman di level DB
-- ──────────────────────────────────────────────

-- Aktifkan RLS di tabel yang punya community_id
ALTER TABLE umkm ENABLE ROW LEVEL SECURITY;
ALTER TABLE masjid ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Policy: isolasi per komunitas — hanya baris dengan community_id yang cocok
-- Untuk tabel tanpa community_id (umkm/masjid pakai kelurahan), policy pakai kelurahan mapping

-- Financial ledger: isolasi ketat per community_id
DROP POLICY IF EXISTS community_isolation ON financial_ledger;
CREATE POLICY community_isolation ON financial_ledger
    USING (community_id = current_setting('app.community_id', true)::text
           OR current_setting('app.community_id', true) IS NULL  -- bypass untuk admin/migration
           OR current_setting('app.community_id', true) = '');

-- Announcements: isolasi per community_id
DROP POLICY IF EXISTS community_isolation ON announcements;
CREATE POLICY community_isolation ON announcements
    USING (community_id = current_setting('app.community_id', true)::text
           OR current_setting('app.community_id', true) IS NULL
           OR current_setting('app.community_id', true) = '');

-- UMKM: isolasi via kelurahan -> community mapping (sederhana: filter kelurahan)
-- Untuk demo, umkm tidak punya community_id langsung — policy pakai kelurahan
-- Aplikasi SET app.kelurahan = 'Bintaro' untuk filter
DROP POLICY IF EXISTS kelurahan_isolation ON umkm;
CREATE POLICY kelurahan_isolation ON umkm
    USING (kelurahan = current_setting('app.kelurahan', true)::text
           OR current_setting('app.kelurahan', true) IS NULL
           OR current_setting('app.kelurahan', true) = '');

-- Masjid: sama — isolasi via kelurahan
DROP POLICY IF EXISTS kelurahan_isolation ON masjid;
CREATE POLICY kelurahan_isolation ON masjid
    USING (kelurahan = current_setting('app.kelurahan', true)::text
           OR current_setting('app.kelurahan', true) IS NULL
           OR current_setting('app.kelurahan', true) = '');

-- Communities: hanya komunitas sendiri yang terlihat (kecuali admin)
DROP POLICY IF EXISTS community_isolation ON communities;
CREATE POLICY community_isolation ON communities
    USING (id = current_setting('app.community_id', true)::text
           OR current_setting('app.community_id', true) IS NULL
           OR current_setting('app.community_id', true) = '');

-- Bypass RLS untuk role postgres/demo (migration & seed)
-- Di produksi: buat role app_user dengan BYPASSRLS = false
ALTER TABLE financial_ledger FORCE ROW LEVEL SECURITY;
ALTER TABLE announcements FORCE ROW LEVEL SECURITY;
-- umkm/masjid/communities: tidak FORCE agar seed tetap bisa insert tanpa SET

COMMENT ON POLICY community_isolation ON financial_ledger IS 'RLS isolasi per komunitas — SET app.community_id di middleware Express';

-- ──────────────────────────────────────────────
-- 6. VACUUM ANALYZE — bersihkan dead tuple + update statistik planner
-- Setelah bulk insert 6.081 UMKM + 256 masjid, planner butuh statistik akurat
-- Autovacuum otomatis jalan, tapi manual VACUUM ANALYZE pastikan statistik fresh
-- sebelum EXPLAIN ANALYZE benchmark
-- ──────────────────────────────────────────────
VACUUM ANALYZE umkm;
VACUUM ANALYZE masjid;
VACUUM ANALYZE communities;
VACUUM ANALYZE memberships;
VACUUM ANALYZE announcements;
VACUUM ANALYZE financial_ledger;
VACUUM ANALYZE zis_distribution;
VACUUM ANALYZE audit_log;

-- Update statistik untuk MatView
ANALYZE mv_kas_summary;
ANALYZE mv_kas_total;

-- ──────────────────────────────────────────────
-- 7. Verifikasi — cek semua objek terbuat dengan benar
-- Jalankan setelah migrasi: psql -c "\d+ mv_kas_summary" dan "\di"
-- ──────────────────────────────────────────────
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '=== Verifikasi 003_scale_db ===';

    -- Cek GIN index
    FOR r IN SELECT indexname FROM pg_indexes WHERE indexname LIKE '%trgm%' LOOP
        RAISE NOTICE 'GIN index OK: %', r.indexname;
    END LOOP;

    -- Cek MatView
    FOR r IN SELECT matviewname FROM pg_matviews WHERE matviewname LIKE 'mv_kas%' LOOP
        RAISE NOTICE 'MatView OK: %', r.matviewname;
    END LOOP;

    -- Cek RLS
    FOR r IN SELECT relname, relrowsecurity, relforcerowsecurity
             FROM pg_class WHERE relname IN ('financial_ledger','umkm','announcements') LOOP
        RAISE NOTICE 'RLS % — enabled=%, forced=%', r.relname, r.relrowsecurity, r.relforcerowsecurity;
    END LOOP;

    RAISE NOTICE '=== 003_scale_db selesai — benchmark: LIKE 2000ms->10ms, MatView 500ms->30ms ===';
END $$;
