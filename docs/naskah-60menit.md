# Naskah 60 Menit — Modul Performa Backend GR Demo (Part 1: Opening + Slides 1-12)

> Part 1 dari 3 — Opening 2 menit + Slides 1-12 (Cover sampai Glossary). Durasi part 1: ~20 menit.
> Stack: Postgres 16 + Redis 7 + pg_trgm + MatView + PgBouncer | TIGA INSAN: Muttaqin - Shalih - Nafi'
> Target audiens: Backend developer, pengurus masjid/RT/RW yang ingin paham performa tanpa jargon.

---

## Opening (Durasi: 2 menit)

- **Narasi**: Assalamualaikum, selamat datang di Modul Performa Backend Gotong Royong Demo — Logging + Performa. Perkenalkan, saya pemateri hari ini. Dalam 60 menit ke depan kita akan membedah 10 bab, 35 slides, dari poster 200ms sampai CDC Debezium WAL ke Kafka. Kenapa kita mulai dari performa? Karena di filosofi TIGA INSAN, Muttaqin adalah fondasi — beriman dengan akal yang hidup. Kepercayaan harus lebih dulu dari fitur. Platform yang lambat mengkhianati amanah.

  Konteks kita bukan Silicon Valley. Pengguna kita di Indonesia: jaringan 3G dengan RTT 500-1000ms, HP Android RAM 2-3GB, kuota terbatas. Prinsip UX #46 dan #50 mengingatkan: loading maksimal 3 detik di 3G. Artinya backend harus selesai di bawah 200ms, sisanya untuk jaringan. SHA-256 hash chain kas masjid harus terverifikasi kurang dari 1 detik — setiap milidetik adalah amanah yang kita jaga.

  Hari ini part 1: opening + slides 1-12. Kita bangun fondasi bahasa yang sama — apa itu 200ms, apa itu P99, 10 metrik wajib, dan glossary super sederhana. Part 2 dan 3 akan masuk ke Postgres scale, caching, dan CDC. Siap? Mari mulai.

- **Analogi Restoran**: Bayangkan warung Gotong Royong. Pelanggan = User yang lapar, Dapur = Server yang memasak, Gudang = Database tempat bahan disimpan, Meja Saji = Cache tempat hidangan siap saji. Jika dapur lambat, pelanggan pergi — kepercayaan hilang. Hari ini kita belajar agar dapur selalu sigap di bawah 200ms.

- **Perintah Live**: ```bash
Tidak ada demo, fokus teori
```

- **Q&A Antisipasi**: Q: Kenapa 60 menit dibagi 3 part? A: Agar tiap part fokus — part 1 fondasi bahasa, part 2 fondasi teknik, part 3 observabilitas dan CDC. Q: Apakah materi ini butuh laptop spek tinggi? A: Tidak, semua demo jalan di Podman lokal Rp0, cukup 2GB RAM untuk MVP.

- **Transisi**: Dengan fondasi kepercayaan ini, mari lihat peta besar 60 menit di Slide 1 — cover modul kita.

---

### Slide 1: Cover — Modul Performa Backend GR Demo (Durasi: 1.5 menit)

- **Narasi**: Slide cover ini adalah peta identitas modul. Judulnya: Modul Performa Backend GR Demo — Logging + Performa, 4 branch + 5 CDC. Empat branch itu adalah perjalanan kita: 01 console-log sebagai anti-pattern, 02 Pino JSON sebagai logging yang benar, 03 scale untuk Postgres dan cache, 04 observability dengan Prometheus dan Grafana. Branch 05 CDC adalah Debezium WAL ke Kafka menuju Elasticsearch dan ClickHouse.

  Di pojok ada TIGA INSAN — Muttaqin, Shalih, Nafi'. Muttaqin adalah fondasi kepercayaan yang kita bahas hari ini. Di bawahnya ada janji performa: p50 kurang dari 50ms, p95 kurang dari 200ms. Bukan angka hiasan, tapi SLA yang diukur server-side dengan prom-client histogram. MVP kita Rp0 — Postgres, Redis, pg_trgm, MatView, PgBouncer — semua jalan lokal tanpa tagihan cloud.

  Alur demo tertulis jelas: 01 console-log, 02 Pino JSON, 03 Scale, 04 Observability, 05 CDC. Ingat urutan ini, karena tiap branch membangun di atas branch sebelumnya.

- **Analogi Restoran**: Cover ini seperti papan nama warung. Pelanggan (User) melihat papan: warung ini janji saji di bawah 200ms, bahan dari Gudang (Database) yang tertata, Meja Saji (Cache) selalu siap. Dapur (Server) punya 4 tahap kematangan — dari kompor berantakan sampai dapur bintang lima.

- **Perintah Live**: ```bash
Tidak ada demo, fokus teori
```

- **Q&A Antisipasi**: Q: Apa beda 4 branch dan 5 CDC? A: 4 branch adalah tahap PZN logging sampai observability, 05 CDC adalah branch kelima khusus streaming WAL ke Kafka. Q: Kenapa Rp0? A: Karena semua infra MVP jalan lokal via Podman, tanpa Redis Cloud atau ES berbayar.

- **Transisi**: Setelah tahu identitas warung, kita buka daftar menu lengkap — Slide 2 daftar isi 10 bab.

---

### Slide 2: Daftar Isi — 10 Bab + 35 Slides Map (Durasi: 1.5 menit)

- **Narasi**: Slide 2 adalah daftar isi — peta 10 bab dan 35 slides. Bab 1 adalah Kecepatan = Kepercayaan, slides 3-5 yang akan kita bedah hari ini. Bab 2 Data Flow Flutter ke Gateway ke 7 Fondasi ke 6 Database ada di slide 13. Bab 3 Postgres Scale — B-Tree, pg_trgm, MatView, Cursor, RLS — slides 14-17. Bab 4 Caching dan Bab 5 Elasticsearch ada di 18-19. Bab 6 CDC ada di 20. Bab 7-8 API Delivery dan Observability di 21-22. Bab 9-10 Roadmap dan SLA 16 endpoint di 23-26. Demo 01-05 dan appendix ada di 27-35.

  Perhatikan kolom kanan: Poster 1-7 ada di part 1, slides 6-12, sudah kita tandai centang. Ini sengaja — part 1 membangun bahasa yang sama sebelum masuk teknik berat. Tanpa paham P99 dan 10 metrik, penjelasan B-Tree 50.000x tidak akan nempel.

  Tabel ini juga menunjukkan bahwa tiap bab punya bobot durasi berbeda. Bab 1 dan poster butuh 1,5 menit per slide karena fondasi. Bab 3 butuh lebih lama karena ada EXPLAIN ANALYZE live.

- **Analogi Restoran**: Daftar isi ini seperti buku menu. Pelanggan (User) lihat daftar: ada 10 kategori hidangan, 35 halaman. Dapur (Server) tahu urutan masak: mulai dari hidangan pembuka (poster 200ms) baru ke hidangan utama (Postgres scale). Gudang (Database) dan Meja Saji (Cache) disiapkan sesuai kategori — tidak semua bahan dikeluarkan sekaligus.

- **Perintah Live**: ```bash
Tidak ada demo, fokus teori
```

- **Q&A Antisipasi**: Q: Harus hafal 35 slides? A: Tidak, cukup paham peta — detail ada di handout dan presentasi HTML yang bisa dibuka ulang. Q: Kenapa poster di awal? A: Karena poster adalah bahasa visual — 200ms dan P99 harus paham dulu sebelum angka SLA.

- **Transisi**: Peta sudah jelas. Sekarang masuk ke Bab 1.1 — kenapa kecepatan adalah kepercayaan.

---

### Slide 3: Bab 1.1 — Kecepatan = Kepercayaan (Muttaqin) (Durasi: 1.5 menit)

- **Narasi**: Bab 1.1 adalah jantung filosofi. Muttaqin — beriman dengan akal yang hidup — adalah fondasi TIGA INSAN. Dalam bahasa teknis, kepercayaan (trust) adalah manifestasi Muttaqin. Platform yang lambat merusak kepercayaan. Setiap milidetik keterlambatan adalah pengkhianatan amanah data komunitas. Prinsip UX nomor satu: kepercayaan harus lebih dulu dari fitur.

  Contoh konkret: SHA-256 hash chain untuk transparansi kas masjid. Setiap transaksi kas dihitung hash_self = SHA256(amount|desc|recipient|actor|hash_prev) via trigger BEFORE INSERT, dan diverifikasi kurang dari 1 detik lewat GET /ledger/verify. Ketika warga cek laporan kas dan data muncul kurang dari 1 detik, ia merasa platform serius. Jika lambat atau error, kepercayaan runtuh seketika. Kecepatan adalah bahasa universal keandalan.

  Prinsip ukur: jangan pakai feeling. Ukur server-side dengan p50/p95/p99 via prom-client histogram, EXPLAIN ANALYZE, dan pg_stat_statements. Yang tidak diukur tidak bisa diperbaiki.

- **Analogi Restoran**: Pelanggan (User) titip uang kas ke warung. Dapur (Server) harus catat di buku kas (Gudang/Database) dengan stempel SHA-256 yang bisa diverifikasi kurang dari 1 detik. Jika Dapur lambat buka buku, Pelanggan curiga ada apa. Meja Saji (Cache) membantu — laporan yang sering dilihat sudah siap di meja, tidak perlu bongkar Gudang tiap kali.

- **Perintah Live**: ```bash
Tidak ada demo, fokus teori
```

- **Q&A Antisipasi**: Q: Apa hubungan Muttaqin dengan milidetik? A: Muttaqin adalah amanah — amanah diwujudkan dengan sistem yang cepat dan transparan, bukan janji. Q: SHA-256 dihitung di aplikasi atau DB? A: Di DB via trigger, agar tidak tambah latency aplikasi dan konsisten.

- **Transisi**: Kepercayaan sudah paham. Sekarang konteks lapangannya — Slide 4, Indonesia 3G dan HP 2GB.

---

### Slide 4: Bab 1.2 — Konteks Indonesia: 3G, 2-3GB RAM, Kuota (Durasi: 1.5 menit)

- **Narasi**: Indonesia bukan Silicon Valley. Mayoritas pengguna Gotong Royong akses via 3G dengan RTT 500-1000ms, sinyal tidak stabil, HP Android RAM 2-3GB, kuota terbatas. Prinsip UX #46: aplikasi harus berfungsi di 3G atau sinyal lemah. Prinsip UX #50: loading maksimal 3 detik untuk konten utama di 3G. Dengan RTT 500-1000ms, backend harus selesai di bawah 200ms agar total tetap di bawah 3 detik.

  Implikasi teknisnya keras. Jangan kirim SELECT bintang — hanya field yang dibutuhkan via ?fields=name,lat,lng. Jangan polling — pakai cache jadwal sholat TTL 1 jam. Wajib GZIP atau Brotli — hemat 70-80% bandwidth. Payload kecil berarti parsing cepat di HP 2GB dan hemat kuota. Setiap byte tidak perlu adalah pemborosan.

  Gotong Royong bukan aplikasi untuk iPhone terbaru dan 5G. Performa adalah aksesibilitas, bukan kemewahan. Jika backend lambat 500ms, di 3G total jadi 1,5 detik — masih oke. Jika backend 1000ms, total 2 detik — mulai terasa. Jika 2000ms, total 3 detik — pengguna pergi.

- **Analogi Restoran**: Pelanggan (User) datang jalan kaki jauh (3G lambat), bawa tas kecil (RAM 2GB), uang pas-pasan (kuota). Dapur (Server) harus saji porsi pas — tidak berlebihan — dan Meja Saji (Cache) sudah siapkan lauk populer agar tidak masak dari Gudang (Database) tiap kali. Gudang tetap jadi sumber, tapi Meja Saji hemat waktu dan tenaga.

- **Perintah Live**: ```bash
Tidak ada demo, fokus teori
```

- **Q&A Antisipasi**: Q: Kenapa backend harus di bawah 200ms, bukan 500ms? A: Karena 500ms backend + 1000ms RTT 3G = 1,5 detik, masih di bawah 3 detik tapi mepet. 200ms memberi buffer aman. Q: Apakah GZIP wajib? A: Ya, untuk JSON. Jangan kompres JPEG/MP4 yang sudah terkompresi.

- **Transisi**: Konteks sudah jelas. Sekarang angka kontraknya — Slide 5 target SLA.

---

### Slide 5: Bab 1.3 — Target SLA: p50 / p95 / p99 / Availability (Durasi: 1.5 menit)

- **Narasi**: SLA adalah kontrak performa antara backend dan frontend. Target global Gotong Royong: p50 kurang dari 50ms untuk read dan kurang dari 100ms untuk write, p95 kurang dari 200ms, p99 kurang dari 500ms — semua diukur server-side tanpa RTT. Availability MVP 99,5 persen (down 3,6 jam per bulan), Fase 3 ke atas 99,9 persen (43 menit), Fase 5 99,99 persen (4 menit). Error rate kurang dari 0,1 persen semua endpoint.

  Alat ukurnya jelas: prom-client histogram dengan buckets 0.01 sampai 5 detik, Prometheus histogram_quantile, Grafana dashboard, dan k6 atau autocannon untuk load test. Jika p95 di atas 500ms selama 5 menit — itu incident. Cek pg_stat_statements dan EXPLAIN ANALYZE segera. Tidak ada satu angka untuk semua — 16 endpoint punya SLA per-endpoint di Bab 10.1, dari /api/jadwal-sholat p50 kurang dari 20ms sampai POST /api/kas p99 kurang dari 500ms.

  Ingat: p50 adalah median — 50 persen request lebih cepat. p95 — 95 persen lebih cepat. p99 — 99 persen lebih cepat. Ketiganya harus hijau, bukan cuma p50.

- **Analogi Restoran**: SLA seperti janji warung: Pelanggan (User) dilayani p50 di bawah 50ms (mayoritas cepat), p95 di bawah 200ms (hampir semua cepat), p99 di bawah 500ms (bahkan yang paling apes tetap wajar). Dapur (Server) diukur dengan stopwatch histogram, Gudang (Database) dicek pg_stat_statements, Meja Saji (Cache) diukur hit rate. Jika janji dilanggar 5 menit, alarm bunyi.

- **Perintah Live**: ```bash
Tidak ada demo, fokus teori
```

- **Q&A Antisipasi**: Q: Kenapa p50 read dan write beda? A: Write harus ACID dan trigger SHA-256, jadi wajar lebih lambat 100ms vs 50ms. Q: 99,5 persen itu bagus? A: Untuk MVP ya — 3,6 jam down per bulan masih wajar. Fase 5 baru 99,99 persen.

- **Transisi**: Angka kontrak sudah paham. Sekarang visualisasinya — Poster #1, apa itu 200ms.

---

### Slide 6: Poster #1 — Apa itu 200ms (Durasi: 1.5 menit)

- **Narasi**: Poster #1 menjawab pertanyaan paling dasar: apa itu 200ms? Satu detik sama dengan 1000ms. Jadi 200ms sama dengan 0,2 detik — secepat kedipan mata. Diagram alurnya: User tap, Gateway validasi JWT 5ms, Redis HIT 2ms atau DB query 20ms, GZIP 5ms, lalu User lihat hasil. Total server 30-50ms di p50. Tambah RTT 3G 500ms, total sekitar 550ms — masih jauh di bawah 3 detik.

  Kenapa 200ms adalah batas terasa instan? Karena di atas itu pengguna mulai merasa menunggu — sesuai UX #46. Target backend kurang dari 200ms di p95 memberi sisa budget untuk jaringan. Jika backend sudah 500ms, tambah RTT 1000ms jadi 1,5 detik — mulai terasa. Jika backend 1000ms, total 2 detik — pengguna gelisah.

  Ukurnya pakai X-Response-Time header dan prom-client histogram, bukan stopwatch manual. Setiap endpoint kirim header ini agar frontend dan Grafana bisa pantau.

