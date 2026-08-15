-- =============================================================================
-- Migration 004_demo_zis_rls.sql — Demo ZIS 8 Asnaf + Hash Verify + RLS Isolasi
-- Opsi B — TIGA INSAN Live: Muttaqin=hash verify, Shalih=ZIS mudah, Nafi'=mustahiq mandiri
-- Sumber: schema.prisma (KasLedger hashPrev/hashSelf, ZisDistribution 8 asnaf), 002_ledger_hash_chain.sql, 003_scale_db.sql
-- Bahasa komentar: Indonesia
-- Idempotent: semua CREATE/ALTER pakai IF NOT EXISTS / DO $$ EXCEPTION WHEN duplicate_object
-- Cara run: psql $DATABASE_URL -f prisma/migrations/004_demo_zis_rls.sql
-- Verifikasi: curl POST /api/zis/distribute, curl GET /api/ledger/verify, curl GET /api/demo/rls-test
-- =============================================================================

-- ──────────────────────────────────────────────
-- 0. Prasyarat extension (idempotent)
-- pgcrypto untuk digest() SHA-256 — sudah di 002 & 003, tapi pastikan ada
-- ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ──────────────────────────────────────────────
-- 1. Validasi ZIS 8 asnaf CHECK constraint
-- Di 002 sudah ada: CHECK (asnaf_category IN ('fakir','miskin','amil','mualaf','riqab','gharim','fisabilillah','ibnu_sabil'))
-- Di sini: cek dulu, jika belum ada baru tambah — idempotent
-- QS At-Taubah:60 — 8 golongan penerima zakat
-- ──────────────────────────────────────────────
DO $$
BEGIN
    -- Cek apakah constraint chk_asnaf atau check asnaf_category sudah ada
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_asnaf'
        AND conrelid = 'zis_distribution'::regclass
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'zis_distribution'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%asnaf_category%IN%'
    ) THEN
        -- Constraint belum ada — buat
        ALTER TABLE zis_distribution
        ADD CONSTRAINT chk_asnaf
        CHECK (asnaf_category IN ('fakir','miskin','amil','mualaf','riqab','gharim','fisabilillah','ibnu_sabil'));
        RAISE NOTICE 'CHECK constraint chk_asnaf dibuat — 8 asnaf QS At-Taubah:60';
    ELSE
        RAISE NOTICE 'CHECK constraint 8 asnaf sudah ada di 002 — skip';
    END IF;
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'chk_asnaf sudah ada — skip (duplicate_object)';
EXCEPTION WHEN others THEN
    RAISE NOTICE 'chk_asnaf check skip: %', SQLERRM;
END $$;

-- ──────────────────────────────────────────────
-- 2. Function secure_ledger_hash() — trigger SHA-256 hash chain
-- Di 002 sudah ada versi exact Bab 5 — di sini buat versi demo yang log
-- Jika sudah ada di 002, buat versi demo yang log ke RAISE NOTICE (tidak override yang asli)
-- Untuk demo: buat function demo_secure_ledger_hash() sebagai wrapper log
-- ──────────────────────────────────────────────

-- Pastikan function asli tetap ada — jangan override jika sudah ada
-- Buat function demo wrapper yang log (untuk observability demo)
CREATE OR REPLACE FUNCTION demo_secure_ledger_hash()
RETURNS TRIGGER AS $$
DECLARE
    prev_hash VARCHAR(64);
    raw_data_string TEXT;
BEGIN
    -- 1. Ambil hash_self dari baris terakhir
    SELECT hash_self INTO prev_hash
    FROM financial_ledger
    ORDER BY id DESC LIMIT 1;

    IF prev_hash IS NULL THEN
        prev_hash := '0000000000000000000000000000000000000000000000000000000000000000';
        RAISE NOTICE '[DEMO] Genesis block — hash_prev = 64 nol';
    END IF;

    NEW.hash_prev := prev_hash;

    -- 2. Gabungkan data untuk di-hash
    raw_data_string := NEW.amount::text || '|' || NEW.description || '|' || NEW.recipient_id || '|' || NEW.actor_id || '|' || NEW.hash_prev;

    -- 3. Hitung SHA-256 via pgcrypto
    NEW.hash_self := encode(digest(raw_data_string, 'sha256'), 'hex');

    RAISE NOTICE '[DEMO] Hash chain: amount=% description=% recipient=% actor=% hash_prev=%... hash_self=%...',
        NEW.amount, substring(NEW.description, 1, 20), NEW.recipient_id, NEW.actor_id,
        substring(NEW.hash_prev, 1, 8), substring(NEW.hash_self, 1, 8);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION demo_secure_ledger_hash() IS 'Demo wrapper secure_ledger_hash() dengan RAISE NOTICE — untuk observability demo ZIS 8 asnaf';

