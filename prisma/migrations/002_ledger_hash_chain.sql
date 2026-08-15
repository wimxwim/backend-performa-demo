-- =============================================================================
-- Migration 002_ledger_hash_chain.sql — SHA-256 Hash Chain untuk Audit Keuangan
-- Sumber EXACT: Ringkasan_Komprehensif_Backend_GotongRoyong.md Bab 5 (Blockchain & Audit Trail)
-- Jangan ubah trigger — ini adalah spec lock Triple-Entry Accounting (hash chain di Postgres)
-- Bahasa komentar: Indonesia
-- =============================================================================

-- ──────────────────────────────────────────────
-- 1. Tabel financial_ledger — jantung audit keuangan transparan
-- Spec exact dari Bab 5:
--   id BIGSERIAL, timestamp TIMESTAMPTZ, amount NUMERIC(15,2), description TEXT,
--   recipient_id VARCHAR(255), actor_id VARCHAR(255), hash_prev VARCHAR(64), hash_self VARCHAR(64)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_ledger (
    id           BIGSERIAL PRIMARY KEY,
    timestamp    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    amount       NUMERIC(15, 2) NOT NULL,
    description  TEXT NOT NULL,
    recipient_id VARCHAR(255) NOT NULL,
    actor_id     VARCHAR(255) NOT NULL,
    hash_prev    VARCHAR(64) NOT NULL,
    hash_self    VARCHAR(64) NOT NULL,
    community_id TEXT REFERENCES communities(id) ON DELETE SET NULL
);

-- Index untuk laporan kas per komunitas + audit per aktor/penerima
CREATE INDEX IF NOT EXISTS idx_ledger_community_timestamp
    ON financial_ledger (community_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_actor ON financial_ledger (actor_id);
CREATE INDEX IF NOT EXISTS idx_ledger_recipient ON financial_ledger (recipient_id);

COMMENT ON TABLE financial_ledger IS 'Ledger keuangan hash chain SHA-256 — trigger secure_ledger_hash() hitung hash_prev+hash_self otomatis';
COMMENT ON COLUMN financial_ledger.hash_prev IS 'Hash dari baris sebelumnya (genesis = 64 nol)';
COMMENT ON COLUMN financial_ledger.hash_self IS 'SHA256(amount|description|recipient_id|actor_id|hash_prev) — dihitung trigger';

-- ──────────────────────────────────────────────
-- 2. Tabel zis_distribution — distribusi ZIS ke 8 Asnaf (Bab 6.2)
-- 8 asnaf: fakir, miskin, amil, mualaf, riqab, gharim, fisabilillah, ibnu_sabil
-- FK ke financial_ledger(id) — satu collection dibagi ke banyak asnaf
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS zis_distribution (
    id                 BIGSERIAL PRIMARY KEY,
    zis_collection_id  BIGINT NOT NULL REFERENCES financial_ledger(id) ON DELETE CASCADE,
    asnaf_category     VARCHAR(50) NOT NULL CHECK (asnaf_category IN ('fakir','miskin','amil','mualaf','riqab','gharim','fisabilillah','ibnu_sabil')),
    percentage         NUMERIC(5, 2) NOT NULL,
    allocated_amount   NUMERIC(15, 2) NOT NULL,
    distributed_status BOOLEAN NOT NULL DEFAULT FALSE,
    distributed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_zis_collection ON zis_distribution (zis_collection_id);
CREATE INDEX IF NOT EXISTS idx_zis_asnaf ON zis_distribution (asnaf_category);

COMMENT ON TABLE zis_distribution IS 'Distribusi ZIS ke 8 asnaf — percentage + allocated_amount per kategori';

-- ──────────────────────────────────────────────
-- 3. Trigger PL/pgSQL EXACT dari Ringkasan Backend Bab 5
-- JANGAN UBAH — ini adalah spec lock yang diverifikasi via cat di VERIFICATION
-- Fungsi: secure_ledger_hash() BEFORE INSERT — hitung hash_prev + hash_self otomatis
-- Formula: hash_self = encode(digest(amount|description|recipient_id|actor_id|hash_prev, 'sha256'), 'hex')
-- Genesis: jika belum ada baris, hash_prev = '0000...0000' (64 karakter nol)
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION secure_ledger_hash()
RETURNS TRIGGER AS $$
DECLARE
    prev_hash VARCHAR(64);
    raw_data_string TEXT;
BEGIN
    -- 1. Ambil hash_self dari baris transaksi terakhir
    SELECT hash_self INTO prev_hash
    FROM financial_ledger
    ORDER BY id DESC LIMIT 1;

    -- Jika ini baris pertama (genesis)
    IF prev_hash IS NULL THEN
        prev_hash := '0000000000000000000000000000000000000000000000000000000000000000';
    END IF;

    NEW.hash_prev := prev_hash;

    -- 2. Gabungkan data transaksi saat ini menjadi string untuk di-hash
    raw_data_string := NEW.amount::text || '|' || NEW.description || '|' || NEW.recipient_id || '|' || NEW.actor_id || '|' || NEW.hash_prev;

    -- 3. Hitung SHA-256 menggunakan modul pgcrypto di PostgreSQL
    NEW.hash_self := encode(digest(raw_data_string, 'sha256'), 'hex');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Pasang trigger pada tabel — BEFORE INSERT, tiap baris
DROP TRIGGER IF EXISTS trg_secure_financial_ledger ON financial_ledger;
CREATE TRIGGER trg_secure_financial_ledger
BEFORE INSERT ON financial_ledger
FOR EACH ROW
EXECUTE FUNCTION secure_ledger_hash();

COMMENT ON FUNCTION secure_ledger_hash() IS 'Trigger hash chain SHA-256 — Bab 5 Ringkasan Backend (exact copy, jangan ubah)';