- **Analogi Restoran**: Pelanggan (User) pesan. Dapur (Server) masak 50ms, ambil bahan dari Gudang (Database) 20ms atau dari Meja Saji (Cache) 2ms, bungkus GZIP 5ms, hidang. Total 30-50ms di dapur. Perjalanan dari warung ke rumah Pelanggan (RTT 3G) 500ms. Total 550ms — masih hangat dan cepat.

- **Perintah Live**: ```bash
Tidak ada demo, fokus teori
```

- **Q&A Antisipasi**: Q: 200ms itu server saja atau total? A: Server saja (p95 kurang dari 200ms). Total dengan RTT 3G jadi sekitar 700ms — tetap di bawah 3 detik. Q: Kenapa tidak target 100ms? A: 100ms ideal untuk p50, tapi p95 200ms sudah terasa instan dan realistis untuk MVP Rp0.

- **Transisi**: Sudah paham 200ms. Sekarang intuisi angkanya — Poster #2, semakin kecil ms semakin cepat.

---

### Slide 7: Poster #2 — Semakin kecil ms, semakin cepat (Durasi: 1.5 menit)

- **Narasi**: Poster #2 meluruskan intuisi: angka ms kecil berarti cepat, besar berarti lambat — jangan tertukar. Tabel acuannya server-side: 1ms sangat cepat, 10ms cepat, 50ms baik, 200ms batas, 1000ms lambat, 10000ms sangat lambat. Contoh nyata: cache HIT Redis 1-5ms (sangat cepat) versus Seq Scan 2000ms (sangat lambat) — bedanya 400 sampai 2000 kali.

  Goal kita: pindahkan sebanyak mungkin request dari kolom kanan (lambat, merah) ke kiri (cepat, hijau) via index dan cache. Di Grafana, garis p50 hijau, p95 kuning, p99 merah — kejar hijau, jaga kuning, waspada merah. Visual bar di slide membantu: hijau pendek untuk 1-10ms, merah tinggi untuk di atas 1000ms. Hover baris tabel akan highlight viz — hijau ke merah.

  Ingat: RLS dengan index yang benar overheadnya kurang dari 0,1ms — masuk kategori sangat cepat. Tanpa index, RLS bisa jadi lambat.

- **Analogi Restoran**: Meja Saji (Cache) 1-5ms seperti ambil lauk sudah matang di meja — sangat cepat. Gudang (Database) tanpa index seperti bongkar seluruh gudang cari satu karung — 2000ms sangat lambat. Dapur (Server) yang pintar selalu ambil dari Meja Saji dulu, baru ke Gudang jika perlu. Warna hijau ke merah di poster adalah lampu dapur — hijau aman, merah bahaya.

- **Perintah Live**: ```bash
Tidak ada demo, fokus teori
```

- **Q&A Antisipasi**: Q: 1ms itu mungkin? A: Ya, Redis HIT dan RLS dengan index bisa 1ms bahkan sub-ms. Q: Kenapa 10000ms ada di tabel? A: Untuk menunjukkan N+1 query atau tanpa index — nyata terjadi jika tidak ada index di tabel 1 juta baris.

- **Transisi**: Intuisi ms sudah lurus. Sekarang metrik yang paling sering salah paham — Poster #3, apa itu P99.

---

### Slide 8: Poster #3 — Apa itu P99 (Durasi: 1.5 menit)

- **Narasi**: Poster #3 menjelaskan P99 dengan 100 request diurutkan dari tercepat ke terlambat. P99 adalah request ke-99 — artinya 99 persen lebih cepat, 1 persen lebih lambat. Contoh: P99 sama dengan 200ms artinya 99 request selesai kurang dari atau sama dengan 200ms, 1 request di atas 200ms — yang paling lambat, yang paling sering komplain.

  Kenapa peduli P99? Karena 1 persen yang lambat adalah pengguna yang paling vokal — mereka yang churn dan cerita ke tetangga. Jangan hanya lihat rata-rata (avg). Contoh jebakan rata-rata: 99 request 10ms, 1 request 10000ms — rata-rata 109ms terlihat bagus, tapi P99 10000ms langsung tunjukkan ada yang sangat menderita. Itulah kenapa kita pakai percentile, bukan rata-rata.

  Visual 100 dots di slide: 99 hijau, 1 merah di ekor (tail). Spec kita: p50 kurang dari 50ms, p95 kurang dari 200ms, p99 kurang dari 500ms — ketiganya harus hijau. Kotak kuning di slide tanya kenapa bukan rata-rata 590ms — jawabannya karena rata-rata tertarik outlier 2500ms, P99 jujur.

- **Analogi Restoran**: 100 Pelanggan (User) pesan. 99 dilayani Dapur (Server) cepat dari Meja Saji (Cache) atau Gudang (Database) dengan index — hijau. 1 Pelanggan apes dapat Seq Scan — merah, tail latency. Rata-rata bilang semua cepat, tapi 1 Pelanggan itu pulang kecewa dan tidak kembali. P99 jujur: 99 senang, 1 menderita — dan 1 itu yang harus kita perbaiki.

- **Perintah Live**: ```bash
Tidak ada demo, fokus teori
```

- **Q&A Antisipasi**: Q: Kenapa tidak pakai rata-rata saja? A: Rata-rata tertarik outlier — 1 request 10 detik bisa naikkan rata-rata 100ms padahal 99 request 10ms. P99 jujur. Q: P99 500ms itu lambat? A: Untuk p99 masih wajar — 99 persen di bawah 500ms, hanya 1 persen di atas. Target kita p99 kurang dari 500ms.

- **Transisi**: P99 sudah paham. Sekarang keluarga lengkapnya — Poster #4, P50/P95/P99/P99.9.

---

### Slide 9: Poster #4 — P50 / P95 / P99 / P99.9 (Durasi: 1.5 menit)

- **Narasi**: Poster #4 melengkapi keluarga percentile. P50 atau median: 50 persen request lebih cepat — gambaran mayoritas pengguna. P95: 95 persen lebih cepat — hanya 5 persen tail. P99: 99 persen lebih cepat — hanya 1 persen tail. P99.9: 99,9 persen lebih cepat — hanya 0,1 persen atau 1 dari 1000 — untuk Fase 5 dengan 200 ribu RPS, tail sangat penting.

  Distribusinya: mayoritas di p50, banyak di p95, sedikit di p99, sangat sedikit di p99.9 — ekor panjang yang harus dipangkas. Visual bar di slide: p50 30ms bar panjang hijau mayoritas, p95 150ms bar sedang kuning 5 persen tail, p99 400ms bar pendek oranye 1 persen tail, p99.9 900ms titik merah 0,1 persen very tail. Optimasi tail adalah index, cache, dan proteksi Circuit Breaker atau Bulkhead.

  Untuk MVP, fokus p50 dan p95 dulu. P99.9 baru relevan saat skala Fase 5. Tapi pahami sekarang agar tidak kaget saat trafik naik.

- **Analogi Restoran**: P50 adalah 50 Pelanggan pertama dilayani cepat — mayoritas. P95 adalah 95 Pelanggan — hampir semua. P99 adalah 99 Pelanggan — hanya 1 yang tunggu lama. P99.9 adalah 999 dari 1000 — hanya 1 yang sangat apes. Dapur (Server) yang baik jaga semua — Meja Saji (Cache) untuk mayoritas, Gudang (Database) dengan index untuk tail, dan proteksi agar 1 yang apes tidak bikin antrean panjang.

- **Perintah Live**: ```bash
Tidak ada demo, fokus teori
```

- **Q&A Antisipasi**: Q: Kapan P99.9 penting? A: Saat 200 ribu RPS Fase 5 — 0,1 persen dari 200 ribu adalah 200 request per detik yang lambat, cukup untuk bikin komplain massal. Q: Harus monitor semua percentile? A: Ya, di Grafana tampilkan p50, p95, p99 bersamaan — jangan cuma p50.

- **Transisi**: Keluarga percentile sudah lengkap. Sekarang skala rasanya — Poster #5, berapa cepat atau lambat.

---

### Slide 10: Poster #5 — Berapa cepat / lambat (skala rasa) (Durasi: 1.5 menit)

- **Narasi**: Poster #5 adalah skala rasa — menerjemahkan angka ms menjadi perasaan. Server-side: 0-50ms sangat cepat, 50-100 sangat baik, 100-200 baik, 200-500 mulai terasa, 500-1000 lambat, di atas 1000 sangat lambat. Mapping ke SLA: p50 harus di sangat cepat atau sangat baik, p95 di baik, p99 jangan sampai lambat.

  Jika p95 di atas 500ms — pengguna mulai komplain. Di atas 1000ms — tinggalkan aplikasi. Gunakan skala ini saat baca Grafana — warna hijau 0-100, kuning 100-200, oranye 200-500, merah di atas 500. Tabel di slide juga beri aksi: 0-50 pertahankan dengan cache HIT dan GIN, 50-100 ideal p50 read, 100-200 batas p95 masih oke, 200-500 optimasi index dan N+1, 500-1000 incident jika p95 di sini, di atas 1000 wajib fix Seq Scan dan OFFSET.

  Setiap ms yang dipangkas adalah kepercayaan yang ditambah — kembali ke Muttaqin. Skala ini bukan teori — ini kompas harian saat lihat dashboard.

- **Analogi Restoran**: Skala rasa seperti level kepedasan. 0-50ms sangat cepat — Pelanggan (User) senyum, Meja Saji (Cache) sigap. 100-200ms baik — masih nyaman. 200-500ms mulai terasa — Dapur (Server) mulai keringat, Gudang (Database) mungkin Seq Scan. Di atas 1000ms sangat lambat — Pelanggan tinggalkan warung. Dapur harus jaga di hijau-kuning, jangan sampai merah.

- **Perintah Live**: ```bash
Tidak ada demo, fokus teori
```

- **Q&A Antisipasi**: Q: Skala ini untuk server atau total dengan RTT? A: Server-side. Total tambah RTT 3G 500-1000ms. Jadi server 200ms + RTT 500ms = 700ms total masih baik. Q: Jika p99 600ms apakah gagal SLA? A: Ya, target p99 kurang dari 500ms — 600ms berarti ada tail yang perlu optimasi index atau cache.

- **Transisi**: Skala rasa sudah paham. Sekarang kompas lengkapnya — Poster #6.1, 10 metrik wajib.

---

### Slide 11: Poster #6.1 — 10 Metrik Wajib (Durasi: 1.5 menit)

- **Narasi**: Poster #6.1 adalah kompas performa — 10 metrik yang wajib diukur. Tanpa ukur, tidak bisa kelola. Tiga pilar observabilitas Bab 8.5: Metrics via Prometheus, Logs via Loki, Traces via Jaeger — saling melengkapi. Tabelnya: 1 Response Time p50 kurang dari 50ms read via prom-client histogram, 2 P95/P99 kurang dari 200/500ms via histogram_quantile, 3 Throughput RPS/QPS 100 sampai 200 ribu via http_requests_total dan k6, 4 Latency RTT/TTFB kurang dari 200ms via curl time_total, 5 Error Rate kurang dari 0,1 persen via 5xx per total, 6 Availability 99,5 persen sampai 99,99 persen via up dan SLO, 7 CPU kurang dari 70 persen rata-rata via node_cpu, 8 Memory kurang dari 70 persen via node_memory, 9 DB Query Time kurang dari 50ms p95 dan no Seq Scan di atas 1000 rows via pg_stat_statements, 10 Cache Hit Rate di atas 80 persen via cache_hit_total.

  Cache hit rate di atas 80 persen adalah pembeda MVP yang scalable versus yang boros DB. DB Query Time p95 kurang dari 50ms dan no Seq Scan di atas 1000 rows — cek pg_stat_statements tiap rilis. Jika salah satu metrik merah, jangan rilis.

- **Analogi Restoran**: 10 metrik seperti 10 alat ukur warung. Response Time dan P95/P99 adalah stopwatch Dapur (Server). Throughput adalah jumlah Pelanggan (User) per detik yang bisa dilayani. Latency adalah waktu antar warung ke rumah. Error Rate adalah porsi gagal. Availability adalah jam buka warung. CPU/Memory adalah tenaga dan ingatan Dapur. DB Query Time adalah kecepatan ambil bahan dari Gudang (Database). Cache Hit Rate adalah seberapa sering ambil dari Meja Saji (Cache) tanpa ke Gudang — di atas 80 persen berarti Meja Saji efektif.

- **Perintah Live**: ```bash
Tidak ada demo, fokus teori
```

- **Q&A Antisipasi**: Q: Harus monitor 10 metrik sekaligus? A: Ya, tapi mulai dari 3: Response Time, Error Rate, Cache Hit Rate — tambah lain bertahap. Q: Cache hit 80 persen itu tinggi? A: Untuk endpoint cache seperti jadwal sholat dan profil, 80 persen wajar — 8 dari 10 request dari Meja Saji, hanya 2 ke Gudang.

- **Transisi**: Kompas sudah lengkap. Terakhir di part 1 — Poster #7, glossary super sederhana agar semua bicara bahasa yang sama.

---

### Slide 12: Poster #7 — Glossary Super Sederhana (Durasi: 1.5 menit)

- **Narasi**: Poster #7 adalah glossary super sederhana — bahasa performa tanpa jargon, untuk pengurus masjid dan RT/RW juga paham. Tabelnya 10 istilah satu kalimat: ms adalah milidetik, 1000ms sama dengan 1 detik. P99 adalah 99 persen request kurang dari atau sama dengan angka ini, 1 persen lebih lambat. RPS/QPS adalah request atau query per detik — throughput. Latency adalah waktu tunggu bolak-balik. Throughput adalah kapasitas layani request per detik. Error Rate adalah persen request gagal 5xx. Availability adalah persen waktu layanan hidup. CPU/Memory adalah persen otak dan ingatan server terpakai. Cache Hit adalah persen dilayani dari memori cepat.

  Kenapa glossary di akhir part 1? Karena setelah 11 slides, kita butuh checkpoint bahasa. Jika ada yang masih bingung beda latency dan throughput, atau P99 dan rata-rata, ini saatnya luruskan. Glossary ini akan jadi rujukan part 2 dan 3 — saat kita bicara B-Tree 50.000x atau pg_trgm 10-50ms, semua sudah paham satuan dan istilahnya.

  Simpan poster ini — tempel di dinding warung. Setiap kali lihat Grafana, ingat glossary ini.

- **Analogi Restoran**: Glossary seperti kamus warung. ms adalah satuan waktu masak. P99 adalah janji 99 Pelanggan (User) dilayani cepat. RPS adalah jumlah Pelanggan per detik. Latency adalah waktu antar pesan sampai hidang. Throughput adalah kapasitas Dapur (Server) per detik. Error adalah pesanan gagal. Availability adalah jam buka. CPU/Memory adalah tenaga Dapur. Cache Hit adalah ambil dari Meja Saji (Cache) — cepat dan hemat Gudang (Database).

- **Perintah Live**: ```bash
Tidak ada demo, fokus teori
```

- **Q&A Antisipasi**: Q: Bedanya latency dan throughput? A: Latency adalah waktu satu request (cepat atau lambat), throughput adalah berapa banyak request per detik (banyak atau sedikit) — keduanya harus baik. Q: Cache Hit dan Cache Miss bedanya? A: Hit ketemu di Meja Saji (cepat), Miss tidak ketemu harus ke Gudang (lambat) lalu simpan ke Meja Saji untuk next time.

- **Transisi**: Glossary selesai — bahasa kita sudah sama. Part 1 selesai di sini. Di part 2 kita masuk Bab 2 Data Flow dan Bab 3 Postgres Scale — dari Meja Saji ke Gudang yang sesungguhnya. Terima kasih, sampai jumpa di part 2.

---

### Slide 13: Bab 2 - Data Flow: Flutter -> Gateway -> 7 Fondasi -> 6 DB (Durasi: 1.5 menit)

