# CHEAT SHEET DEMO — GotongRoyong 40 Slides

> **TERUJI 5 JUTA 99s | 50.457 rows/s | heap 64MB flat | Wafi 15 Aug 2026** | `wimxwim/backend-performa-demo` — OS Kehidupan Komunitas TIGA INSAN

| Atribut | Isi |
|---------|-----|
| **Judul** | CHEAT SHEET DEMO 1 HALAMAN — Karton Pegangan Anti-Grogi Wafi Demo Live 40 Slides |
| **Badge** | TERUJI 5 JUTA 99.1s 50.457 rows/s — RSS 210MB heap 64MB flat — COPY 25x GIN 200x |
| **Ukuran** | A4 portrait 1 halaman — margin 1.5cm — font DejaVu Sans 11pt — code DejaVu Sans Mono 8pt break-all |
| **Sumber** | Bab 11 Skrip Hafalan verbatim + DEMO_ZIS_RLS.md curl verbatim — pandoc-compatible heading ## tabel pipe code block |

## KIRI — 5 PERINTAH DEMO (copy-paste verbatim mono numbered)

### 1. Generate 5M — 99s 50K rows/s — bukti performa streaming heap flat

```bash
npx tsx seed/generate.ts --synthetic 5000000 --out /tmp/test_5m.ndjson  # 99s 50K rows/s heap 64MB flat
# Fallback jika lama / disk sempit:
npx tsx seed/generate.ts --synthetic 1000000 --out /tmp/test_1m.ndjson  # 22s 44K rows/s 503M
```

| Expected | `ls -lh /tmp/test_5m.ndjson # 2.5G` + `wc -l # 5000000` + `sha256sum reproducible` |

### 2. Hidupkan DB — docker compose postgres 16

```bash
docker compose up -d && docker compose logs -f postgres
# cek ready: pg_isready -h localhost -p 5432 && echo DATABASE_URL OK
```

| Expected | `postgres ready` + `DATABASE_URL postgres://demo:demo123@localhost:5432/gotongroyong_demo` |

### 3. Seed ZIS/RLS — 8 asnaf QS At-Taubah:60 + RLS Prinsip #31

```bash
psql $DATABASE_URL -f prisma/migrations/004_demo_zis_rls.sql
# cek: psql $DATABASE_URL -c "SELECT community_id, COUNT(*) FROM financial_ledger GROUP BY community_id;"
```

| Expected | `community_demo_a: 3` + `community_demo_b: 2` + `Total 5 ledger entries` + `RLS enabled true` |

### 4. Distribusi ZIS — POST 201 hashSelf SHA-256 chain

```bash
curl -X POST http://localhost:3004/api/zis/distribute -H 'Content-Type: application/json' -d '{"communityId":"community_demo_a","amount":500000,"asnaf":"fakir","recipient":"mustahiq_001","description":"Beras 50kg"}'
```

| Expected | `201 Created {hashSelf: "a1b2c3..." hashPrev: "0000..."}` + `asnaf fakir OK validAsnaf 8` |

### 5. Verifikasi — hash chain valid true + RLS isolated true

```bash
curl "http://localhost:3004/api/ledger/verify?communityId=community_demo_a"  # -> valid true 5 entries brokenAt null
curl "http://localhost:3004/api/demo/rls-test"  # -> isolated true A:3 B:2 rlsEnabled true policyExists true
```

| Endpoint | Expected Output Verbatim |
|----------|--------------------------|
| `GET /api/ledger/verify` | `valid true 5 entries brokenAt null chain 5 OK` |
| `GET /api/demo/rls-test` | `isolated true A:3 B:2 rlsEnabled true prinsip31 OK` |

## KANAN — SKRIP HAFALAN (verbatim besar ucap pelan)

### Pembuka 3 Kalimat — hafal verbatim jangan karang

> 1. "Assalamualaikum, saya Wafi dari tim developer GotongRoyong."
> 2. "Hari ini saya tunjukkan OS Kehidupan Komunitas — bukan aplikasi kas, tapi infrastruktur kepercayaan."
> 3. "Bayangkan warung tetangga jadi hub digital — mari kita buktikan 5 juta data dalam 99 detik."

### Penutup 3 Kalimat — hafal verbatim ucap pelan jeda 2 detik setelah angka

> 1. "Transparansi bukan janji, tapi matematika — hash tidak bisa bohong."
> 2. "Dari 5M ke 280 juta, dari Yogyakarta ke nasional — gotong royong yang terverifikasi."
> 3. "Terima kasih, saya tunggu pertanyaannya."

### Filler Anti-Panik 5 Kalimat — saat blank pakai salah satu bullet

- "Izin saya cek data sebentar..."
- "Pertanyaan bagus, saya catat dulu..."
- "Secara warung ini seperti..., secara teknikal ini adalah..."
- "Boleh saya tunjukkan di slide 37?"
- "Kita coba live, jika lama saya pakai fallback 1M 22 detik."

## FOOTER — Checklist 3 Sebelum Naik + Link + Pesan Anti-Grogi

| # | Cek Wajib | Perintah Verbatim | Expected | Status |
|---|-----------|-------------------|----------|--------|
| 1 | Disk 17G free | `df -h` | `17G free` 90G total 80% used sisa 2.4G | ☐ |
| 2 | Docker OK | `docker compose config` | `OK` no error compose.yaml valid | ☐ |
| 3 | Artefak 513K | `ls -lh /tmp/sample_1k.ndjson` | `513K ada` SHA256 f5afea... retained | ☐ |

| Link GitHub | `github.com/wimxwim/backend-performa-demo` branch `demo-zis-rls` — 40 Slides + 5M 99s + ZIS 8 asnaf |
| Pesan Anti-Grogi | **Jangan grogi — baca karton ini. Kontak mata 3 detik, jeda 2 detik setelah angka 5M 99 detik.** |

> Halaman 1/1 — CHEAT SHEET DEMO GotongRoyong 40 Slides — Wafi 15 Aug 2026 — Karton A5 landscape / A4 portrait lipat
