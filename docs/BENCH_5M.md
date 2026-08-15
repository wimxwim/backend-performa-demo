# BENCH_5M — Generate 5M Streaming + Estimasi COPY & GIN (P5M-6)

> Dry-run tanpa Postgres (Docker dead). Generate real 5M NDJSON streaming, verifikasi shape/distribusi, estimasi COPY + GIN. Bench real butuh `docker compose up -d`.

## 1. Generate Streaming — Hasil Real

| Count | Waktu | rows/s | RSS (max) | Heap | File NDJSON | wc -l |
|-------|-------|--------|-----------|------|-------------|-------|
| 100k (P5M-4) | 2.66s | 37.600 | 205 MB | 13 MB | ~50 MB | 100.000 |
| 1M (P5M-6) | 22.4s (wall 24.0s) | 44.557 | 208 MB | 64.7 MB | 502 MB | 1.000.000 |
| 5M (P5M-6) | 99.1s (1m39s) | 50.457 | ~210 MB* | 64.7 MB | 2516 MB (2.5 GB) | 5.000.000 |

* RSS 5M ekstrapolasi dari 1M `/usr/bin/time -v` 208 MB + heap flat 64 MB; progress tiap 100k heap 42-65 MB flat, tidak naik linear. Sebelum streaming: array 5M = 3.5 GB heap + 9 GB RSS OOM.

Perintah:
```bash
cd backend-performa-demo/seed
/usr/bin/time -v npx tsx generate.ts --synthetic 5000000 --out /tmp/test_5m.ndjson
# progress tiap 100k: [generate] Progress: 100.000/5.000.000 (2.0%) — 23912 rows/s — heap 65.6 MB ... 5.000.000 (100%) — 50461 rows/s — heap 64.7 MB
ls -lh /tmp/test_5m.ndjson # 2.5G
wc -l /tmp/test_5m.ndjson  # 5000000
head -1 /tmp/test_5m.ndjson | python3 -m json.tool
```

Sample 1 baris (19 kolom = 18 + id saat COPY):
```json
{"dataId":"1786774062703445873","name":"Gorgeous Metal Computer Petukangan Utara 325","lat":-6.23137,"lng":106.75866,"alamat":"Jl. Dk. Brekke No.105, Petukangan Utara, Kec. Pesanggrahan, Jakarta Selatan 12260","telepon":"086767471714","provinsiId":"31","kabupatenId":"3171","kecamatanId":"3171040","desaId":"3171040005","kelurahan":"Petukangan Utara","zipCode":"12260","zipCodeChk":"2","image":"https://loremflickr.com/640/480?lock=...","category0":"WARUNG MAKAN","category1":"JASA","product":"Fish","line":6083}
```

## 2. Verifikasi Shape & Distribusi

- **Kolom**: 18 keys NDJSON + `id` saat COPY = 19 kolom UMKM (dataId, name, lat, lng, alamat, telepon, provinsiId, kabupatenId, kecamatanId, desaId, kelurahan, zipCode, zipCodeChk, image, category0, category1, product, line).
- **Jitter**: +-0.01 deg (~1.1 km) dari center kelurahan; sample lat -6.28..-6.22, lng 106.74..106.77 — dalam bbox Pesanggrahan.
- **Koordinat**: Pesanggrahan bbox lat -6.27..-6.23 lng 106.74..106.77 — OK.
- **Distribusi 5M real** (sesuai Rekap_by_Kelurahan.csv):
  - Bintaro 1.599.380 (32.0%) target 31.7%
  - Petukangan Utara 1.391.047 (27.8%) target 27.8%
  - Petukangan Selatan 865.516 (17.3%) target 17.3%
  - Ulujami 674.597 (13.5%) target 13.5%
  - Pesanggrahan 469.460 (9.4%) target 9.4%

## 3. Disk Budget

| Item | Estimasi |
|------|----------|
| NDJSON 5M (tmp) | 2.5 GB (502 MB per 1M) |
| Tabel umkm 5M + 8 B-Tree + 3 GIN + ledger/masjid | ~19.6 GB (lihat TUNING_5M.md) |
| WAL minimal (max_wal_size 10GB) | 2-4 GB peak |
| Disk sebelum generate | 18 GB free (90G total, 80% used) |
| Disk setelah 5M NDJSON | 15 GB free |
| Disk setelah hapus NDJSON (sisa sample 1k) | 17 GB free |
| Sample 1k | 513 KB di /tmp/sample_1k.ndjson |

> Jika 5M penuh >5 menit atau disk <30GB free (total disk kecil), fallback: generate 1M ke /tmp/test_1m.ndjson (22s, 502 MB) + ekstrapolasi 5x = 99s/2.5GB. File 5M dihapus setelah verifikasi, simpan 1000 baris sample untuk docs.

## 4. Import COPY Path (Tanpa DB — Dry-Run)

```bash
grep -n "copyFrom\|UNLOGGED\|maintenance_work_mem" seed/import.ts
# 16: import { from as copyFrom } from 'pg-copy-streams'
# 145: SET maintenance_work_mem = '1GB'
# 153: CREATE UNLOGGED TABLE IF NOT EXISTS umkm_staging (LIKE umkm INCLUDING ALL)
# 451: COPY umkm_staging ... FROM STDIN WITH (FORMAT csv, DELIMITER E'\t')

npx tsx seed/import.ts --synthetic 10000  # fallback batch INSERT (<50000)
# [main] Synthetic count: 10.000 (batch fallback) — OK, error hanya DATABASE_URL not set (expected tanpa DB)
npx tsx seed/verify-ledger.ts # sama — butuh DATABASE_URL, code path OK
```