- **Narasi**: Slide 13 adalah peta aliran data end-to-end Gotong Royong. Dimulai dari Flutter single codebase — satu kode untuk Android dan iOS — request masuk ke API Gateway (Kong atau Supabase Edge). Gateway tugasnya validasi JWT kurang dari 5ms (cache), rate limit, dan GZIP. Dari Gateway, request diteruskan ke 7 Fondasi Bersama — fondasi yang dipakai semua fitur, bukan milik satu modul saja.

  Tujuh fondasi itu adalah: Auth (login/JWT), Profil (Single Source of Truth), Payment (HarmoniPay + Xendit), Notifikasi (FCM/Wablas), Storage (S3/R2), Audit SHA-256 (hash chain kas), dan Feature Flag (kill-switch). Dari fondasi, data mengalir ke 6 Database sesuai karakter: Postgres (ACID + RLS, jantung transaksi), Redis (cache kurang dari 10ms), Mongo (kajian fleksibel), Elasticsearch (geo + search), ClickHouse (OLAP agregasi), dan Influx/Timescale (IoT sensor). Bottleneck per layer sudah dipetakan: Gateway JWT cache kurang dari 5ms, Fondasi profil cache 5 menit, DB index + pool 25, Network GZIP hemat 70 persen. Hot path read ideal: Flutter -> Gateway cache -> Redis HIT kurang dari 5ms -> response tanpa sentuh DB sama sekali.

  Diagram ASCII di slide memperjelas: Flutter --> Gateway (JWT cache kurang dari 5ms) --> [7 Fondasi] --> Redis HIT kurang dari 5ms --> response. Cabang async: Postgres WAL --> Debezium --> Kafka --> ES/ClickHouse. Cabang search: pg_trgm untuk MVP, ES untuk Fase 3. Pahami peta ini dulu sebelum masuk optimasi per layer — karena tiap layer punya teknik berbeda.

- **Analogi Restoran**: Bayangkan warung Gotong Royong. Pelanggan (User) pesan via aplikasi (Flutter) ke Kasir (Gateway) yang cek kartu member (JWT) kurang dari 5ms. Kasir teruskan ke 7 Fondasi — seperti 7 meja persiapan bersama: meja kasir (Auth), meja data pelanggan (Profil), meja pembayaran (Payment), meja pengumuman (Notifikasi), meja gudang foto (Storage), meja buku kas stempel SHA-256 (Audit), dan meja saklar lampu (Feature Flag). Dari situ, bahan diambil dari 6 Gudang sesuai jenis: Gudang utama (Postgres) untuk transaksi, Meja Saji (Redis) untuk lauk siap saji kurang dari 5ms, dan gudang cabang lain untuk kebutuhan khusus. Jika Meja Saji ada, langsung hidang — tidak perlu bongkar Gudang utama.

- **Perintah Live**: ```bash
Tidak ada demo, fokus arsitektur
```

- **Q&A Antisipasi**: Q: Kenapa 7 fondasi, tidak 3 atau 10? A: Karena 7 itu fondasi bersama yang dipakai semua modul — Auth, Profil, Payment, Notifikasi, Storage, Audit SHA-256, dan Feature Flag. Jika tiap modul bikin sendiri, duplikasi dan inkonsisten. Q: Kenapa 6 DB, tidak cukup Postgres saja? A: Postgres jantung ACID, tapi Redis untuk cache kurang dari 10ms, ES untuk geo kurang dari 10ms, ClickHouse untuk OLAP — tiap DB untuk beban yang paling cocok.

- **Transisi**: Peta aliran sudah jelas. Sekarang masuk ke jantung Gudang — Bab 3.1, bagaimana B-Tree bikin 1 juta baris jadi 20 langkah.

---

### Slide 14: Bab 3.1 - Index B-Tree 50.000x: 1M Langkah vs 20 (Durasi: 1.5 menit)

- **Narasi**: Tanpa index, Postgres lakukan Seq Scan — baca 1.000.000 baris satu per satu, O(n), sekitar 2000ms untuk tabel UMKM 6.081 baris yang akan tumbuh ke jutaan. Dengan B-Tree (Balanced Tree), data disusun seperti pohon berimbang — root -> branch -> branch -> leaf. Cari kelurahan Bintaro hanya butuh sekitar 20 langkah (log2 1M sekitar 20), O(log n), sekitar 10ms. Speedup 50.000x — dari 1.000.000 langkah jadi 20 langkah, dari 2000ms jadi 10ms.

  Aturan Checklist nomor 3: semua Foreign Key wajib punya index. Tanpa index, JOIN pasti Seq Scan. Buat index dengan CONCURRENTLY agar tidak blokir write di produksi — CREATE INDEX CONCURRENTLY idx_umkm_kelurahan ON umkm(kelurahan). Untuk query ORDER BY pinned, created_at LIMIT 20, butuh index komposit (community_id, pinned, created_at) agar p50 kurang dari 30ms. Cek dengan EXPLAIN ANALYZE — pastikan muncul Index Scan, bukan Seq Scan. Jika masih Seq Scan, berarti index belum ada atau statistik belum ANALYZE.

  Ingat batas: jangan index semua kolom. Index mempercepat read tapi memperlambat write dan makan disk. Maksimal 5-7 index per tabel, hanya untuk kolom yang sering di WHERE, JOIN, atau ORDER BY.

- **Analogi Restoran**: Gudang (Database) tanpa indeks seperti cari satu karung beras di gudang tanpa rak — harus buka karung satu per satu, 1 juta karung, 2000ms. Dengan B-Tree seperti gudang pakai rak berlabel — rak A, rak B, sub-rak Bintaro — langsung lompat ke rak yang tepat dalam 20 langkah, 10ms. Dapur (Server) yang pintar selalu pakai rak berlabel, bukan bongkar semua karung.

- **Perintah Live**: ```bash
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM umkm WHERE kelurahan='Bintaro'"
# Harapkan: Index Scan using idx_umkm_kelurahan (Execution Time: ~10ms)
# Tanpa index: Seq Scan on umkm (Execution Time: ~2000ms) -- 50.000x lebih lambat
psql $DATABASE_URL -c "CREATE INDEX CONCURRENTLY idx_umkm_kelurahan ON umkm(kelurahan);"
psql $DATABASE_URL -c "ANALYZE umkm;"
```

- **Q&A Antisipasi**: Q: Kapan index malah merugikan? A: Tiga kondisi: pertama, jika lebih dari 50 persen query butuh full scan — index tidak terpakai. Kedua, kolom dengan kurang dari 10 nilai unik (misal boolean) — index tidak selektif. Ketiga, terlalu banyak index (lebih dari 5-7 per tabel) — write jadi lambat dan VACUUM berat. Q: Kenapa harus CONCURRENTLY? A: Tanpa CONCURRENTLY, CREATE INDEX lock tabel — write terblokir. Dengan CONCURRENTLY, build index tanpa blokir, aman di produksi.

- **Transisi**: B-Tree untuk pencarian tepat (kelurahan = Bintaro). Tapi bagaimana jika cari LIKE '%ayam%' — B-Tree tidak bisa. Itu tugas pg_trgm di Slide 15.

---

### Slide 15: Bab 3.2 - pg_trgm GIN 10-50ms vs LIKE 2000ms (Durasi: 1.5 menit)

- **Narasi**: LIKE '%ayam%' tidak bisa pakai B-Tree — karena wildcard di depan, Postgres harus Seq Scan 6.081 baris sekitar 2000ms, dan akan meledak saat data tumbuh ke ratusan ribu. Solusi MVP Rp0 adalah pg_trgm dengan GIN index. pg_trgm pecah teks jadi trigram — potongan 3 huruf yang overlap. Contoh: SELAMAT dipecah jadi {SEL, ELA, LAM, AMA, MAT}, SELAMIT jadi {SEL, ELA, LAM, AMI, MIT} — overlap 3 dari 5 trigram, similarity 71 persen (5/7). GIN index simpan daftar trigram, cari overlap trigram — bukan scan semua baris — hasil 10-50ms, 40-200x lebih cepat.

  Query-nya: SELECT * FROM umkm WHERE name % 'ayam' ORDER BY similarity(name,'ayam') DESC LIMIT 20. Operator % artinya similarity lebih dari 0.3 (threshold default). Buat index: CREATE EXTENSION pg_trgm; CREATE INDEX USING GIN (name gin_trgm_ops). Tuning: word_similarity_threshold 0.3 ke 0.2 untuk typo tolerance lebih longgar — misal cari 'ayam' tetap ketemu 'ayam geprek' meski typo. Untuk 500+ komunitas Fase 3, baru butuh Elasticsearch — pg_trgm cukup untuk puluhan ribu.

- **Analogi Restoran**: LIKE '%ayam%' tanpa index seperti cari resep ayam dengan baca semua halaman buku resep satu per satu — 2000ms. pg_trgm GIN seperti buku dengan indeks belakang — cari kata 'ayam' di indeks, langsung lompat ke halaman 12, 45, 89 — 10-50ms. Dapur (Server) tidak perlu bongkar seluruh Gudang (Database), cukup lihat indeks trigram di Meja Saji.

- **Perintah Live**: ```bash
# Bandingkan latency_ms di response JSON
curl "http://localhost:3003/api/cari?q=ayam" | jq '.meta.latency_ms'
# Harapkan: 10-50ms (GIN Index Scan)

curl "http://localhost:3003/api/cari?q=ayam&mode=like" | jq '.meta.latency_ms'
# Harapkan: ~2000ms (Seq Scan) -- 40-200x lebih lambat

psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM umkm WHERE name % 'ayam' ORDER BY similarity(name,'ayam') DESC LIMIT 20;"
# Harapkan: Bitmap Index Scan on idx_umkm_name_trgm
```

- **Q&A Antisipasi**: Q: Kenapa GIN, bukan B-Tree atau GiST? A: GIN dengan gin_trgm_ops khusus untuk LIKE/ILIKE dan operator similarity %. B-Tree hanya untuk = atau prefix LIKE 'ayam%', GiST bisa tapi GIN lebih cepat untuk trigram. Q: Kapan pg_trgm tidak cukup? A: Saat ratusan ribu dokumen, butuh stemming superior dan geospasial — itu tugas Elasticsearch Fase 3.

- **Transisi**: Pencarian sudah cepat. Sekarang dua teknik untuk agregasi dan pagination — MatView dan Cursor di Slide 16.

---

### Slide 16: Bab 3.3-3.4 - MatView + Cursor vs OFFSET 2s -> 20ms (Durasi: 1.5 menit)

- **Narasi**: Dua masalah berbeda, satu prinsip: jangan hitung ulang atau baca-buang. Pertama, Materialized View untuk agregasi kas. Tanpa MatView, SELECT SUM(amount) GROUP BY community_id harus Seq Scan financial_ledger tiap ada yang buka laporan — 500ms. Dengan MatView mv_kas_total yang sudah hitung COUNT, SUM, MAX per community_id, query jadi SELECT * FROM mv_kas_total WHERE community_id='xxx' — Index Scan 5-30ms, 16-100x. Refresh dengan REFRESH MATERIALIZED VIEW CONCURRENTLY tiap 5-15 menit via pg_cron — butuh UNIQUE INDEX agar tidak lock read.

  Kedua, Cursor vs OFFSET untuk pagination. OFFSET 10000 artinya SELECT ... ORDER BY created_at LIMIT 20 OFFSET 10000 — DB scan 10.020 baris, buang 10.000, kirim 20 — 2000ms, semakin dalam halaman semakin lambat. Cursor keyset: SELECT ... WHERE (created_at, id) > ('2024-01-15','umkm_3000') ORDER BY created_at, id LIMIT 20 — langsung lompat via index (created_at, id) — 20ms, 100x, stabil tidak skip atau duplikat saat data baru masuk. Cursor di-encode base64 dari {created_at, id} jadi nextCursor.

- **Analogi Restoran**: MatView seperti rekap kas harian yang sudah dihitung tiap pagi — ada yang tanya total kas, langsung lihat rekap 5-30ms, tidak hitung ulang semua nota 500ms. OFFSET seperti pelayan yang disuruh ambil 20 piring mulai dari piring ke-10000 — ia harus hitung dan buang 10.000 piring dulu, 2000ms. Cursor seperti pelayan yang dikasih penanda 'lanjut dari piring nomor 3000 tanggal 15 Januari' — langsung lompat ke sana, 20ms. Meja Saji (Cache) dan Gudang (Database) dengan index komposit bikin lompatan ini mungkin.

- **Perintah Live**: ```bash
# MatView: bandingkan before (Seq Scan) vs after (MatView)
curl "http://localhost:3004/api/kas?community_id=xxx&mode=before" | jq '.meta.latency_ms'
# Harapkan: ~500ms (Seq Scan SUM)
curl "http://localhost:3004/api/kas?community_id=xxx" | jq '.meta.latency_ms'
# Harapkan: 5-30ms (MatView Index Scan)

# Cursor vs OFFSET
curl "http://localhost:3003/api/umkm?offset=10000&limit=20" | jq '.meta.latency_ms'
# Harapkan: ~2000ms (scan+discard)
curl "http://localhost:3003/api/umkm?cursor=eyJjcmVhdGVkX2F0IjoiMjAyNC0wMS0xNVQwMDowMDowMFoiLCJpZCI6InVta21fMzAwMCJ9&limit=20" | jq '.meta.latency_ms'
# Harapkan: ~20ms (Index Scan keyset)
```

- **Q&A Antisipasi**: Q: Kapan pakai cursor, kapan OFFSET? A: Cursor untuk infinite scroll dan feed — stabil, cepat, tidak skip saat data baru masuk. OFFSET hanya untuk halaman bernomor yang butuh lompat ke halaman 5 atau 10 — tapi batasi max OFFSET 1000, lebih dari itu paksa cursor. Q: Kenapa MatView butuh UNIQUE INDEX? A: Agar REFRESH CONCURRENTLY tidak lock read — tanpa unique index, refresh blokir semua SELECT ke MatView.

- **Transisi**: Agregasi dan pagination sudah hemat. Sekarang tiga fondasi terakhir Postgres scale — PgBouncer, EXPLAIN, RLS, VACUUM di Slide 17.

---

### Slide 17: Bab 3.5-3.8 - PgBouncer Pool 25, EXPLAIN 6 Langkah, RLS <0.1ms, VACUUM (Durasi: 1.5 menit)

- **Narasi**: Empat teknik dalam satu slide — semua tentang efisiensi koneksi dan kebersihan Gudang. Pertama, PgBouncer pool 25 transaction mode di port 6432. Tanpa pool, 500 koneksi langsung ke Postgres makan 1-3MB per koneksi — 1500MB, server crash. Dengan pool 25, hanya 25 koneksi fisik yang dipakai bergantian — sekitar 75MB, hemat 95 persen. Rumus pool: (CPU core * 2) + spindle — 4 core jadi 10-15, kita set 25 untuk handle 100 RPS MVP dengan buffer.

  Kedua, SOP EXPLAIN 6 langkah: 1) EXPLAIN ANALYZE query, 2) cek apakah Seq Scan, 3) buat index CONCURRENTLY, 4) ANALYZE tabel, 5) EXPLAIN lagi, 6) cek Buffers hit — pastikan shared hit kecil (45 vs 1200). Ketiga, RLS (Row Level Security) untuk isolasi per komunitas: CREATE POLICY ... USING (community_id = current_setting('app.community_id')::text) + index FK — overhead kurang dari 0.1ms, 99.94 persen improvement vs filter di aplikasi. Keempat, VACUUM hapus dead tuples (bangkai UPDATE/DELETE), ANALYZE update statistik planner agar tidak salah pilih Seq Scan. Cek n_dead_tup kurang dari 1000, autovacuum normal, pg_stat_statements enabled, slow log lebih dari 100ms.

- **Analogi Restoran**: PgBouncer seperti kolam koneksi siap pakai — 25 gayung siap di kolam, Pelanggan (User) pakai bergantian, tidak perlu buka tutup keran (koneksi baru) tiap pelanggan — hemat air (RAM) 95 persen. EXPLAIN seperti cek resep — lihat langkah masak, jika masih bongkar semua bahan (Seq Scan), buat rak baru (index). RLS seperti sekat warung — tiap komunitas hanya lihat mejanya sendiri, sekatnya tipis kurang dari 0.1ms. VACUUM seperti bersih-bersih gudang — buang karung kosong (dead tuples) agar tidak sesak.

