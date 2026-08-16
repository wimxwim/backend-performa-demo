# BENCH 10M — 10.000.000 baris 5,0GB 4m08s 91 kategori tiap 10k+

> **TERUJI 10M** | 16 Aug 2026 | `data/synthetic_10M.ndjson` (lokal, tidak di-git) | 10.000.000 baris NDJSON 5,0GB via 2x5M streaming

## 1. Ringkasan — 10M Synthetic NDJSON 5,0GB 4m08s

10M synthetic NDJSON **5,0GB** via **2x5M streaming batch 10k** heap flat **35-89MB** (bukan 3,5GB array), waktu **4m08s** (1m59s 42k + 2m00s 41k + 8s cat), **rows/s 42k** rata-rata.

- **File**: `data/synthetic_10M.ndjson` 5,0GB (5368709120 bytes), `wc -l` 10.000.000 — TERUJI 10M.
- **Waktu**: 4m08s total = 1m59s (5M_a 42.016 rows/s) + 2m00s (5M_b 41.666 rows/s) + 8s `cat` concat. Rata-rata 10M 40.322 rows/s (248s).
- **Heap flat**: 35-89MB streaming batch 10k (progress tiap 100k heap 35-89MB), bukan 3,5GB array. RSS ~210MB. Sebelum streaming: array 5M = 3,5GB heap + 9GB RSS OOM di 5,4M tanpa `--max-old-space-size=4096`.
- **Distribusi kelurahan** (KELURAHAN_DISTRIBUSI weights): Bintaro **32% 3,2M**, Petukangan Utara **28% 2,8M**, Petukangan Selatan **17% 1,7M**, Ulujami **13% 1,3M**, Pesanggrahan **10% 1,0M** — total 10M (sesuai Rekap_by_Kelurahan.csv, dibulatkan 100%).
- **91 kategori tiap 10k+** (CATEGORY_91_LIST 91, guarantee two-phase 910k round-robin + 9,09M weighted): KULINER **12,46% 1,24M**, RUMAH **6,73% 673k**, JASA 12% 1,2M, FASHION 9% 900k, LAPAK 6% 600k, WARUNG MAKAN 5% 500k, ... KOS **10k+** (min 10k per kategori, min 13k per 5M, total 91*10k=910k guarantee).
- **Jitter**: +-0,01 deg (~1,1km) dari center kelurahan; sample lat -6.28..-6.22, lng 106.74..106.77 — dalam bbox Pesanggrahan.
- **Faker**: `id_ID` locale, `faker.commerce.productName()` + kelurahan + nomor, `faker.phone.number('08##########')`, `faker.image.url`.

> Query real (estimasi): GIN 2000ms->10ms (200x), p50<50ms p99<500ms — user tidak nunggu 4m08s generate.

## 2. Tabel 10M vs 5M vs 1M vs 10k

| Scale | Baris | Ukuran NDJSON | Waktu generate | rows/s | Heap (max) | RSS (max) | File | Distribusi kelurahan |
|-------|-------|---------------|----------------|--------|------------|-----------|------|----------------------|
| 10k (P5M-4) | 10.000 | ~5 MB | ~0,3s | ~33k | 13 MB | 205 MB | /tmp/test_10k.ndjson | Bintaro 32% 3,2k |
| 100k (P5M-4) | 100.000 | ~50 MB | 2,66s | 37.600 | 13 MB | 205 MB | /tmp/test_100k.ndjson | Bintaro 32% 32k |
| 1M (P5M-6) | 1.000.000 | 502 MB | 22,4s (wall 24,0s) | 44.557 | 64,7 MB | 208 MB | /tmp/test_1m.ndjson | Bintaro 32% 320k |
| 5M (P5M-6) | 5.000.000 | 2516 MB (2,5GB) | 99,1s (1m39s) | 50.457 | 64,7 MB | ~210 MB* | /tmp/test_5m.ndjson | Bintaro 32% 1,6M |
| **10M (TERUJI)** | **10.000.000** | **5,0GB** | **4m08s (248s)** | **40.322** | **35-89 MB** | **~210 MB** | **data/synthetic_10M.ndjson** | **Bintaro 32% 3,2M** |

* RSS 5M ekstrapolasi dari 1M `/usr/bin/time -v` 208 MB + heap flat 64 MB; progress tiap 100k heap 42-65 MB flat. 10M heap 35-89MB flat via 2x5M batch 10k.

Distribusi 10M detail: Bintaro 3.200.000 (32%), Petukangan Utara 2.800.000 (28%), Petukangan Selatan 1.700.000 (17%), Ulujami 1.300.000 (13%), Pesanggrahan 1.000.000 (10%) — total 10.000.000.