-- Pastikan trigger asli tetap aktif — jika belum ada, buat
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_secure_financial_ledger'
    ) THEN
        CREATE TRIGGER trg_secure_financial_ledger
        BEFORE INSERT ON financial_ledger
        FOR EACH ROW
        EXECUTE FUNCTION secure_ledger_hash();
        RAISE NOTICE 'Trigger trg_secure_financial_ledger dibuat';
    ELSE
        RAISE NOTICE 'Trigger trg_secure_financial_ledger sudah ada — skip';
    END IF;
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Trigger sudah ada — skip';
END $$;

-- ──────────────────────────────────────────────
-- 3. RLS demo — isolasi per komunitas
-- Di 003 sudah ada: ALTER TABLE financial_ledger ENABLE RLS + POLICY community_isolation
-- Di sini: buat policy demo_isolation idempotent (jika sudah ada skip)
-- Prinsip UX #31: Data satu komunitas tidak bocor ke komunitas lain
-- Piagam Madinah Pasal 2: Data satu komunitas tidak bocor ke lain
-- ──────────────────────────────────────────────

-- Pastikan RLS enabled
ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE zis_distribution ENABLE ROW LEVEL SECURITY;

-- Policy demo_isolation — idempotent
DO $$
BEGIN
    -- financial_ledger: demo_isolation
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'financial_ledger' AND policyname = 'demo_isolation'
    ) THEN
        CREATE POLICY demo_isolation ON financial_ledger
            USING (
                community_id = current_setting('app.community_id', true)::text
                OR current_setting('app.community_id', true) IS NULL
                OR current_setting('app.community_id', true) = ''
            );
        RAISE NOTICE 'Policy demo_isolation di financial_ledger dibuat';
    ELSE
        RAISE NOTICE 'Policy demo_isolation di financial_ledger sudah ada — skip';
    END IF;
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Policy demo_isolation financial_ledger sudah ada — skip';
END $$;

DO $$
BEGIN
    -- zis_distribution: demo_isolation via join ke financial_ledger
    -- Untuk demo: zis_distribution tidak punya community_id langsung — policy pakai EXISTS subquery
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'zis_distribution' AND policyname = 'demo_isolation'
    ) THEN
        CREATE POLICY demo_isolation ON zis_distribution
            USING (
                EXISTS (
                    SELECT 1 FROM financial_ledger fl
                    WHERE fl.id = zis_distribution.zis_collection_id
                    AND (
                        fl.community_id = current_setting('app.community_id', true)::text
                        OR current_setting('app.community_id', true) IS NULL
                        OR current_setting('app.community_id', true) = ''
                    )
                )
                OR current_setting('app.community_id', true) IS NULL
                OR current_setting('app.community_id', true) = ''
            );
        RAISE NOTICE 'Policy demo_isolation di zis_distribution dibuat';
    ELSE
        RAISE NOTICE 'Policy demo_isolation di zis_distribution sudah ada — skip';
    END IF;
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Policy demo_isolation zis_distribution sudah ada — skip';
END $$;

-- FORCE RLS untuk financial_ledger (sudah di 003, tapi pastikan)
DO $$
BEGIN
    ALTER TABLE financial_ledger FORCE ROW LEVEL SECURITY;
    RAISE NOTICE 'FORCE RLS financial_ledger OK';
EXCEPTION WHEN others THEN
    RAISE NOTICE 'FORCE RLS skip: %', SQLERRM;
END $$;