- **Perintah Live**: ```bash
# PgBouncer pool
psql postgres://demo:demo123@localhost:6432/gotongroyong_demo -c "SHOW POOLS;"
# Harapkan: pool_mode transaction, default_pool_size 25, cl_active, sv_active

# RLS + EXPLAIN
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM financial_ledger WHERE community_id='xxx';"
# Harapkan: Index Scan using idx_ledger_community_timestamp, Execution Time <0.1ms overhead RLS

psql $DATABASE_URL -c "SELECT n_dead_tup FROM pg_stat_all_tables WHERE relname='umkm';"
# Harapkan: <1000 (VACUUM sehat)
```

- **Q&A Antisipasi**: Q: Kenapa pool 25, tidak 10 atau 100? A: Rumus (CPU*2)+spindle — 4 core jadi 10-15. Kita set 25 untuk 100 RPS MVP dengan buffer burst. Terlalu kecil antre, terlalu besar boros RAM. Q: Kapan VACUUM manual? A: Setelah bulk insert 6.081 UMKM atau batch update besar — jalankan VACUUM ANALYZE umkm agar planner tidak salah pilih Seq Scan karena statistik kadaluarsa.

- **Transisi**: Postgres scale selesai — dari B-Tree sampai VACUUM. Sekarang naik ke layer Meja Saji — caching hierarki di Slide 18.

---

### Slide 18: Bab 4 - Caching Hierarki L1 sub-ms L2 1-5ms L3 10-50ms (Durasi: 1.5 menit)

- **Narasi**: Caching adalah hierarki kecepatan — L1 memory sub-ms (hot, di aplikasi), L2 Redis 1-5ms (warm, di server cache), L3 Postgres 10-50ms (cold, di Gudang). Tujuan: kejar L1/L2, hindari L3. Redis kurang dari 1ms, ratusan kali lebih cepat dari disk. Pola yang kita pakai adalah Cache-Aside (lazy): baca cache dulu, jika HIT langsung return, jika MISS baru query DB lalu SETEX ke Redis. Lawannya Write-Through (tulis cache dan DB sync) dan Write-Behind (tulis cache dulu, DB async — jangan untuk kas ACID).

  Invalidate on update: POST /api/kas setelah insert langsung DEL kas:summary:{id} — GET berikutnya MISS, fetch DB, SETEX lagi. TTL per endpoint sudah dipetakan: profil 5 menit (Single Source of Truth), komunitas/:id 10 menit (jarang berubah), pengumuman 1 menit (sering update pinned), jadwal sholat 1 jam (paling jarang berubah), laporan kas 5 menit (agregasi MatView), feature_flag 30 detik (kill-switch cepat). Hit rate di atas 80 persen adalah pembeda MVP scalable vs boros DB — monitor via cache_hit_total di Prometheus.

- **Analogi Restoran**: Hierarki cache seperti warung: L1 Meja Saji sub-ms — lauk sudah di meja, ambil langsung. L2 Kulkas 1-5ms — lauk di kulkas dekat dapur, ambil cepat. L3 Gudang 10-50ms — bahan di gudang belakang, harus jalan dan bongkar. Dapur (Server) yang pintar selalu cek Meja Saji dulu, baru Kulkas, baru Gudang. Cache-Aside seperti pelayan yang hanya siapkan lauk yang dipesan — tidak masak semua lauk tiap pagi. Jika Meja Saji kosong (MISS), baru masak dari Gudang lalu taruh di Meja Saji untuk pelanggan berikutnya.

- **Perintah Live**: ```bash
# First hit MISS, second hit HIT
curl -i "http://localhost:3003/api/komunitas/xxx" | grep -i X-Cache
# Harapkan: X-Cache: MISS (pertama, fetch DB 20ms)
curl -i "http://localhost:3003/api/komunitas/xxx" | grep -i X-Cache
# Harapkan: X-Cache: HIT (kedua, Redis 2ms)

redis-cli INFO stats | grep -E "keyspace_hits|keyspace_misses"
# Hitung hit rate: hits / (hits+misses) >80%
curl "http://localhost:3003/api/cache/stats" | jq '.hitRate'
# Harapkan: >0.8
```

- **Q&A Antisipasi**: Q: Kenapa Cache-Aside, bukan Write-Through? A: Cache-Aside resilience tinggi — jika Redis down, aplikasi tetap jalan via DB (hanya lambat). Write-Through jika Redis down, write gagal. Untuk MVP, resilience lebih penting dari konsistensi mutlak. Q: Kenapa TTL beda-beda? A: Karena frekuensi berubah beda — jadwal sholat jarang berubah jadi 1 jam, pengumuman sering jadi 1 menit, feature_flag kill-switch harus 30 detik agar cepat matikan fitur bermasalah.

- **Transisi**: Hierarki dan TTL sudah paham. Sekarang tiering hot/warm/cold dan kapan Redis wajib — Slide 19.

---

### Slide 19: Bab 4 - Tiering Hot/Warm/Cold + Kapan Redis Wajib (Durasi: 1.5 menit)

- **Narasi**: Tidak semua data butuh cache — tiering hemat biaya. Hot adalah request per detik (leaderboard, feature_flag) — simpan di Redis TTL 1 detik sampai 1 menit. Warm adalah request per menit (pengumuman, cari populer) — Postgres + index + Redis 5-10 menit. Cold adalah request per jam (arsip, jadwal sholat) — arsip atau ClickHouse, tanpa cache atau TTL 1 jam. Contoh: jadwal sholat cold tapi TTL 1 jam karena paling jarang berubah — endpoint tercepat p50 kurang dari 20ms justru karena cache lama.

  Kapan Redis wajib? MVP ditunda Rp0 — Postgres + index cukup untuk 100 RPS, tanpa Redis. Fase 2 free tier — pakai Upstash 10k command per hari gratis. Fase 3 wajib 10-50 dolar per bulan — saat hit rate di atas 80 persen atau p99 lebih dari 5ms atau lebih dari 500 writes per detik. Jangan over-engineering di awal — mulai tanpa Redis, tambah saat metrik bilang perlu. Tiering memastikan hanya hot/warm yang di-cache, cold tidak boros memory.

- **Analogi Restoran**: Tiering seperti atur lauk di warung: lauk paling laku (Hot) taruh di Meja Saji depan — ambil 1 detik. Lauk lumayan laku (Warm) di Kulkas — ambil 1 menit. Lauk jarang dipesan (Cold) di Gudang — ambil 1 jam, tidak perlu taruh di Meja Saji. MVP warung kecil belum perlu Kulkas (Redis) — Gudang + rak (index) cukup. Saat warung ramai Fase 3, baru wajib Kulkas 10-50 dolar agar Meja Saji selalu penuh dan Pelanggan (User) tidak antre ke Gudang.

- **Perintah Live**: ```bash
redis-cli --latency
# Harapkan: min/avg/max <1ms (Redis ratusan kali lebih cepat dari disk)
redis-cli --latency-history -i 1
# Lihat latency per detik, pastikan <1ms stabil

redis-cli INFO memory | grep used_memory_human
# Cek memory tiering tidak boros
```

- **Q&A Antisipasi**: Q: Kapan pakai Write-Through, bukan Cache-Aside? A: Untuk keuangan (kas/donasi) yang butuh konsistensi — tulis cache dan DB sync agar tidak ada jendela inkonsisten. Tapi untuk MVP, Cache-Aside + invalidate on update sudah cukup, Write-Through baru Fase 3. Q: Kenapa MVP tunda Redis? A: Karena Postgres + index + MatView sudah handle 100 RPS Rp0. Redis tambah kompleksitas dan biaya — tunda sampai Fase 2 free tier atau Fase 3 wajib saat hit rate atau p99 butuh.

- **Transisi**: Caching selesai. Sekarang pencarian skala besar — Elasticsearch vs pg_trgm di Slide 20.

---

### Slide 20: Bab 5 - Elasticsearch Inverted Index + Geospasial 5km (Durasi: 1.5 menit)

- **Narasi**: Elasticsearch pakai inverted index — kebalikan dari LIKE. LIKE scan semua baris, ES pecah kata jadi index kata — misal 'ayam geprek' jadi posting list {ayam: [doc 12, 45, 89], geprek: [doc 12, 78]}. Cari 'ayam' langsung ambil posting list — kurang dari 10ms untuk jutaan dokumen, vs LIKE 2000ms. Kapan dibutuhkan? MVP ditunda — pg_trgm cukup untuk puluhan ribu. Fase 3 ratusan ribu dokumen atau 500+ komunitas — ES wajib.

  Mapping ES: text dengan analyzer indonesian (stemming, stop-words) + keyword + suggest, lat_lng geo_point, created_at date, kelurahan keyword. Fitur geospasial: cari masjid terdekat 5km dengan geo_distance 5km + sort _geo_distance — kurang dari 10ms (PostGIS sekitar 50ms). Sinkronisasi via Postgres WAL --> Debezium --> Kafka --> ES (real-time) atau batch 5 menit untuk MVP. Fallback: jika ES down, otomatis fallback ke pg_trgm GIN 10-50ms — tidak error ke user.

- **Analogi Restoran**: Inverted index seperti indeks buku — cari 'ayam' di indeks belakang, langsung lompat ke halaman 12, 45, 89 — kurang dari 10ms. LIKE seperti baca semua halaman buku satu per satu — 2000ms. Geospasial seperti peta masjid terdekat 5km — ES seperti GPS yang langsung tunjuk masjid dalam radius 5km kurang dari 10ms, PostGIS seperti tanya satu per satu jarak tiap masjid 50ms. Dapur (Server) pakai indeks buku untuk cepat, peta untuk dekat.

- **Perintah Live**: ```bash
# Bandingkan ES vs pg_trgm
curl "http://localhost:9200/umkm/_search?q=ayam" | jq '.took'
# Harapkan: <10ms (inverted index)

curl "http://localhost:3003/api/cari?q=ayam" | jq '.meta.latency_ms'
# Harapkan: 10-50ms (pg_trgm GIN) -- ES 5x lebih cepat untuk jutaan dokumen

# Geospasial masjid terdekat 5km
curl "http://localhost:3003/api/masjid-terdekat?lat=-6.25&lng=106.75&radius=5km" | jq '.meta.took_ms'
# Harapkan: <10ms (ES geo_distance) vs PostGIS ~50ms
```

- **Q&A Antisipasi**: Q: Kenapa tidak pakai ES dari awal MVP? A: Karena pg_trgm gratis built-in Postgres, cukup untuk puluhan ribu, setup sederhana. ES butuh server tambahan 10-50 dolar, setup kompleks, butuh CDC — baru wajib Fase 3 saat ratusan ribu dan butuh geospasial. Q: Bagaimana jika ES down? A: Fallback otomatis ke pg_trgm GIN 10-50ms — user tetap dapat hasil, hanya sedikit lebih lambat, tidak error.

- **Transisi**: ES sudah paham. Sekarang tabel perbandingan lengkap pg_trgm vs ES — Slide 21.

---

### Slide 21: Bab 5 - pg_trgm vs Elasticsearch Tabel Perbandingan (Durasi: 1.5 menit)

- **Narasi**: Slide 21 adalah tabel keputusan — kapan pakai motor (pg_trgm), kapan upgrade ke mobil (ES). Enam aspek: Biaya — pg_trgm gratis built-in vs ES server 10-50 dolar per bulan. Setup — pg_trgm sederhana (CREATE EXTENSION) vs ES kompleks (cluster, mapping, CDC). Kapasitas — pg_trgm puluhan ribu vs ES ratusan ribu. Stemming — pg_trgm terbatas (trigram) vs ES superior (analyzer indonesian dengan stop-words dan stemming — 'makan', 'makanan', 'memakan' dianggap sama). Geospasial — pg_trgm butuh PostGIS sekitar 50ms vs ES geo_point kurang dari 10ms. Kapan — pg_trgm untuk MVP sampai Fase 2, ES untuk Fase 3 ke atas.

  Prinsip: jangan over-engineering di awal. Mulai dengan motor (pg_trgm) — cukup, gratis, sederhana. Upgrade ke mobil (ES) saat jarak jauh (ratusan ribu) dan butuh fitur (geospasial, fuzziness AUTO, highlight). Fallback selalu ada — jika ES down, otomatis ke pg_trgm. Tabel ini jadi kompas roadmap — tiap fase cek kapasitas, jika puluhan ribu tetap di pg_trgm, jika ratusan ribu baru ES.

- **Analogi Restoran**: pg_trgm vs ES seperti motor vs mobil. Motor (pg_trgm) gratis, lincah, cukup untuk antar lauk dalam kampung (puluhan ribu) — 10-50ms. Mobil (ES) butuh bensin 10-50 dolar, parkir luas, tapi untuk antar ke kota sebelah (ratusan ribu) dan bawa banyak (geospasial, stemming) — kurang dari 10ms. Warung kecil mulai dengan motor, warung besar baru butuh mobil. Jika mobil mogok (ES down), motor tetap antar — fallback.

- **Perintah Live**: ```bash
Tidak ada demo, fokus tabel
# Tabel ada di slide HTML — bandingkan 6 aspek:
# Biaya | Setup | Kapasitas | Stemming | Geospasial | Kapan
# pg_trgm: Gratis | Sederhana | Puluhan ribu | Terbatas | PostGIS ~50ms | MVP-Fase2
# ES: $10-50 | Kompleks | Ratusan ribu | Superior | <10ms | Fase3+
```

- **Q&A Antisipasi**: Q: Bedanya stemming pg_trgm dan ES? A: pg_trgm pecah jadi trigram 3 huruf — 'makan' jadi {mak, aka, kan} — tidak paham kata dasar. ES analyzer indonesian paham stop-words ('yang', 'di') dan stemming ('makanan', 'memakan' jadi 'makan') — pencarian lebih pintar. Q: Bisa pakai keduanya bersamaan? A: Ya — ES primary, pg_trgm fallback. Jika ES down, query otomatis ke pg_trgm — user tidak merasakan error.

- **Transisi**: Perbandingan sudah jelas. Sekarang bagaimana ES dan ClickHouse dapat data tanpa dual-write — CDC di Slide 22.

---

### Slide 22: Bab 6 - CDC Debezium WAL -> Kafka -> ES/ClickHouse (Durasi: 1.5 menit)

- **Narasi**: CDC (Change Data Capture) adalah cara sebar data tanpa dual-write. Debezium baca WAL (Write-Ahead Log) Postgres — log logical yang catat tiap INSERT/UPDATE/DELETE — lalu kirim ke Kafka sebagai broker. Kafka teruskan ke consumer terpisah yang tulis ke ES (search) dan ClickHouse (OLAP). Alternatif batch ETL untuk non real-time: cron 00:00 ekstrak Postgres lalu bulk ke ClickHouse — cukup untuk laporan bulanan, tanpa Kafka, hemat biaya.

  Bahaya dual-write: jika aplikasi tulis Postgres OK tapi tulis ES gagal — data hilang di search, inkonsisten, tidak ada transaksi lintas DB, retry manual jadi duplikat. Prinsip single writer: hanya tulis ke Postgres (source of truth), biarkan CDC yang sebar async. Postgres + WAL durable, Kafka buffer dan replay, ES/ClickHouse derived — bisa rebuild kapan saja dari Postgres. Lag dimonitor: lag_ms = now - ts_ms, alert jika lebih dari 1000ms. Offset commit manual setelah ES/ClickHouse sukses — jika gagal, Kafka redeliver (at-least-once, idempotent via id dedup).

- **Analogi Restoran**: CDC seperti CCTV Gudang (WAL) yang rekam tiap perubahan — ada karung masuk, keluar, pindah — lalu Kurir (Kafka) antar rekaman ke toko cabang (ES/ClickHouse). Toko cabang update stok dari rekaman CCTV, bukan dari laporan manual Dapur (dual-write). Jika Dapur tulis buku Gudang OK tapi lupa kabari toko cabang (dual-write gagal) — stok cabang salah. Dengan CCTV + Kurir, hanya tulis di Gudang utama, Kurir yang sebar — konsisten, bisa replay jika cabang ketinggalan.