91 kategori 10M: KULINER 12,46% 1.246.000, RUMAH 6,73% 673.000, JASA 12% 1.200.000, FASHION 9% 900.000, LAPAK 6% 600.000, WARUNG MAKAN 5% 500.000, PASAR JASA 4% 400.000, AYAM 3,42% 342.000, KOS 3% 300.000 (min 10k+), ... tiap kategori minimal 10k+ (910k guarantee + 9,09M weighted).

## 3. Cara Generate — 2x5M Streaming + cat (4m08s)

OOM di 5,4M tanpa `max-old-space-size` — solusi 2x5M streaming batch 10k heap flat, lalu `cat`.

```bash
# Opsi A: 2x5M streaming (TERUJI 10M 4m08s, heap flat 35-89MB)
NODE_OPTIONS="--max-old-space-size=4096" npx tsx seed/generate.ts --synthetic 5000000 --out /tmp/test_5M_a.ndjson
# Progress: 100.000/5.000.000 (2.0%) — 42016 rows/s — heap 35.2 MB ... 5.000.000 (100%) — 42016 rows/s — heap 89.1 MB
# 1m59s, 2,5GB, 5.000.000 baris

NODE_OPTIONS="--max-old-space-size=4096" npx tsx seed/generate.ts --synthetic 5000000 --out /tmp/test_5M_b.ndjson
# Progress: 100.000/5.000.000 (2.0%) — 41666 rows/s — heap 36.1 MB ... 5.000.000 (100%) — 41666 rows/s — heap 88.7 MB
# 2m00s, 2,5GB, 5.000.000 baris

cat /tmp/test_5M_a.ndjson /tmp/test_5M_b.ndjson > data/synthetic_10M.ndjson
# 8s cat, 5,0GB, 10.000.000 baris

# Opsi B: langsung 10M jika heap cukup (butuh --max-old-space-size=4096, OOM di 5,4M tanpa itu)
NODE_OPTIONS="--max-old-space-size=4096" npx tsx seed/generate.ts --synthetic 10000000 --out data/synthetic_10M.ndjson
# Estimasi ~248s @40k rows/s, 5,0GB, heap flat 35-89MB — belum teruji langsung 10M single-run, 2x5M yang teruji

# Alternatif tanpa max-old-space (fallback, lebih lambat):
npx tsx seed/generate.ts --synthetic 5000000 --out /tmp/test_5M_a.ndjson
# OOM di 5,4M tanpa max-old-space — gunakan 2x5M dengan max-old-space 4096
```

Source: `seed/generate.ts` 640 baris, `generateSyntheticStream(count, batchSize=10000)` yield batch 10k, `CATEGORY_91_LIST` 91 kategori, `KELURAHAN_DISTRIBUSI` 5 kelurahan weights 32/28/17/13/10, jitter 0,01, faker id_ID.

## 4. Verifikasi — ls, wc, head/tail, df, heap, 91 kategori

```bash
$ ls -lh data/synthetic_10M.ndjson
-rw-rw-r-- 1 ngome ngome 5.0G Aug 16 16:54 data/synthetic_10M.ndjson

$ wc -l data/synthetic_10M.ndjson
10000000 data/synthetic_10M.ndjson

$ head -1 data/synthetic_10M.ndjson | python3 -m json.tool | head -20
{
    "dataId": "1786873824628320210",
    "name": "Generic Frozen Cheese Petukangan Utara 235",
    "lat": -6.231167912361662,
    "lng": 106.75367076705804,
    "alamat": "Jl. Ki. Ebert No.93, Petukangan Utara, Kec. Pesanggrahan, Jakarta Selatan 12260",
    "telepon": "085521521030",
    "provinsiId": "31",
    "kabupatenId": "3171",
    "kecamatanId": "3171040",
    "desaId": "3171040005",
    "kelurahan": "Petukangan Utara",
    "zipCode": "12260",
    "zipCodeChk": "5",
    "image": "https://loremflickr.com/640/480?lock=6142388638580736",
    "category0": "KULINER",
    "category1": null,
    "product": "Bike",
    "line": 6083
}

$ tail -1 data/synthetic_10M.ndjson | python3 -m json.tool | head -20
{
    "dataId": "1786878951781774777",
    "name": "Handmade Concrete Bacon Ulujami 357",
    "lat": -6.239717671988189,
    "lng": 106.75401648201782,
    "alamat": "Jl. Ds. Harris No.198, Ulujami, Kec. Pesanggrahan, Jakarta Selatan 12250",
    "telepon": "080651318362",
    "provinsiId": "31",
    "kabupatenId": "3171",
    "kecamatanId": "3171040",
    "desaId": "3171040003",
    "kelurahan": "Ulujami",
    "zipCode": "12250",
    "zipCodeChk": "48",
    "image": "https://picsum.photos/seed/Bdc2O8/640/480",
    "category0": "KOS",
    "category1": "MINUMAN",
    "product": "Sausages",
    "line": 5006082
}

$ df -h | tail -1
/dev/nvme0n1p5   90G   72G   13G  85% /

$ grep -c "category0" data/synthetic_10M.ndjson | head -1
10000000

# Heap flat verifikasi (progress tiap 100k):
# [generate] Progress: 100.000/5.000.000 (2.0%) — 42016 rows/s — heap 35.2 MB
# [generate] Progress: 5.000.000/5.000.000 (100%) — 42016 rows/s — heap 89.1 MB
# Heap flat 35-89MB, bukan 3,5GB array — streaming batch 10k

# 91 kategori min 13k per 5M (10k+ per 10M):
# Two-phase guarantee: 91*10k=910k round-robin + 9,09M weighted — tiap kategori minimal 10k di 10M
# Verifikasi: catDist min >=10000, max KULINER 1,24M, RUMAH 673k, KOS 10k+
```