COMMENT ON POLICY demo_isolation ON financial_ledger IS 'Demo RLS isolasi — SET app.community_id di middleware Express, prinsip UX #31';

-- ──────────────────────────────────────────────
-- 4. Seed demo — 2 komunitas + 5 ledger entries untuk test verify
-- community_demo_a: 3 entries (fakir, miskin, fisabilillah)
-- community_demo_b: 2 entries (gharim, ibnu_sabil)
-- Total 5 entries — untuk GET /api/ledger/verify?communityId=xxx -> valid true
-- ──────────────────────────────────────────────

-- Seed komunitas demo (idempotent — ON CONFLICT DO NOTHING)
INSERT INTO communities (id, slug, name, description, type, kelurahan, kecamatan_id, alamat, member_count)
VALUES
    ('community_demo_a', 'demo-a-masjid-al-ikhlas', 'Demo A — Masjid Al-Ikhlas', 'Komunitas demo A untuk test RLS isolasi — 3 ledger entries', 'masjid', 'Bintaro', '3171040', 'Jl. Demo A No. 1, Bintaro, Pesanggrahan', 50),
    ('community_demo_b', 'demo-b-masjid-an-nur', 'Demo B — Masjid An-Nur', 'Komunitas demo B untuk test RLS isolasi — 2 ledger entries', 'masjid', 'Petukangan Utara', '3171040', 'Jl. Demo B No. 2, Petukangan Utara, Pesanggrahan', 30)
ON CONFLICT (id) DO NOTHING;

-- Untuk seed ledger: nonaktifkan RLS sementara agar bisa insert tanpa SET app.community_id
-- Atau pakai role yang BYPASSRLS — di sini kita SET app.community_id = '' (bypass via policy OR NULL)
SELECT set_config('app.community_id', '', false);

-- Hapus seed lama jika ada (idempotent — untuk re-run)
DELETE FROM zis_distribution WHERE zis_collection_id IN (
    SELECT id FROM financial_ledger WHERE community_id IN ('community_demo_a', 'community_demo_b')
);
DELETE FROM financial_ledger WHERE community_id IN ('community_demo_a', 'community_demo_b');

-- Insert 5 ledger entries — trigger secure_ledger_hash() akan hitung hash_prev + hash_self otomatis
-- Kita kirim hash_prev/hash_self = 'pending' — trigger akan override
-- Urutan penting: trigger ambil hash_self dari baris terakhir ORDER BY id DESC

-- Community A — 3 entries
INSERT INTO financial_ledger (amount, description, recipient_id, actor_id, hash_prev, hash_self, community_id)
VALUES
    ('500000.00', 'ZIS fakir — beras 50kg untuk Pak Ahmad', 'mustahiq_fakir_001', 'amil_demo_a', 'pending', 'pending', 'community_demo_a'),
    ('750000.00', 'ZIS miskin — bantuan modal warung Bu Siti', 'mustahiq_miskin_001', 'amil_demo_a', 'pending', 'pending', 'community_demo_a'),
    ('1000000.00', 'ZIS fisabilillah — beasiswa santri TPQ Al-Ikhlas', 'mustahiq_fisabilillah_001', 'amil_demo_a', 'pending', 'pending', 'community_demo_a');

-- Community B — 2 entries
INSERT INTO financial_ledger (amount, description, recipient_id, actor_id, hash_prev, hash_self, community_id)
VALUES
    ('600000.00', 'ZIS gharim — pelunasan utang berobat Pak Budi', 'mustahiq_gharim_001', 'amil_demo_b', 'pending', 'pending', 'community_demo_b'),
    ('400000.00', 'ZIS ibnu_sabil — bekal musafir terlantar di terminal', 'mustahiq_ibnu_sabil_001', 'amil_demo_b', 'pending', 'pending', 'community_demo_b');