- **Perintah Live**: ```bash
# Lihat CDC event di Kafka
kafka-console-consumer --bootstrap-server localhost:9092 --topic gotongroyong.public.umkm --from-beginning --max-messages 5 | jq '.payload'
# Harapkan: { op: "c", after: { id, name, kelurahan }, ts_ms }

# Trigger CDC: insert lalu cek ES
psql $DATABASE_URL -c "INSERT INTO umkm (name, kelurahan) VALUES ('Ayam Geprek Baru', 'Bintaro');"
sleep 2
curl "http://localhost:9200/umkm/_search?q=Ayam%20Geprek%20Baru" | jq '.hits.hits[0]._source.name'
# Harapkan: "Ayam Geprek Baru" (CDC sudah sebar ke ES)

# Cek lag
curl "http://localhost:3003/api/cdc/lag" | jq '.lag_ms'
# Harapkan: <1000ms
```

- **Q&A Antisipasi**: Q: Kenapa tidak dual-write langsung dari aplikasi? A: Karena jika salah satu gagal inkonsisten — Postgres OK + ES gagal = data tidak bisa dicari. Tidak ada transaksi lintas DB. Single writer Postgres + async CDC via WAL lebih aman — Kafka buffer, bisa retry, idempotent. Q: Kapan pakai batch ETL, kapan CDC? A: Batch ETL cron 00:00 untuk laporan bulanan non real-time — sederhana tanpa Kafka. CDC untuk real-time search dan dashboard — butuh detik, pakai Debezium + Kafka.

- **Transisi**: Data sudah tersebar konsisten. Sekarang bagaimana data dikirim hemat ke Flutter — API Delivery di Slide 23.

---

### Slide 23: Bab 7 - API Delivery Payload Shaping, GZIP 70-80%, Cursor, Edge (Durasi: 1.5 menit)

- **Narasi**: API Delivery adalah seni kirim data hemat — penting untuk 3G dan kuota Indonesia. Pertama, payload shaping (sparse fieldsets): ?fields=name,lat,lng — hanya kirim field yang dibutuhkan Flutter, bukan SELECT *. Dari 100KB full jadi 15KB — hemat 85 persen, parsing cepat di HP 2GB. Kedua, kompresi: GZIP 70-80 persen untuk JSON (100KB jadi 20KB), Brotli tambah 20-30 persen (20KB jadi 14-16KB) — level 6, threshold 1024, semua browser support GZIP. Ketiga, cursor vs OFFSET — cursor 20ms stabil untuk feed, OFFSET 2000ms di halaman dalam — wajib cursor untuk list. Keempat, Cloudflare Edge 330+ DC — cache response GET di edge TTL 1 menit, kurangi origin hit 80 persen, TTFB kurang dari 50ms global.

  Kombinasi: payload shaping + GZIP + cursor + Edge = hemat kuota, cepat, dan kurangi beban origin. Verifikasi dengan curl -H Accept-Encoding: gzip -v — cek header Content-Encoding: gzip dan Content-Length 20KB vs 100KB.

- **Analogi Restoran**: Payload shaping seperti bungkus makanan hanya yang dipesan — Pelanggan (User) pesan ayam dan nasi, Dapur (Server) bungkus hanya ayam dan nasi (fields=name,lat,lng) — 15KB, tidak bungkus seluruh menu 100KB. GZIP seperti kompres dus — dus besar 100KB dikompres jadi 20KB, Brotli jadi 14KB — hemat ongkir (kuota). Cursor seperti nomor antrean — langsung lompat ke nomor 3000, tidak hitung dari 1. Edge seperti cabang warung — menu populer simpan di cabang dekat rumah Pelanggan, tidak perlu ke pusat tiap kali.

- **Perintah Live**: ```bash
curl -H "Accept-Encoding: gzip" -v "http://localhost:3003/api/umkm?fields=name,lat,lng&limit=20" 2>&1 | grep -E "Content-Encoding|Content-Length|< HTTP"
# Harapkan: Content-Encoding: gzip, Content-Length: ~20KB (dari 100KB full)
# Tanpa fields: Content-Length: ~100KB
# Tanpa gzip: Content-Length: ~100KB

curl "http://localhost:3003/api/umkm?fields=name,lat,lng&limit=20" | jq '.data[0]'
# Harapkan: hanya { name, lat, lng } -- sparse fieldsets

curl -H "Accept-Encoding: br" -v "http://localhost:3003/api/umkm?limit=20" 2>&1 | grep Content-Encoding
# Harapkan: Content-Encoding: br (Brotli 14-16KB, +20-30% vs GZIP)
```

- **Q&A Antisipasi**: Q: Kenapa sparse fieldsets hemat kuota? A: Karena Flutter hanya butuh 3 field untuk list — kirim 15KB vs 100KB full (85 persen saving). Di 3G RTT 500ms, payload kecil parsing cepat di HP 2GB dan hemat kuota pengguna. Q: Kapan pakai Brotli vs GZIP? A: GZIP wajib — semua browser support, 70-80 persen. Brotli tambah 20-30 persen tapi butuh client support Accept-Encoding: br — pakai keduanya, server pilih yang client support.

- **Transisi**: Payload dan kompresi sudah hemat. Terakhir di part 2 — rate limiting dan Edge caching di Slide 24.

---

### Slide 24: Bab 7 - Rate Limiting 100/10/5 + Edge Caching (Durasi: 1.5 menit)

- **Narasi**: Dua proteksi terakhir: rate limiting dan Edge caching. Rate limiting 3 tier: umum 100 req/menit (GET /api/komunitas), berat 10 req/menit (POST /api/kas write), auth 5 req/menit (POST /auth/login) — lindungi backend dari burst dan abuse, kembalikan 429 + Retry-After jika lewat. Token/Leaky Bucket di Redis — hitung per IP/user, tolak burst, simpan di Redis. Tanpa rate limit, satu user bisa bombardir DB dengan 1000 req/detik — DB down.

  Edge caching: profil, masjid, jadwal, pengumuman publik — cache di Cloudflare Edge TTL 1 menit sampai 1 jam, kurangi origin hit 80 persen. Jangan cache privat: kas, profil pribadi, ledger — bypass Edge, hanya Redis L2. Verifikasi: burst 105 request, 5 terakhir harus 429. Cek header CF-Cache-Status: HIT untuk publik, BYPASS untuk privat. Kombinasi rate limit + Edge = backend aman dari abuse dan hemat origin.

- **Analogi Restoran**: Rate limiting seperti kasir batasi pelanggan per menit — umum 100 per menit, pesan berat (write) 10 per menit, masuk pintu (auth) 5 per menit — jika lewat, kasir bilang 'tunggu, antre' (429 Retry-After). Lindungi Dapur (Server) dari diserbu. Edge caching seperti cabang warung simpan menu populer — Pelanggan dekat cabang langsung dapat dari cabang (Edge HIT) tanpa ke pusat (origin) — hemat 80 persen perjalanan. Menu privat (kas pribadi) tidak simpan di cabang — hanya di Gudang utama (Redis L2) agar tidak bocor.

- **Perintah Live**: ```bash
# Burst 105 request -- 5 terakhir harus 429
for i in $(seq 1 105); do curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3003/api/cari?q=ayam"; done | tail -10
# Harapkan: 100x 200, 5x 429 (Retry-After header)

# Cek rate limit header
curl -i "http://localhost:3003/api/cari?q=ayam" | grep -i -E "X-RateLimit|Retry-After"
# Harapkan: X-RateLimit-Limit: 100, X-RateLimit-Remaining, Retry-After saat 429

# Edge cache
curl -i "http://localhost:3003/api/jadwal-sholat?kota=Jakarta" | grep -i CF-Cache-Status
# Harapkan: CF-Cache-Status: HIT (publik, TTL 1 jam)
curl -i "http://localhost:3003/api/kas?community_id=xxx" | grep -i CF-Cache-Status
# Harapkan: BYPASS atau MISS (privat, tidak di Edge)
```

- **Q&A Antisipasi**: Q: Kenapa 3 tier rate limit, tidak satu angka? A: Karena risiko beda — umum 100 untuk baca, berat 10 untuk write yang beban DB tinggi, auth 5 untuk lindungi dari brute force login. Jika auth 100, penyerang bisa coba 100 password per menit. Q: Kenapa Edge hanya untuk publik? A: Karena Edge cache bisa dilihat banyak user — jika kas privat di-cache di Edge, user lain bisa lihat. Privat hanya di Redis L2 per user, dengan RLS.

- **Transisi**: Rate limiting dan Edge selesai — part 2 selesai di sini. Kita sudah dari Data Flow (Slide 13) lewat Postgres Scale (14-17), Caching (18-19), Elasticsearch (20-21), CDC (22), sampai API Delivery (23-24). Di part 3 kita masuk Observability, Roadmap 5 Fase, dan SLA 16 endpoint — dari proteksi ke pemantauan. Terima kasih, sampai jumpa di part 3.

---

### Slide 25: Bab 8 - Observability pg_stat_statements + Slow Log 100ms + Prometheus 10 Metrik (Durasi: 1.5 menit)

- **Narasi**: Slide 25 masuk ke Bab 8 Observability — bagaimana kita tahu apa yang lambat tanpa tebak-tebakan. Tiga alat utama. Pertama, pg_stat_statements — extension Postgres yang catat tiap query: total_exec_time, mean_exec_time, calls, rows. Query paling boros bukan yang paling lambat sekali, tapi yang total_exec_time paling besar — sering dipanggil dan lambat. Perintahnya: SELECT query, mean_exec_time, calls, total_exec_time FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10 — langsung ketahuan top 10 query paling makan waktu. Kedua, slow log 100ms — set log_min_duration_statement = 100ms di postgresql.conf, semua query di atas 100ms otomatis masuk log dan diteruskan ke Loki. Ketiga, Prometheus 10 metrik Poster #6 — scrape tiap 15 detik dari 11 jobs (order, payment, umkm, kas, pgbouncer, redis, postgres, node, prometheus, loki, otel-collector) — tampil di Grafana dashboard performa-gr. Alert threshold: p95 >500ms warning dan >1000ms critical selama 5 menit, error rate >1% warning >5% critical, DB pool >80%, disk >85% — semua kirim WA atau Email via Alertmanager.

- **Analogi Restoran**: pg_stat_statements seperti CCTV dapur yang catat waktu masak tiap menu — menu mana yang paling lama total, bukan sekali masak lama tapi sering dipesan dan lama. Slow log 100ms seperti alarm dapur — jika masak lebih dari 100ms, alarm bunyi dan catat di buku. Prometheus 10 metrik seperti 10 CCTV di warung — kasir, dapur, gudang, meja saji — semua terpantau, jika p95 >500ms alarm bunyi seperti kompor kepanasan.

- **Perintah Live**: ```bash
psql $DATABASE_URL -c "SELECT query, mean_exec_time, calls, total_exec_time FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;"
# Harapkan: top 10 query paling boros total_exec_time, cek mean_exec_time >100ms = lambat

psql $DATABASE_URL -c "SHOW log_min_duration_statement;"
# Harapkan: 100ms (slow log aktif)

curl -s "http://localhost:9090/api/v1/query?query=up" | jq '.data.result[] | {job: .metric.job, value: .value[1]}'
# Harapkan: 11 jobs UP (order, payment, umkm, kas, pgbouncer, redis, postgres, node, prometheus, loki, otel-collector)

curl -s "http://localhost:9090/api/v1/alerts" | jq '.data.alerts[] | {alert: .labels.alertname, state: .state}'
# Harapkan: P95High, ErrorRate, DBPoolHigh jika threshold terlampaui
```

- **Q&A Antisipasi**: Q: Kenapa slow log 100ms, tidak 10ms atau 1000ms? A: Jika terlalu rendah 10ms, banjir log — tiap query kecil masuk, Loki penuh, noise. Jika terlalu tinggi 1000ms, lewatkan pola — query 500ms yang sering tidak ketahuan. 100ms adalah sweet spot — tangkap yang benar-benar lambat tanpa banjir.

- **Transisi**: Sudah tahu cara lacak query lambat dan 10 metrik. Sekarang 3 pilar lengkapnya — metrics, logs, traces — di Slide 26.

---

### Slide 26: Bab 8 - 3 Pilar Observabilitas: Metrics / Logs / Traces (Durasi: 1.5 menit)

- **Narasi**: Tiga pilar observabilitas saling melengkapi — metrics kasih tahu apa yang lambat, logs kasih tahu kenapa, traces kasih tahu di mana bottleneck. Pilar pertama Metrics via Prometheus + Grafana — angka agregat: latency histogram_quantile p50/p95/p99, throughput RPS, error rate, CPU/memory, DB pool, cache hit rate. Query PromQL: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) untuk p95. Pilar kedua Logs via Loki — teks terstruktur Pino JSON dengan correlation ID requestId. Tiap log bawa requestId UUID yang sama lintas service — order, payment, umkm — jadi bisa korelasi satu request dari ujung ke ujung. Query LogQL: {service="order"} | json | requestId="550e8400-e29b-41d4-a716-446655440000" — langsung ketahuan jejak satu request di semua service. Labels Loki hanya service dan level (low cardinality), requestId dan latency_ms simpan di structured_metadata (high cardinality) agar tidak explosion. Pilar ketiga Traces via OTEL + Jaeger — jejak lintas service dengan flame graph. Tiap request buat span: GET /checkout -> bulkhead acquire 1ms -> circuit breaker 0.5ms -> payment POST /charge 280ms -> pg.query 40ms -> redis.set 5ms. Flame graph langsung tunjuk bottleneck — jika payment 280ms, lihat span pg.query 40ms atau http 280ms.

- **Analogi Restoran**: Metrics seperti kasir yang catat angka — berapa pelanggan per detik, berapa lama rata-rata dilayani, berapa persen gagal. Logs seperti buku tamu tiap meja — tiap pelanggan (requestId) catat pesan apa, berapa lama, kenapa komplain. Traces seperti jejak kurir — dari kasir ke dapur ke gudang ke meja saji, flame graph tunjuk di mana kurir paling lama berhenti. Ketiganya pakai correlation ID yang sama — requestId = traceId — seperti nomor struk yang sama di kasir, buku tamu, dan jejak kurir.

- **Perintah Live**: ```bash
# Metrics: cek Prometheus datasources di Grafana
curl -s "http://localhost:3000/api/datasources" | jq '.[] | {name: .name, type: .type}'
# Harapkan: prometheus (9090) dan loki (3100) terdaftar

# Metrics: query p95 via Prometheus API
curl -s "http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,rate(http_request_duration_seconds_bucket[5m]))" | jq '.data.result'

# Logs: LogQL Loki - semua log order
curl -G -s "http://localhost:3100/loki/api/v1/query" --data-urlencode 'query={service="order"} | json' | jq '.data.result | length'
# Harapkan: >0 logs

# Logs: korelasi by requestId lintas service
curl -G -s "http://localhost:3100/loki/api/v1/query" --data-urlencode 'query={service=~"order|payment|umkm|kas"} | json | requestId="550e8400-e29b-41d4-a716-446655440000"' | jq

# Traces: buka Jaeger UI
open http://localhost:16686
# Cari service order-service, lihat flame graph trace 320ms -> pg.query 40ms, redis 5ms, http 280ms
```

- **Q&A Antisipasi**: Q: Bedanya logs vs traces? A: Logs adalah catatan per service — tiap service tulis log sendiri dengan requestId. Traces adalah jejak lintas service — satu requestId yang sama mengalir dari order ke payment ke DB/Redis, flame graph tunjuk di mana bottleneck. Logs jawab kenapa error, traces jawab di mana lambat. Keduanya pakai requestId yang sama untuk korelasi.

- **Transisi**: Tiga pilar sudah paham — metrics apa, logs kenapa, traces di mana. Sekarang roadmap besarnya — 5 fase dari MVP Rp0 sampai auto-scale di Slide 27.

---

### Slide 27: Bab 9 - Roadmap 5 Fase: MVP Rp0 p50<50ms -> Fase 5 200k+ 99.99% (Durasi: 1.5 menit)