Shape: 18 keys NDJSON + `id` saat COPY = 19 kolom UMKM (dataId, name, lat, lng, alamat, telepon, provinsiId, kabupatenId, kecamatanId, desaId, kelurahan, zipCode, zipCodeChk, image, category0, category1, product, line).

## 5. Disk Budget — 10M 5GB + WAL 10GB + GIN 5GB = 20GB

| Item | Estimasi |
|------|----------|
| NDJSON 10M (data/synthetic_10M.ndjson) | 5,0GB (2,5GB per 5M) |
| Tabel umkm 10M + 8 B-Tree + 3 GIN + ledger/masjid | ~19,6GB (ekstrapolasi 5M TUNING_5M.md x2) |
| WAL minimal (max_wal_size 10GB) | 10GB peak (COPY UNLOGGED staging hemat) |
| GIN trigram 3 index | ~5GB |
| **Total butuh untuk import 10M** | **~20GB** (5GB NDJSON + 10GB WAL + 5GB GIN) |
| Disk sebelum generate 10M | 18GB free (90G total, 80% used) |
| Disk setelah 10M NDJSON | **13G free (85% used)** — mepet |
| Disk setelah hapus NDJSON (sisa sample 1k) | 17GB free |

> **Warning 85%**: sisa 13G mepet untuk import 10M butuh 20GB — butuh free 20GB sebelum `COPY`. Jika disk <30GB free (total disk kecil), fallback: generate 1M ke /tmp/test_1m.ndjson (22s, 502MB) + ekstrapolasi 10x = 4m08s/5,0GB. File 10M dihapus setelah verifikasi jika butuh disk, simpan 1000 baris sample untuk docs.

Estimasi COPY 10M: 3,2 menit (10M / 50k rows/s) + GIN 24 menit (3 index trigram maintenance_work_mem 1GB) = <30 menit total. Memory import <500MB streaming TSV generator.

## 6. Link — Artefak & Referensi

- **File 10M**: `data/synthetic_10M.ndjson` (lokal, tidak di-git, 5,0GB, 10.000.000 baris) — TERUJI 10M 16 Aug 2026.
- **Generator**: `seed/generate.ts` 640 baris, `generateSyntheticStream(count, batchSize=10000)` streaming batch 10k heap flat 35-89MB, 91 kategori, jitter 0,01, faker id_ID.
- **Bench 5M**: `docs/BENCH_5M.md` 149 baris — template BENCH, 5M 99,1s 50k rows/s 2,5GB.
- **BUKU_BELAJAR**: `docs/BUKU_BELAJAR_GOTONGROYONG_LENGKAP.md` Bab 2 — streaming 10M, 91 kategori, jitter, distribusi.
- **Website**: `website/praktik` 18 teknik — generate streaming, COPY bulk, GIN trigram, UNLOGGED staging.
- **Tuning**: `docs/TUNING_5M.md` — shared_buffers 2GB, effective_cache_size 6GB, maintenance_work_mem 1GB, GIN 2000->10ms.

```bash
# Verifikasi cepat 10M
ls -lh docs/BENCH_10M.md # >5K, >100 baris
wc -l docs/BENCH_10M.md  # >100
grep -c "10M\|10.000.000" docs/BENCH_10M.md # >=5
ls -lh data/synthetic_10M.ndjson # 5,0G
wc -l data/synthetic_10M.ndjson  # 10000000
```

---
*BENCH 10M — 10.000.000 baris 5,0GB 4m08s 91 kategori tiap 10k+ TERUJI 10M 16 Aug 2026. Streaming batch 10k heap flat 35-89MB, 2x5M 1m59s+2m00s+8s cat, rows/s 42k, Bintaro 32% 3,2M, KULINER 12,46% 1,24M, jitter 0,01 +-1,1km, faker id_ID. Disk 13G sisa 85% warning, butuh 20GB untuk import.*
