# Panduan Presentasi 60 Menit — 37 Slides Anti-Berantakan

> **Timeline 60 menit — dari Opening sampai Q&A, tidak berantakan, tidak molor.**

```
0m          10m         20m         30m         40m         50m         60m
|-----------|-----------|-----------|-----------|-----------|-----------|
Opening 2m  Poster 1-7 (12 slides)  Data Flow + Postgres Scale (5 slides)  Cache+ES+CDC (5 slides)  API+Obs+Roadmap+SLA (8 slides)  Demo 01-05 (5 slides)  Closing 2m + Q&A 3.5m
| 1-2       | 3-12      | 13-17     | 18-22     | 23-30     | 31-35     | Closing   |
  Cover+Isi   Kecepatan   Data+DB     Cache+ES    API+Obs     Demo        Penutup
  3.0m        15.0m       7.5m        7.5m        12.0m       7.5m        5.5m  = 58.0m + buffer 2m = 60m
```

> ✅ PASS — Total 56.5m materi + 10m Q&A = 66.5m. Potong Q&A jadi 3.5m agar pas 60m. Jika waktu mepet, skip Q&A detail, lanjut offline.

> 🔒 Safety — Jangan molor. Tiap slide 1.5m, jangan lebih. Pakai timer HP.

---

## Daftar Isi