- **Narasi**: Roadmap 5 fase adalah prinsip mulai sederhana, tingkatkan bertahap — jangan over-engineering di awal. Fase MVP bulan 1-6: Rp0, 100 RPS, 1 instance, p50 <50ms, availability 99.5% — stack Postgres + pg_trgm + MatView + PgBouncer pool 25, semua jalan lokal Podman tanpa tagihan cloud. Fase 2 bulan 7-12: 500 RPS, 2-3 instance, Rp0-500rb — tambah Redis cache + pooling, Upstash free tier 10k command per hari. Fase 3 bulan 13-24: 5.000 RPS, 5-10 instance, Rp1.5-5jt, 99.9% — tambah Elasticsearch + CDC Debezium WAL -> Kafka -> ES/ClickHouse, untuk 500+ komunitas dan ratusan ribu dokumen. Fase 4 bulan 25+: 50.000 RPS, 20-50 instance, Rp10jt+, 99.9% — tambah HA/DR, replica, load balancer. Fase 5 bulan 25+ lanjutan: 200.000+ RPS, auto-scale, <10ms p50, 99.99% (down 4 menit per bulan) — sharding, multi-region, blockchain audit. Tiap fase punya trigger jelas — jangan lompat ke Fase 5 jika masih 10 komunitas.

- **Analogi Restoran**: Roadmap seperti warung yang tumbuh. MVP adalah warung 1 cabang, 500 pelanggan per hari, 1 dapur, masak <50ms — cukup Gudang + rak (index) tanpa kulkas (Redis). Fase 2 warung 2-3 cabang, 5.000 pelanggan — baru butuh kulkas (Redis) Rp0-500rb. Fase 3 warung 500 cabang, 50.000 pelanggan — butuh mobil antar (ES) + kurir CCTV (CDC) Rp1.5-5jt. Fase 5 warung 5.000 cabang, 5 juta pelanggan per hari, 200.000 pesanan per detik — butuh 2.000 kasir auto-scale, biaya Rp10jt+ tapi revenue marketplace dan BMT sudah cover. Jangan buka 5.000 cabang di hari pertama — mulai 1 cabang, buktikan laku, baru ekspansi.

- **Perintah Live**: ```bash
Tidak ada demo, fokus roadmap visual
# Tabel roadmap ada di slide HTML — 5 fase:
# MVP Rp0 (1 inst, 100 RPS, p50<50ms) -> Fase2 500 RPS (2-3 inst, Redis) -> Fase3 5k (5-10, ES+CDC) -> Fase4 50k (20-50, HA) -> Fase5 200k auto-scale 99.99%
# Prinsip: mulai sederhana, tingkatkan bertahap — jangan over-engineering di awal
```

- **Q&A Antisipasi**: Q: Kenapa tidak langsung bangun Fase 5 dari awal? A: Karena Fase 5 butuh biaya Rp10jt+ per bulan, setup kompleks (sharding, multi-region, blockchain), dan belum ada trafik 200k RPS. Mulai sederhana MVP Rp0, buktikan product-market fit dengan 5-10 komunitas, baru tingkatkan bertahap sesuai skala. Over-engineering di awal habiskan waktu dan uang untuk trafik yang belum ada.

- **Transisi**: Roadmap sudah jelas — dari warung 1 cabang sampai 5.000 cabang. Sekarang janji per menu — SLA 16 endpoint di Slide 28.

---

### Slide 28: Bab 10.1 - SLA 16 Endpoint (p50/p95/p99 server-side) (Durasi: 1.5 menit)

- **Narasi**: SLA 16 endpoint adalah janji waktu antar tiap menu — tidak ada satu angka untuk semua, tiap endpoint punya target p50/p95/p99 server-side (tanpa RTT 3G). Tabel tampil 7 contoh dari 16: GET /komunitas/:id p50 <30ms p95 <100ms p99 <200ms strategi Redis 10m + index, GET /kas p50 <50ms p95 <200ms p99 <500ms MatView 5m, GET /pengumuman p50 <30ms p95 <100ms p99 <200ms Redis 1m + pinned index, GET /jadwal-sholat p50 <20ms p95 <50ms p99 <100ms Redis 1 jam (paling cepat karena jarang berubah), GET /cari?q= p50 <50ms p95 <200ms p99 <500ms pg_trgm GIN atau ES, POST /kas p50 <100ms p95 <300ms p99 <500ms SHA-256 + invalidate, GET /masjid-terdekat p50 <30ms p95 <100ms p99 <200ms ES geo <10ms. Sembilan endpoint lain (profil, ledger, auth, UMKM, notifikasi, storage, audit, flag, health) lengkap di docs/04-observability.md. Diukur server-side via X-Response-Time header + prom-client histogram — tanpa RTT 3G 500-1000ms. Jika p95 >500ms selama 5 menit, itu incident — cek pg_stat_statements dan EXPLAIN ANALYZE segera.

- **Analogi Restoran**: SLA per endpoint seperti janji waktu antar tiap menu. Nasi goreng (jadwal sholat) janji <20ms karena sudah di Meja Saji (Redis 1 jam) — paling cepat. Ayam geprek (cari) janji <50ms via indeks trigram atau ES. Laporan kas (MatView) janji <50ms karena sudah dihitung tiap 5 menit. Tulis kas (POST) janji <100ms karena harus stempel SHA-256 dan hapus cache. Tiap menu beda janji, tapi semua diukur dengan stopwatch dapur (server-side), bukan waktu antar ke rumah pelanggan (RTT).

- **Perintah Live**: ```bash
# Bench 16 endpoint dengan k6
k6 run load/k6-script.js
# Harapkan: p50, p95, p99 per endpoint sesuai SLA tabel, cek X-Response-Time header

# Cek header server-side per endpoint
curl -i "http://localhost:3003/api/komunitas/xxx" | grep -i -E "X-Response-Time|X-Request-Id"
# Harapkan: X-Response-Time: 23ms, X-Request-Id: 550e8400-...

curl -i "http://localhost:3003/api/jadwal-sholat?kota=Jakarta" | grep -i X-Response-Time
# Harapkan: <20ms (Redis 1 jam, paling cepat)

# Query Prometheus p95 per endpoint
curl -s "http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,rate(http_request_duration_seconds_bucket[5m]))" | jq
```

- **Q&A Antisipasi**: Q: Kenapa SLA diukur server-side, bukan total dengan RTT? A: Karena RTT 3G 500-1000ms bervariasi per pengguna dan tidak bisa dikontrol backend. Server-side ukur proses backend murni — dari Gateway terima request sampai kirim response, tanpa jaringan. Total dengan RTT = server-side + RTT, jadi server <50ms + RTT 500ms = 550ms total masih <3 detik. Jika ukur total, angka tidak stabil dan tidak bisa jadi kontrak.

- **Transisi**: SLA per endpoint sudah jelas — tiap menu punya janji. Sekarang throughput dan biaya per fase — dari 100 RPS Rp0 sampai 200k+ RPS di Slide 29.

---

### Slide 29: Bab 10.2 - Throughput + Biaya per Fase (Durasi: 1.5 menit)

- **Narasi**: Throughput dan biaya naik bertahap seiring skala — MVP 100 RPS Rp0 untuk 5-10 komunitas DAU 500-1.000, Fase 2 500 RPS Rp0-500rb untuk 50+ komunitas DAU 5k-10k, Fase 3 5.000 RPS Rp1.5-5jt untuk 500+ komunitas DAU 50k-100k, Fase 4 50.000 RPS Rp10jt+ untuk 5.000+ komunitas DAU 500k-1jt, Fase 5 200.000+ RPS auto-scale untuk 50.000+ komunitas DAU 5jt+. Rumus throughput: (DAU x req_per_user) / (peak_hours x 3600) x burst 5x x safety 10x. Contoh MVP: (1.000 x 20) / (4 jam x 3600) x 10 = 14 RPS, target 100 RPS aman. Fase 5: (5jt x 20) / (14.400) x 10 = 69k, target 200k RPS. Instance: MVP 1, Fase 2 2-3, Fase 3 5-10, Fase 4 20-50, Fase 5 auto-scale. Biaya: MVP Rp0 Supabase Free + Podman lokal, Fase 2 Upstash Free, Fase 3 Redis Cloud $10-50 + ES + ClickHouse, Fase 5 multi-region auto-scale Rp10jt+ tapi revenue marketplace dan BMT sudah cover.

- **Analogi Restoran**: Throughput seperti kapasitas warung per detik. MVP warung 500 pelanggan per hari, 100 pesanan per detik, 1 dapur, gratis — cukup. Fase 5 warung 5 juta pelanggan per hari, 200.000 pesanan per detik, butuh 2.000 kasir auto-scale — seperti warung yang buka 5.000 cabang se-Indonesia. Biaya naik dari gratis (warung di rumah) ke Rp10jt+ (resto chain) tapi revenue juga naik — marketplace UMKM dan BMT sudah jalan, cover biaya infra.

- **Perintah Live**: ```bash
# Ukur throughput dengan load generator
TARGET=http://localhost:3003 bun --cwd load run load.ts -- --vus 100 --requests 20
# Harapkan: RPS aktual, p50/p95/p99, error rate <0.1%

# Atau dengan k6
k6 run --vus 100 --duration 30s load/k6-script.js
# Harapkan: http_reqs, http_req_duration p95 <200ms, checks pass

# Cek throughput via Prometheus
curl -s "http://localhost:9090/api/v1/query?query=sum(rate(http_requests_total[5m]))" | jq '.data.result[0].value[1]'
# Harapkan: RPS aktual MVP ~100, Fase3 ~5000
```

- **Q&A Antisipasi**: Q: Kenapa biaya naik dari Rp0 ke Rp10jt+? A: Karena infra naik dari gratis (Supabase Free, Podman lokal, pg_trgm) ke dedicated (Redis Cloud, ES cluster, ClickHouse) ke multi-region auto-scale. Tapi revenue juga naik — marketplace UMKM, BMT, donasi — sudah cover biaya. Fase 5 dengan 5jt DAU, revenue jauh di atas Rp10jt. Jangan takut biaya naik jika value juga naik.

- **Transisi**: Throughput dan biaya sudah paham — skala dan harga. Sekarang checklist sebelum rilis — 10 Definition of Done di Slide 30.

---

### Slide 30: Bab 10.4 - Checklist 10 Definition of Done (Durasi: 1.5 menit)

- **Narasi**: Checklist 10 Definition of Done adalah syarat wajib sebelum setiap rilis — bukan sekali di akhir, tapi tiap sprint. Sepuluh item: 1) EXPLAIN ANALYZE semua query baru — Execution Time OK, 2) No Seq Scan >1000 rows — EXPLAIN tanpa Seq Scan, 3) Semua FK punya index — cek pg_constraint vs pg_index, 4) pg_trgm aktif jika ada search — cek pg_extension, 5) MatView refresh terjadwal — cron 5m CONCURRENTLY dengan UNIQUE INDEX, 6) Autovacuum normal — n_dead_tup <1000, 7) p95 <500ms semua endpoint — histogram_quantile di Grafana hijau, 8) No N+1 query — JOIN atau IN, cek OTEL trace tidak ada pg.query berulang, 9) GZIP/Brotli aktif — Content-Encoding: gzip, 10) Rate limiting aktif — 429 setelah burst. Aturan: 10 dari 10 hijau baru boleh rilis. 9 dari 10 tunda, fix dulu. Jangan kompromi performa — checklist ini ditempel di dinding warung, penanggung jawab rilis tanda tangan.

- **Analogi Restoran**: Checklist DoD seperti checklist buka warung tiap pagi. 1) Cek resep (EXPLAIN) — langkah masak benar. 2) Tidak bongkar semua karung (no Seq Scan). 3) Semua rak berlabel (FK index). 4) Indeks buku siap (pg_trgm). 5) Rekap kas sudah hitung (MatView). 6) Gudang bersih (autovacuum). 7) Waktu saji <500ms (p95). 8) Tidak masak satu-satu (no N+1). 9) Dus dikompres (GZIP). 10) Satpam siap (rate limit). Jika satu checklist merah, warung jangan buka — fix dulu.

- **Perintah Live**: ```bash
# Cek 10 checklist via explain-demo.sql
psql $DATABASE_URL -f scripts/explain-demo.sql
# Harapkan: semua query Index Scan, no Seq Scan >1000, FK index ada, pg_trgm aktif

# Cek autovacuum
psql $DATABASE_URL -c "SELECT relname, n_dead_tup, last_autovacuum FROM pg_stat_all_tables WHERE n_dead_tup > 100;"
# Harapkan: n_dead_tup <1000, last_autovacuum recent

# Cek p95 Grafana
curl -s "http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,rate(http_request_duration_seconds_bucket[5m]))" | jq

# Cek GZIP
curl -H "Accept-Encoding: gzip" -I "http://localhost:3003/api/umkm?limit=20" | grep -i Content-Encoding
# Harapkan: Content-Encoding: gzip

# Cek rate limit
for i in $(seq 1 105); do curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3003/api/cari?q=ayam"; done | tail -5
# Harapkan: 429 setelah 100
```

- **Q&A Antisipasi**: Q: Kenapa harus Definition of Done tiap sprint, bukan sekali di akhir? A: Karena jika cek sekali di akhir, sudah terlanjur banyak query tanpa index, N+1, dan Seq Scan — fix-nya mahal dan telat. Tiap sprint cek 10 item, tiap rilis pasti hijau. Seperti warung — checklist tiap pagi, bukan tiap tahun.

- **Transisi**: Checklist sudah hafal — 10 item wajib hijau. Sekarang demo perbandingan — console.log vs Pino JSON di Slide 31.

---

### Slide 31: Demo 01 vs 02 - console.log vs Pino JSON (Durasi: 1.5 menit)

- **Narasi**: Demo 01 vs 02 adalah perbandingan before-after logging. Demo 01 buruk: console.log('cari q='+q) — format teks bebas, tidak terstruktur, tidak bisa di-query Loki. Password bocor: console.log('password='+req.body.password) — langsung kelihatan di log, melanggar UU PDP denda Rp2M. Tanpa requestId — tidak bisa korelasi lintas service, cari satu request harus grep manual. Query LIKE '%ayam%' Seq Scan 2000ms — tidak ada index. Metrik rata-rata bohong — avg 50ms terlihat bagus padahal P99 2000ms ada yang menderita. Demo 02 benar: Pino JSON {"level":"info","requestId":"550e...","q":"ayam","latency_ms":23} — terstruktur, bisa di-query Loki LogQL. Password [Redacted] — Pino redact: ['password','token','card'] otomatis jadi [Redacted], aman UU PDP. UUID x-request-id — tiap request bawa correlation ID, Loki dan Jaeger pakai ID sama. GIN 10-50ms — pg_trgm index. p99 jujur — 99% <=200ms, 1% tail ketahuan.

- **Analogi Restoran**: Demo 01 seperti warung tanpa buku tamu — pelayan teriak 'pesan ayam!' tanpa catat, password pelanggan teriak keras semua dengar, tidak ada nomor struk, cari ayam bongkar semua karung 2000ms, rata-rata bilang cepat padahal 1 pelanggan tunggu 2 detik. Demo 02 seperti warung dengan buku tamu lengkap — tiap pesanan catat JSON dengan nomor struk (requestId), password disensor [Redacted], cari ayam pakai indeks buku 10-50ms, p99 jujur tunjuk 1 pelanggan yang menderita.

- **Perintah Live**: ```bash
# Demo 01 buruk - password bocor, tanpa requestId, Seq Scan
node order-service/src/index.ts &
curl -X POST "http://localhost:3001/checkout" -H "Content-Type: application/json" -d '{"card":"4111111111111111","password":"rahasia123"}'
# Lihat log: password=rahasia123 BOCOR, tanpa requestId, LIKE Seq Scan 2000ms

# Demo 02 benar - [Redacted], UUID, GIN
LOG_LEVEL=debug bun --cwd order-service run src/index-proper.ts &
curl -X POST "http://localhost:3001/checkout" -H "Content-Type: application/json" -d '{"card":"4111111111111111","password":"rahasia123"}' -H "x-request-id: 550e8400-e29b-41d4-a716-446655440000"
# Lihat log: {"level":"info","requestId":"550e8400-...","card":"[Redacted]","password":"[Redacted]","latency_ms":23} -- aman, terstruktur
# Bandingkan: Demo01 bocor vs Demo02 [Redacted], Demo01 tanpa ID vs Demo02 UUID, Demo01 Seq Scan vs Demo02 GIN
```

