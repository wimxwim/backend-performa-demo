-- =============================================================================
-- 003_scale_db_manual_concurrently.sql — Referensi manual untuk produksi
-- Untuk produksi: jalankan manual psql -c 'CREATE INDEX CONCURRENTLY ...' (tidak bisa via prisma migrate)
-- Alasan: CONCURRENTLY tidak bisa dalam transaction block, sedangkan prisma migrate deploy wrap transaction.
-- File ini berisi 32 CREATE INDEX CONCURRENTLY yang dihapus dari 003_scale_db.sql untuk demo lokal.
-- Jalankan satu per satu atau batch via psql (di luar transaction).
-- =============================================================================

-- UMKM: kelurahan, kecamatan, category (filter utama /api/umkm & /api/cari)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_umkm_kelurahan ON umkm (kelurahan);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_umkm_kecamatan ON umkm (kecamatan_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_umkm_category0 ON umkm (category0);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_umkm_zip ON umkm (zip_code);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_umkm_lat_lng ON umkm (lat, lng);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_umkm_kelurahan_category ON umkm (kelurahan, category0);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_umkm_created_id ON umkm (created_at, id);

-- Memberships: FK community_id + profile_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_memberships_community ON memberships (community_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_memberships_profile ON memberships (profile_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_memberships_community_profile ON memberships (community_id, profile_id);

-- Announcements: FK community_id + komposit pinned/created_at
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_announcements_community_pinned_created ON announcements (community_id, pinned, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_announcements_community ON announcements (community_id);

-- Financial ledger: FK community_id + donor/actor
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ledger_community_timestamp ON financial_ledger (community_id, timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ledger_actor ON financial_ledger (actor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ledger_recipient ON financial_ledger (recipient_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ledger_community_amount ON financial_ledger (community_id, amount);

-- ZIS distribution: FK zis_collection_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_zis_collection ON zis_distribution (zis_collection_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_zis_asnaf ON zis_distribution (asnaf_category);

-- Masjid: kelurahan + tipe
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_masjid_kelurahan ON masjid (kelurahan);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_masjid_tipe ON masjid (tipe);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_masjid_lat_lng ON masjid (lat, lng);

-- Communities: kelurahan + type + slug
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_communities_kelurahan ON communities (kelurahan);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_communities_type ON communities (type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_communities_slug ON communities (slug);

-- GIN pg_trgm untuk pencarian fuzzy LIKE '%keyword%'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_umkm_name_trgm ON umkm USING GIN (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_umkm_alamat_trgm ON umkm USING GIN (alamat gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_umkm_name_alamat_trgm ON umkm USING GIN ((name || ' ' || alamat) gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_masjid_name_trgm ON masjid USING GIN (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_masjid_alamat_trgm ON masjid USING GIN (alamat gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_communities_name_trgm ON communities USING GIN (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_announcements_title_trgm ON announcements USING GIN (title gin_trgm_ops);