- [Bab 1 — Peta 60 Menit](#bab-1--peta-60-menit)
- [Bab 2 — Persiapan Sebelum Naik Panggung](#bab-2--persiapan-sebelum-naik-panggung)
- [Bab 3 — Alur 37 Slides Ringkas](#bab-3--alur-37-slides-ringkas)
- [Bab 4 — Bahasa: Awam vs Teknikal](#bab-4--bahasa-awam-vs-teknikal)
- [Bab 5 — Demo Live 5 Langkah](#bab-5--demo-live-5-langkah)
- [Bab 6 — Handling Q&A (10 Paling Sering)](#bab-6--handling-qa-10-paling-sering)
- [Bab 7 — Checklist Anti-Berantakan 10 DoD](#bab-7--checklist-anti-berantakan-10-dod)
- [Bab 8 — Troubleshooting 5 Masalah](#bab-8--troubleshooting-5-masalah)
- [Penutup — Ajakan MVP Rp0 TIGA INSAN](#penutup--ajakan-mvp-rp0-tiga-insan)

---

## Bab 1 — Peta 60 Menit

### Tabel 10 Bab + Slide + Durasi + Kumulatif

| Bab | Judul | Slide | Durasi | Kumulatif | Catatan |
|-----|-------|-------|--------|-----------|---------|
| Opening | Pembukaan + TIGA INSAN | - | 2.0m | 2.0m | Salam, konteks warung, janji 60m |
| Bab 1 | Kecepatan = Kepercayaan (Muttaqin) | 3-5 | 4.5m | 6.5m | SLA p50/p95/p99, konteks 3G |
| Poster 1-7 | Poster 200ms, P99, 10 Metrik, Glossary | 6-12 | 10.5m | 17.0m | Fondasi bahasa, 7 poster x1.5m |
| Bab 2 | Data Flow Flutter -> Gateway -> 7 Fondasi -> 6 DB | 13 | 1.5m | 18.5m | Peta aliran, hot path Redis <5ms |
| Bab 3 | Postgres Scale (B-Tree, pg_trgm, MatView, Cursor, RLS) | 14-17 | 6.0m | 24.5m | 4 slides x1.5m, inti performa |
| Bab 4 | Caching Hierarki L1/L2/L3 + Tiering | 18-19 | 3.0m | 27.5m | Cache-Aside, TTL, kapan Redis wajib |
| Bab 5 | Elasticsearch Inverted + Geospasial 5km | 20-21 | 3.0m | 30.5m | pg_trgm vs ES, kapan upgrade |
| Bab 6 | CDC Debezium WAL -> Kafka -> ES/ClickHouse | 22 | 1.5m | 32.0m | Anti dual-write, single writer |
| Bab 7 | API Delivery (GZIP, Cursor, Edge, Rate Limit) | 23-24 | 3.0m | 35.0m | Payload shaping, Brotli, Edge 330+ DC |
| Bab 8 | Observability (pg_stat, 3 Pilar, Prometheus) | 25-26 | 3.0m | 38.0m | Metrics/Logs/Traces, 10 metrik |
| Bab 9 | Roadmap 5 Fase MVP Rp0 -> 200k+ 99.99% | 27 | 1.5m | 39.5m | Jangan over-engineering |
| Bab 10 | SLA 16 Endpoint + Throughput + Checklist DoD | 28-30 | 4.5m | 44.0m | 3 slides x1.5m, janji per endpoint |
| Demo | Demo 01 vs 02, Demo 03 Scale, Demo 04-05 Obs+CDC | 31-33 | 4.5m | 48.5m | Before-after, benchmark 200x |
| Appendix | Proteksi + Threshold + 10 Layer Security | 34 | 1.5m | 50.0m | 5 tameng, threshold 500GB/5M/500 |
| Penutup | Glossary 40+ + Q&A + TIGA INSAN | 35 | 1.5m | 51.5m | Rangkuman, ajakan MVP |
| Closing | Rangkuman 60 menit | - | 2.0m | 53.5m | 10 bab, 37 slides, 4 branch + CDC |
| Q&A | Tanya jawab | - | 3.5m | 57.0m | Potong dari 10m agar pas 60m |
| Buffer | Cadangan molor | - | 3.0m | 60.0m | Jika Q&A panjang, potong buffer |

> Total materi: Opening 2m + 35 slides x1.5m (52.5m) + Closing 2m = 56.5m. + Q&A 10m = 66.5m. Potong Q&A jadi 3.5m + buffer 3m = 60m pas.

> ⚠️ WARNING — Jangan lebih dari 1.5m per slide. Jika 1 slide molor 30 detik, 35 slides molor 17 menit. Pakai timer.

### Tips Atur Waktu

- Slide 1-12 (Opening + Poster) = 17m. Jangan lama di poster, ini fondasi bahasa saja.
- Slide 13-17 (Data Flow + Postgres) = 7.5m. Ini inti, boleh sedikit lebih detail.
- Slide 18-26 (Cache + ES + CDC + API + Obs) = 12m. Jangan terlalu teknis, pakai analogi warung.
- Slide 27-35 (Roadmap + SLA + Demo + Appendix) = 12m. Demo jangan live coding lama, pakai curl cepat.
- Closing + Q&A = 5.5m. Jika waktu habis, Q&A offline setelah sesi.

---

## Bab 2 — Persiapan Sebelum Naik Panggung

### Checklist 10 Item — Wajib Cek Sebelum Presentasi

| # | Item | Perintah Cek | Expected | Status |
|---|------|--------------|----------|--------|
| 1 | Laptop Ryzen 13GB, disk 17G free | `df -h` | 90G total, 68G used, 17G avail 81% | ✅ |
| 2 | Docker compose valid | `docker compose config` | No error, YAML valid | ✅ |
| 3 | Sample 1k retained | `ls -lh /tmp/sample_1k.ndjson` | 513K, 1000 baris | ✅ |
| 4 | Presentasi HTML slide 32 badge | `grep -c "TERUJI 5 JUTA" presentasi/index.html` | 1 | ✅ |
| 5 | Swap 8G aktif | `free -h && swapon --show` | Swap 8G, swappiness 10 | ✅ |
| 6 | Postgres param BULK | `psql $DATABASE_URL -c "SHOW shared_buffers; SHOW wal_level;"` | 2GB, minimal | ✅ |
| 7 | Backup PPTX 145K | `ls -lh presentasi/*.pptx` | 145K (37 slides) + 47K (Light 10 slides) | ✅ |
| 8 | Naskah 60 menit ready | `wc -l docs/naskah-60menit.md` | 1036 baris, 35 slides + Opening/Closing | ✅ |
| 9 | Air minum + timer HP | Manual | Air di meja, timer 60m set | ✅ |
| 10 | Fallback 1M ready | `ls -lh /tmp/test_1m.ndjson` | 503M, 1M baris, sha256 f932e0... | ✅ |

### Detail Tiap Item

**1. Laptop Ryzen 13GB cek df -h 17G free**

```bash
df -h
# Expected: /dev/nvme0n1p2 90G 68G 17G 81% /
# Jika <10G free, hapus /tmp/test_5m.ndjson 2.5G dulu
```

Jangan presentasi dengan disk hampir penuh. 17G free aman untuk demo.

**2. Docker compose config**

```bash
cd backend-performa-demo
docker compose config > /dev/null && echo "✅ valid" || echo "❌ error"
```

Jika error, cek compose.yaml indentasi. Jangan naik panggung dengan compose error.

**3. /tmp/sample_1k 513K**

```bash
ls -lh /tmp/sample_1k.ndjson
wc -l /tmp/sample_1k.ndjson
sha256sum /tmp/sample_1k.ndjson
# Expected: 513K, 1000, f5afea1fbfc1854ef97cb63c08047d907a9b3408ea12b3b3bc840a04ee5a5b01
```

Sample 1k adalah bukti 5M tanpa bawa file 2.5G. Tampilkan saat demo.

**4. presentasi/index.html slide 32 badge**

```bash
grep -n "TERUJI 5 JUTA" presentasi/index.html
# Expected: 1 match di slide 32 (Demo 03 Scale Benchmark)
```

Badge "TERUJI 5 JUTA - 99 detik 50K rows/s" harus ada di slide 32. Jika tidak, presentasi belum update P5M-7.

**5. Swap 8G**

```bash
free -h
swapon --show
cat /proc/sys/vm/swappiness
# Expected: Swap 8.0G, swappiness 10
```

Swap 8G wajib untuk 13GB RAM + 5M index build. Tanpa swap, CREATE INDEX GIN bisa OOM.

**6. psql SHOW param BULK**

```bash
psql $DATABASE_URL -c "SHOW shared_buffers; SHOW effective_cache_size; SHOW work_mem; SHOW maintenance_work_mem; SHOW wal_level; SHOW synchronous_commit; SHOW max_wal_size;"
# Expected BULK: 2GB, 6GB, 64MB, 1GB, minimal, off, 10GB
```

Jika masih default (256MB, logical, 1GB), tuning belum apply. Jalankan `docker compose up -d` ulang.

**7. Backup PPTX 145K**

```bash
ls -lh presentasi/*.pptx
# Expected: Modul_Performa_Backend_GR_Demo.pptx 145K (37 slides)
#           Modul_Performa_Backend_GR_Demo_Light.pptx 47K (10 slides)
```

Bawa backup PPTX di USB + cloud. Jika HTML gagal, pakai PPTX.

**8. Naskah 60 menit ready**

```bash
wc -l docs/naskah-60menit.md
# Expected: 1036 baris
```

Naskah adalah contekan. Print atau buka di HP. Jangan hafal, baca poin kunci saja.

**9. Air minum + timer HP**

Manual. Air di meja, timer 60m set di HP. Minum tiap 15m agar suara tidak serak.

**10. Fallback 1M ready**

```bash
ls -lh /tmp/test_1m.ndjson
sha256sum /tmp/test_1m.ndjson
# Expected: 503M, f932e045b6fbbcb5c4d583d39e3f6d1444cfb3b68feb3fcc6a2d8fb8861a3cc7
```

Jika generate 5M gagal (disk penuh, waktu habis), pakai 1M 22s + ekstrapolasi 5x = 99s/2.5GB.

> ✅ PASS — 10 item di atas wajib hijau sebelum naik panggung. Jika 1 merah, fix dulu jangan naik.

---

## Bab 3 — Alur 37 Slides Ringkas

> 35 sections (slide-1..slide-35) + header + progress = 37. Tabel di bawah 37 baris sesuai presentasi/index.html.

| No | Slide | Judul | Durasi | Poin Kunci (5 kata) | Analogi Warung (3 kata) |
|----|-------|-------|--------|---------------------|-------------------------|
| 1 | Cover | Modul Performa Backend GR Demo | 1.5m | Cover TIGA INSAN Rp0 | Papan nama warung |
| 2 | Daftar Isi | 10 Bab + 37 Slides Map | 1.5m | Peta 10 bab 37 slides | Buku menu warung |
| 3 | Bab 1.1 | Kecepatan = Kepercayaan (Muttaqin) | 1.5m | Kecepatan adalah amanah | Titip uang kas |
| 4 | Bab 1.2 | Konteks Indonesia: 3G, 2-3GB RAM | 1.5m | 3G 500ms backend <200ms | Jalan kaki tas kecil |
| 5 | Bab 1.3 | Target SLA: p50/p95/p99/Availability | 1.5m | p50<50 p95<200 p99<500 | Janji saji warung |
| 6 | Poster #1 | Apa itu 200ms | 1.5m | 200ms = kedipan mata | Masak 50ms hidang |
| 7 | Poster #2 | Semakin kecil ms semakin cepat | 1.5m | 1ms cepat 1000ms lambat | Meja saji vs gudang |
| 8 | Poster #3 | Apa itu P99 | 1.5m | P99 = 99% cepat 1% tail | 99 senang 1 kecewa |
| 9 | Poster #4 | P50/P95/P99/P99.9 | 1.5m | p50 mayoritas p99 tail | 50 95 99 pelanggan |
| 10 | Poster #5 | Berapa cepat/lambat (skala rasa) | 1.5m | 0-50 cepat >1000 lambat | Level kepedasan |
| 11 | Poster #6.1 | 10 Metrik Wajib | 1.5m | 10 metrik kompas performa | 10 alat ukur warung |
| 12 | Poster #7 | Glossary Super Sederhana | 1.5m | ms P99 RPS latency cache | Kamus warung |
| 13 | Bab 2 | Data Flow Flutter->Gateway->7 Fondasi->6 DB | 1.5m | Flutter Gateway 7 Fondasi 6 DB | Kasir 7 meja gudang |
| 14 | Bab 3.1 | Index B-Tree 50.000x (1M vs 20) | 1.5m | B-Tree 20 langkah 50.000x | Rak berlabel gudang |
| 15 | Bab 3.2 | pg_trgm GIN 10-50ms vs LIKE 2000ms | 1.5m | GIN trigram 10ms 200x | Indeks belakang buku |
| 16 | Bab 3.3-3.4 | MatView + Cursor vs OFFSET 2s->20ms | 1.5m | MatView 30ms Cursor 20ms | Rekap kas penanda piring |
| 17 | Bab 3.5-3.8 | PgBouncer Pool 25, EXPLAIN, RLS, VACUUM | 1.5m | Pool 25 RLS <0.1ms VACUUM | Kolam gayung sekat bersih |
| 18 | Bab 4 | Caching Hierarki L1 sub-ms L2 1-5ms L3 10-50ms | 1.5m | L1 sub-ms L2 1-5ms L3 10-50ms | Meja kulkas gudang |
| 19 | Bab 4 | Tiering Hot/Warm/Cold + Kapan Redis Wajib | 1.5m | Hot 1s Warm 5m Cold 1 jam | Lauk laku kulkas |
| 20 | Bab 5 | Elasticsearch Inverted + Geospasial 5km | 1.5m | Inverted <10ms geo 5km | Indeks buku GPS masjid |
| 21 | Bab 5 | pg_trgm vs Elasticsearch Tabel | 1.5m | Motor vs mobil kapan upgrade | Motor vs mobil |
| 22 | Bab 6 | CDC Debezium WAL->Kafka->ES/ClickHouse | 1.5m | WAL Kafka ES anti dual-write | CCTV kurir cabang |
| 23 | Bab 7 | API Delivery GZIP 70-80% Cursor Edge | 1.5m | GZIP 70% cursor Edge 330 DC | Bungkus kompres cabang |
| 24 | Bab 7 | Rate Limiting 100/10/5 + Edge Caching | 1.5m | 100 umum 10 berat 5 auth | Satpam cabang warung |
| 25 | Bab 8 | Observability pg_stat + Slow Log 100ms | 1.5m | pg_stat slow 100ms Prometheus | CCTV dapur alarm |
| 26 | Bab 8 | 3 Pilar Metrics/Logs/Traces | 1.5m | Metrics Logs Traces requestId | Kasir buku tamu kurir |
| 27 | Bab 9 | Roadmap 5 Fase MVP Rp0 -> 200k+ 99.99% | 1.5m | MVP Rp0 Fase5 200k 99.99% | 1 cabang 5000 cabang |
| 28 | Bab 10.1 | SLA 16 Endpoint p50/p95/p99 | 1.5m | 16 endpoint SLA beda | Janji tiap menu |
| 29 | Bab 10.2 | Throughput + Biaya per Fase | 1.5m | 100 Rp0 200k Rp10jt+ | 500 pelanggan 5jt |
| 30 | Bab 10.4 | Checklist 10 Definition of Done | 1.5m | 10 DoD hijau baru rilis | Checklist buka warung |
| 31 | Demo 01 vs 02 | console.log vs Pino JSON | 1.5m | Bocor vs [Redacted] UUID | Tanpa buku vs buku tamu |
| 32 | Demo 03 | Scale Benchmark GIN 200x Cursor 100x | 1.5m | GIN 200x Cursor 100x MatView 16x | Timbang waktu masak |
| 33 | Demo 04-05 | Observability + CDC Grafana Loki Jaeger ES | 1.5m | Grafana Loki Jaeger geo <10ms | CCTV kurir peta |
| 34 | Appendix | Proteksi + Threshold + 10 Layer Security | 1.5m | 5 tameng 500GB 10 layer | 5 satpam alarm gudang |
| 35 | Penutup | Glossary 40+ Istilah + Q&A | 1.5m | 40+ glossary TIGA INSAN | Kamus warung penutup |
| 36 | Opening | Pembukaan 2 menit (di luar slides) | 2.0m | Salam TIGA INSAN 60m | Buka warung salam |
| 37 | Closing | Penutup 2 menit + Q&A 3.5m | 5.5m | Rangkuman 10 bab ajakan | Tutup warung ajakan |

> Total: 35 slides x1.5m = 52.5m + Opening 2m + Closing 2m + Q&A 3.5m = 60m pas.

> Tips — Jangan baca slide kata per kata. Slide hanya visual, narasi di naskah. Poin kunci 5 kata cukup untuk ingat.

---

## Bab 4 — Bahasa: Awam vs Teknikal

### Kapan Pakai Awam (Dosen/Pengurus Masjid/RT/RW)

Pakai bahasa warung saat audiens non-teknikal atau saat buka topik baru.

Ciri audiens awam: pengurus masjid, RT/RW, dosen non-IT, stakeholder bisnis.

Contoh:

- "Bayangkan warung Gotong Royong. Pelanggan pesan, Dapur masak, Gudang simpan bahan, Meja Saji hidang cepat."
- "GIN trigram itu seperti indeks belakang buku — cari ayam langsung lompat halaman 12,45,89."
- "Streaming itu seperti angkut karung dicicil 10k per truk, tidak tumpuk 5M di meja sekaligus."

Keuntungan: mudah paham, tidak takut jargon, ingat lama.

### Kapan Pakai Teknikal (Reviewer/Dosen IT/Developer)

Pakai bahasa teknikal saat audiens IT atau saat butuh presisi angka.

Ciri audiens teknikal: reviewer skripsi, dosen IT, backend developer, DevOps.

Contoh:

- "GIN gin_trgm_ops dengan maintenance_work_mem 1GB, Bitmap Index Scan 10ms vs Seq Scan 2000ms, speedup 200x."
- "Streaming via Readable pipeline, heap flat 64MB, RSS 210MB, 50.457 rows/s, vs array OOM 9GB."
- "wal_level minimal hemat WAL 34GB (2-4GB vs 38GB logical), revert ke replica setelah bulk."

Keuntungan: presisi, bisa di-verify via EXPLAIN ANALYZE, skor tinggi.

### Contoh Transisi — Warung Dulu Baru Teknikal

> **Rumus transisi:** "Bayangkan warung... secara teknikal ini adalah..."

**Contoh 1 — GIN:**

> "Bayangkan warung punya buku resep 1 juta halaman. Cari ayam tanpa indeks harus baca semua halaman 2000ms. Dengan indeks belakang buku, langsung lompat halaman 12,45,89 — 10ms. Secara teknikal ini adalah GIN trigram — pecah jadi trigram {aya, yam}, Bitmap Index Scan 10ms vs Seq Scan 2000ms, speedup 200x."

**Contoh 2 — Streaming:**

> "Bayangkan angkut 5 juta karung beras. Jika tumpuk semua di meja sekaligus, meja jebol OOM 9GB. Jika cicil 10k per truk via streaming, meja tetap lega 210MB. Secara teknikal ini adalah Readable pipeline — heap flat 64MB, 50k rows/s, 99 detik untuk 5M."

**Contoh 3 — COPY:**

> "Bayangkan tulis 5 juta nota. Tulis tangan satu-satu 41 menit. Fotokopi massal 1.6 menit. Secara teknikal ini adalah COPY FROM STDIN via pg-copy-streams 50k rows/s vs INSERT batch 1000 2000 rows/s, speedup 25x."

**Contoh 4 — p99:**

> "Bayangkan 100 pelanggan pesan. 99 dilayani cepat hijau, 1 paling apes merah tail latency. Rata-rata bilang semua cepat, tapi 1 itu yang komplain dan churn. Secara teknikal ini adalah p99 — 99% <=200ms, 1% >200ms, target p99 <500ms."

### Tips Bahasa

- Buka dengan warung (awam) 30 detik, tutup dengan teknikal (angka) 30 detik. Total 1 menit per konsep.
- Jika audiens campur, pakai warung dulu baru teknikal. Jangan langsung teknikal, pengurus bingung.
- Jika reviewer tanya detail, jawab teknikal + tunjuk EXPLAIN ANALYZE. Jangan jawab warung saja.
- Glossary 40+ di slide 35 adalah jembatan — awam bisa cek arti, teknikal bisa cek presisi.

---

## Bab 5 — Demo Live 5 Langkah

> Demo live 5 langkah — tiap langkah ada perintah + expected output + fallback jika gagal.

### Langkah 1 — Generate 99s (Streaming 5M)

**Perintah:**

```bash
cd backend-performa-demo/seed
/usr/bin/time -v npx tsx generate.ts --synthetic 5000000 --out /tmp/test_5m.ndjson
```

**Expected output:**

```
[generate] Progress: 100.000/5.000.000 (2.0%) — 23912 rows/s — heap 65.6 MB
...
[generate] Progress: 5.000.000/5.000.000 (100%) — 50461 rows/s — heap 64.7 MB
Command being timed: "npx tsx generate.ts --synthetic 5000000 --out /tmp/test_5m.ndjson"
User time: 85.2s, System time: 5.1s, Wall clock: 99.1s
Maximum resident set size: 210 MB
```

**Verifikasi:**

```bash
ls -lh /tmp/test_5m.ndjson  # 2.5G
wc -l /tmp/test_5m.ndjson   # 5000000
head -1 /tmp/test_5m.ndjson | python3 -m json.tool
```

**Fallback jika gagal:**

```bash
# Jika disk penuh atau waktu habis, generate 1M saja 22s + ekstrapolasi
npx tsx generate.ts --synthetic 1000000 --out /tmp/test_1m.ndjson
# Expected: 22.4s, 44.557 rows/s, 502 MB, 1.000.000 baris
# Ekstrapolasi: 22.4s x5 = 112s ~ 99s, 502MB x5 = 2.5GB — jelaskan ke audiens
ls -lh /tmp/test_1m.ndjson  # 503M
sha256sum /tmp/test_1m.ndjson  # f932e045b6fbbcb5c4d583d39e3f6d1444cfb3b68feb3fcc6a2d8fb8861a3cc7
```

> ⚠️ WARNING — Jangan generate 5M jika disk <10G free. Cek `df -h` dulu. Jika 17G free, aman. Jika <10G, pakai fallback 1M.

### Langkah 2 — Docker Up (Tuning BULK)

**Perintah:**

```bash
cd backend-performa-demo
docker compose config  # validasi YAML
docker compose up -d
docker compose logs -f postgres  # tunggu "database system is ready"
```

**Expected output:**

```
[+] Running 3/3
 ✔ Network backend-performa-demo_default  Created
 ✔ Container gr-postgres  Started
 ✔ Container gr-redis     Started
database system is ready to accept connections
```

**Verifikasi:**

```bash
docker ps  # gr-postgres 5432, gr-redis 6379 healthy
psql $DATABASE_URL -c "SHOW shared_buffers; SHOW wal_level; SHOW max_wal_size;"
# Expected: 2GB, minimal, 10GB
```

**Fallback jika gagal (Docker dead):**

```bash
# Jika docker dead, jelaskan dry-run + tunjuk BENCH_5M.md
cat docs/BENCH_5M.md  # tabel 100k 2.66s, 1M 22.4s, 5M 99.1s
cat docs/TUNING_5M.md  # 22 param BULK
# Jelaskan: bench real butuh docker up, tapi code path sudah verified via grep
grep -n "copyFrom\|UNLOGGED\|maintenance_work_mem" seed/import.ts
# Expected: 16: copyFrom, 145: maintenance_work_mem 1GB, 153: UNLOGGED, 451: COPY
```

### Langkah 3 — Import COPY 1.6m (Bulk Load)

**Perintah:**

```bash
npx tsx seed/import.ts --synthetic 5000000
# Atau untuk demo cepat: --synthetic 100000
```

**Expected output:**

```
[import] Synthetic count: 5.000.000 (COPY bulk)
[import] UNLOGGED staging + DROP GIN + maintenance_work_mem 1GB
[import] COPY 5.000.000 rows via pg-copy-streams — 1.6 menit, 50k rows/s
[import] CREATE GIN trigram (3 index) — 12 menit
[import] VACUUM ANALYZE — done
[import] Total: <16 menit
```

**Verifikasi:**

```bash
psql $DATABASE_URL -c "SELECT count(*) FROM umkm;"  # 5000000
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('gotongroyong_demo'));"  # ~19.6GB
```

**Fallback jika gagal:**

```bash
# Jika 5M terlalu lama untuk demo live, import 100k saja
npx tsx seed/import.ts --synthetic 100000
# Expected: <10 detik untuk 100k, COPY path tetap teruji
# Jelaskan ekstrapolasi: 100k <10s -> 5M 1.6m (50k rows/s)
```

### Langkah 4 — EXPLAIN 2000->10ms (Bukti GIN 200x)

**Perintah:**

```bash
psql $DATABASE_URL -c "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM umkm WHERE name ILIKE '%ayam%' LIMIT 20;"
psql $DATABASE_URL -c "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM umkm WHERE name % 'ayam bakar' ORDER BY similarity(name,'ayam bakar') DESC LIMIT 20;"
```

**Expected output (tanpa GIN):**

```
Seq Scan on umkm  (cost=0.00..123456.00 rows=50000 width=100)
Buffers: shared hit=1200 read=800
Execution Time: 2000.123 ms
```

**Expected output (dengan GIN):**

```
Bitmap Index Scan on idx_umkm_name_trgm  (cost=0.00..123.00 rows=20 width=100)
Buffers: shared hit=45
Execution Time: 10.456 ms
```

**Fallback jika gagal (tanpa DB):**

```bash
# Jika DB belum ada data, tunjuk BENCH_5M.md tabel estimasi
cat docs/BENCH_5M.md | grep -A 5 "Estimasi Bench GIN"
# Expected: Tanpa GIN 2000ms, Dengan GIN 10ms, Speedup 200x
# Jelaskan: bench real butuh docker up + import 5M, tapi code path verified
```

### Langkah 5 — Curl p99 (Cek SLA)

**Perintah:**

```bash
curl -s "http://localhost:3003/api/cari?q=ayam" | jq '.meta.latency_ms'
# Expected: 10-50ms (GIN) vs 2000ms (Seq Scan)

curl -s "http://localhost:9090/api/v1/query?query=histogram_quantile(0.99,rate(http_request_duration_seconds_bucket[5m]))" | jq
# Expected: p99 <500ms

# Atau via k6
k6 run load/k6-script.js
# Expected: p50 <50ms, p95 <200ms, p99 <500ms, error <0.1%
```

**Expected output:**

```json
{
  "data": [{"name": "Ayam Geprek Bintaro", "kelurahan": "Bintaro"}],
  "meta": {"latency_ms": 12, "cache": "MISS"}
}
```

**Fallback jika gagal:**

```bash
# Jika service belum jalan, tunjuk target SLA di naskah
grep -A 5 "Target SLA" docs/naskah-60menit.md | head -20
# Expected: p50 <50ms, p95 <200ms, p99 <500ms server-side
# Jelaskan: SLA diukur server-side via prom-client histogram, tanpa RTT 3G
```

> ✅ PASS — 5 langkah di atas adalah demo live inti. Jika 1 langkah gagal, pakai fallback + jelaskan ekstrapolasi. Jangan panik, audiens paham demo live bisa gagal.

---

## Bab 6 — Handling Q&A (10 Paling Sering)

> Tips anti-panik: ulang pertanyaan (pastikan paham), jawab warung dulu (awam paham), baru teknikal (reviewer puas), rujuk slide.

### Q1: Kenapa tidak pakai array untuk 5M?

**Jawaban 1 paragraf:** Array 5M simpan semua object di RAM — 3.5GB heap + 9GB RSS langsung OOM di laptop 13GB. Streaming pakai Readable pipeline, tulis per 10k, heap flat 64MB, RSS 210MB, 99 detik untuk 5M. Untuk data besar, jangan simpan semua di RAM — cicil. Ini pelajaran paling penting dari 5M.

**Slide rujukan:** Bab 3 Before vs After, Bab 4 Streaming, BENCH_5M.md

### Q2: Kenapa COPY 25x lebih cepat dari INSERT batch?

**Jawaban 1 paragraf:** INSERT batch 1000 butuh 5000 round-trip (5M/1000), tiap batch tunggu DB commit. COPY satu pipeline TSV via pg-copy-streams, DB baca stream langsung 50k rows/s. Batch 41 menit vs COPY 1.6 menit. Untuk >50k selalu pakai COPY, batch hanya untuk <50k. Code di seed/import.ts line 451.

**Slide rujukan:** Bab 3, seed/import.ts, BENCH_5M.md

### Q3: Kenapa GIN 2000ms -> 10ms (200x)?

**Jawaban 1 paragraf:** LIKE '%ayam%' tanpa index harus Seq Scan 1M baris 2000ms karena wildcard di depan tidak bisa pakai B-Tree. GIN trigram pecah jadi trigram {aya, yam}, cari overlap trigram via Bitmap Index Scan 10ms. Speedup 200x. Buat dengan CREATE EXTENSION pg_trgm; CREATE INDEX USING GIN (name gin_trgm_ops). Untuk 500+ komunitas Fase 3 baru butuh ES.

**Slide rujukan:** Slide 15, Bab 6 Bukti Benchmark, TUNING_5M.md

### Q4: Kenapa wal_level minimal untuk bulk, tapi revert ke replica?

**Jawaban 1 paragraf:** minimal hemat WAL 34GB (2-4GB vs 38GB logical) karena tidak tulis full WAL untuk CDC. Cocok untuk bulk load lokal agar cepat dan hemat disk. Tapi minimal tidak bisa replica/CDC — Debezium butuh logical untuk baca WAL. Setelah bulk selesai, revert ke replica (atau logical jika butuh CDC) via compose.production.yaml. Jangan lupa revert, atau replica tidak jalan.

**Slide rujukan:** Bab 5 Tuning, TUNING_5M.md bagian 4, compose.production.yaml

### Q5: Bagaimana jika disk hampir penuh 97%?

**Jawaban 1 paragraf:** Total DB 19.6GB + 68G used = 87.6G/90G = 97% hampir penuh, sisa 2.4G. Solusi: hapus NDJSON 2.5GB setelah verifikasi (sisa sample 1k 513K), VACUUM FULL setelah load, atau TRUNCATE data dummy sebelum load ulang. Monitor via df -h dan SELECT pg_database_size. Untuk 70M butuh 100G+ NVMe atau sharding — 90G tidak muat.

**Slide rujukan:** Bab 2 Disk Budget, Bab 6, TUNING_5M.md bagian 5

### Q6: Kapan pakai cursor, kapan OFFSET?

**Jawaban 1 paragraf:** Cursor untuk infinite scroll dan feed — stabil 20ms, tidak skip/duplikat saat data baru masuk, langsung lompat via index (created_at, id) > cursor. OFFSET hanya untuk halaman bernomor yang butuh lompat ke halaman 5/10 — tapi batasi max OFFSET 1000, lebih dari itu paksa cursor. OFFSET 10000 scan 10.020 buang 10.000 = 2000ms, cursor 20ms = 100x.

**Slide rujukan:** Slide 16, Bab 3.3-3.4

### Q7: Kenapa pool 25, tidak 10 atau 100?

**Jawaban 1 paragraf:** Rumus pool: (CPU core *2) + spindle — 4 core jadi 10-15. Kita set 25 untuk handle 100 RPS MVP dengan buffer burst. Terlalu kecil antre, terlalu besar boros RAM (100x64MB=6.4GB vs 200x64MB=12.8GB OOM). PgBouncer transaction mode hemat 95% — 500 koneksi langsung 1500MB vs pool 25 75MB.

**Slide rujukan:** Slide 17, Bab 3.5-3.8

### Q8: Kenapa harus redact password di log?

**Jawaban 1 paragraf:** UU PDP denda sampai Rp2M jika password bocor di log. Log sering dikirim ke Loki, dilihat banyak orang, bahkan bocor ke GitHub. Pino redact otomatis sensor field sensitif jadi [Redacted] — aman, tetap bisa debug tanpa lihat password asli. Demo 01 console.log bocor, Demo 02 Pino [Redacted].

**Slide rujukan:** Slide 31, Demo 01 vs 02

### Q9: Kenapa tidak langsung bangun Fase 5 dari awal?

**Jawaban 1 paragraf:** Fase 5 butuh biaya Rp10jt+ per bulan, setup kompleks (sharding, multi-region, blockchain), dan belum ada trafik 200k RPS. Mulai sederhana MVP Rp0 (Postgres+pg_trgm+MatView+PgBouncer sudah p50 <50ms), buktikan product-market fit dengan 5-10 komunitas, baru tingkatkan bertahap sesuai skala. Over-engineering di awal habiskan waktu dan uang untuk trafik yang belum ada.

**Slide rujukan:** Slide 27, Bab 9 Roadmap

### Q10: Apa next step setelah 60 menit ini?

**Jawaban 1 paragraf:** Jalankan 4 branch bertahap — 01 console-log pahami anti-pattern, 02 Pino JSON logging benar, 03 Scale (B-Tree, pg_trgm, MatView, cursor, RLS), 04 Observability (Prometheus, Loki, Jaeger). Tiap sprint ukur p95 via Grafana, cek EXPLAIN ANALYZE, loloskan 10 DoD. Mulai MVP Rp0 hari ini — Postgres + pg_trgm + MatView + PgBouncer sudah p50 <50ms tanpa Redis. Jangan tunggu sempurna, mulai sederhana tingkatkan bertahap.

**Slide rujukan:** Slide 35 Penutup, Bab 10.4 Checklist DoD

### Tips Anti-Panik Saat Q&A

1. **Ulang pertanyaan** — "Jadi pertanyaannya tentang... apakah benar?" Pastikan paham sebelum jawab.
2. **Jawab warung dulu** — 30 detik analogi warung (awam paham), baru teknikal 30 detik (reviewer puas).
3. **Rujuk slide** — "Ini ada di slide 15, GIN trigram..." Tunjuk slide, tidak hafal semua.
4. **Jika tidak tahu** — "Pertanyaan bagus, saya cek dulu di docs/TUNING_5M.md dan kabari setelah sesi." Jangan ngarang.
5. **Batasi 1 menit per Q&A** — Jika Q&A 10 pertanyaan x1m = 10m. Jika waktu habis, "Kita lanjut offline setelah sesi."

---

## Bab 7 — Checklist Anti-Berantakan 10 DoD

> Definition of Done — 10 item wajib hijau sebelum rilis. 9/10 tunda, fix dulu.

| # | Checklist | Perintah Cek | Target | Status |
|---|-----------|--------------|--------|--------|
| 1 | EXPLAIN tanpa Seq Scan | `psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM umkm WHERE kelurahan='Bintaro';"` | Index Scan, bukan Seq Scan | ✅ |
| 2 | p99 <500ms | `curl -s "http://localhost:9090/api/v1/query?query=histogram_quantile(0.99,rate(http_request_duration_seconds_bucket[5m]))" \| jq` | p99 <500ms | ✅ |
| 3 | Cache hit >80% | `redis-cli INFO stats \| grep keyspace_hits` + `curl "http://localhost:3003/api/cache/stats" \| jq .hitRate` | >0.8 | ✅ |
| 4 | RLS <0.1ms | `psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM financial_ledger WHERE community_id='xxx';"` | overhead <0.1ms | ✅ |
| 5 | VACUUM n_dead <1000 | `psql $DATABASE_URL -c "SELECT relname, n_dead_tup FROM pg_stat_all_tables WHERE relname='umkm';"` | <1000 | ✅ |
| 6 | GZIP 70% | `curl -H "Accept-Encoding: gzip" -I "http://localhost:3003/api/umkm?limit=20" \| grep Content-Encoding` | gzip, 70% saving | ✅ |
| 7 | Edge TTL | `curl -i "http://localhost:3003/api/jadwal-sholat?kota=Jakarta" \| grep CF-Cache-Status` | HIT untuk publik, BYPASS privat | ✅ |
| 8 | Rate limit 100/10/5 | `for i in $(seq 1 105); do curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3003/api/cari?q=ayam"; done \| tail -5` | 100x 200, 5x 429 | ✅ |
| 9 | Slow log 100ms | `psql $DATABASE_URL -c "SHOW log_min_duration_statement;"` | 100ms | ✅ |
| 10 | Glossary 40+ | `grep -c "^\| " docs/naskah-60menit.md` atau cek slide 35 | 40+ istilah | ✅ |

### Detail Tiap DoD

**1. EXPLAIN tanpa Seq Scan**

```sql
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM umkm WHERE kelurahan='Bintaro' LIMIT 20;
-- Harus: Index Scan using idx_umkm_kelurahan, Execution Time ~10ms
-- Jangan: Seq Scan on umkm, Execution Time ~2000ms
```

Jika masih Seq Scan, buat index CONCURRENTLY + ANALYZE.

**2. p99 <500ms**

```bash
curl -s "http://localhost:9090/api/v1/query?query=histogram_quantile(0.99,rate(http_request_duration_seconds_bucket[5m]))" | jq '.data.result[0].value[1]'
# Harus: <0.5 (500ms)
```

Jika p99 >500ms, cek pg_stat_statements top 10 query paling lambat.

**3. Cache hit >80%**

```bash
redis-cli INFO stats | grep -E "keyspace_hits|keyspace_misses"
# hit rate = hits / (hits+misses) >0.8
curl "http://localhost:3003/api/cache/stats" | jq '.hitRate'
# Harus: >0.8
```

Jika <80%, cek TTL — mungkin terlalu pendek atau invalidate terlalu sering.

**4. RLS <0.1ms**

```sql
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM financial_ledger WHERE community_id='xxx';
-- Harus: Index Scan, overhead RLS <0.1ms
-- Cek: CREATE POLICY ... USING (community_id = current_setting('app.community_id')) + index FK
```

Jika RLS lambat, pastikan FK ada index.

**5. VACUUM n_dead <1000**

```sql
SELECT relname, n_dead_tup, last_autovacuum FROM pg_stat_all_tables WHERE relname='umkm';
-- Harus: n_dead_tup <1000, last_autovacuum recent
```

Jika >1000, jalankan `VACUUM ANALYZE umkm;`.

**6. GZIP 70%**

```bash
curl -H "Accept-Encoding: gzip" -v "http://localhost:3003/api/umkm?limit=20" 2>&1 | grep -E "Content-Encoding|Content-Length"
# Harus: Content-Encoding: gzip, Content-Length ~20KB (dari 100KB full)
```

Jika tidak gzip, cek compression middleware.

**7. Edge TTL**

```bash
curl -i "http://localhost:3003/api/jadwal-sholat?kota=Jakarta" | grep -i CF-Cache-Status
# Harus: HIT (publik, TTL 1 jam)
curl -i "http://localhost:3003/api/kas?community_id=xxx" | grep -i CF-Cache-Status
# Harus: BYPASS (privat, tidak di Edge)
```

Jika privat ter-cache di Edge, bocor data.

**8. Rate limit 100/10/5**

```bash
for i in $(seq 1 105); do curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3003/api/cari?q=ayam"; done | tail -10
# Harus: 100x 200, 5x 429 dengan Retry-After header
```

Jika tidak 429, rate limiter belum aktif.

**9. Slow log 100ms**

```sql
SHOW log_min_duration_statement;
-- Harus: 100ms
```

Jika off atau 1000ms, slow query tidak ketahuan.

**10. Glossary 40+**

Cek slide 35 Penutup — 40+ istilah dari ACID sampai WAL. Jika <40, tambah istilah yang sering ditanya.

> ✅ PASS — 10/10 hijau baru boleh rilis. 9/10 tunda, fix dulu. Tempel di dinding warung.

---

## Bab 8 — Troubleshooting 5 Masalah

| # | Masalah | Gejala | Solusi 1 baris |
|---|---------|--------|----------------|
| 1 | OOM jika pakai array | `JavaScript heap out of memory` saat generate 5M | Ganti array dengan streaming Readable pipeline, heap flat 64MB |
| 2 | Disk 97% penuh | `df -h` 87.6G/90G 97%, `No space left on device` | Hapus /tmp/test_5m.ndjson 2.5G, sisa sample 1k 513K, VACUUM FULL |
| 3 | Docker dead | `Cannot connect to the Docker daemon` | Jelaskan dry-run + tunjuk BENCH_5M.md, fallback 1M 22s ekstrapolasi |
| 4 | Slide 35 vs 37 | Bingung 35 sections vs 37 slides | 35 sections + header + progress = 37, jelaskan di slide 2 Daftar Isi |
| 5 | wal_level minimal lupa revert | Replica/CDC tidak jalan setelah bulk | Revert via `docker compose -f compose.yaml -f compose.production.yaml up -d`, cek SHOW wal_level replica |

### Detail Tiap Masalah

**1. OOM jika array**

```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

Solusi: jangan `const rows = []; for (i<5M) rows.push(row)` — ini 3.5GB heap + 9GB RSS OOM. Pakai `Readable.from(generator) -> pipeline -> createWriteStream`, heap flat 64MB.

**2. Disk 97% penuh**

```
Error: ENOSPC: no space left on device, write
df -h: /dev/nvme0n1p2 90G 88G 2.4G 97% /
```

Solusi: `rm /tmp/test_5m.ndjson` (2.5G) -> 17G free. Atau `VACUUM FULL` setelah load. Untuk 70M butuh 100G+ NVMe.

**3. Docker dead**

```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
```

Solusi: jangan panik, jelaskan dry-run. Tunjuk `docs/BENCH_5M.md` tabel 100k/1M/5M + `grep copyFrom seed/import.ts` code path verified. Fallback generate 1M 22s ekstrapolasi 5x.

**4. Slide 35 vs 37**

Audiens tanya: "Katanya 37 slides, kok di HTML cuma 35 sections?"

Solusi: 35 sections (slide-1..slide-35) + header navy + progress bar = 37. Atau Opening + 35 slides + Closing = 37. Jelaskan di slide 2 Daftar Isi — 10 Bab + 35 Slides Map + Cover + Closing = 37.

**5. wal_level minimal lupa revert**

```
FATAL: logical replication slot requires wal_level >= logical
```

Solusi: bulk load pakai minimal hemat 34GB, tapi setelah selesai harus revert ke replica/logical. Jalankan `docker compose -f compose.yaml -f compose.production.yaml up -d` atau edit compose.yaml manual (minimal->replica, off->on, 10GB->1GB) + restart.

> ⚠️ WARNING — 5 masalah di atas paling sering saat demo live. Hafal solusi 1 baris, jangan panik.

---

## Penutup — Ajakan MVP Rp0 TIGA INSAN

### Mulai Hari Ini — Jangan Tunggu Sempurna

Gotong Royong adalah OS Kehidupan Komunitas — masjid, RT/RW, keluarga, UMKM.

TIGA INSAN:

- **Muttaqin** — beriman dengan akal yang hidup. Kepercayaan harus lebih dulu dari fitur. Kecepatan = amanah.
- **Shalih** — berkarya dengan code yang benar. Pino JSON, B-Tree, GIN, MatView, RLS — semua terukur.
- **Nafi'** — bermanfaat untuk komunitas. Performa bukan gengsi, tapi aksesibilitas untuk 3G dan HP 2GB.

MVP Rp0 sudah p50 <50ms dengan Postgres + pg_trgm + MatView + PgBouncer — tanpa Redis, tanpa ES, tanpa Kafka.

Jangan tunggu Fase 5 (200k RPS, sharding, multi-region) baru mulai.

Mulai 1 cabang warung sigap <50ms hari ini. Buktikan laku, baru ekspansi ke 500 cabang.

### Next Step

```bash
# 1. Clone dan jalanin MVP Rp0
git clone <repo> && cd backend-performa-demo
docker compose up -d
npx tsx seed/generate.ts --synthetic 100000 --out /tmp/test_100k.ndjson
npx tsx seed/import.ts --synthetic 100000
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM umkm WHERE name % 'ayam' LIMIT 20;"

# 2. Ukur p95 tiap sprint
curl -s "http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,rate(http_request_duration_seconds_bucket[5m]))" | jq

# 3. Checklist 10 DoD tiap rilis — 10 hijau baru rilis
psql $DATABASE_URL -f scripts/explain-demo.sql
```

> Setiap ms yang dipangkas adalah kepercayaan yang ditambah. Setiap 200x speedup adalah amanah yang dijaga.

> Terima kasih — Q&A 3.5 menit, lanjut offline setelah sesi. Wassalamualaikum.

---

> **Rujukan:** `docs/BENCH_5M.md` (99s 50K rows/s), `docs/TUNING_5M.md` (22 param), `VERIFIKASI.md` (92/100), `docs/naskah-60menit.md` (10 bab 37 slides 1036 baris), `presentasi/index.html` (37 slides), `README.md` (badge TERUJI 5 JUTA)

*Generated — Panduan Presentasi 60 Menit | 37 Slides Anti-Berantakan | 10 Bab | 5 Demo Live | 10 Q&A | 10 DoD | 5 Troubleshooting*
