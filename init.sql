-- Gotong Royong Demo — init extensions
-- Dijalankan otomatis via /docker-entrypoint-initdb.d
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Contoh tabel audit hash chain (dipakai kas-service branch 03+)
-- Lihat docs/spec-backend-performa.md Bab 7 Fondasi #6 & Ringkasan Backend Bab 5
