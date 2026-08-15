-- cdc/clickhouse-schema.sql — ClickHouse OLAP untuk ledger_analytics
-- Bahasa komentar: Indonesia
-- Sumber: Spec 6 DB (ClickHouse agregasi miliaran baris), Modul Performa Bab 6 + 9 (Fase 3+)
-- Jalankan: curl -X POST http://localhost:8123 --data-binary @clickhouse-schema.sql

-- ──────────────────────────────────────────────
-- Database
-- ──────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS gotongroyong;

-- ──────────────────────────────────────────────
-- Tabel utama — MergeTree ORDER BY (community_id, created_at)
-- Anti dual-write: hanya diisi via Kafka consumer (CDC), bukan dari aplikasi langsung.
-- Idempotent: pakai ReplacingMergeTree agar duplikat Kafka redelivery ter-replace.
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gotongroyong.ledger_analytics
(
    id           String,
    community_id String,
    amount       Decimal(15, 2),
    description  String,
    hash_self    String,
    created_at   DateTime
)
ENGINE = ReplacingMergeTree(created_at)
ORDER BY (community_id, created_at)
PARTITION BY toYYYYMM(created_at)
SETTINGS index_granularity = 8192;

-- ──────────────────────────────────────────────
-- Materialized View — agregasi harian per komunitas
-- SUM(amount) per community_id per hari — untuk dashboard OKR / laporan bulanan
-- Query: SELECT * FROM mv_ledger_daily WHERE community_id = 'xxx' ORDER BY day
-- ──────────────────────────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS gotongroyong.mv_ledger_daily
ENGINE = SummingMergeTree
ORDER BY (community_id, day)
POPULATE
AS SELECT
    community_id,
    toDate(created_at) AS day,
    count()            AS txn_count,
    sum(amount)        AS total_amount
FROM gotongroyong.ledger_analytics
GROUP BY community_id, day;

-- ──────────────────────────────────────────────
-- View helper — agregasi bulanan (dipakai API /api/kas ringkasan)
-- SELECT community_id, toYYYYMM(day) AS bulan, sum(total_amount) FROM mv_ledger_daily GROUP BY community_id, bulan
-- ──────────────────────────────────────────────
CREATE VIEW IF NOT EXISTS gotongroyong.v_ledger_monthly AS
SELECT
    community_id,
    toYYYYMM(day) AS bulan,
    sum(txn_count)    AS total_txn,
    sum(total_amount) AS total_amount
FROM gotongroyong.mv_ledger_daily
GROUP BY community_id, bulan;

-- ──────────────────────────────────────────────
-- Contoh query analitik — miliaran baris tetap cepat (columnar)
-- ──────────────────────────────────────────────
-- 1. Total donasi per komunitas (hari ini)
-- SELECT community_id, total_amount FROM gotongroyong.mv_ledger_daily WHERE day = today();
-- 2. Tren bulanan
-- SELECT * FROM gotongroyong.v_ledger_monthly WHERE community_id = 'masjid_01' ORDER BY bulan;
-- 3. Top komunitas by total
-- SELECT community_id, sum(total_amount) AS total FROM gotongroyong.mv_ledger_daily GROUP BY community_id ORDER BY total DESC LIMIT 10;