- **Q&A Antisipasi**: Q: Kenapa harus redact password, tidak cukup hapus log? A: Karena UU PDP (Perlindungan Data Pribadi) denda sampai Rp2M jika password bocor di log. Log sering dikirim ke Loki, dilihat banyak orang, bahkan bocor ke GitHub. Pino redact otomatis sensor field sensitif jadi [Redacted] — aman, tetap bisa debug tanpa lihat password asli.

- **Transisi**: Before-after logging sudah jelas — dari bocor ke aman. Sekarang benchmark scale — GIN, cursor, MatView, RLS di Slide 32.

---

### Slide 32: Demo 03 - Scale Benchmark: GIN 2000->10ms 200x, Cursor 2s->20ms 100x, MatView 500->30ms (Durasi: 1.5 menit)

- **Narasi**: Demo 03 adalah hasil benchmark before-after scale — angka nyata, bukan teori. GIN pg_trgm: LIKE '%ayam%' Seq Scan 2000ms -> WHERE name % 'ayam' GIN 10ms — speedup 200x. Cursor keyset: OFFSET 10000 scan 10.020 buang 10.000 2000ms -> WHERE (created_at, id) > cursor Index Scan 20ms — speedup 100x, stabil tidak skip atau duplikat saat data baru masuk. MatView kas: SUM(amount) GROUP BY Seq Scan 500ms -> SELECT * FROM mv_kas_total Index Scan 30ms — speedup 16x, refresh CONCURRENTLY tiap 5 menit. RLS overhead <0.1ms — CREATE POLICY USING (community_id = current_setting('app.community_id')) + index FK, 99.94% improvement vs filter di aplikasi. Cache hit Redis 2ms vs DB 50ms — hit rate >80% pembeda scalable vs boros DB. Semua diukur dengan EXPLAIN ANALYZE — Buffers shared hit 45 vs 1200, Execution Time 12ms vs 2000ms.

- **Analogi Restoran**: Benchmark seperti timbang waktu masak. Cari karung tanpa rak (Seq Scan) 2000ms vs pakai rak berlabel (GIN) 10ms — 200x. Ambil piring mulai dari 10000 dengan hitung buang (OFFSET) 2000ms vs langsung lompat ke penanda (cursor) 20ms — 100x. Hitung total kas dari nota satu per satu 500ms vs lihat rekap sudah hitung (MatView) 30ms — 16x. Sekat warung (RLS) tipis <0.1ms — tiap komunitas hanya lihat mejanya sendiri tanpa lambat.

- **Perintah Live**: ```bash
# GIN vs LIKE
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM umkm WHERE name % 'ayam' ORDER BY similarity(name,'ayam') DESC LIMIT 20;"
# Harapkan: Bitmap Index Scan on idx_umkm_name_trgm, Execution Time: ~10ms, Buffers hit=45
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM umkm WHERE name LIKE '%ayam%' LIMIT 20;"
# Harapkan: Seq Scan on umkm, Execution Time: ~2000ms, Buffers hit=1200 -- 200x

# Cursor vs OFFSET
curl -s "http://localhost:3003/api/umkm?offset=10000&limit=20" | jq '.meta.latency_ms'
# Harapkan: ~2000ms (scan+discard)
curl -s "http://localhost:3003/api/umkm?cursor=eyJjcmVhdGVkX2F0IjoiMjAyNC0wMS0xNVQwMDowMDowMFoiLCJpZCI6InVta21fMzAwMCJ9&limit=20" | jq '.meta.latency_ms'
# Harapkan: ~20ms (Index Scan keyset) -- 100x

# MatView
curl -s "http://localhost:3004/api/kas?community_id=xxx&mode=before" | jq '.meta.latency_ms'
# Harapkan: ~500ms (Seq Scan SUM)
curl -s "http://localhost:3004/api/kas?community_id=xxx" | jq '.meta.latency_ms'
# Harapkan: ~30ms (MatView) -- 16x

# RLS
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM financial_ledger WHERE community_id='xxx';"
# Harapkan: Index Scan, overhead RLS <0.1ms
```

- **Q&A Antisipasi**: Q: Kenapa cursor lebih cepat dari OFFSET? A: Karena OFFSET harus baca dan buang — OFFSET 10000 artinya DB scan 10.020 baris, buang 10.000, kirim 20. Cursor langsung lompat via index (created_at, id) > cursor — tidak baca buang, langsung ke posisi. Seperti pelayan disuruh ambil piring ke-10000 dengan hitung dari 1 vs dikasih penanda langsung lompat ke piring 3000.

- **Transisi**: Benchmark scale sudah bukti — 200x, 100x, 16x. Sekarang observability dan CDC live — Grafana, Loki, Jaeger, ES geo di Slide 33.

---

### Slide 33: Demo 04-05 - Observability + CDC: Grafana 10 Metrik, Loki LogQL, Jaeger Flame, ES geo_distance <10ms (Durasi: 1.5 menit)

- **Narasi**: Demo 04-05 gabung observability dan CDC streaming. Grafana dashboard performa-gr di :3000 — 10 metrik Poster #6 (latency p50/p95/p99, throughput, error, CPU, memory, DB, cache) + 16 SLA per-endpoint + proteksi Circuit/Bulkhead/Backpressure — 13 panel. Loki LogQL di :3100 — query {service="order"} | json | requestId="550e..." untuk korelasi lintas service, filter level error, latency >500ms. Jaeger flame graph di :16686 — trace 320ms dengan span pg.query 40ms, redis 5ms, http 280ms — langsung tahu bottleneck, identifikasi N+1 jika banyak span pg.query berulang. CDC Debezium WAL -> Kafka :9092 -> ES :9200 — geo_distance masjid terdekat 5km <10ms untuk 256 masjid (vs PostGIS ~50ms), fallback pg_trgm jika ES down. Structured_metadata untuk requestId — karena requestId high cardinality 1 juta ID unik, jika jadi label Loki akan explosion (index membengkak), jadi simpan di structured_metadata yang tidak di-index tapi bisa di-query.

- **Analogi Restoran**: Demo 04-05 seperti warung dengan CCTV lengkap + kurir + peta. Grafana CCTV 10 metrik — lihat semua sudut warung. Loki buku tamu — cari pelanggan dengan nomor struk (requestId) di semua meja. Jaeger jejak kurir — flame graph tunjuk kurir paling lama di dapur atau gudang. CDC seperti CCTV gudang (WAL) rekam tiap perubahan, kurir (Kafka) antar ke toko cabang (ES) — peta masjid terdekat 5km <10ms seperti GPS langsung tunjuk masjid terdekat, bukan tanya satu per satu.

- **Perintah Live**: ```bash
# Grafana dashboard 10 metrik
open http://localhost:3000
# Login admin/admin, buka dashboard Gotong Royong - Performa (uid: performa-gr) - 13 panel
# Atau via API
curl -s "http://localhost:3000/api/dashboards/uid/performa-gr" | jq '.dashboard.title'

# Loki LogQL - korelasi requestId lintas service
curl -G -s "http://localhost:3100/loki/api/v1/query" --data-urlencode 'query={service="order"} | json | requestId="550e8400-e29b-41d4-a716-446655440000"' | jq
# Harapkan: logs order, payment, umkm dengan requestId sama

# Loki - hanya error
curl -G -s "http://localhost:3100/loki/api/v1/query" --data-urlencode 'query={service=~"order|payment|umkm|kas"} | json | level="error"' | jq

# Jaeger flame graph
open http://localhost:16686
# Service order-service, cari trace latency >500ms, lihat flame graph bottleneck

# ES geo_distance masjid terdekat 5km <10ms
curl -s "http://localhost:9200/umkm/_search" -H "Content-Type: application/json" -d '{"query":{"bool":{"must":{"match":{"name":"masjid"}},"filter":{"geo_distance":{"distance":"5km","lat_lng":{"lat":-6.25,"lon":106.75}}}}},"sort":[{"_geo_distance":{"lat_lng":{"lat":-6.25,"lon":106.75},"order":"asc"}}]}' | jq '.took'
# Harapkan: <10ms (ES geo) vs PostGIS ~50ms
curl -s "http://localhost:3003/api/masjid-terdekat?lat=-6.25&lng=106.75&radius=5km" | jq '.meta.took_ms'
# Harapkan: <10ms
```

- **Q&A Antisipasi**: Q: Kenapa requestId pakai structured_metadata, tidak jadi label Loki? A: Karena requestId high cardinality — 1 juta request = 1 juta nilai unik. Jika jadi label, Loki index membengkak (cardinality explosion), query lambat dan memory habis. Structured_metadata tidak di-index tapi tetap bisa di-query via LogQL | json | requestId="..." — hemat index, tetap bisa korelasi.

- **Transisi**: Observability dan CDC sudah live — dari CCTV sampai peta. Sekarang proteksi dan security — 5 proteksi + threshold + 10 layer di Slide 34.

---

### Slide 34: Appendix - Proteksi + Threshold + 10 Layer Security (Durasi: 1.5 menit)

- **Narasi**: Appendix proteksi adalah 5 tameng anti domino failure saat overload. Satu, Token/Leaky Bucket rate limiting 100 req/menit umum, 10 berat (write), 5 auth (login) — di Redis, kembalikan 429 + Retry-After jika lewat. Dua, Circuit Breaker — jika error >50% dalam 10 detik, open 30 detik, semua request fast-fail 503 tanpa coba downstream yang sudah sakit — setengah open coba lagi. Tiga, Bulkhead — pool isolation 20 untuk read, 10 untuk write, 15 untuk search, queue 50 — jika pool penuh kembalikan 503 bulkhead penuh, isolasi agar write lambat tidak blokir read. Empat, Backpressure — jika Kafka lag >1000, kembalikan 503 + Retry-After:10, cegah OOM. Lima, Graceful Degradation — jika circuit open atau bulkhead penuh atau lag >1000, matikan fitur non-kritis via feature flag, kembalikan x-degradation header. Threshold scaling: 1TB data size alert di 500GB (80%), 10M rows per table alert di 5M, 1000 write QPS alert di 500 — konservatif vs Shopee yang 1TB/10M/1000 baru scale, kita alert di 80% jangan tunggu 100% baru panik. 10 Layer Security: TLS 1.3, AES-256, RLS <0.1ms, SHA-256 hash chain, Vault/KMS, RBAC, rate limit, audit log, backup encrypt, WAF — hash_self = SHA256(amount|desc|recipient|actor|hash_prev) via trigger.

- **Analogi Restoran**: 5 proteksi seperti 5 satpam warung. Satpam rate limit batasi pelanggan per menit — umum 100, write 10, auth 5. Sekring listrik (circuit breaker) — jika dapur korslet 50% error, sekring putus 30 detik, tidak paksa masak. Sekat dapur (bulkhead) — dapur read, write, search sekat terpisah, jika sekat write penuh tidak blokir read. Backpressure seperti antrean — jika antrean >1000, satpam bilang penuh coba lagi 10 detik. Graceful degradation seperti matikan menu non-kritis saat ramai — fokus nasi goreng dulu, sate tunda. Threshold seperti alarm gudang — jika 80% penuh sudah alarm, jangan tunggu 100% baru panik.

- **Perintah Live**: ```bash
# Rate limiting 429 demo - burst 105 request, 5 terakhir harus 429
for i in $(seq 1 105); do curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3003/api/cari?q=ayam"; done | tail -10
# Harapkan: 100x 200, 5x 429 dengan Retry-After header

# Cek header rate limit
curl -i "http://localhost:3003/api/cari?q=ayam" | grep -i -E "X-RateLimit|Retry-After"
# Harapkan: X-RateLimit-Limit: 100, X-RateLimit-Remaining, Retry-After saat 429

# Circuit breaker - trigger 50% error
for i in $(seq 1 20); do curl -s "http://localhost:3001/checkout" -d 'invalid' & done; wait
curl -i "http://localhost:3001/checkout" | grep -i "503\|circuit"
# Harapkan: 503 fast-fail saat circuit open 30s

# Bulkhead - pool penuh
curl -s "http://localhost:3003/api/bulkhead/stats" | jq
# Harapkan: pool read 20, write 10, search 15, queue 50

# Threshold check
psql $DATABASE_URL -c "SELECT pg_database_size('gotongroyong_demo')/1024/1024/1024.0 AS size_gb;"
# Harapkan: <500GB (80% dari 1TB), jika >500GB alert scaling
```

- **Q&A Antisipasi**: Q: Kenapa butuh 5 proteksi, tidak cukup rate limit saja? A: Karena tiap proteksi cegah domino failure berbeda — rate limit cegah burst dari luar, circuit breaker cegah retry ke downstream sakit, bulkhead isolasi agar satu pool lambat tidak blokir lain, backpressure cegah OOM saat lag, graceful degradation matikan fitur non-kritis agar inti tetap jalan. Satu proteksi saja tidak cukup — butuh 5 lapis seperti 5 satpam.

- **Transisi**: Proteksi dan security sudah lengkap — 5 tameng + 10 layer. Terakhir penutup dan glossary — Slide 35.

---

### Slide 35: Penutup + Glossary 40+ Istilah + Q&A (Durasi: 1.5 menit)

- **Narasi**: Penutup — Kecepatan = Amanah. Mulai sederhana, tingkatkan bertahap. Setiap ms yang dipangkas adalah kepercayaan yang ditambah — kembali ke Muttaqin. MVP Rp0 sudah p50 <50ms dengan Postgres + Redis + pg_trgm + MatView + PgBouncer — jangan tunggu Fase 5 baru mulai. Tambah ES + CDC + ClickHouse saat 500+ komunitas Fase 3 — jangan over-engineering di awal. Ukur, jangan tebak — EXPLAIN ANALYZE, pg_stat_statements, Prometheus, Loki, Jaeger — tiap sprint cek p95. Glossary 40+ istilah: ACID transaksi aman, B-Tree index log(n) 50.000x, CDC tangkap WAL, Cache memori cepat L1/L2/L3, Cursor keyset pagination 100x, Dual-Write bahaya inkonsisten, Edge CDN 330+ DC, ES Elasticsearch inverted <10ms, ETL extract batch cron 00:00, EXPLAIN cek query plan, FK foreign key wajib index, GIN index trigram, GZIP kompresi 70-80%, Hot Data sering diakses, Index daftar cepat, Inverted index kata, JSONB JSON binary, Kafka broker event, Latency waktu tunggu, MatView agregasi cache 16x, N+1 query berulang, Observabilitas metrics/logs/traces, Offset skip-buang lambat, OLAP analitik kolom ClickHouse, p50/p95/p99 percentile, PgBouncer pool 25 hemat 95%, pg_trgm trigram GIN 10-50ms, PK primary key, Prometheus metrics 9090, Redis cache 1-5ms, RLS row isolation <0.1ms, RPS/RTT req/detik dan round-trip, Seq Scan scan semua 2000ms, SLA/SLI/SLO janji/ukur/target, Supabase Postgres managed, Throughput kapasitas RPS 100->200k, TTFB/TTL first byte dan expire, WAL log transaksi. TIGA INSAN: Muttaqin (percaya, kecepatan = amanah), Shalih (berkarya, code yang benar), Nafi' (bermanfaat, untuk komunitas).

- **Analogi Restoran**: Penutup seperti warung sukses bukan sehari jadi. Mulai warung 1 cabang dengan dapur sigap <50ms, Meja Saji (cache) dan rak berlabel (index) — sudah cukup. Tambah cabang dan mobil antar (ES) saat ramai — bertahap. Tiap ms yang dipangkas seperti tiap detik pelanggan tidak menunggu — kepercayaan tambah. Glossary seperti kamus warung — 40+ istilah agar semua pelayan bicara bahasa sama, dari ACID sampai WAL. TIGA INSAN: Muttaqin warung dipercaya, Shalih masakan enak, Nafi' bermanfaat untuk kampung.

