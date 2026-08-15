-- =============================================================================
-- Migration 001_init.sql — DDL inti Backend Performa Demo Gotong Royong
-- Sumber: Ringkasan Backend Bab 4 (6 Database) + Bab 2 (7 Fondasi) + spec lock
-- Tujuan: Buat extension + tabel UMKM/Masjid/Community + index B-Tree FK
-- Bahasa komentar: Indonesia (sesuai constraint)
-- =============================================================================

-- ──────────────────────────────────────────────
-- 1. Extension wajib (idempotent)
-- ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;            -- untuk digest() SHA-256 di ledger
CREATE EXTENSION IF NOT EXISTS pg_trgm;             -- untuk GIN trigram pencarian LIKE '%keyword%'
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;  -- untuk observabilitas query (Bab 8.1)

-- ──────────────────────────────────────────────
-- 2. Tabel communities — Fondasi #2 (Single Source of Truth)
-- Endpoint SLA: GET /api/komunitas/:id p50 <30ms (cache Redis TTL 10 menit)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS communities (
    id           TEXT PRIMARY KEY,
    slug         TEXT UNIQUE NOT NULL,
    name         TEXT NOT NULL,
    description  TEXT,
    type         TEXT NOT NULL DEFAULT 'masjid' CHECK (type IN ('masjid','musholla','rt','rw','kelurahan','ormas','karang_taruna','market','family','laz','bmt','koperasi','other')),
    kelurahan    TEXT NOT NULL,
    kecamatan_id TEXT NOT NULL DEFAULT '3171040',
    alamat       TEXT,
    logo_url     TEXT,
    member_count INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index B-Tree untuk filter & lookup cepat (checklist #3: semua FK harus punya index)
CREATE INDEX IF NOT EXISTS idx_communities_kelurahan ON communities (kelurahan);
CREATE INDEX IF NOT EXISTS idx_communities_type ON communities (type);
CREATE INDEX IF NOT EXISTS idx_communities_slug ON communities (slug);

-- ──────────────────────────────────────────────
-- 3. Tabel memberships — relasi komunitas ↔ profil
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS memberships (
    id           TEXT PRIMARY KEY,
    community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    profile_id   TEXT NOT NULL,
    role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin','admin_masjid','admin_market','admin_rw','bendahara','sekretaris','member','user')),
    joined_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (community_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_community ON memberships (community_id);
CREATE INDEX IF NOT EXISTS idx_memberships_profile ON memberships (profile_id);

-- ──────────────────────────────────────────────
-- 4. Tabel announcements — pengumuman komunitas
-- Index komposit untuk ORDER BY pinned DESC, created_at DESC LIMIT 20 (p50 <30ms)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
    id           TEXT PRIMARY KEY,
    community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    content      TEXT NOT NULL,
    pinned       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_announcements_community_pinned_created
    ON announcements (community_id, pinned, created_at DESC);

-- ──────────────────────────────────────────────
-- 5. Tabel UMKM — data real 6.081 baris dari CSV Pesanggrahan (23 kolom)
-- Distribusi real: Bintaro 31.7% (1931), Petukangan Utara 27.8% (1694),
--   Petukangan Selatan 17.3% (1054), Ulujami 13.5% (821), Pesanggrahan 9.4% (577)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS umkm (
    id            TEXT PRIMARY KEY,
    data_id       TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL,
    lat           DOUBLE PRECISION NOT NULL,
    lng           DOUBLE PRECISION NOT NULL,
    alamat        TEXT NOT NULL,
    telepon       TEXT,
    provinsi_id   TEXT NOT NULL DEFAULT '31',
    kabupaten_id  TEXT NOT NULL DEFAULT '3171',
    kecamatan_id  TEXT NOT NULL,
    desa_id       TEXT,
    kelurahan     TEXT NOT NULL,
    zip_code      TEXT NOT NULL,
    zip_code_chk  TEXT,
    image         TEXT,
    category0     TEXT NOT NULL,
    category1     TEXT,
    product       TEXT,
    line          INTEGER,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index B-Tree untuk filter kelurahan/kategori (endpoint /api/cari & /api/umkm)
CREATE INDEX IF NOT EXISTS idx_umkm_kelurahan ON umkm (kelurahan);
CREATE INDEX IF NOT EXISTS idx_umkm_kecamatan ON umkm (kecamatan_id);
CREATE INDEX IF NOT EXISTS idx_umkm_category0 ON umkm (category0);
CREATE INDEX IF NOT EXISTS idx_umkm_category1 ON umkm (category1);
CREATE INDEX IF NOT EXISTS idx_umkm_zip ON umkm (zip_code);
CREATE INDEX IF NOT EXISTS idx_umkm_lat_lng ON umkm (lat, lng);

-- GIN trigram untuk pencarian LIKE '%keyword%' (Bab 3.2 — 50.000x lebih cepat dari Seq Scan)
CREATE INDEX IF NOT EXISTS idx_umkm_name_trgm ON umkm USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_umkm_alamat_trgm ON umkm USING GIN (alamat gin_trgm_ops);

-- ──────────────────────────────────────────────
-- 6. Tabel Masjid — data real 256 baris dari CSV Masjid (15 kolom efektif)
-- Kolom: No, name, Tipe (MASJID/MUSHOLLA), Kelurahan, Kode Pos, dataLat, dataLng, alamat
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS masjid (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    tipe       TEXT CHECK (tipe IN ('MASJID','MUSHOLLA')),
    kelurahan  TEXT NOT NULL,
    kode_pos   TEXT,
    lat        DOUBLE PRECISION NOT NULL,
    lng        DOUBLE PRECISION NOT NULL,
    alamat     TEXT NOT NULL,
    pic        TEXT,
    kas_masjid TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_masjid_kelurahan ON masjid (kelurahan);
CREATE INDEX IF NOT EXISTS idx_masjid_tipe ON masjid (tipe);
CREATE INDEX IF NOT EXISTS idx_masjid_lat_lng ON masjid (lat, lng);

-- GIN trigram untuk pencarian masjid terdekat + keyword
CREATE INDEX IF NOT EXISTS idx_masjid_name_trgm ON masjid USING GIN (name gin_trgm_ops);

-- ──────────────────────────────────────────────
-- 7. Tabel audit_log — Fondasi #6 (non-financial audit trail)
-- Mencatat create/update/delete/access dengan old_data/new_data JSONB
-- Hash chain SHA-256 hanya untuk financial_ledger (lihat 002_ledger_hash_chain.sql)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
    id         BIGSERIAL PRIMARY KEY,
    actor_id   VARCHAR(255) NOT NULL,
    action     VARCHAR(50) NOT NULL CHECK (action IN ('create','update','delete','access')),
    entity     VARCHAR(100) NOT NULL,
    entity_id  VARCHAR(255) NOT NULL,
    old_data   JSONB,
    new_data   JSONB,
    ip_address VARCHAR(45),
    timestamp  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log (entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log (timestamp DESC);

-- ──────────────────────────────────────────────
-- 8. Komentar untuk dokumentasi
-- ──────────────────────────────────────────────
COMMENT ON TABLE umkm IS 'UMKM Pesanggrahan 6.081 baris — CSV 23 kolom, distribusi Bintaro 31.7%';
COMMENT ON TABLE masjid IS 'Masjid Pesanggrahan 256 baris — CSV 15 kolom, tipe MASJID/MUSHOLLA';
COMMENT ON TABLE communities IS 'Fondasi #2 — Single Source of Truth komunitas';
COMMENT ON INDEX idx_umkm_name_trgm IS 'pg_trgm GIN untuk pencarian UMKM LIKE %keyword% — ganti Seq Scan';