-- Insert zis_distribution untuk 5 entries (1 per ledger, 100% ke 1 asnaf)
-- Ambil id ledger yang baru di-insert
INSERT INTO zis_distribution (zis_collection_id, asnaf_category, percentage, allocated_amount, distributed_status)
SELECT id, 'fakir', 100.00, 500000.00, false FROM financial_ledger WHERE community_id = 'community_demo_a' AND recipient_id = 'mustahiq_fakir_001'
UNION ALL
SELECT id, 'miskin', 100.00, 750000.00, false FROM financial_ledger WHERE community_id = 'community_demo_a' AND recipient_id = 'mustahiq_miskin_001'
UNION ALL
SELECT id, 'fisabilillah', 100.00, 1000000.00, false FROM financial_ledger WHERE community_id = 'community_demo_a' AND recipient_id = 'mustahiq_fisabilillah_001'
UNION ALL
SELECT id, 'gharim', 100.00, 600000.00, false FROM financial_ledger WHERE community_id = 'community_demo_b' AND recipient_id = 'mustahiq_gharim_001'
UNION ALL
SELECT id, 'ibnu_sabil', 100.00, 400000.00, false FROM financial_ledger WHERE community_id = 'community_demo_b' AND recipient_id = 'mustahiq_ibnu_sabil_001';

-- Reset app.community_id
SELECT set_config('app.community_id', '', false);

-- ──────────────────────────────────────────────
-- 5. Verifikasi seed — RAISE NOTICE untuk cek manual
-- ──────────────────────────────────────────────
DO $$
DECLARE
    cnt_a INT;
    cnt_b INT;
    cnt_total INT;
    cnt_zis INT;
    r RECORD;
BEGIN
    SELECT COUNT(*)::int INTO cnt_a FROM financial_ledger WHERE community_id = 'community_demo_a';
    SELECT COUNT(*)::int INTO cnt_b FROM financial_ledger WHERE community_id = 'community_demo_b';
    SELECT COUNT(*)::int INTO cnt_total FROM financial_ledger WHERE community_id IN ('community_demo_a', 'community_demo_b');
    SELECT COUNT(*)::int INTO cnt_zis FROM zis_distribution WHERE zis_collection_id IN (SELECT id FROM financial_ledger WHERE community_id IN ('community_demo_a', 'community_demo_b'));

    RAISE NOTICE '=== Seed 004_demo_zis_rls ===';
    RAISE NOTICE 'community_demo_a: % ledger entries', cnt_a;
    RAISE NOTICE 'community_demo_b: % ledger entries', cnt_b;
    RAISE NOTICE 'Total demo: % ledger entries', cnt_total;
    RAISE NOTICE 'ZIS distribution: % rows', cnt_zis;
    RAISE NOTICE 'Expected: A=3, B=2, total=5, zis=5';

    -- Cek hash chain untuk demo
    FOR r IN SELECT id, hash_prev, hash_self, community_id FROM financial_ledger WHERE community_id IN ('community_demo_a', 'community_demo_b') ORDER BY id LOOP
        RAISE NOTICE 'Ledger id=% community=% hash_prev=%... hash_self=%...', r.id, r.community_id, substring(r.hash_prev, 1, 8), substring(r.hash_self, 1, 8);
    END LOOP;

    -- Cek RLS
    FOR r IN SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname IN ('financial_ledger', 'zis_distribution') LOOP
        RAISE NOTICE 'RLS % — enabled=%, forced=%', r.relname, r.relrowsecurity, r.relforcerowsecurity;
    END LOOP;

    -- Cek policy
    FOR r IN SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('financial_ledger', 'zis_distribution') LOOP
        RAISE NOTICE 'Policy % ON %', r.policyname, r.tablename;
    END LOOP;

    RAISE NOTICE '=== 004_demo_zis_rls selesai — test: curl GET /api/ledger/verify && curl GET /api/demo/rls-test ===';
END $$;

-- Refresh MatView jika ada (dari 003)
DO $$
BEGIN
    REFRESH MATERIALIZED VIEW mv_kas_total;
    RAISE NOTICE 'MatView mv_kas_total refreshed';
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'MatView mv_kas_total belum ada — skip';
END $$;

DO $$
BEGIN
    REFRESH MATERIALIZED VIEW mv_kas_summary;
    RAISE NOTICE 'MatView mv_kas_summary refreshed';
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'MatView mv_kas_summary belum ada — skip';
END $$;

VACUUM ANALYZE financial_ledger;
VACUUM ANALYZE zis_distribution;