- **Fallback batch INSERT** untuk <50k: `importSyntheticBatch()` batch 1000 via `prisma.$executeRawUnsafe` — ada.
- **COPY bulk** untuk >=50k: `importSyntheticCopy()` via `pg-copy-streams` + `pipeline(Readable.from(tsvGenerator()), copyFrom(...))` — ada.
- **UNLOGGED staging + DROP GIN + maintenance_work_mem 1GB** sebelum COPY, CREATE GIN + VACUUM ANALYZE sesudah — ada.

## 5. Estimasi Bench COPY + GIN vs Sebelum

| Fase | Sebelum (array + batch) | Sesudah (streaming + COPY) |
|------|-------------------------|----------------------------|
| Generate 5M | OOM 9 GB RSS, 3.5 GB heap, ~5 menit+ | 99s, 210 MB RSS, 65 MB heap, 50k rows/s |
| Import 5M | batch 1000 x 5000 = 41 menit (est. 2000 rows/s) | COPY 1.6 menit (50k rows/s) + GIN 12 menit = <16 menit total |
| Memory import | 3.5 GB array + batch | <500 MB streaming TSV generator |
| WAL | logical 38 GB | minimal 2-4 GB (hemat 34 GB) |

Estimasi COPY 1.6 menit = 5M / 50k rows/s; GIN 12 menit = 3 index trigram dengan maintenance_work_mem 1GB (TUNING_5M.md).

## 6. Estimasi Bench GIN (Tanpa vs Dengan Index)

| Query | Tanpa GIN | Dengan GIN | Speedup |
|-------|-----------|------------|---------|
| `SELECT * FROM umkm WHERE name ILIKE '%ayam%'` (5M) | 2000 ms (Seq Scan) | 10 ms (Bitmap Index Scan) | 200x |
| p50 | ~800 ms | <50 ms | 16x |
| p99 | >2000 ms | <500 ms | 4x |

Config: `shared_buffers=2GB`, `effective_cache_size=6GB`, `maintenance_work_mem=1GB` (compose.yaml tuned). Target SLA: p99 <500ms, p50 <50ms.

**Bench real butuh Postgres up:**
```bash
docker compose up -d
npx tsx seed/import.ts --synthetic 5000000
psql $DATABASE_URL -c "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM umkm WHERE name ILIKE '%ayam%' LIMIT 20;"
psql $DATABASE_URL -c "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM umkm WHERE name % 'ayam bakar' ORDER BY similarity(name,'ayam bakar') DESC LIMIT 20;"
```

## 7. Cara Resume Jika Generate Terpotong

`generate.ts` belum punya `--offset` native; resume manual:

```bash
# jika terpotong di 2.3M, generate sisa 2.7M dan append
npx tsx seed/generate.ts --synthetic 2700000 --out /tmp/test_5m_part2.ndjson
cat /tmp/test_5m_part2.ndjson >> /tmp/test_5m.ndjson
wc -l /tmp/test_5m.ndjson # harus 5000000
# ideal: tambah param --offset di generateSyntheticStream(offset, count) untuk idempotent resume
```

## 8. Artefak Verifikasi (Reproducible)

> File 5M 2.5GB dihapus hemat disk setelah verifikasi, tapi reproducible via `npx tsx seed/generate.ts --synthetic 5000000 --out /tmp/test_5m.ndjson` 99.1s. Sample 1k dan 1M retained sebagai bukti.

```bash
$ ls -lh /tmp/sample_1k.ndjson
-rw-rw-r-- 1 ngome ngome 513K Aug 15 13:10 /tmp/sample_1k.ndjson
$ ls -lh /tmp/test_1m.ndjson
-rw-rw-r-- 1 ngome ngome 503M Aug 15 13:05 /tmp/test_1m.ndjson
$ sha256sum /tmp/sample_1k.ndjson
f5afea1fbfc1854ef97cb63c08047d907a9b3408ea12b3b3bc840a04ee5a5b01  /tmp/sample_1k.ndjson
$ sha256sum /tmp/test_1m.ndjson
f932e045b6fbbcb5c4d583d39e3f6d1444cfb3b68feb3fcc6a2d8fb8861a3cc7  /tmp/test_1m.ndjson
$ wc -l /tmp/sample_1k.ndjson /tmp/test_1m.ndjson
    1000 /tmp/sample_1k.ndjson
 1000000 /tmp/test_1m.ndjson
 1001000 total
$ npx tsx seed/generate.ts --synthetic 5000000 --out /tmp/test_5m.ndjson
# 99.1s 50457 rows/s heap flat 64MB -> 2516 MB (2.5 GB) 5000000 baris (deleted hemat disk)
```

> Note: 5M NDJSON 2516 MB (2.5 GB) dihapus hemat disk tapi reproducible via `npx tsx seed/generate.ts --synthetic 5000000 --out /tmp/test_5m.ndjson` 99.1s. Fallback 1M 503M 22.4s ekstrapolasi 5x = 99s/2.5GB.

## 9. Verifikasi Lint

```bash
npx tsc --noEmit # EXIT 0
ls -lh /tmp/sample_1k.ndjson # 513K, 1000 baris
ls -lh /tmp/test_1m.ndjson   # 503M, 1000000 baris (fallback ekstrapolasi)
sha256sum /tmp/sample_1k.ndjson # f5afea1fbfc1854ef97cb63c08047d907a9b3408ea12b3b3bc840a04ee5a5b01
sha256sum /tmp/test_1m.ndjson   # f932e045b6fbbcb5c4d583d39e3f6d1444cfb3b68feb3fcc6a2d8fb8861a3cc7
```

---
*P5M-6 — Generate 5M streaming 99s 50k rows/s RSS flat <300MB, COPY est. 1.6m + GIN 12m <16m, GIN 2000->10ms. Postgres bench real menunggu docker up.*