- **Perintah Live**: ```bash
Tidak ada demo, Q&A 10 menit
# Next step: jalankan 4 branch bertahap
# Branch 01 console-log -> 02 Pino JSON -> 03 Scale -> 04 Observability -> 05 CDC
# Tiap sprint ukur p95 via: curl -s "http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,rate(http_request_duration_seconds_bucket[5m]))" | jq
# Checklist DoD 10 item tiap rilis, jangan kompromi
```

- **Q&A Antisipasi**: Q: Apa next step setelah 60 menit ini? A: Jalankan 4 branch bertahap — 01 console-log pahami anti-pattern, 02 Pino JSON logging benar, 03 Scale (B-Tree, pg_trgm, MatView, cursor, RLS), 04 Observability (Prometheus, Loki, Jaeger). Tiap sprint ukur p95 via Grafana, cek EXPLAIN ANALYZE, loloskan 10 DoD. Mulai MVP Rp0, jangan tunggu sempurna — mulai sederhana, tingkatkan bertahap.

- **Transisi**: Glossary dan penutup selesai. Masuk ke closing 2 menit — rangkuman 60 menit.

---

## Closing (Durasi: 2 menit)

- **Narasi**: Alhamdulillah, 60 menit kita sudah dari Poster 200ms sampai CDC Debezium WAL ke Kafka. Rangkuman: 10 bab, 35 slides, 4 branch + 5 CDC. Bab 1 Kecepatan = Kepercayaan (Muttaqin) — p50 <50ms, p95 <200ms, p99 <500ms server-side. Bab 2 Data Flow Flutter -> Gateway -> 7 Fondasi -> 6 DB — hot path Redis HIT <5ms. Bab 3 Postgres Scale — B-Tree 50.000x (1M -> 20 langkah), pg_trgm GIN 10-50ms 200x, MatView 5-30ms 16x, Cursor 20ms 100x, PgBouncer pool 25 hemat 95%, RLS <0.1ms, VACUUM. Bab 4 Caching L1 sub-ms L2 1-5ms L3 10-50ms — hit rate >80%, TTL 30s-1 jam. Bab 5 ES inverted <10ms + geo 5km. Bab 6 CDC single writer WAL -> Kafka -> ES/ClickHouse anti dual-write. Bab 7 API Delivery GZIP 70-80% + cursor + Edge 330+ DC + rate limit 100/10/5. Bab 8 Observability pg_stat_statements + slow log 100ms + 3 pilar metrics/logs/traces + 10 metrik + alert. Bab 9 Roadmap 5 fase MVP Rp0 -> 200k+ 99.99%. Bab 10 SLA 16 endpoint + throughput + checklist 10 DoD. Demo 01 vs 02 [Redacted] vs bocor, Demo 03 benchmark 200x/100x/16x, Demo 04-05 Grafana+Loki+Jaeger+ES geo.

  Ajakan: mulai MVP Rp0 hari ini — Postgres + pg_trgm + MatView + PgBouncer sudah p50 <50ms tanpa Redis. Jangan tunggu ES dan Kafka baru mulai — mulai sederhana, tingkatkan bertahap sesuai skala. Tiap sprint jalankan checklist 10 DoD — EXPLAIN, no Seq Scan >1000, FK index, pg_trgm, MatView, autovacuum, p95<500, no N+1, GZIP, rate limit — 10 hijau baru rilis. TIGA INSAN: Muttaqin jaga amanah kecepatan, Shalih berkarya dengan code benar, Nafi' bermanfaat untuk masjid, RT/RW, keluarga, UMKM. Setiap ms adalah kepercayaan. Terima kasih — Q&A 10 menit.

- **Analogi Restoran**: 60 menit seperti kursus buka warung dari nol sampai 5.000 cabang. Dari papan nama (cover) sampai CCTV (observability) dan kurir (CDC). Warung sukses bukan sehari jadi — mulai 1 cabang sigap <50ms, Meja Saji penuh, rak berlabel, buku tamu lengkap. Tiap ms pelanggan tidak menunggu adalah senyum kepercayaan. TIGA INSAN: warung dipercaya (Muttaqin), masakan enak (Shalih), bermanfaat untuk kampung (Nafi').

- **Perintah Live**: ```bash
Tidak ada demo, Q&A
```

- **Q&A Antisipasi**: Q: Dari mana mulai besok? A: Clone repo, jalankan Podman compose, buat index B-Tree untuk FK, aktifkan pg_trgm untuk search, buat MatView untuk kas, set PgBouncer pool 25, ukur p95 — MVP Rp0 sudah jalan. Checklist DoD 10 tiap sprint.

---

## Lampiran A: Semua Perintah Live dalam 1 Blok Bash (20+ Commands dari Slide 14-33)

Kumpulan semua perintah live dari slide 14 sampai 33 dalam satu blok untuk copy-paste saat demo atau latihan.

```bash
# === Slide 14: B-Tree 50.000x ===
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM umkm WHERE kelurahan='Bintaro'"
psql $DATABASE_URL -c "CREATE INDEX CONCURRENTLY idx_umkm_kelurahan ON umkm(kelurahan);"
psql $DATABASE_URL -c "ANALYZE umkm;"

# === Slide 15: pg_trgm GIN 10-50ms ===
curl "http://localhost:3003/api/cari?q=ayam" | jq '.meta.latency_ms'
curl "http://localhost:3003/api/cari?q=ayam&mode=like" | jq '.meta.latency_ms'
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM umkm WHERE name % 'ayam' ORDER BY similarity(name,'ayam') DESC LIMIT 20;"

# === Slide 16: MatView + Cursor ===
curl "http://localhost:3004/api/kas?community_id=xxx&mode=before" | jq '.meta.latency_ms'
curl "http://localhost:3004/api/kas?community_id=xxx" | jq '.meta.latency_ms'
curl "http://localhost:3003/api/umkm?offset=10000&limit=20" | jq '.meta.latency_ms'
curl "http://localhost:3003/api/umkm?cursor=eyJjcmVhdGVkX2F0IjoiMjAyNC0wMS0xNVQwMDowMDowMFoiLCJpZCI6InVta21fMzAwMCJ9&limit=20" | jq '.meta.latency_ms'

# === Slide 17: PgBouncer + RLS + VACUUM ===
psql postgres://demo:demo123@localhost:6432/gotongroyong_demo -c "SHOW POOLS;"
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM financial_ledger WHERE community_id='xxx';"
psql $DATABASE_URL -c "SELECT n_dead_tup FROM pg_stat_all_tables WHERE relname='umkm';"

# === Slide 18: Caching L1/L2/L3 ===
curl -i "http://localhost:3003/api/komunitas/xxx" | grep -i X-Cache
redis-cli INFO stats | grep -E "keyspace_hits|keyspace_misses"
curl "http://localhost:3003/api/cache/stats" | jq '.hitRate'

# === Slide 19: Tiering + Redis ===
redis-cli --latency
redis-cli INFO memory | grep used_memory_human

# === Slide 20: Elasticsearch ===
curl "http://localhost:9200/umkm/_search?q=ayam" | jq '.took'
curl "http://localhost:3003/api/masjid-terdekat?lat=-6.25&lng=106.75&radius=5km" | jq '.meta.took_ms'

# === Slide 22: CDC Debezium WAL -> Kafka ===
kafka-console-consumer --bootstrap-server localhost:9092 --topic gotongroyong.public.umkm --from-beginning --max-messages 5 | jq '.payload'
psql $DATABASE_URL -c "INSERT INTO umkm (name, kelurahan) VALUES ('Ayam Geprek Baru', 'Bintaro');"
curl "http://localhost:9200/umkm/_search?q=Ayam%20Geprek%20Baru" | jq '.hits.hits[0]._source.name'
curl "http://localhost:3003/api/cdc/lag" | jq '.lag_ms'

# === Slide 23: API Delivery GZIP + Payload ===
curl -H "Accept-Encoding: gzip" -v "http://localhost:3003/api/umkm?fields=name,lat,lng&limit=20" 2>&1 | grep -E "Content-Encoding|Content-Length|< HTTP"
curl "http://localhost:3003/api/umkm?fields=name,lat,lng&limit=20" | jq '.data[0]'

# === Slide 24: Rate Limiting + Edge ===
for i in $(seq 1 105); do curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3003/api/cari?q=ayam"; done | tail -10
curl -i "http://localhost:3003/api/cari?q=ayam" | grep -i -E "X-RateLimit|Retry-After"
curl -i "http://localhost:3003/api/jadwal-sholat?kota=Jakarta" | grep -i CF-Cache-Status

# === Slide 25: Observability pg_stat_statements + Prometheus ===
psql $DATABASE_URL -c "SELECT query, mean_exec_time, calls, total_exec_time FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;"
curl -s "http://localhost:9090/api/v1/query?query=up" | jq '.data.result[] | {job: .metric.job, value: .value[1]}'
curl -s "http://localhost:9090/api/v1/alerts" | jq

# === Slide 26: 3 Pilar Metrics/Logs/Traces ===
curl -s "http://localhost:3000/api/datasources" | jq
curl -G -s "http://localhost:3100/loki/api/v1/query" --data-urlencode 'query={service="order"} | json' | jq
curl -G -s "http://localhost:3100/loki/api/v1/query" --data-urlencode 'query={service=~"order|payment|umkm|kas"} | json | requestId="550e8400-e29b-41d4-a716-446655440000"' | jq
open http://localhost:16686

# === Slide 28: SLA 16 endpoint ===
k6 run load/k6-script.js
curl -i "http://localhost:3003/api/komunitas/xxx" | grep -i -E "X-Response-Time|X-Request-Id"

# === Slide 29: Throughput ===
TARGET=http://localhost:3003 bun --cwd load run load.ts -- --vus 100 --requests 20
k6 run --vus 100 --duration 30s load/k6-script.js

# === Slide 30: Checklist 10 DoD ===
psql $DATABASE_URL -f scripts/explain-demo.sql
psql $DATABASE_URL -c "SELECT relname, n_dead_tup, last_autovacuum FROM pg_stat_all_tables WHERE n_dead_tup > 100;"

# === Slide 31: Demo 01 vs 02 ===
LOG_LEVEL=debug bun --cwd order-service run src/index-proper.ts &
curl -X POST "http://localhost:3001/checkout" -H "Content-Type: application/json" -d '{"card":"4111111111111111","password":"rahasia123"}' -H "x-request-id: 550e8400-e29b-41d4-a716-446655440000"

# === Slide 32: Demo 03 Scale Benchmark ===
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM umkm WHERE name % 'ayam' ORDER BY similarity(name,'ayam') DESC LIMIT 20;"
curl -s "http://localhost:3003/api/umkm?offset=10000&limit=20" | jq '.meta.latency_ms'
curl -s "http://localhost:3003/api/umkm?cursor=eyJjcmVhdGVkX2F0IjoiMjAyNC0wMS0xNVQwMDowMDowMFoiLCJpZCI6InVta21fMzAwMCJ9&limit=20" | jq '.meta.latency_ms'

# === Slide 33: Demo 04-05 Observability + CDC ===
open http://localhost:3000
curl -G -s "http://localhost:3100/loki/api/v1/query" --data-urlencode 'query={service="order"} | json | requestId="550e8400-e29b-41d4-a716-446655440000"' | jq
curl -s "http://localhost:9200/umkm/_search" -H "Content-Type: application/json" -d '{"query":{"bool":{"must":{"match":{"name":"masjid"}},"filter":{"geo_distance":{"distance":"5km","lat_lng":{"lat":-6.25,"lon":106.75}}}}}}' | jq '.took'

# === Slide 34: Proteksi ===
for i in $(seq 1 105); do curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3003/api/cari?q=ayam"; done | tail -10
```

---

## Lampiran B: Tabel Q&A Lengkap 20+ Q&A per Slide (Q | A | Slide)

| Q | A | Slide |
|---|---|---|
| Kenapa slow log 100ms, tidak 10ms atau 1000ms? | Jangan terlalu rendah banjir log, terlalu tinggi lewatkan pola — 100ms sweet spot. | 25 |
| Bedanya logs vs traces? | Logs per service catat kenapa, traces lintas service tunjuk di mana bottleneck — keduanya pakai requestId sama. | 26 |
| Kenapa tidak langsung bangun Fase 5 dari awal? | Mulai sederhana MVP Rp0, tingkatkan bertahap sesuai skala — jangan over-engineering untuk trafik yang belum ada. | 27 |
| Kenapa SLA diukur server-side, bukan total dengan RTT? | Tidak termasuk jaringan 3G 500-1000ms, ukur proses backend murni agar kontrak stabil. | 28 |
| Kenapa biaya naik dari Rp0 ke Rp10jt+? | Dari gratis (Supabase Free) ke dedicated ke multi-region, tapi revenue marketplace/BMT cover. | 29 |
| Kenapa harus Definition of Done tiap sprint? | Setiap rilis harus lolos 10 checklist, bukan sekali di akhir — cegah utang performa. | 30 |
| Kenapa harus redact password di log? | UU PDP denda Rp2M, password tidak boleh di log — Pino redact jadi [Redacted]. | 31 |
| Kenapa cursor lebih cepat dari OFFSET? | Langsung lompat via index (created_at, id) > cursor, tidak baca buang 10.000 baris. | 32 |
| Kenapa structured_metadata untuk requestId di Loki? | High cardinality 1jt requestId jadi label = explosion, pakai structured_metadata tidak di-index. | 33 |
| Kenapa butuh 5 proteksi, tidak cukup rate limit? | Cegah domino failure berbeda — rate limit, circuit breaker, bulkhead, backpressure, graceful degradation. | 34 |
| Apa next step setelah 60 menit ini? | Jalankan 4 branch bertahap (01 console-log -> 02 Pino -> 03 Scale -> 04 Observability), ukur p95 tiap sprint. | 35 |
| Kapan index malah merugikan? | Jika >50% query butuh full scan, kolom <10 nilai unik, atau >5-7 index per tabel — write lambat. | 14 |
| Kenapa GIN, bukan B-Tree untuk LIKE '%ayam%'? | B-Tree hanya untuk = atau prefix, GIN gin_trgm_ops khusus untuk LIKE dan operator %. | 15 |
| Kapan pakai cursor, kapan OFFSET? | Cursor untuk infinite scroll stabil 20ms, OFFSET hanya untuk halaman bernomor batasi max 1000. | 16 |
| Kenapa pool 25, tidak 10 atau 100? | Rumus (CPU*2)+spindle — 4 core jadi 10-15, set 25 untuk 100 RPS dengan buffer burst. | 17 |
| Kenapa Cache-Aside, bukan Write-Through untuk MVP? | Resilience tinggi — jika Redis down tetap jalan via DB, Write-Through jika Redis down write gagal. | 18 |
| Kapan Redis wajib? | MVP tunda Rp0, Fase 2 free tier Upstash, Fase 3 wajib $10-50 saat hit rate >80% atau p99 >5ms. | 19 |
| Kenapa tidak pakai ES dari awal MVP? | pg_trgm gratis built-in cukup puluhan ribu, ES butuh server $10-50 dan CDC — baru Fase 3. | 20 |
| Kenapa tidak dual-write langsung dari aplikasi? | Jika salah satu gagal inkonsisten — Postgres OK + ES gagal = hilang di search, single writer via WAL aman. | 22 |
| Kenapa sparse fieldsets hemat kuota? | Hanya kirim 3 field 15KB vs 100KB full — hemat 85%, parsing cepat di HP 2GB. | 23 |
| Kenapa 3 tier rate limit 100/10/5? | Risiko beda — umum 100 baca, berat 10 write beban DB tinggi, auth 5 lindungi brute force. | 24 |
| Apa beda P99 dan rata-rata? | Rata-rata tertarik outlier 2500ms, P99 jujur 99% <=200ms 1% menderita — jangan pakai avg. | 8 |
| Kenapa p50 read dan write beda 50ms vs 100ms? | Write harus ACID dan trigger SHA-256, wajar lebih lambat dari read. | 5 |

