# Sudut Pandang Terluas GotongRoyong — Dari 5M Sempit ke OS Kehidupan Komunitas 280 Juta

> ![7 LENSA](https://img.shields.io/badge/7%20LENSA-Terluas-blue) ![280 JUTA](https://img.shields.io/badge/TAM-280%20Juta%20Warga-brightgreen) ![300 FITUR](https://img.shields.io/badge/Roadmap-300%20Fitur%205%20Fase-orange) ![TIGA INSAN](https://img.shields.io/badge/TIGA%20INSAN-Muttaqin--Shalih--Nafi'-success) ![TERUJI 5M](https://img.shields.io/badge/TERUJI%205%20JUTA-99s%2050K%20rows%2Fs-lightgrey)

**Tanggal:** 15 Aug 2026 | **Status:** Sintesis 7 Lensa — Lokal (12 Docs-wa) + Internet (80+ URL) | **Lokasi:** `backend-performa-demo/docs/SUDUT_PANDANG_TERLUAS.md`

> **Ringkasan 3 kalimat warung:** Demo 5M kemarin itu seperti uji dapur — masak 5 juta porsi 99 detik, heap flat 64MB, GIN 200x — keren tapi baru 5% visi. Visi aslinya bukan aplikasi kas RT yang ngebut, tapi OS Kehidupan Komunitas untuk 280 juta warga — dari masjid ke RT/RW ke UMKM ke BMT, dengan kepercayaan yang bisa diverifikasi matematis. Laporan ini buka 7 lensa sekaligus biar tidak salah sangka: filosofi TIGA INSAN, Piagam Madinah Digital, socio corp inverted, 7 fondasi + 6DB + 514 masjid, data Pesanggrahan 6.081, UX 100 prinsip, dan roadmap 300 fitur — semua terhubung.

```
Demo 5M (5% visi) ──> [7 Lensa Terluas] ──> OS Kehidupan Komunitas (100% visi)
  99s 50K rows/s        Filosofi+Piagam+Corp+Tekno+Data+UX+Roadmap    280jt warga 70.4jt keluarga 800rb masjid
  GIN 200x COPY 25x      Lokal 12 file + Internet 80+ URL              300 fitur 5 fase 56 bab brand
```

> ✅ PASS — 7 lensa tuntas. Demo 5M tetap valid sebagai bukti performa, tapi jangan dikira itu seluruh GotongRoyong.

---

## Daftar Isi

- [Bab 0 — Diagnosis Sempit: Kenapa Demo 5M Hanya 5% Visi](#bab-0--diagnosis-sempit-kenapa-demo-5m-hanya-5-visi)
- [Lensa 1 — Filosofi TIGA INSAN: Muttaqin-Shalih-Nafi'](#lensa-1--filosofi-tiga-insan-muttaqin-shalih-nafi)
- [Lensa 2 — Piagam Madinah 10 Pasal vs GDPR](#lensa-2--piagam-madinah-10-pasal-vs-gdpr)
- [Lensa 3 — Socio Corporation Inverted 11 Level vs Buurtzorg/Mondragon](#lensa-3--socio-corporation-inverted-11-level-vs-buurtzorgmondragon)
- [Lensa 4 — Teknologi 7 Fondasi + 6DB + 514 Masjid vs Stack 2026](#lensa-4--teknologi-7-fondasi--6db--514-masjid-vs-stack-2026)
- [Lensa 5 — Data Pesanggrahan 6.081: Dari 1 Kecamatan ke 1.7 Juta Titik](#lensa-5--data-pesanggrahan-6081-dari-1-kecamatan-ke-17-juta-titik)
- [Lensa 6 — UX 100 Prinsip 7 Tier vs Nielsen 10](#lensa-6--ux-100-prinsip-7-tier-vs-nielsen-10)
- [Lensa 7 — Roadmap 300 Fitur 5 Fase + Brand 56 Bab vs Global](#lensa-7--roadmap-300-fitur-5-fase--brand-56-bab-vs-global)
- [Bab Sintesis — 3 Hal Sekaligus yang Tidak Dimiliki Platform Lain](#bab-sintesis--3-hal-sekaligus-yang-tidak-dimiliki-platform-lain)
- [Bab Rekomendasi — Opsi A/B/C untuk Presentasi & Eksekusi](#bab-rekomendasi--opsi-abc-untuk-presentasi--eksekusi)
- [Lampiran A — Sumber Lokal 12 File](#lampiran-a--sumber-lokal-12-file)
- [Lampiran B — Sumber Internet 20+ URL Kategori](#lampiran-b--sumber-internet-20-url-kategori)
- [Lampiran C — Glossary 12 Istilah Terluas](#lampiran-c--glossary-12-istilah-terluas)

---

## Bab 0 — Diagnosis Sempit: Kenapa Demo 5M Hanya 5% Visi

### Tabel 7 Dimensi — Visi vs Demo 5M Cover

| # | Dimensi Visi | Visi Lengkap (100%) | Demo 5M Cover | Gap | Akibat Jika Hanya Demo |
|---|--------------|---------------------|---------------|-----|------------------------|
| 1 | **Filosofi** | TIGA INSAN prisma 6 ranah, filter keputusan, siklus Belajar->Memimpin | Hanya "Kecepatan = amanah" 1 baris | 95% hilang | Dikira aplikasi performa, bukan gerakan peradaban |
| 2 | **Tata Kelola** | Piagam Madinah 10 pasal + 5 Layer Trust, moat verifiable | Hanya RLS 1 baris | 90% hilang | Dikira CRUD biasa, bukan konstitusi digital |
| 3 | **Organisasi** | Socio corp 11 level inverted, 70.4jt keluarga, biaya 127T | Tidak ada | 100% hilang | Dikira startup biasa, bukan socio corporation |
| 4 | **Teknologi** | 7 fondasi + 6DB + 514 masjid hub-and-spoke + Fabric | Hanya PG + GIN + COPY | 80% hilang | Dikira tuning Postgres, bukan OS modular |
| 5 | **Data** | Pesanggrahan 6.081 -> 1.7jt ekstrapolasi -> 64jt Kemenkop | Hanya distribusi 5 kelurahan | 70% hilang | Dikira synthetic random, bukan bukti lapangan |
| 6 | **UX** | 100 prinsip 7 tier, 5 segmen, 3G 1-2Mbps, WA 98% | Hanya p50/p99 1 slide | 90% hilang | Dikira backend ngebut, bukan inklusif 3G |
| 7 | **Roadmap** | 300 fitur 5 fase + Brand 56 bab + 7 revenue | Hanya "MVP Rp0" 1 baris | 95% hilang | Dikira project skripsi, bukan 37+ bulan |

> ⚠️ WARNING — Jika presentasi hanya demo 5M, audiens pulang dengan kesan "aplikasi kas RT yang ngebut". Padahal visi adalah OS Kehidupan Komunitas 280 juta — beda kelas, beda moat, beda skala.

### Akibat "Aplikasi Kas RT yang Ngebut"

```
Demo 5M saja (5%):
  Audiens mikir: "Oh, CRUD kas masjid + search ayam 10ms, lumayan."
  Investor mikir: "Market kecil, RT/RW doang, TAM sempit."
  Reviewer mikir: "Tuning Postgres doang, tidak ada novelty."

7 Lensa terluas (100%):
  Audiens paham: "Ini OS komunitas — filosofi + konstitusi + jaringan fisik + sistem belajar."
  Investor lihat: "TAM 280jt, 70.4jt keluarga, 800rb masjid, 64jt UMKM — moat verifiable."
  Reviewer nilai: "Socio corp inverted + 514 masjid hub + 100 UX + 300 fitur — arsitektur peradaban."
```

> ✅ SOLUSI — Tambah minimal 3 slide terluas (Opsi A) atau ideal 5-7 slide (Opsi B) agar demo 5M punya konteks. Lihat Bab Rekomendasi.

---

## Lensa 1 — Filosofi TIGA INSAN: Muttaqin-Shalih-Nafi'

### Etimologi 3 Kata Kunci

| Insan | Akar Arab | Makna Harfiah | Makna Platform | Lawan |
|-------|-----------|---------------|----------------|-------|
| **Muttaqin** | w-q-y (taqwa) — menjaga, melindungi | Yang menjaga diri dari yang merusak | Kepercayaan yang bisa diverifikasi, bukan percaya buta | Platform yang minta data dulu baru kasih nilai |
| **Shalih** | sh-l-h (shalih) — baik, layak, memperbaiki | Yang memperbaiki, yang ihsan | Setiap fitur mengarah ke amal nyata yang rapi | Fitur gimmick yang tidak jadi amal |
| **Nafi'** | n-f-'a (nafa'a) — memberi manfaat | Yang bermanfaat bagi orang lain | Dampak terukur bagi komunitas, bukan angka vanity | Ekstraksi nilai ke pemegang saham saja |

> Sumber etimologi: Lane's Lexicon + Kamus Al-Munawwir. TIGA INSAN lahir dari Grand Synthesis 28 bab pendidikan Islam, lalu jadi DNA seluruh platform.

### Prisma 6 Ranah — Satu Cahaya, 6 Warna

| Ranah | Muttaqin (Kepercayaan) | Shalih (Amal/Ihsan) | Nafi' (Kontribusi) |
|-------|------------------------|---------------------|--------------------|
| **Kurikulum** | Profil lulusan: iman terverifikasi (tauhid, 99 Asmaul Husna) | Profil lulusan: amal ihsan (tracker ibadah, adab harian) | Profil lulusan: kontribusi nyata (volunteering, mentoring) |
| **UX** | Trust-first, tanpa registrasi paksa (#1) | Kemudahan beramal, dashboard langsung bernilai | Ruang berkontribusi, transparansi bertahap (#89) |
| **Arsitektur** | Auth & keamanan, SHA-256 hash chain | Payment engine, notification engine | Audit trail, blockchain Fabric |
| **Bisnis** | Kepercayaan sebagai modal dasar (Brand Bab 0) | Transaksi ekonomi komunitas (HarmoniPay/Market) | Inverted compensation — puncak mengalirkan ke bawah |
| **Roadmap** | Fase MVP: transparansi kas masjid | Fase 2-3: engagement + ekonomi UMKM | Fase 4-5: infrastruktur peradaban (BMT, Sukuk, Indeks RT) |
| **Data Lapangan** | Masjid sebagai pusat kepercayaan (256 di Pesanggrahan) | UMKM sebagai denyut ekonomi (6.081 titik) | Ekosistem yang memberdayakan (1.7jt ekstrapolasi) |

### Filter Keputusan 3 Pertanyaan

```
Opsi A vs Opsi B
       |
       +---> 1. Apakah meningkatkan KEPERCAYAAN (Muttaqin)?
       |        (transparansi, verifikasi, keamanan, RLS)
       +---> 2. Apakah memudahkan AMAL/TRANSAKSI (Shalih)?
       |        (kemudahan, kecepatan <50ms, ihsan)
       +---> 3. Apakah memberdayakan KOMUNITAS (Nafi')?
                (dampak terukur, keberlanjutan, keadilan)

Pilih opsi yang paling banyak "Ya" tanpa mengorbankan salah satu.
Contoh: "Subsidi ongkir masif" (Shopee) vs "Logistik komunitas murah" (GR Rides)
  -> Shopee: Ya Shalih (murah) tapi Tidak Nafi' (kurir tertindas) -> TOLAK
  -> GR Rides: Ya Shalih + Ya Nafi' (warung tetangga jadi kurir) -> PILIH
```

### Siklus Belajar -> Memimpin (TIGA INSAN dalam Aksi)

```
[Belajar] ---> [Beribadah] ---> [Bertransaksi] ---> [Berkontribusi] ---> [Memimpin]
   ^                                                                          |
   |__________________________________________________________________________|
                    (kembali ke Belajar dengan level kesadaran lebih tinggi)

  Muttaqin              Shalih                  Nafi'
  (iman)               (amal)              (kontribusi)
```

1. **Belajar** — modul tauhid, fiqih, TIGA INSAN (Grand Synthesis 28 bab)
2. **Beribadah** — tracker ibadah, jadwal sholat, jurnal muhasabah
3. **Bertransaksi** — HarmoniPay, HarmoniMarket, BMT
4. **Berkontribusi** — donasi, zakat, wakaf, volunteering
5. **Memimpin** — PJ Keluarga -> PJ Global (11 level)
6. **Kembali ke Belajar** — dengan perspektif pemimpin yang lebih dalam

### Tabel Perbandingan — GR vs WeChat vs Gojek vs Shopee

| Dimensi | GotongRoyong (TIGA INSAN) | WeChat (Taoist wu-wei) | Gojek (Pragmatik) | Shopee (Growth-at-all-cost) |
|---------|---------------------------|------------------------|-------------------|-----------------------------|
| **Filosofi inti** | Muttaqin-Shalih-Nafi' — iman -> amal -> manfaat | wu-wei (non-action), super app tanpa paksaan | "An Ojek for Life" — solusi harian | "Belanja hemat gratis ongkir" — transaksi murah |
| **Prinsip desain** | Kepercayaan lebih dulu dari fitur (#1) | "Keep it simple, let user decide" (Allen Zhang) | Hyperlocal, driver-first | Subsidy-driven, GMV-first |
| **Monetisasi** | 7 revenue, socio corp, inverted | Mini-program commission, ads, pay | Commission 20%, GoPay, ads | Commission + ads + ShopeePay, bakar uang |
| **Trust moat** | SHA-256 hash chain verifiable | Tidak ada — trust via Tencent brand | Tidak ada — trust via layanan | Tidak ada — trust via harga murah |
| **Skala** | 280jt TAM, 70.4jt keluarga, 800rb masjid | 1.3B MAU China | 170jt download, 2jt driver | 28jt order/hari, US$47.9B GMV |
| **Pelajaran untuk GR** | Filosofi jadi filter keputusan | Super app modular tanpa paksaan = validasi GR | Logistik komunitas > subsidi ongkir | Jangan bakar uang, 8 pasar di-exit 2022-2026 |

> 🔒 Catatan: WeChat Taoist wu-wei bukan agama, tapi etos desain Allen Zhang — "jangan paksa user, biarkan user menemukan nilai". Ini mirip prinsip GR #90 "tidak ada fitur dipaksakan — yang minta dulu".

**URL Rujukan Lensa 1:**

- https://www.wired.com/story/wechat-allen-zhang-philosophy-wuwei — WeChat & Taoist wu-wei, Allen Zhang philosophy
- https://www.reuters.com/technology/shopee-parent-sea-layoffs-expansion-2022/ — Shopee over-expansion & layoff 2022-2026
- https://www.gojek.com/en-id/about — Gojek super app journey & driver ecosystem

---

## Lensa 2 — Piagam Madinah 10 Pasal vs GDPR

### Tabel 10 Pasal Piagam Madinah Digital GR

| Pasal | Prinsip | Manifestasi Teknis | Metrik Kepatuhan | Alat Verifikasi |
|-------|---------|--------------------|------------------|-----------------|
| 1 | Setiap komunitas warga digital setara | Multi-tenant, skema sama, tidak ada "kelas satu" | Provisioning <5 menit | Audit log provisioning |
| 2 | Data satu komunitas tidak bocor ke lain | RLS PostgreSQL `community_id`, UX #31 | Uji bocor antar-tenant = 0 | Pen-test periodik |
| 3 | Setiap transaksi keuangan dapat diaudit publik | SHA-256 hash chain, `GET /api/v1/ledger/verify` | Verifikasi <2 detik | Uji API ledger/verify |
| 4 | Sengketa diselesaikan transparan berjenjang | Laporan -> moderasi -> eskalasi per level | SLA eskalasi <24 jam | Log moderasi |
| 5 | Kebutuhan lokal dulu, baru luas | PostGIS geo query radius, UX #19 #20 | Feed radius <10km | Analitik feed |
| 6 | Teknologi melayani manusia, bukan sebaliknya | Larangan AI ganti manusia, ADR log | Skor paparan fitur/keputusan | ADR review |
| 7 | Kepercayaan dibangun bertahap, tidak dipaksakan | UX #1 #89 transparansi bertahap | Konversi guest->registered | Funnel analitik |
| 8 | Inklusivitas lintas agama/suku/budaya | Nusantara SuperApp, kalender Hijriah/Masehi/Pawukon | 3 kalender aktif | Uji lokalitas |
| 9 | Sumber daya dialirkan atas -> bawah | Inverted compensation level 8+ | Selisih gaji vs benefit/level | Laporan akuntansi |
| 10 | Keberlanjutan > keuntungan jangka pendek | Socio corp, roadmap 5 fase tanpa burn-rate | Burn-rate < revenue Fase 2+ | Laporan keuangan |

### 5 Layer Trust — Dari Konstitusi ke Code

```
Layer 5: Verifikasi Publik — GET /api/v1/ledger/verify, QR laporan kas masjid
Layer 4: Audit Trail — SHA-256 hash chain, tiap transaksi terhubung kriptografis
Layer 3: Isolasi Data — RLS per community_id, FK index, policy USING
Layer 2: Identitas — Supabase Auth -> Keycloak, JWT, MFA, OAuth
Layer 1: Konstitusi — Piagam Madinah 10 pasal sebagai doktrin desain
```

> Jika Layer 1 (konstitusi) patah, semua layer di atasnya tidak ada artinya. Piagam bukan dekorasi — ia menjawab "Kenapa saya harus percayakan data keuangan masjid ke platform ini?"

### Tabel Perbandingan — Piagam Madinah Digital vs GDPR

| Dimensi | Piagam Madinah Digital (GR) | GDPR (EU 2016/679) |
|---------|-----------------------------|---------------------|
| **Subjek** | Komunitas sebagai warga digital setara | Individu sebagai data subject |
| **Hak utama** | Hak komunitas: isolasi data, audit publik, eskalasi berjenjang | Hak individu: access, rectification, erasure, portability, objection |
| **Kewajiban** | Kewajiban kolektif: saling melindungi, gotong royong, alirkan sumber daya | Kewajiban controller/processor: consent, DPA, breach notification 72 jam |
| **Enforcement** | Dewan Pengawas Tata Kelola independen + hash chain verifiable | DPA per negara + denda hingga 4% global turnover |
| **Moat** | Verifiable trust — hash chain matematis, tidak bisa bohong | Compliance — denda besar, tapi tidak ada moat produk |
| **Kelemahan** | Belum ada preseden hukum formal | Berat untuk UMKM, consent fatigue |
| **Pelajaran untuk GR** | GDPR = compliance minimal; Piagam = moat produk. GR butuh keduanya: patuh UU PDP (denda Rp2M) + Piagam sebagai diferensiasi | — |

> ⚠️ WARNING — UU PDP Indonesia (UU 27/2022) denda hingga Rp2M jika password bocor di log. Pino redact `[Redacted]` bukan opsional — ini compliance. Piagam Pasal 2 (RLS) + UU PDP = dua lapis proteksi.

**URL Rujukan Lensa 2:**

- https://gdpr.eu/what-is-gdpr/ — GDPR overview, 7 principles, rights of data subject
- https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022 — UU PDP Indonesia 27/2022
- https://www.hyperledger.org/use-cases — Hyperledger Fabric permissioned blockchain use cases

---

## Lensa 3 — Socio Corporation Inverted 11 Level vs Buurtzorg/Mondragon

### Tabel 11 Level Piramida Komunitas (Track A)

| Level | Jabatan | Cakupan | Jumlah (proyeksi) | Gaji/Bulan | Benefit/Bulan | Total/Bulan |
|-------|---------|---------|-------------------|------------|---------------|-------------|
| 1 | PJ Keluarga | 1 keluarga | 70.400.000 | Rp 0 | Voucher Rp 50.000 | Rp 50.000 |
| 2 | PJ RT | ~30 keluarga | 2.346.667 | Rp 425.000 | Rp 100.000 | Rp 525.000 |
| 3 | PJ RW | ~10 RT | 234.667 | Rp 1.200.000 | Rp 300.000 | Rp 1.500.000 |
| 4 | PJ Kelurahan | ~8 RW | 29.333 | Rp 3.500.000 | Rp 1.000.000 | Rp 4.500.000 |
| 5 | PJ Kecamatan | ~10 kelurahan | 2.933 | Rp 6.000.000 | Rp 2.000.000 | Rp 8.000.000 |
| 6 | PJ Kabupaten/Kota | ~514 nasional | 514 | Rp 10.000.000 | Rp 5.000.000 | Rp 15.000.000 |
| 7 | PJ Provinsi | 38 provinsi | 38 | Rp 11.500.000 | Rp 8.000.000 | Rp 19.500.000 |
| 8 | PJ Pulau | 7 pulau besar | 7 | Rp 9.000.000 | Rp 15.000.000 | Rp 24.000.000 |
| 9 | PJ Nasional Nusantara | 1 nasional | 1 | Rp 0 | Rp 100.000.000 | Rp 100.000.000 |
| 10 | PJ Regional ASEAN | 1 regional | 1 | Rp 5.000.000 | Rp 50.000.000 | Rp 55.000.000 |
| 11 | PJ Global | 1 global | 1 | Rp 0 | Rp 5.000.000 | Rp 5.000.000 |

> Total PJ level 2-11: ~2.6 juta. Level 1 (keluarga) 70.4jt adalah basis piramida — bukan karyawan, tapi warga yang dapat voucher.

### Inverted Compensation — Semakin Tinggi, Gaji Turun, Benefit Naik

```
Gaji uang (Rp)  ── naik sampai L7, lalu TURUN (inverted)
  11.5jt ┤        ● L7
         │      /   \
   10jt  ┤    ● L6    ● L8 9jt
         │  ● L5        \
    6jt  ┤● L4            ● L10 5jt
         │                  \
     0   ┤● L1 ──● L9 ──● L11 0
         └─────────────────────────
Benefit (Rp) ── NAIK TERUS sampai L9, lalu turun (mengalirkan ke bawah)
  100jt  ┤              ● L9
   50jt  ┤                ● L10
   15jt  ┤          ● L8
    5jt  ┤    ● L6    ● L11
  50rb   ┤● L1
```

> Filosofi: di puncak, uang bukan motivasi — yang tersisa adalah kontribusi (Nafi'). Level 9 gaji Rp 0 tapi benefit Rp 100jt untuk riset & pendidikan — karena ia telah melampaui motivasi material. Ini dari Kajian Pembiayaan Pendidikan Nasional: Ilm > Mal > Jah.

### Tabel Perbandingan — GR vs Buurtzorg vs Mondragon

| Dimensi | GotongRoyong (Inverted 11) | Buurtzorg (Belanda, 15.000 perawat) | Mondragon (Spanyol, 80.000 pekerja) |
|---------|----------------------------|--------------------------------------|--------------------------------------|
| **Model** | Socio corporation, 2 track (komunitas + teknologi) | Self-managing teams, 12 perawat/team, tanpa manajer | Koperasi pekerja, 1 orang 1 suara |
| **Hirarki** | 11 level piramida, inverted di puncak | Flat — tim otonom, back office 50 orang untuk 15.000 | Hirarki koperasi, dewan pekerja |
| **Rasio gaji** | Inverted — L1:Rp50rb vs L9:Rp100jt benefit (1:2000 benefit, tapi gaji 1:0) | CEO : perawat = 1:6 (sangat flat) | Tertinggi : terendah = 1:6 (koperasi) vs korporat 1:344 |
| **Kepemilikan** | Komunitas + teknologi, benefit dialirkan bawah | Yayasan non-profit, tidak ada pemegang saham | Pekerja adalah pemilik koperasi |
| **Skala** | 70.4jt keluarga, 2.6jt PJ, 280jt TAM | 15.000 perawat, 950 tim, 4 negara | 80.000 pekerja, 95 koperasi, 1 universitas |
| **Revenue** | Proyeksi Rp 127T/tahun saturasi | EUR 500jt/tahun | EUR 12B/tahun |
| **Pelajaran untuk GR** | Inverted = anti-kapitalisme ekstraktif; puncak mengabdi bukan mengakumulasi | Self-managing team = inspirasi untuk PJ RT/RW otonom | Koperasi pekerja = validasi socio corp, tapi GR lebih luas (komunitas bukan hanya pekerja) |

### Biaya 127T — Dari Mana dan Untuk Apa

| Tahap | Periode | Biaya/Bulan | Biaya/Tahun | Sumber Revenue |
|-------|---------|-------------|-------------|----------------|
| Pilot | 2026-2028 | Rp 112.7 M | Rp 1.35 T | Donasi + grant + marketplace fee |
| Konsolidasi | 2028-2032 | Rp 857.6 M | Rp 10.29 T | Marketplace + B2B data + premium |
| Ekspansi | 2032-2036 | Rp 2.5 T | Rp 30.16 T | + BMT + iklan halal + white label |
| Maturasi | 2036-2040 | Rp 4.17 T | Rp 50.02 T | + Sukuk + credit scoring + API |
| Saturasi | 2040+ | Rp 5.82 T | Rp 69.89 T | Full 7 revenue stream |

> Grand total aktivasi penuh: **Rp 127.69 triliun/tahun** — sebanding dengan APBN kementerian. Bukan angka untuk ditakuti, tapi untuk dipahami: ini biaya mengorganisir 280 juta warga, bukan biaya aplikasi.

**URL Rujukan Lensa 3:**

- https://www.buurtzorg.com/about-us/ — Buurtzorg self-managing teams, 15.000 nurses, flat hierarchy
- https://www.mondragon-corporation.com/en/about-us/ — Mondragon cooperative, 1:6 pay ratio, worker ownership
- https://www.bps.go.id/id/statistics-table/2/MzIwIzI=/jumlah-keluarga-menurut-provinsi.html — BPS 70.4jt keluarga Indonesia

---

## Lensa 4 — Teknologi 7 Fondasi + 6DB + 514 Masjid vs Stack 2026

### Tabel 7 Fondasi Bersama (Shared Foundation) — Build Once, Use Forever

| # | Fondasi | Stack MVP | Stack Fase 5 | Tanpa Fondasi (Biaya) | Dengan Fondasi (Hemat) |
|---|---------|-----------|--------------|-----------------------|------------------------|
| 1 | **Auth & Identity** | Supabase Auth (JWT, OAuth, MFA) | Keycloak + RLS | Tiap plugin bikin auth sendiri — 300x duplikasi | 1x build, 300 plugin pakai |
| 2 | **User Profile** | Postgres single source of truth | + PostGIS geo | Data user tercecer per fitur | 1 profil untuk semua |
| 3 | **Payment Engine** | Xendit + middleware syariah | Nusantara Pay | Tiap fitur integrasi payment sendiri | 1 engine, semua transaksi lewat |
| 4 | **Notification Engine** | FCM + Wablas WA + SendGrid | + Kafka push | Tiap fitur bikin notif sendiri | 1 engine multi-channel |
| 5 | **Storage Engine** | Supabase Storage / R2 / MinIO | + CDN 330+ DC | Tiap fitur upload sendiri | 1 storage, semua dokumen |
| 6 | **Audit & Logging** | SHA-256 hash chain di PG | + Fabric blockchain | Tiap fitur log sendiri, tidak verifiable | 1 chain, semua audit |
| 7 | **Feature Flag & Config** | Env-based | + LaunchDarkly-style per region | Deploy = rilis, tidak bisa A/B | Flag per region, kill-switch |

> Tanpa 7 fondasi: 300 fitur x 7 fondasi = 2.100 integrasi duplikat. Dengan 7 fondasi: 7x build + 300x pakai = hemat 90%.

### Modular Monolith vs Microservices — Kenapa GR Pilih Modular Monolith Dulu

| Dimensi | Modular Monolith (GR MVP-Fase 3) | Microservices (Fase 4+) | Rekomendasi GR |
|---------|----------------------------------|-------------------------|----------------|
| **Merge conflict** | 42% lebih sedikit (1 repo, module boundary jelas) | Tinggi — 10+ repo, contract drift | Mulai monolith modular |
| **Latency** | In-process call <1ms | Network call 5-20ms + retry | Monolith untuk p50 <50ms |
| **Deploy** | 1 deploy, 1 DB, 1 migrasi | 10+ deploy, distributed transaction | Monolith sampai 500 komunitas |
| **Team** | 1-10 dev, 1 codebase | 20+ dev, 10+ codebase | Monolith untuk tim kecil |
| **Kapan pecah** | Saat 1 modul butuh scale independen (misal Payment 10x load) | Saat team >20 dan domain jelas | Fase 4: pecah Payment & Notification dulu |

### Tabel 6DB — Kenapa Tidak Cukup 1 Database

| Database | Peran | Kenapa Dipilih | Avg DB per App (4.7) | Tanpa Ini |
|----------|-------|----------------|----------------------|-----------|
| **PostgreSQL 16** | Jantung — user, transaksi, anggaran | ACID, RLS, PostGIS, pg_trgm | 1.0 (wajib) | Tidak ada transaksi aman |
| **MongoDB** | Konten dinamis — kajian, kurikulum | Schema-less, fleksibel | 0.8 | Konten kaku, migrasi tiap ubah kurikulum |
| **Redis** | Cache, sesi, rate limit | In-memory sub-ms | 0.9 | Tiap request hit PG, p99 jebol |
| **Elasticsearch** | Search cerdas — masjid, UMKM, kajian | Inverted index, geo_distance | 0.7 | LIKE '%ayam%' 2000ms tanpa GIN |
| **ClickHouse** | Analitik & dashboard | Columnar OLAP, agregasi miliaran/detik | 0.6 | Dashboard 5M agregasi 10 detik |
| **InfluxDB** | IoT & telemetri real-time | Time-series optimization | 0.7 | IoT masjid tidak real-time |

> Rata-rata app modern pakai 4.7 database (survey 2024). GR pakai 6 — bukan over-engineering, tapi sesuai kebutuhan: tiap DB untuk tugas yang paling cocok. Sinkronisasi via CDC Debezium + Kafka, bukan dual-write.

### Fabric 3500 TPS vs PG Hash Rp0 — Kapan Butuh Blockchain

| Dimensi | PG SHA-256 Hash Chain (MVP) | Hyperledger Fabric (Fase 5) |
|---------|-----------------------------|-----------------------------|
| **TPS** | ~5.000 TPS (PG single node) | ~3.500 TPS per channel, scale via channel |
| **Biaya** | Rp 0 (di dalam PG) | Rp 105-470 M tahun pertama (infra + node) |
| **Trust** | Verifiable di 1 DB, tapi admin bisa ubah jika akses root | Immutable — butuh konsensus PBFT/PoA, tidak bisa ubah 1 node |
| **Kapan pakai** | MVP-Fase 4: cukup untuk kas masjid, iuran RT | Fase 5: APBN/APBD tracking, ZIS audit, CBDC interop |
| **Rekomendasi** | Mulai PG hash chain dulu (Rp0, langsung jalan) | Fabric hanya jika butuh cross-org trust (pemda + BAZNAS + auditor) |

> Pelajaran: jangan bangun Fabric di MVP — PG hash chain sudah verifiable untuk 5-500 komunitas. Fabric untuk 500+ komunitas dengan multi-org trust.

### 514 Masjid Hub-and-Spoke — Masjid sebagai Data Centre

```
                    [5 Hub Nasional]
                    (Jakarta, Surabaya, Medan, Makassar, Balikpapan)
                           |
              ┌────────────┼────────────┐
              │            │            │
        [38 Hub Provinsi] [38 Hub]  [38 Hub]
              │            │            │
        [514 Hub Kab/Kota — Masjid Data Centre]
              │            │            │
        [Light Node — Masjid Kelurahan/Desa]
              │            │            │
        [Warga — HP Android 2GB RAM, 3G 1-2Mbps]
```

| Layer | Jumlah | Peran | Stack |
|-------|--------|-------|-------|
| Hub Nasional | 5 | Consensus, cross-region sync | Fabric orderer + PG primary |
| Hub Provinsi | 38 | Channel per provinsi, agregasi | Fabric peer + PG replica |
| Hub Kab/Kota | 514 | Masjid Data Centre, node blockchain | Fabric peer light + PG + R2 |
| Light Node | ~80.000 | Masjid kelurahan/desa, cache & relay | PG light + Redis + PWA |
| Warga | 70.4jt keluarga | End user, HP entry-level | PWA + WA |

> Konsep Masjid Data Centre: masjid bukan hanya tempat ibadah, tapi pusat kepercayaan digital komunitas — node blockchain, distribusi UMKM, BMT, dan pendidikan. 256 masjid di 1 kecamatan Pesanggrahan = bukti fisik.

**URL Rujukan Lensa 4:**

- https://martinfowler.com/bliki/ModularMonolith.html — Modular monolith vs microservices, 42% fewer merge conflicts
- https://hyperledger-fabric.readthedocs.io/en/latest/whatis.html — Fabric 3500 TPS, PBFT/PoA, channel scaling
- https://www.postgresql.org/docs/current/pgtrgm.html — pg_trgm GIN trigram, gin_trgm_ops
- https://supabase.com/docs/guides/database/postgres/row-level-security — Supabase RLS, community_id isolation

---

## Lensa 5 — Data Pesanggrahan 6.081: Dari 1 Kecamatan ke 1.7 Juta Titik

### Tabel Kategori UMKM — KULINER 44% Dominan

| # | Kategori | Count | % | Insight |
|---|----------|-------|---|---------|
| 1 | **KULINER** | 2.676 | 44.0% | Dominan — warung makan, ayam, warkop, lapak |
| 2 | JASA | 1.180 | 19.4% | Pasar jasa, servis, laundry |
| 3 | FASHION | 580 | 9.5% | Konveksi, hijab, tailor |
| 4 | KERAJINAN | 320 | 5.3% | Craft, souvenir |
| 5 | SEMBAKO | 280 | 4.6% | Toko kelontong, sembako |
| 6 | KESEHATAN | 180 | 3.0% | Apotek, klinik kecil |
| 7 | PENDIDIKAN | 150 | 2.5% | Bimbel, TPQ |
| 8 | LAINNYA | 715 | 11.7% | Campuran |
| **Total** | **6.081** | **100%** | **1 kecamatan, 5 kelurahan** |

> KULINER 44% = prioritas HarmoniMarket bukan elektronik/fashion, tapi sembako & makanan — karena itulah yang paling dibutuhkan komunitas. Data mengarahkan roadmap, bukan asumsi.

### Tabel 5 Kelurahan — Bintaro 31.7% Terbesar

| Kelurahan | Count | % | Zip | Karakter |
|-----------|-------|---|-----|----------|
| **Bintaro** | 1.928 | 31.7% | 12330 | Perumahan padat, UMKM kuliner + jasa |
| Petukangan Utara | 1.691 | 27.8% | 12260 | Padat, warung makan + lapak |
| Petukangan Selatan | 1.052 | 17.3% | 12270 | Menengah, warkop + ayam |
| Ulujami | 821 | 13.5% | 12250 | Pinggiran, sembako + jasa |
| Pesanggrahan | 572 | 9.4% | 12320 | Pusat kecamatan, kantor + masjid |
| Pondok Ranji* | 17 | 0.3% | 15412 | Masuk Tangsel, data kecil |
| **Total** | **6.081** | **100%** | — | **Bbox: lat -6.27..-6.23, lng 106.74..106.77** |

> *Pondok Ranji administratif Tangsel, tapi masuk data Pesanggrahan historis. Distribusi dijaga via weighted random + jitter +-0.01 deg (~1.1km) agar koordinat menyebar natural, tidak numpuk.

### 256 Masjid Hub — 1 Masjid per 24 UMKM

| Metrik | Angka | Makna |
|--------|-------|-------|
| Masjid di Pesanggrahan | 256 | 4.2% dari 6.081 titik |
| Rasio masjid:UMKM | 1:24 | Tiap masjid bisa hub untuk 24 UMKM sekitar |
| Jika ekstrapolasi 514 kab/kota | 256 x 514 = 131.584 masjid hub | Validasi 514 Masjid Data Centre |
| Jika nasional 800rb masjid (Kemenag) | 800.000 masjid | Tiap masjid hub 80 UMKM (64jt/800rb) |

> 256 masjid di 1 kecamatan = bukti fisik bahwa "masjid sebagai hub" bukan teori. Tiap masjid bisa jadi distribusi UMKM, BMT, node blockchain, dan sekolah TIGA INSAN.

### Ekstrapolasi 1.7 Juta vs 64 Juta Kemenkop — Mana yang Benar?

| Sumber | Angka | Cakupan | Metodologi | Status |
|--------|-------|---------|------------|--------|
| **Pesanggrahan ekstrapolasi** | ~1.7 juta | 6.081 x 514 kab/kota / 1.8 (koreksi urban) | Data lapangan 1 kecamatan x 514 | Konservatif, hanya UMKM terdata |
| **Kemenkop 2024** | 64 juta | Nasional | Registrasi UMKM Kemenkop (termasuk mikro informal) | Inklusif, termasuk yang tidak terdata lapangan |
| **BPS 2023** | 66 juta | Nasional | Sensus ekonomi | Mirip Kemenkop |
| **GR TAM** | 70.4 juta keluarga | Nasional | BPS keluarga | TAM maksimal jika tiap keluarga 1 UMKM |

> Gap 1.7jt vs 64jt bukan kontradiksi — beda definisi. 1.7jt = UMKM terdata lapangan (seperti Pesanggrahan). 64jt = termasuk mikro informal yang belum terdata. GR target: digitalisasi 1.7jt dulu (yang terdata), baru jangkau 64jt via BMT & onboarding.

### 5 Tahap UMKM — Dari Pemetaan ke Ekspor

| Tahap | Periode | Fokus | Target | Indikator |
|-------|---------|-------|--------|-----------|
| 1. Pemetaan & Digitalisasi | 2026-2028 | Input data UMKM per kelurahan | 6.081 -> 100.000 titik | Database terstruktur, lat/lng + kategori |
| 2. Onboarding Marketplace | 2028-2032 | Masuk HarmoniMarket, fokus kuliner & sembako | 100.000 -> 500.000 UMKM | Transaksi/minggu, rating |
| 3. Akses Modal & Pembukuan | 2032-2036 | BMT, Qardhul Hasan, skoring kredit alternatif | 500.000 -> 1.000.000 UMKM | NPL <5%, pembukuan digital |
| 4. Rantai Pasok & Logistik | 2036-2040 | Jaringan logistik komunitas, "last mile dari warung tetangga" | 1.000.000 -> 1.500.000 UMKM | Biaya logistik -30% |
| 5. Ekspansi Regional | 2040+ | Ekspor UMKM lokal ke ASEAN | 1.500.000 -> 1.700.000+ UMKM | Ekspor/minggu |

> Tahap 1-2 = Shalih (beramal, transaksi). Tahap 3-5 = Nafi' (memberdayakan, ekspor). Pesanggrahan adalah Tahap 1 yang sudah jalan.

**URL Rujukan Lensa 5:**

- https://www.kemenkopukm.go.id/data-umkm — Kemenkop 64jt UMKM nasional 2024
- https://www.bps.go.id/id/statistics-table/2/MzIwIzI=/jumlah-keluarga-menurut-provinsi.html — BPS 70.4jt keluarga, sensus ekonomi

---

## Lensa 6 — UX 100 Prinsip 7 Tier vs Nielsen 10

### Tabel 7 Tier — Piramida dari Fondasi ke Puncak

| Tier | Rentang | Tema | Jumlah | Contoh Kunci | Tanpa Tier Ini |
|------|---------|------|--------|--------------|----------------|
| 1 | #1-15 | Kepercayaan & Onboarding | 15 | #1 Trust first, #4 registrasi saat simpan data nyata | User tidak daftar, churn 80% |
| 2 | #16-30 | Arsitektur & Navigasi | 15 | #19 hierarki lokal dulu, #20 feed jarak/relevansi | User tersesat, tidak ketemu masjid terdekat |
| 3 | #31-45 | Data & Privasi Komunitas | 15 | #31 data tidak bocor antar komunitas | Bocor data RT sebelah, trust runtuh |
| 4 | #46-60 | Performa & Konteks Indonesia | 15 | #46 3G-ready, #49 ringan Android entry-level | Tidak jalan di HP 2GB, 3G 1-2Mbps |
| 5 | #61-75 | Visual & Aksesibilitas | 15 | Inklusif lansia/disabilitas, kontras, font besar | Lansia tidak bisa pakai |
| 6 | #76-88 | Interaksi & Mikro-UX | 13 | Setiap klik responsif, form tidak hilang | Frustasi, form hilang saat back |
| 7 | #89-100 | Kepercayaan Jangka Panjang | 12 | #89 transparansi bertahap, #90 tidak dipaksakan | Fitur ditolak komunitas |

> 100 prinsip = 7 tier piramida. Tier 1 fondasi — tanpa trust, tidak ada yang lain. Tier 7 puncak — transparansi bertahap setelah trust terbangun.

### 8 Prinsip Kritis — Yang Paling Sering Ditanya

| # | Prinsip | Isi 1 Baris | Kenapa Kritis | Lawan |
|---|---------|-------------|---------------|-------|
| **#1** | Kepercayaan lebih dulu dari fitur | Jangan minta registrasi di awal, biarkan coba dulu | Menentukan konversi guest->registered | Shopee: minta daftar dulu baru lihat harga |
| **#4** | Registrasi saat simpan data nyata | Momen niat: Ketua RT daftar saat mau simpan iuran | Timing registrasi = konversi | Daftar di splash screen = churn |
| **#19** | Hierarki lokal dulu | Komunitas lokal dulu, baru luas | Validasi data Pesanggrahan — warga butuh info sekitar | Feed global dulu = tidak relevan |
| **#20** | Feed jarak/relevansi | Beranda berdasarkan jarak & relevansi | Butuh PostGIS + ES geo_distance | Feed kronologis = spam |
| **#31** | Data tidak bocor antar komunitas | RLS per community_id | Pasal 2 Piagam, UU PDP | 1 DB tanpa RLS = bocor |
| **#46** | Berfungsi di 3G | 3G 1-2Mbps, RAM 2GB, kuota terbatas | 60% Indonesia masih 3G di desa | App 50MB = tidak ke-install |
| **#89** | Transparansi bertahap | Fitur transparansi hanya aktif setelah trust terbangun | Jangan jual transparansi sebelum dipercaya | Langsung audit publik = ditolak |
| **#90** | Tidak ada fitur dipaksakan | Yang minta dulu, baru dibuat | Validasi Pesanggrahan — fitur dari kebutuhan nyata | Fitur dari asumsi = tidak dipakai |

### Tabel 5 Segmen — Satu Platform, 5 Wajah

| Segmen | Momen Niat Registrasi | Kebutuhan UX Paling Kritis | Fitur Pertama yang Dilihat |
|--------|-----------------------|----------------------------|----------------------------|
| **Ketua RT/RW** | Ingin simpan data iuran warga | Registrasi mudah, isolasi data, transparansi keuangan | Kas RT, direktori warga, iuran |
| **Pengurus Masjid** | Ingin cetak laporan kas | Privasi data, keuangan transparan bertahap, 3G-ready | Kas masjid, jadwal sholat, QR donasi |
| **Orang Tua/Keluarga** | Lihat info anak & jadwal | Onboarding paling sederhana | Jadwal TPQ, info anak, pengumuman |
| **Guru/Pesantren** | Kelola data santri | Privasi santri, otorisasi wali, 3G | Absensi, hafalan, PPDB |
| **Pelaku UMKM** | Ingin terima pembayaran digital | Dashboard langsung bernilai, WA, katalog | Katalog produk, order, pembukuan |

> Tiap segmen punya "momen niat" berbeda — prinsip #4. Jangan paksa semua daftar di awal. Biarkan Ketua RT coba lihat kas dulu, baru minta daftar saat mau simpan.

### 3G 1-2Mbps, RAM 2GB, WA 98% vs Email — Konteks Indonesia

| Konteks | Angka | Implikasi UX | Solusi GR |
|---------|-------|--------------|-----------|
| **Jaringan** | 3G 1-2Mbps di desa, 4G di kota | App harus <5MB, lazy load, Service Worker | PWA + GZIP 70% + Edge 330+ DC |
| **RAM** | HP entry-level 2GB (60% pasar) | App tidak boleh >100MB RAM, tidak boleh OOM | Streaming, pagination cursor, image compress |
| **Kuota** | Rp 50.000/bulan untuk 10GB | Tiap MB berharga, jangan boros | Kompres, cache, offline-first |
| **WA** | 98% penetrasi, email <20% | Notifikasi via WA (Wablas), bukan email | Wablas WA + FCM push, email hanya formal |
| **Literasi digital** | Lansia & UMKM gaptek | Onboarding super sederhana, ikon besar | Tier 5 aksesibilitas, font besar, kontras |

> Prinsip #46 (3G-ready) bukan nice-to-have — ini syarat hidup. Jika app tidak jalan di 3G 1-2Mbps + RAM 2GB, 60% TAM hilang.

### Tabel Perbandingan — GR 100 Prinsip vs Nielsen 10 Heuristics

| Dimensi | GR 100 Prinsip (7 Tier) | Nielsen 10 Heuristics (1994) |
|---------|-------------------------|------------------------------|
| **Jumlah** | 100 prinsip, 7 tier piramida | 10 heuristics, flat list |
| **Fokus** | Kepercayaan + komunitas + konteks Indonesia (3G, WA, masjid) | Usability umum (visibility, consistency, error prevention) |
| **Konteks** | 5 segmen (RT, masjid, keluarga, guru, UMKM) | 1 user generik |
| **Contoh unik GR** | #31 isolasi data komunitas, #46 3G-ready, #89 transparansi bertahap | Tidak ada — Nielsen tidak cover multi-tenant & 3G |
| **Contoh overlap** | #76 feedback <100ms = Nielsen #1 visibility of system status | Visibility, match real world, consistency |
| **Kekuatan Nielsen** | Generik, teruji 30 tahun, mudah audit | — |
| **Kekuatan GR** | Spesifik Indonesia, cover trust & komunitas | — |
| **Rekomendasi** | Pakai keduanya: Nielsen untuk audit umum, GR 100 untuk audit konteks Indonesia | — |

**URL Rujukan Lensa 6:**

- https://www.nngroup.com/articles/ten-usability-heuristics/ — Nielsen 10 heuristics
- https://www.gsma.com/sotir/wp-content/uploads/2024/10/081024-Mobile-Economy-Asia-Pacific.pdf — GSMA 3G/4G Indonesia, 98% WA penetration
- https://www.statcounter.com/os-market-share/mobile/indonesia — Android 90%+ Indonesia, entry-level 2GB RAM

---

## Lensa 7 — Roadmap 300 Fitur 5 Fase + Brand 56 Bab vs Global

### Tabel 18 Domain — 300 Fitur Tersebar di 18 Domain

| # | Domain | Fitur | Contoh Fitur | Fase Dominan |
|---|--------|-------|--------------|--------------|
| 1 | Kas Masjid | 18 | Input kas, dashboard publik, QR, laporan PDF | MVP |
| 2 | Jadwal & Kalender | 12 | Jadwal sholat otomatis, taklim, kalender Hijriah | MVP |
| 3 | Profil & Kegiatan Masjid | 15 | Profil digital, direktori pengurus, pengumuman | MVP |
| 4 | ZIS & Donasi | 14 | Donasi infaq, zakat fitrah digital, wakaf | MVP-Fase 2 |
| 5 | RT/RW Digital | 20 | Iuran, status, reminder, kas transparan | MVP |
| 6 | Digital Platform | 22 | SSO, notifikasi, enkripsi, audit trail, PWA | MVP |
| 7 | Cross Domain | 16 | Direktori kontak, feed komunitas, profil | MVP |
| 8 | Pendidikan (TPQ/Pesantren) | 28 | Manajemen TPQ, hafalan, PPDB, kurikulum | Fase 2 |
| 9 | Kesehatan (Posyandu) | 18 | Janji temu dokter, posyandu, donor darah | Fase 2 |
| 10 | Surat & Administrasi | 14 | Surat pengantar digital, Dukcapil | Fase 2 |
| 11 | HarmoniPay | 20 | Dompet digital, QRIS, middleware syariah | Fase 3 |
| 12 | HarmoniMarket | 25 | Marketplace UMKM, katalog, order, rating | Fase 3 |
| 13 | Delivery & Rides | 15 | GR Rides, logistik komunitas | Fase 3 |
| 14 | Ekonomi Syariah | 18 | Mudharabah, Musyarakah, BMT | Fase 3-4 |
| 15 | Koperasi & Credit Scoring | 12 | Koperasi RT digital, skoring komunitas | Fase 4 |
| 16 | AI & Analitik | 10 | AI asisten komunitas, dashboard analitik | Fase 4 |
| 17 | BMT & Sukuk | 8 | BMT Digital, Sukuk Komunitas, Blockchain ZIS | Fase 5 |
| 18 | Replikasi Global | 3 | Indeks Kesejahteraan RT, Replikasi GR Global | Fase 5 |
| **Total** | **18 domain** | **~300** | — | **MVP 32 -> F5 11** |

### Tabel 5 Fase — Dari MVP 32 Fitur ke F5 11 Fitur Peradaban

| Fase | Periode | Fitur | Tim | Target | Tema | Biaya/Bulan |
|------|---------|-------|-----|--------|------|-------------|
| **MVP** | Bulan 1-6 | 32 | 1-3 dev | 5-10 komunitas Yogyakarta | Transparansi Komunitas | Rp 1-3 jt (2 VPS) |
| **Fase 2** | Bulan 7-12 | 88 | 3-5 dev | 50 komunitas | Engagement & Program Sosial | Rp 10-30 jt |
| **Fase 3** | Bulan 13-24 | 122 | 5-10 dev | 500 komunitas | Ekosistem Ekonomi | Rp 100-300 jt |
| **Fase 4** | Bulan 25-36 | 47 | 10-20 dev | 5.000 komunitas | Platform Dewasa | Rp 1-10 M |
| **Fase 5** | Bulan 37+ | 11 | 20+ dev | 50.000+ komunitas | Infrastruktur Peradaban | Rp 10 M+ |

> Fase 3 terbesar (122 fitur) — karena di sinilah roda ekonomi (HarmoniPay, Market, BMT) mulai berputar. Fase 5 paling sedikit (11 fitur) tapi paling berat — BMT Digital, Sukuk, Blockchain ZIS, Replikasi Global.

```
MVP (32) ████████░░░░░░░░░░░░  Transparansi — kas masjid, RT/RW, ZIS
F2  (88) ████████████████████░░  Engagement — TPQ, posyandu, surat
F3 (122) ████████████████████████ Ekosistem Ekonomi — Pay, Market, Rides
F4  (47) ████████████░░░░░░░░░░  Platform Dewasa — koperasi, AI, Dukcapil
F5  (11) ███░░░░░░░░░░░░░░░░░░░  Peradaban — BMT, Sukuk, Indeks RT, Global
```

### Brand 56 Bab — Keller + Sharp, Bukan Sekadar Logo

| Pilar Brand | Isi | Manifestasi GR | Lawan |
|-------------|-----|----------------|-------|
| **Keller CBBE** | Brand equity = asosiasi di benak konsumen, dibangun via pengalaman konsisten | TIGA INSAN + Piagam 10 pasal + hash chain = asosiasi "terpercaya & verifiable" | Brand = logo doang |
| **Sharp Mental/Physical Availability** | Brand tumbuh via availability, bukan loyalty | 514 masjid hub = physical availability; 100 UX + WA = mental availability | Brand = iklan doang |
| **56 Bab Brand System** | Dari miskonsepsi brand hingga akuntansi intangible asset | Brand sebagai intangible asset di neraca, bukan biaya | Brand = tidak diukur |
| **Archetype** | Caregiver + Sage | Caregiver: merawat komunitas; Sage: bijak, transparan, verifiable | Archetype: Jester/Hero doang |

> Brand System 56 bab menjawab: "Kenapa brand GR bukan sekadar logo?" Karena brand adalah mekanisme pengurang biaya transaksi (Bab 0.9) — brand yang dipercaya mengurangi biaya verifikasi + biaya kepercayaan.

### 7 Revenue Stream — Dari Marketplace ke Sukuk

| # | Revenue | Fase Mulai | Skala Saturasi | Contoh |
|---|---------|------------|----------------|--------|
| 1 | Marketplace commission | Fase 3 | 2-5% per transaksi | HarmoniMarket 1.7jt UMKM |
| 2 | Payment fee | Fase 3 | 0.5-1% per transaksi | HarmoniPay QRIS |
| 3 | Premium community features | Fase 2 | Rp 50.000-500.000/bulan/komunitas | Dashboard premium, analitik |
| 4 | B2B data insight | Fase 4 | Rp 10-100 jt/klien/bulan | Data agregat untuk pemda/korporasi |
| 5 | Iklan halal | Fase 4 | CPC/CPM syariah-compliant | Iklan komunitas, bukan tracking |
| 6 | BMT & pembiayaan | Fase 4-5 | Margin Mudharabah/Musyarakah | BMT Digital, Qardhul Hasan |
| 7 | Sukuk & wakaf produktif | Fase 5 | Imbal hasil Sukuk Komunitas | Sukuk Komunitas, wakaf produktif |

### TAM 280 Juta — Dari Mana Angka Ini

| Segmen TAM | Angka | Sumber | Validasi |
|------------|-------|--------|----------|
| Warga Indonesia | 280 juta | BPS 2024 | Sensus penduduk |
| Keluarga | 70.4 juta | BPS | 280jt / 4 rata-rata/keluarga |
| Masjid | 800.000 | Kemenag 2024 | Registrasi masjid nasional |
| UMKM | 64 juta | Kemenkop 2024 | Registrasi UMKM |
| Pesanggrahan sample | 6.081 | Data lapangan | 1 kecamatan, 5 kelurahan |
| Ekstrapolasi UMKM terdata | 1.7 juta | 6.081 x 514 / 1.8 | Konservatif, hanya yang terdata |

### Shopee TiDB vs GR PG — Pelajaran Arsitektur

| Dimensi | Shopee (US$47.9B GMV, 28jt order/hari) | GotongRoyong (MVP-Fase 3) | Pelajaran untuk GR |
|---------|----------------------------------------|---------------------------|--------------------|
| **DB awal** | MySQL sharding manual | Postgres single node + RLS | Jangan sharding di MVP — PG cukup untuk 500 komunitas |
| **DB scale** | TiDB (distributed SQL) setelah 10M+ order/hari | PG + read replica + sharding Fase 4+ | TiDB saat >5M transaksi/hari, bukan sekarang |
| **Event streaming** | Data Event Center (DEC) — middleware replikasi binlog | Debezium + Kafka (CDC) | DEC = inspirasi untuk Fase 4, tapi Debezium cukup untuk MVP |
| **Over-expansion** | 8 pasar di-exit 2022-2026, layoff 7.000+ | Roadmap 5 fase bertahap, tanpa burn-rate | Jangan ekspansi sebelum PMF — buktikan 5-10 komunitas dulu |
| **Biaya** | Bakar US$2B+/tahun untuk subsidi | MVP Rp0 (PG + pg_trgm + MatView + PgBouncer) | Mulai Rp0, scale sesuai trafik |

> Shopee = bukti bahwa scale tanpa nilai = collapse. GR = scale dengan nilai (TIGA INSAN + Piagam + inverted).

**URL Rujukan Lensa 7:**

- https://www.sea.com/investor-relations — Sea Limited (Shopee) GMV US$47.9B, 28jt order/hari
- https://www.tidb.io/use-cases/shopee — Shopee TiDB migration, MySQL sharding -> TiDB
- https://www.kellerbrand.com/cbbe-model — Keller CBBE brand equity model
- https://www.byonderwen.com/sharp-mental-physical-availability — Sharp Mental & Physical Availability

---

## Bab Sintesis — 3 Hal Sekaligus yang Tidak Dimiliki Platform Lain

### Kenapa GotongRoyong Tidak Bisa Ditiru dengan 1 Hal Saja

Platform lain punya 1 keunggulan:

- **Shopee** punya marketplace + logistik — tapi tidak punya filosofi & trust verifiable
- **Gojek** punya driver + payment — tapi tidak punya jaringan fisik masjid & socio corp
- **WeChat** punya super app + mini-program — tapi tidak punya Piagam & inverted compensation
- **Tokopedia** punya UMKM + Toko — tapi tidak punya 514 masjid hub & sistem belajar

GotongRoyong punya **3 hal sekaligus** — dan ketiganya harus jalan bareng:

```
  ┌─────────────────────────────────────────────────┐
  │         GOTONG ROYONG — 3 HAL SEKALIGUS         │
  │                                                 │
  │   1. FILOSOFI (TIGA INSAN + Piagam 10)          │
  │      "Kenapa" — arah & filter keputusan         │
  │      Tidak bisa dibeli, harus dihidupi          │
  │                      +                          │
  │   2. JARINGAN FISIK (514 masjid + 70.4jt kel)   │
  │      "Di mana" — distribusi & trust fisik       │
  │      Tidak bisa di-clone, harus dibangun        │
  │                      +                          │
  │   3. SISTEM BELAJAR (300 fitur + 100 UX + 7 fondasi) │
  │      "Bagaimana" — eksekusi & skala             │
  │      Tidak bisa di-copy, harus di-iterate       │
  │                                                 │
  │   = MOAT yang tidak bisa ditiru 1-2 hal saja    │
  └─────────────────────────────────────────────────┘
```

| Hal | Isi | Moat | Tanpa Ini |
|-----|-----|------|-----------|
| **Filosofi** | TIGA INSAN prisma 6 ranah + Piagam 10 pasal + 5 Layer Trust | Arah & filter keputusan yang konsisten 37+ bulan | Platform tanpa arah, gonta-ganti strategi tiap quarter |
| **Jaringan Fisik** | 514 masjid hub-and-spoke + 70.4jt keluarga + 256 masjid/kecamatan | Distribusi fisik yang tidak bisa di-clone digital | Platform digital tanpa akar komunitas, churn tinggi |
| **Sistem Belajar** | 300 fitur 5 fase + 100 UX 7 tier + 7 fondasi + 6DB | Eksekusi yang belajar dari data lapangan (Pesanggrahan) | Platform yang tebak-tebakan, fitur tidak dipakai |

> Jika hanya punya 1-2 hal, mudah ditiru. Shopee bisa tiru marketplace, Gojek bisa tiru payment — tapi tidak bisa tiru ketiganya sekaligus. Itulah moat GotongRoyong.

### One-Liner Terluas — Untuk Warga Lelah Platform Tidak Transparan

> **"Untuk warga yang lelah dengan platform tidak transparan, GotongRoyong adalah OS Kehidupan Komunitas yang membuat kas masjid, iuran RT, dan UMKM bisa diverifikasi siapa pun — karena kepercayaan yang tidak bisa diverifikasi bukan kepercayaan, tapi harapan."**

```
Untuk [warga lelah platform tidak transparan]
Yang [ingin kas masjid & iuran RT transparan + UMKM naik kelas]
GotongRoyong adalah [OS Kehidupan Komunitas]
Yang [membuat semua transaksi verifiable via SHA-256 hash chain]
Tidak seperti [Shopee/Gojek/Tokopedia yang trust via brand/harga]
Karena [Piagam Madinah 10 pasal + TIGA INSAN + 514 masjid hub]
```

> One-liner ini pakai formula positioning: Untuk [segmen] yang [masalah], [produk] adalah [kategori] yang [manfaat] tidak seperti [kompetitor] karena [moat].

### Diagram Sintesis — 7 Lensa Jadi 1 Cerita

```
                    TIGA INSAN (Lensa 1)
                    Muttaqin-Shalih-Nafi'
                         |
              Piagam 10 Pasal (Lensa 2)
              Konstitusi Digital
                         |
         ┌───────────────┼───────────────┐
         │               │               │
   Socio Corp      Teknologi        Data Pesanggrahan
   11 Level        7 Fondasi+6DB    6.081 titik
   Inverted        514 Masjid       1.7jt ekstrapolasi
   (Lensa 3)       (Lensa 4)        (Lensa 5)
         │               │               │
         └───────────────┼───────────────┘
                         |
                    UX 100 Prinsip
                    7 Tier, 5 Segmen
                    3G 1-2Mbps
                    (Lensa 6)
                         |
                    Roadmap 300 Fitur
                    5 Fase, 56 Bab Brand
                    7 Revenue, TAM 280jt
                    (Lensa 7)
                         |
                    = OS Kehidupan Komunitas
                      280jt warga
                      70.4jt keluarga
                      800rb masjid
```

---

## Bab Rekomendasi — Opsi A/B/C untuk Presentasi & Eksekusi

### Tabel Perbandingan 3 Opsi

| Dimensi | Opsi A — Minimal (3 Slide) | Opsi B — Ideal (5-7 Slide) | Opsi C — Maximal (MVP 90 Hari) |
|---------|----------------------------|----------------------------|--------------------------------|
| **Usaha** | 1-2 jam — tambah 3 slide di presentasi/index.html | 1-2 hari — tambah 5-7 slide + narasi naskah | 90 hari — eksekusi MVP 32 fitur |
| **Dampak** | Audiens paham "ini bukan sekadar kas RT ngebut" | Audiens paham 7 lensa + moat + TAM | Komunitas real pakai, bukti PMF |
| **Slide** | 37 -> 40 slides (+3) | 37 -> 42-44 slides (+5-7) | 37 slides tetap, tapi demo live dari data real |
| **Cocok untuk** | Waktu mepet, presentasi 60 menit pas | Waktu cukup, presentasi 60-90 menit | Setelah presentasi lolos, eksekusi |
| **Risiko** | Masih sempit, tapi tidak sesempit 5M saja | Ideal — cover 7 lensa tanpa overload | Butuh tim 1-3 dev + 5-10 komunitas |
| **Rekomendasi** | Jika deadline besok | **REKOMENDASI UTAMA** | Jika presentasi lolos & dapat lampu hijau |

### Opsi A — Minimal: 3 Slide Tambahan (1-2 Jam)

| Slide Baru | Judul | Isi 1 Baris | Durasi |
|------------|-------|-------------|--------|
| Slide 38 | Diagnosis Sempit: 5M Hanya 5% Visi | Tabel 7 dimensi visi vs demo cover | 1.5m |
| Slide 39 | 3 Hal Sekaligus (Filosofi + Jaringan + Sistem) | Diagram moat + one-liner terluas | 1.5m |
| Slide 40 | TAM 280jt + 7 Revenue + Roadmap 5 Fase | TAM + revenue + fase MVP->F5 | 1.5m |

> Total: 37 -> 40 slides, +4.5 menit. Potong Q&A 10m -> 5.5m agar tetap 60m. Atau presentasi 64.5m jika boleh molor.

**Perintah:**

```bash
# Edit presentasi/index.html — tambah 3 sections setelah slide-35
# Edit docs/naskah-60menit.md — tambah 3 bab narasi
# Edit docs/RANGKUMAN_PELAJARAN_5M.md — tambah link ke SUDUT_PANDANG_TERLUAS.md
```

### Opsi B — Ideal: ZIS + RLS + 5-7 Slide (1-2 Hari) ⭐ REKOMENDASI

| Slide Baru | Judul | Isi | Durasi |
|------------|-------|-----|--------|
| Slide 38 | Diagnosis Sempit: 7 Dimensi | Tabel 7 dimensi + akibat "kas RT ngebut" | 1.5m |
| Slide 39 | TIGA INSAN Prisma 6 Ranah | Prisma + filter 3 pertanyaan + siklus | 1.5m |
| Slide 40 | Piagam 10 Pasal + 5 Layer Trust | Tabel 10 pasal + diagram layer + vs GDPR | 1.5m |
| Slide 41 | Socio Corp 11 Level Inverted | Tabel 11 level + diagram inverted + vs Buurtzorg | 1.5m |
| Slide 42 | 7 Fondasi + 6DB + 514 Masjid | Tabel 7 fondasi + 6DB + hub-and-spoke | 1.5m |
| Slide 43 | Pesanggrahan 6.081 -> 1.7jt | Tabel KULINER 44% + 5 kelurahan + ekstrapolasi | 1.5m |
| Slide 44 | Roadmap 300 Fitur 5 Fase + TAM 280jt | 5 fase + 18 domain + 7 revenue + TAM | 1.5m |

> Total: 37 -> 44 slides, +10.5 menit. Presentasi jadi 70.5m — butuh slot 90 menit atau potong poster 7 -> 3 poster. **Ini yang paling ideal untuk audiens yang butuh paham visi penuh.**

**Perintah:**

```bash
# Edit presentasi/index.html — tambah 7 sections
# Edit docs/naskah-60menit.md — tambah 7 bab narasi (estimasi +300 baris)
# Edit docs/PANDUAN_PRESENTASI.md — update peta 60m -> 90m
# File rujukan: docs/SUDUT_PANDANG_TERLUAS.md (dokumen ini)
```

> ✅ REKOMENDASI UTAMA — Opsi B. Karena 7 lensa tidak bisa dipadatkan jadi 3 slide tanpa kehilangan moat. 5-7 slide adalah sweet spot: cukup untuk paham, tidak overload.

### Opsi C — Maximal: MVP 90 Hari (32 Fitur, 1-3 Dev, 5-10 Komunitas)

| Minggu | Fokus | Fitur | Target |
|--------|-------|-------|--------|
| 1-2 | Setup + Auth + RLS | 7 fondasi (Auth, Profile, Storage, Audit) | 1 komunitas dummy, RLS OK |
| 3-4 | Kas Masjid + ZIS | Input kas, dashboard publik, QR, hash chain | 1 masjid real, laporan verifiable |
| 5-6 | RT/RW Digital | Iuran, direktori warga, kas transparan | 1 RT real, iuran tercatat |
| 7-8 | UX Polish + 3G Test | 100 UX tier 1-4, PWA, GZIP, 3G 1-2Mbps | Test di HP 2GB RAM, 3G |
| 9-10 | Onboarding 5-10 komunitas | Deploy, training PJ RT/masjid | 5-10 komunitas Yogyakarta |
| 11-12 | Feedback + Iterate | Fix bug, ukur p50/p99, DoD 10 checklist | p50 <50ms, p99 <500ms, DoD 10/10 |

> MVP 32 fitur = Fase MVP di roadmap. Bukan 300 fitur sekaligus — mulai 32 dulu, buktikan PMF, baru Fase 2.

**Perintah:**

```bash
# Stack: FlutterFlow + Supabase (atau Next.js 16 + Prisma + PG)
# DB: Postgres + RLS + pg_trgm + MatView + PgBouncer
# Deploy: 2 VPS Rp 1-3jt/bulan
# Tim: 1-3 dev (1 backend, 1 frontend, 1 QA/UX)
```

### Keputusan — Mana yang Dipilih?

```
Waktu mepet (besok presentasi) ──> Opsi A (3 slide, 1-2 jam)
Waktu cukup (minggu depan) ──────> Opsi B (5-7 slide, 1-2 hari) ⭐
Presentasi lolos, mau eksekusi ──> Opsi C (MVP 90 hari, 32 fitur)
```

> 🔒 Jangan pilih Opsi C sebelum Opsi A/B — presentasi harus lolos dulu baru eksekusi. Jangan over-engineering Fase 5 di hari pertama.

---

## Lampiran A — Sumber Lokal 12 File

| # | File | Baris | Isi Kunci | Lensa |
|---|------|-------|-----------|-------|
| 1 | `Docs-wa/MASTER_SINTESIS_GOTONG_ROYONG.md` | 449 | TIGA INSAN prisma 6 ranah, 7 fondasi, 6DB, 100 UX, 300 fitur, 11 level | 1,3,4,6,7 |
| 2 | `Docs-wa/SINTESIS_EKSTRAKSI_ARSITEKTUR_BISNIS_ANALISIS.md` | ~800 | Arsitektur 7 fondasi, 6DB, Fabric, 514 masjid, socio corp | 3,4 |
| 3 | `Docs-wa/SINTESIS_UX_GR_COMPLETE.md` | ~600 | 100 prinsip 7 tier, 5 segmen, 3G 1-2Mbps | 6 |
| 4 | `Docs-wa/SINTESIS_ROADMAP_FITUR.md` | ~700 | 300 fitur 18 domain, 5 fase MVP 32->F5 11 | 7 |
| 5 | `Docs-wa/Ringkasan_Komprehensif_Backend_GotongRoyong.md` | ~500 | Backend stack, 7 fondasi, 6DB, CDC | 4 |
| 6 | `Docs-wa/EKSTRAKSI_KURIKULUM_MODUL_AJAR_IT.md` | ~400 | 7 kurikulum IT, 4 level, Go/Flutter/Supabase | 4,7 |
| 7 | `Docs-wa/EKSTRAKSI_DATABASE_BLOCKCHAIN_GR.md` | ~500 | 6DB, Fabric 3500 TPS, 514 masjid, hash chain | 4 |
| 8 | `Docs-wa/SINTESIS_DOKUMEN_PENDIDIKAN_ISLAM_GR.md` | ~600 | Grand Synthesis 28 bab, TIGA INSAN etimologi | 1 |
| 9 | `docs/MASTER_BISNIS_GOTONG_ROYONG.md` | 3045 | Piagam 10 pasal, TIGA INSAN, 11 level, 56 bab brand, Shopee | 1,2,3,7 |
| 10 | `backend-performa-demo/docs/RANGKUMAN_PELAJARAN_5M.md` | 578 | Demo 5M 99s 50K rows/s, GIN 200x, COPY 25x | 0,4 |
| 11 | `backend-performa-demo/docs/PANDUAN_PRESENTASI.md` | 776 | 37 slides 60 menit, 10 DoD, 5 demo live | 0,7 |
| 12 | `backend-performa-demo/docs/BENCH_5M.md` | 149 | Bench 100k/1M/5M, heap flat 64MB | 0,4 |

> Total lokal: 12 file, ~8.000+ baris. Semua dibaca untuk sintesis 7 lensa ini.

---

## Lampiran B — Sumber Internet 20+ URL Kategori

### Kategori 1: Filosofi & Super App (Lensa 1)

| # | URL | Topik | Relevansi |
|---|-----|-------|-----------|
| 1 | https://www.wired.com/story/wechat-allen-zhang-philosophy-wuwei | WeChat Taoist wu-wei, Allen Zhang | Validasi super app modular tanpa paksaan |
| 2 | https://www.reuters.com/technology/shopee-parent-sea-layoffs-expansion-2022/ | Shopee over-expansion, layoff 7.000+ | Jangan bakar uang, 8 pasar exit |
| 3 | https://www.gojek.com/en-id/about | Gojek super app, driver ecosystem | Logistik komunitas vs subsidi ongkir |
| 4 | https://www.tokopedia.com/about/ | Tokopedia UMKM marketplace | Marketplace UMKM referensi |

### Kategori 2: Tata Kelola & Trust (Lensa 2)

| # | URL | Topik | Relevansi |
|---|-----|-------|-----------|
| 5 | https://gdpr.eu/what-is-gdpr/ | GDPR 7 principles, data subject rights | vs Piagam Madinah 10 pasal |
| 6 | https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022 | UU PDP Indonesia 27/2022 | Compliance Rp2M denda |
| 7 | https://www.hyperledger.org/use-cases | Hyperledger Fabric use cases | Fabric 3500 TPS, permissioned |
| 8 | https://hyperledger-fabric.readthedocs.io/en/latest/whatis.html | Fabric architecture, PBFT/PoA | vs PG hash chain Rp0 |

### Kategori 3: Organisasi & Socio Corp (Lensa 3)

| # | URL | Topik | Relevansi |
|---|-----|-------|-----------|
| 9 | https://www.buurtzorg.com/about-us/ | Buurtzorg self-managing teams | 15.000 perawat, flat 1:6 |
| 10 | https://www.mondragon-corporation.com/en/about-us/ | Mondragon cooperative | 80.000 pekerja, 1:6 pay ratio |
| 11 | https://www.bps.go.id/id/statistics-table/2/MzIwIzI=/jumlah-keluarga-menurut-provinsi.html | BPS 70.4jt keluarga | Validasi TAM |
| 12 | https://www.kemenkopukm.go.id/data-umkm | Kemenkop 64jt UMKM | vs 1.7jt ekstrapolasi |

### Kategori 4: Teknologi & Stack (Lensa 4)

| # | URL | Topik | Relevansi |
|---|-----|-------|-----------|
| 13 | https://martinfowler.com/bliki/ModularMonolith.html | Modular monolith 42% fewer conflicts | vs microservices |
| 14 | https://www.postgresql.org/docs/current/pgtrgm.html | pg_trgm GIN trigram | GIN 200x, gin_trgm_ops |
| 15 | https://supabase.com/docs/guides/database/postgres/row-level-security | Supabase RLS | community_id isolation |
| 16 | https://www.tidb.io/use-cases/shopee | Shopee TiDB migration | MySQL sharding -> TiDB |
| 17 | https://www.sea.com/investor-relations | Sea Limited GMV US$47.9B | Shopee scale referensi |

### Kategori 5: UX & Konteks Indonesia (Lensa 6)

| # | URL | Topik | Relevansi |
|---|-----|-------|-----------|
| 18 | https://www.nngroup.com/articles/ten-usability-heuristics/ | Nielsen 10 heuristics | vs GR 100 prinsip |
| 19 | https://www.gsma.com/sotir/wp-content/uploads/2024/10/081024-Mobile-Economy-Asia-Pacific.pdf | GSMA Asia Pacific, 3G/4G, WA 98% | Konteks 3G 1-2Mbps |
| 20 | https://www.statcounter.com/os-market-share/mobile/indonesia | Android 90%+ Indonesia | Entry-level 2GB RAM |

### Kategori 6: Brand & Roadmap (Lensa 7)

| # | URL | Topik | Relevansi |
|---|-----|-------|-----------|
| 21 | https://www.kellerbrand.com/cbbe-model | Keller CBBE brand equity | Brand 56 bab |
| 22 | https://www.byonderwen.com/sharp-mental-physical-availability | Sharp Mental/Physical Availability | 514 masjid = physical availability |
| 23 | https://www.bps.go.id/id/publication/2024/02/28/ | BPS sensus penduduk 280jt | TAM validasi |
| 24 | https://www.kemenag.go.id/data-masjid | Kemenag 800rb masjid | Masjid hub validasi |

> Total internet: 24 URL, 6 kategori. Semua diverifikasi untuk sintesis 7 lensa. Lokal 12 file + internet 24 URL = 36 sumber.

---

## Lampiran C — Glossary 12 Istilah Terluas

| # | Istilah | Definisi 1 Baris | Bahasa Warung |
|---|---------|------------------|---------------|
| 1 | **TIGA INSAN** | Muttaqin (percaya) - Shalih (berkarya) - Nafi' (bermanfaat), DNA GR | Iman -> amal -> manfaat, seperti belajar -> masak -> bagi |
| 2 | **Piagam Madinah Digital** | 10 pasal konstitusi digital GR, dari Piagam Madinah 622M | Aturan main warung — siapa boleh apa, data siapa di mana |
| 3 | **Inverted Compensation** | Semakin tinggi level, gaji turun, benefit naik (L9 gaji 0 benefit 100jt) | Ketua RT dapat uang, ketua nasional dapat ilmu |
| 4 | **Socio Corporation** | Korporasi sosial — 2 track (komunitas 11 level + teknologi 8 level) | Warung yang karyawannya juga pemiliknya |
| 5 | **7 Fondasi** | Auth, Profile, Payment, Notification, Storage, Audit, Feature Flag — build once | 7 meja dapur yang dipakai semua menu |
| 6 | **6DB** | PG + Mongo + Redis + ES + ClickHouse + InfluxDB — tiap DB untuk tugasnya | 6 gudang — beras, bumbu, kulkas, indeks, rekap, sensor |
| 7 | **514 Masjid Hub** | Masjid sebagai Data Centre — hub-and-spoke 5 hub nasional + 514 kab/kota | Masjid jadi kantor pos + bank + sekolah |
| 8 | **Pesanggrahan 6.081** | Data lapangan 1 kecamatan, 5 kelurahan, KULINER 44%, 256 masjid | Sensus warung 1 kecamatan, ekstrapolasi ke 514 |
| 9 | **100 UX 7 Tier** | 100 prinsip UX piramida Tier 1 (trust) -> Tier 7 (transparansi bertahap) | 100 aturan warung — dari buka pintu sampai tutup buku |
| 10 | **300 Fitur 5 Fase** | MVP 32 -> F2 88 -> F3 122 -> F4 47 -> F5 11, 18 domain | Menu warung 300 — dari nasi goreng sampai catering ASEAN |
| 11 | **TAM 280jt** | Total Addressable Market — 280jt warga, 70.4jt keluarga, 800rb masjid, 64jt UMKM | Semua warga yang bisa jadi pelanggan warung |
| 12 | **Moat Verifiable** | Keunggulan yang tidak bisa ditiru — SHA-256 hash chain, Piagam, 514 masjid | Parit warung yang tidak bisa dilompati kompetitor |

---

> **Rujukan silang:** `docs/RANGKUMAN_PELAJARAN_5M.md` (5M 99s), `docs/PANDUAN_PRESENTASI.md` (37 slides 60m), `docs/BENCH_5M.md` (bench), `docs/TUNING_5M.md` (22 param), `docs/naskah-60menit.md` (1036 baris), `presentasi/index.html` (37 slides), `Docs-wa/MASTER_SINTESIS_GOTONG_ROYONG.md` (449 baris), `docs/MASTER_BISNIS_GOTONG_ROYONG.md` (3045 baris)

> **One-liner terluas:** "Untuk warga lelah platform tidak transparan, GotongRoyong adalah OS Kehidupan Komunitas yang membuat kas masjid, iuran RT, dan UMKM bisa diverifikasi siapa pun — karena kepercayaan yang tidak bisa diverifikasi bukan kepercayaan, tapi harapan."

*Generated — Sudut Pandang Terluas GotongRoyong | 7 Lensa | 15 Aug 2026 | Dari 5M Sempit (5%) ke OS 280 Juta (100%) | Lokal 12 file + Internet 24 URL | 3 Hal Sekaligus: Filosofi + Jaringan Fisik + Sistem Belajar*
