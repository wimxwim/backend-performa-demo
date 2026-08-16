# Demo ZIS 8 Asnaf + Hash Verify + RLS Isolasi — TIGA INSAN Live

> **Opsi B — Ideal (5-7 Slide + Backend Demo)** | Branch `demo-zis-rls` | 15 Aug 2026
> **TIGA INSAN:** Muttaqin = hash verify (kepercayaan verifiable) | Shalih = ZIS mudah (1 POST jadi) | Nafi' = mustahiq mandiri (dana tepat ke 8 asnaf)
> **Prinsip UX #31:** Data satu komunitas tidak bocor ke komunitas lain — RLS di level DB
> **Piagam Madinah Pasal 2 & 3:** Isolasi data + audit publik via hash chain

---

## Hero — Kenapa Demo Ini Penting

```
Demo 5M (5% visi) ──> [Demo ZIS 8 Asnaf + Hash + RLS] ──> OS Kehidupan Komunitas (100%)
  99s 50K rows/s       ZIS verifiable + isolasi DB          280jt warga, 800rb masjid, 64jt UMKM
  GIN 200x             QS At-Taubah:60 + SHA-256 + RLS      TIGA INSAN live, bukan slide
```

**Masalah yang dijawab:**

| Pertanyaan Audiens | Jawaban Demo |
|--------------------|--------------|
| "Kas masjid bisa dimanipulasi admin?" | Hash chain SHA-256 — tiap rupiah terhubung kriptografis, `GET /api/ledger/verify` deteksi manipulasi <2 detik |
| "Data RT sebelah bisa bocor?" | RLS PostgreSQL — `SET app.community_id = A` tidak bisa lihat data B, prinsip #31 di level DB bukan hanya aplikasi |
| "ZIS ke siapa saja?" | 8 asnaf QS At-Taubah:60 — validasi CHECK constraint di DB, bukan hanya di aplikasi |

> **One-liner:** Untuk warga yang lelah platform tidak transparan, GotongRoyong membuat kas masjid & ZIS bisa diverifikasi siapa pun — karena kepercayaan yang tidak bisa diverifikasi bukan kepercayaan, tapi harapan.

---

## Arsitektur — 3 Pilar Demo

```
                    ┌─────────────────────────────────────┐
                    │         TIGA INSAN PRISMA           │
                    │  Muttaqin ── Shalih ── Nafi'        │
                    └──────────┬──────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
     │  ZIS 8 Asnaf  │ │ Hash Chain  │ │ RLS Isolasi │
     │  QS 9:60      │ │ SHA-256     │ │ Prinsip #31 │
     │  Shalih       │ │ Muttaqin    │ │ Nafi'       │
     └───────┬───────┘ └──────┬──────┘ └──────┬──────┘
             │                │               │
     ┌───────▼────────────────▼───────────────▼───────┐
     │         PostgreSQL 16 + Prisma 5               │
     │  financial_ledger (hash_prev/hash_self)        │
     │  zis_distribution (8 asnaf CHECK)              │
     │  RLS POLICY community_isolation + demo_isolation│
     └────────────────────────────────────────────────┘
```

---

## Tabel 8 Asnaf — QS At-Taubah:60

> *Sesungguhnya zakat-zakat itu hanyalah untuk orang-orang fakir, orang-orang miskin, pengurus-pengurus zakat, para mu'allaf yang dibujuk hatinya, untuk (memerdekakan) budak, orang-orang yang berutang, untuk jalan Allah dan untuk mereka yang sedang dalam perjalanan...* (QS At-Taubah:60)

| No | Asnaf | Arab | Arti | Contoh Mustahiq | Validasi DB |
|----|-------|------|------|-----------------|-------------|
| 1 | **fakir** | فقير | Tidak punya harta & usaha sama sekali | Tunawisma, tidak ada penghasilan | `CHECK IN ('fakir',...)` |
| 2 | **miskin** | مسكين | Punya usaha tapi tidak cukup | Buruh harian, penghasilan < kebutuhan | `CHECK IN (...)` |
| 3 | **amil** | عامل | Pengelola zakat | Panitia ZIS masjid, BAZNAS | `CHECK IN (...)` |
| 4 | **mualaf** | مؤلفة قلوبهم | Baru masuk Islam / dilembutkan hati | Mualaf butuh dukungan | `CHECK IN (...)` |
| 5 | **riqab** | رقاب | Memerdekakan budak / terbelenggu | Korban trafficking, pekerja terjerat utang | `CHECK IN (...)` |
| 6 | **gharim** | غارم | Berutang untuk kebutuhan halal | Utang berobat, utang usaha halal | `CHECK IN (...)` |
| 7 | **fisabilillah** | في سبيل الله | Di jalan Allah | Guru ngaji, dai, beasiswa santri | `CHECK IN (...)` |
| 8 | **ibnu_sabil** | ابن السبيل | Musafir kehabisan bekal | Musafir terlantar, mahasiswa rantau | `CHECK IN (...)` |

**Constraint di DB (002 + 004):**

```sql
-- 002_ledger_hash_chain.sql — sudah ada
CHECK (asnaf_category IN ('fakir','miskin','amil','mualaf','riqab','gharim','fisabilillah','ibnu_sabil'))

-- 004_demo_zis_rls.sql — idempotent, cek dulu baru tambah
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_asnaf') THEN
    ALTER TABLE zis_distribution ADD CONSTRAINT chk_asnaf CHECK (...);
  END IF;
END $$;
```

**Test validasi:**

```bash
# Valid — 200 OK
curl -X POST http://localhost:3004/api/zis/distribute \
  -H 'Content-Type: application/json' \
  -d '{"communityId":"community_demo_a","amount":500000,"asnaf":"fakir","recipient":"mustahiq_001","description":"Beras 50kg"}'

# Invalid — 400 Bad Request
curl -X POST http://localhost:3004/api/zis/distribute \
  -H 'Content-Type: application/json' \
  -d '{"communityId":"community_demo_a","amount":500000,"asnaf":"kaya","recipient":"x","description":"test"}'
# -> {"error":"asnaf tidak valid: kaya","validAsnaf":["fakir","miskin",...]}
```

---

## Hash Chain Diagram — SHA-256 Blockchain-like di Postgres

```
Genesis (64 nol)
  │
  │  hashPrev = 0000...0000
  │  raw = "500000|ZIS fakir — beras 50kg|mustahiq_fakir_001|amil_demo_a|0000...0000"
  │  hashSelf = SHA256(raw) = a1b2c3... (64 hex)
  ▼
┌─────────────────────────────────────────────────────────┐
│ id=1  community_demo_a  fakir  Rp500.000                 │
│ hashPrev=0000...0000  hashSelf=a1b2c3...                 │
└──────────────────────┬──────────────────────────────────┘
                       │  hashPrev = a1b2c3... (prev hashSelf)
                       │  raw = "750000|ZIS miskin — modal warung|mustahiq_miskin_001|amil_demo_a|a1b2c3..."
                       │  hashSelf = SHA256(raw) = d4e5f6...
                       ▼
┌─────────────────────────────────────────────────────────┐
│ id=2  community_demo_a  miskin  Rp750.000                │
│ hashPrev=a1b2c3...  hashSelf=d4e5f6...                   │
└──────────────────────┬──────────────────────────────────┘
                       │  hashPrev = d4e5f6...
                       ▼
┌─────────────────────────────────────────────────────────┐
│ id=3  community_demo_a  fisabilillah  Rp1.000.000        │
│ hashPrev=d4e5f6...  hashSelf=789abc...                  │
└──────────────────────┬──────────────────────────────────┘
                       │  hashPrev = 789abc... (chain berlanjut)
                       ▼
┌─────────────────────────────────────────────────────────┐
│ id=4  community_demo_b  gharim  Rp600.000                │
│ hashPrev=789abc...  hashSelf=def012...                  │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│ id=5  community_demo_b  ibnu_sabil  Rp400.000            │
│ hashPrev=def012...  hashSelf=345678...                  │
└─────────────────────────────────────────────────────────┘

Verifikasi: GET /api/ledger/verify
  Loop: for each row ORDER BY id
    1. Cek BROKEN_LINK: hashPrev != prev.hashSelf -> flag
    2. Recompute: SHA256(amount|description|recipient|actor|hashPrev) != hashSelf -> HASH_MISMATCH
  Result: { valid: true, count: 5, brokenAt: null, chain: [...] }
```

**Trigger di DB (002 — exact Bab 5):**

```sql
CREATE OR REPLACE FUNCTION secure_ledger_hash() RETURNS TRIGGER AS $$
DECLARE prev_hash VARCHAR(64); raw_data_string TEXT;
BEGIN
  SELECT hash_self INTO prev_hash FROM financial_ledger ORDER BY id DESC LIMIT 1;
  IF prev_hash IS NULL THEN prev_hash := '0000...0000'; END IF;
  NEW.hash_prev := prev_hash;
  raw_data_string := NEW.amount::text || '|' || NEW.description || '|' || NEW.recipient_id || '|' || NEW.actor_id || '|' || NEW.hash_prev;
  NEW.hash_self := encode(digest(raw_data_string, 'sha256'), 'hex');
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_secure_financial_ledger BEFORE INSERT ON financial_ledger
FOR EACH ROW EXECUTE FUNCTION secure_ledger_hash();
```

**Formula hash (sama di aplikasi & trigger):**

```
hashSelf = SHA256(amount + "|" + description + "|" + recipient_id + "|" + actor_id + "|" + hashPrev)
         = encode(digest('500000|ZIS fakir — beras 50kg|mustahiq_fakir_001|amil_demo_a|0000...', 'sha256'), 'hex')
```

---

## RLS Diagram — Isolasi per Komunitas (Prinsip #31)

```
                    ┌──────────────────────────────────┐
                    │     PostgreSQL RLS Layer         │
                    │  ALTER TABLE financial_ledger    │
                    │  ENABLE ROW LEVEL SECURITY       │
                    │  FORCE ROW LEVEL SECURITY        │
                    └──────────┬───────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
     │ Policy:       │ │ Policy:     │ │ Bypass:     │
     │ community_    │ │ demo_       │ │ current_    │
     │ isolation     │ │ isolation   │ │ setting IS  │
     │ (003)         │ │ (004)       │ │ NULL = admin│
     └───────┬───────┘ └──────┬──────┘ └──────┬──────┘
             │                │               │
             └────────────────┼───────────────┘
                              │
              ┌───────────────▼───────────────┐
              │  USING (                      │
              │    community_id =             │
              │    current_setting(           │
              │      'app.community_id'       │
              │    )::text                   │
              │    OR current_setting IS NULL │
              │  )                            │
              └───────────────┬───────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
┌────────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│ SET app.        │  │ SET app.        │  │ SET app.       │
│ community_id    │  │ community_id    │  │ community_id   │
│ = 'demo_a'      │  │ = 'demo_b'      │  │ = '' (bypass)  │
│ -> hanya lihat  │  │ -> hanya lihat  │  │ -> lihat semua │
│    3 rows A     │  │    2 rows B     │  │    5 rows      │
└─────────────────┘  └─────────────────┘  └────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Middleware Express│
                    │  app.use((req,_,n)=>│
                    │   pool.query(      │
                    │    `SET app.       │
                    │     community_id`  │
                    │   , [req.headers[  │
                    │    'x-community-id'│
                    │   ]])              │
                    │  )                 │
                    └───────────────────┘
```

**Prinsip UX #31 — Data tidak bocor antar komunitas:**

| Aspek | Detail |
|-------|--------|
| **Prinsip** | #31 — Data satu komunitas tidak bocor ke komunitas lain |
| **Piagam** | Pasal 2 — Data satu komunitas tidak bocor ke lain |
| **Layer** | 5 Layer Trust — Layer 3: Isolasi Data (RLS per community_id) |
| **Teknis** | `CREATE POLICY ... USING (community_id = current_setting('app.community_id', true)::text)` |
| **Overhead** | <0.1ms setelah index FK ada |
| **Bypass** | `OR current_setting IS NULL` — untuk migration/seed/admin |
| **Verifikasi** | `GET /api/demo/rls-test` -> `{ isolated: true, communityA_count: 3, communityB_count: 2 }` |

---

## TIGA INSAN Mapping — Demo Live

| Insan | Makna | Manifestasi Demo | Endpoint | Metrik |
|-------|-------|------------------|----------|--------|
| **Muttaqin** | Kepercayaan verifiable | Hash chain SHA-256 — tiap rupiah bisa diverifikasi matematis | `GET /api/ledger/verify` | `valid: true, count: 5, brokenAt: null` |
| **Shalih** | Amal ihsan, mudah beramal | ZIS 1 POST langsung jadi ledger + distribusi asnaf | `POST /api/zis/distribute` | `201 Created { id, hashPrev, hashSelf }` |
| **Nafi'** | Mustahiq mandiri | Dana tepat ke 8 asnaf, bukan numpuk di admin | `zis_distribution` 8 kategori | `5 rows` terdistribusi ke 5 asnaf |

```
Muttaqin (Kepercayaan)
  └── Hash chain SHA-256 — tidak bisa manipulasi tanpa ketahuan
  └── RLS isolasi — data amanah tiap komunitas terjaga
  └── Audit log — tiap aksi tercatat

Shalih (Amal/Ihsan)
  └── POST /api/zis/distribute — 1 call langsung jadi
  └── Validasi 8 asnaf di DB — tidak bisa salah kategori
  └── Response <100ms — ihsan kecepatan

Nafi' (Kontribusi)
  └── 8 asnaf tepat sasaran — fakir, miskin, gharim, fisabilillah, ibnu_sabil
  └── Mustahiq menerima manfaat langsung
  └── Komunitas mandiri — data tidak bocor ke tetangga
```

---

## Cara Run — Step by Step

### Prasyarat

```bash
# Node 20+, Bun 1.1+, Docker/Podman, Postgres 16
node -v  # >=20
bun -v   # >=1.1
docker --version || podman --version
```

### 1. Start Database

```bash
cd /home/ngome/GotongRoyong/backend-performa-demo

# Via Docker Compose (jika ada compose.yaml)
docker compose up -d
# atau
podman-compose up -d

# Cek Postgres ready
pg_isready -h localhost -p 5432
# atau
docker exec -it gotongroyong-postgres pg_isready

# Alternatif: Postgres lokal
# Pastikan DATABASE_URL di .env:
# DATABASE_URL=postgres://demo:demo123@localhost:5432/gotongroyong_demo
```

### 2. Migrasi

```bash
# Jalankan migrasi berurutan
psql $DATABASE_URL -f prisma/migrations/001_init.sql
psql $DATABASE_URL -f prisma/migrations/002_ledger_hash_chain.sql
psql $DATABASE_URL -f prisma/migrations/003_scale_db.sql
psql $DATABASE_URL -f prisma/migrations/004_demo_zis_rls.sql

# Cek log — harus ada:
# NOTICE: CHECK constraint 8 asnaf sudah ada di 002 — skip
# NOTICE: community_demo_a: 3 ledger entries
# NOTICE: community_demo_b: 2 ledger entries
# NOTICE: Total demo: 5 ledger entries

# Verifikasi manual
psql $DATABASE_URL -c "SELECT community_id, COUNT(*) FROM financial_ledger WHERE community_id LIKE 'community_demo_%' GROUP BY community_id;"
# Expected:
#  community_demo_a | 3
#  community_demo_b | 2

psql $DATABASE_URL -c "SELECT asnaf_category, COUNT(*) FROM zis_distribution GROUP BY asnaf_category;"
# Expected: 5 rows — fakir, miskin, fisabilillah, gharim, ibnu_sabil

psql $DATABASE_URL -c "SELECT relname, relrowsecurity FROM pg_class WHERE relname='financial_ledger';"
# Expected: relrowsecurity = true (RLS enabled)
```

### 3. Install & Generate Prisma

```bash
cd /home/ngome/GotongRoyong/backend-performa-demo
bun install
npx prisma generate
# atau
bunx prisma generate
```

### 4. Jalankan Service

```bash
# Opsi A: Standalone demo service (port 3004)
DATABASE_URL=postgres://demo:demo123@localhost:5432/gotongroyong_demo \
  bun run kas-service/src/demo-zis-rls.ts

# Opsi B: Integrasi ke kas-service existing (tambah router)
# Di kas-service/src/index-03a.ts atau index-proper.ts:
# import { createDemoZisRlsRouter } from './demo-zis-rls.js';
# app.use(createDemoZisRlsRouter(prisma));

# Cek health
curl http://localhost:3004/health
# Expected: {"status":"ok","service":"kas-service-demo-zis-rls","branch":"demo-zis-rls","asnaf":8}
```

### 5. Test Endpoints

```bash
# ── POST /api/zis/distribute — distribusi ZIS ke 1 asnaf ──
curl -X POST http://localhost:3004/api/zis/distribute \
  -H 'Content-Type: application/json' \
  -H 'x-request-id: demo-001' \
  -d '{
    "communityId": "community_demo_a",
    "amount": 500000,
    "asnaf": "fakir",
    "recipient": "mustahiq_fakir_demo",
    "description": "ZIS fakir — beras 50kg untuk demo",
    "actorId": "amil_demo_a"
  }'
# Expected 201:
# {
#   "success": true,
#   "data": { "id": "6", "communityId": "community_demo_a", "amount": "500000", "asnaf": "fakir", ... },
#   "id": "6", "hashPrev": "345678...", "hashSelf": "abc123...",
#   "tigaInsan": { "muttaqin": "hash chain SHA-256 ...", ... }
# }

# Test 8 asnaf — semua harus 201
for asnaf in fakir miskin amil mualaf riqab gharim fisabilillah ibnu_sabil; do
  echo "Testing asnaf: $asnaf"
  curl -s -X POST http://localhost:3004/api/zis/distribute \
    -H 'Content-Type: application/json' \
    -d "{\"communityId\":\"community_demo_a\",\"amount\":100000,\"asnaf\":\"$asnaf\",\"recipient\":\"test_$asnaf\",\"description\":\"Test $asnaf\"}" | head -c 200
  echo ""
done

# Invalid asnaf — harus 400
curl -X POST http://localhost:3004/api/zis/distribute \
  -H 'Content-Type: application/json' \
  -d '{"communityId":"community_demo_a","amount":100000,"asnaf":"kaya","recipient":"x","description":"test"}'
# Expected 400: {"error":"asnaf tidak valid: kaya","validAsnaf":["fakir",...]}

# ── GET /api/ledger/verify — verifikasi hash chain ──
curl "http://localhost:3004/api/ledger/verify?communityId=community_demo_a"
# Expected:
# { "valid": true, "count": 3, "brokenAt": null, "chain": [...] }

curl "http://localhost:3004/api/ledger/verify?communityId=community_demo_b"
# Expected:
# { "valid": true, "count": 2, "brokenAt": null, "chain": [...] }

curl "http://localhost:3004/api/ledger/verify"
# Expected (semua):
# { "valid": true, "count": 5, "brokenAt": null, "chain": [...] }

# ── GET /api/demo/rls-test — demo RLS isolasi ──
curl "http://localhost:3004/api/demo/rls-test?communityA=community_demo_a&communityB=community_demo_b"
# Expected:
# {
#   "communityA": "community_demo_a", "communityB": "community_demo_b",
#   "communityA_count": 3, "communityB_count": 2,
#   "isolated": true, "rlsEnabled": true, "policyExists": true,
#   "prinsip31": "Prinsip UX #31 — Data satu komunitas tidak bocor ...",
#   "tigaInsan": { "muttaqin": "isolasi data terverifikasi ..." }
# }

# ── GET /api/demo/asnaf — info 8 asnaf ──
curl http://localhost:3004/api/demo/asnaf
# Expected: { "total": 8, "source": "QS At-Taubah:60", "asnaf": [...], "table": [...] }
```

---

## Expected Output — Verifikasi Sukses

### Verify Valid True (5 entries)

```json
{
  "valid": true,
  "count": 5,
  "brokenAt": null,
  "brokenReason": null,
  "chain": [
    { "id": "1", "hashPrev": "00000000...", "hashSelf": "a1b2c3...", "expectedSelf": "a1b2c3...", "status": "OK" },
    { "id": "2", "hashPrev": "a1b2c3...", "hashSelf": "d4e5f6...", "expectedSelf": "d4e5f6...", "status": "OK" },
    { "id": "3", "hashPrev": "d4e5f6...", "hashSelf": "789abc...", "expectedSelf": "789abc...", "status": "OK" },
    { "id": "4", "hashPrev": "789abc...", "hashSelf": "def012...", "expectedSelf": "def012...", "status": "OK" },
    { "id": "5", "hashPrev": "def012...", "hashSelf": "345678...", "expectedSelf": "345678...", "status": "OK" }
  ],
  "total": 5,
  "checked": 5,
  "message": "Valid — 5 baris hash chain utuh (Muttaqin: kepercayaan verifiable)"
}
```

### RLS Isolated True

```json
{
  "communityA": "community_demo_a",
  "communityB": "community_demo_b",
  "communityA_count": 3,
  "communityB_count": 2,
  "rlsCountA": 3,
  "rlsCountB": 2,
  "isolated": true,
  "rlsEnabled": true,
  "policyExists": true,
  "prinsip31": "Prinsip UX #31 — Data satu komunitas tidak bocor ke komunitas lain",
  "piagamPasal2": "Piagam Madinah Pasal 2 — Data satu komunitas tidak bocor ke lain",
  "tigaInsan": {
    "muttaqin": "isolasi data terverifikasi — amanah terjaga",
    "shalih": "RLS di DB — keamanan ihsan",
    "nafi": "komunitas mandiri — data tidak bocor ke tetangga"
  }
}
```

### Jika Broken (simulasi manipulasi)

```bash
# Simulasi: ubah amount di DB langsung (bypass trigger)
psql $DATABASE_URL -c "UPDATE financial_ledger SET amount = 999999 WHERE id = 2;"

curl "http://localhost:3004/api/ledger/verify"
# Expected:
# { "valid": false, "count": 5, "brokenAt": "2", "brokenReason": "HASH_MISMATCH di id=2 ..." }
```

---

## File Terkait

| File | Peran | Tier |
|------|-------|------|
| `kas-service/src/demo-zis-rls.ts` | Express router — POST /api/zis/distribute, GET /api/ledger/verify, GET /api/demo/rls-test | N (baru) |
| `prisma/migrations/004_demo_zis_rls.sql` | SQL demo — CHECK 8 asnaf, RLS demo_isolation, seed 2 komunitas + 5 ledger | N (baru) |
| `docs/DEMO_ZIS_RLS.md` | Dokumentasi ini | N (baru) |
| `prisma/schema.prisma` | 8 model — KasLedger hashPrev/hashSelf, ZisDistribution 8 asnaf | Existing |
| `prisma/migrations/002_ledger_hash_chain.sql` | Trigger secure_ledger_hash() SHA-256 | Existing |
| `prisma/migrations/003_scale_db.sql` | RLS community_isolation, GIN, MatView | Existing |
| `kas-service/src/ledger.ts` | Ledger router existing (POST /api/kas, verify) | Existing |
| `shared/logger.ts` | Pino logger factory | Existing |
| `shared/requestId.ts` | RequestId middleware | Existing |
| `docs/SUDUT_PANDANG_TERLUAS.md` | Lensa 2 (Piagam 10 pasal) & Lensa 4 (7 fondasi + 6DB) | Existing |

---

## Prinsip & Piagam — Referensi

| Sumber | Isi | Kaitan Demo |
|--------|-----|-------------|
| **Prinsip UX #31** | Data satu komunitas tidak bocor ke komunitas lain | RLS `community_id = current_setting('app.community_id')` |
| **Piagam Pasal 2** | Data satu komunitas tidak bocor ke lain | RLS di level DB, bukan hanya aplikasi |
| **Piagam Pasal 3** | Setiap transaksi keuangan dapat diaudit publik | Hash chain SHA-256 + `GET /api/ledger/verify` |
| **5 Layer Trust** | Layer 3: Isolasi Data, Layer 4: Audit Trail, Layer 5: Verifikasi Publik | RLS (L3) + hash chain (L4) + verify endpoint (L5) |
| **TIGA INSAN** | Muttaqin-Shalih-Nafi' prisma 6 ranah | Hash verify (Muttaqin) + ZIS mudah (Shalih) + mustahiq mandiri (Nafi') |

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `psql: connection refused` | `docker compose up -d` atau cek `DATABASE_URL` di `.env` |
| `relation "financial_ledger" does not exist` | Jalankan `001_init.sql` + `002_ledger_hash_chain.sql` dulu |
| `policy already exists` | Normal — 004 idempotent, `DO $$ EXCEPTION WHEN duplicate_object` |
| `isolated: false` | Cek `SELECT relrowsecurity FROM pg_class WHERE relname='financial_ledger'` — harus `true`. Jika `false`, jalankan `ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;` |
| `valid: false` setelah seed | Cek `SELECT id, hash_prev, hash_self FROM financial_ledger ORDER BY id` — pastikan trigger aktif. Jika hash `pending`, trigger tidak jalan — cek `SELECT * FROM pg_trigger WHERE tgname='trg_secure_financial_ledger'` |
| `npx tsc --noEmit` error | Cek `tsconfig.json` include — harus cover `kas-service/src/demo-zis-rls.ts` |

---

## Next Step — Integrasi ke Presentasi

Demo ini adalah **Opsi B — Ideal (5-7 Slide + Backend Live)** dari `docs/SUDUT_PANDANG_TERLUAS.md` Bab Rekomendasi:

| Slide | Judul | Isi Demo |
|-------|-------|----------|
| 38 | Diagnosis Sempit: 7 Dimensi | Tabel 7 dimensi visi vs demo 5M cover |
| 39 | TIGA INSAN Prisma 6 Ranah | Prisma + filter 3 pertanyaan + siklus |
| 40 | Piagam 10 Pasal + 5 Layer Trust | Tabel 10 pasal + diagram layer + vs GDPR |
| 41 | Socio Corp 11 Level Inverted | Tabel 11 level + diagram inverted |
| 42 | 7 Fondasi + 6DB + 514 Masjid | Tabel 7 fondasi + 6DB + hub-and-spoke |
| 43 | Pesanggrahan 6.081 -> 1.7jt | Tabel KULINER 44% + 5 kelurahan |
| **44** | **Demo ZIS 8 Asnaf + Hash + RLS Live** | **Live curl: POST distribute -> GET verify (valid true 5) -> GET rls-test (isolated true)** |

> Demo live 2 menit: `POST /api/zis/distribute` (fakir) -> `GET /api/ledger/verify` (valid true) -> `GET /api/demo/rls-test` (isolated true) -> audiens lihat hash chain & RLS bekerja real-time.

---

*GotongRoyong — OS Kehidupan Komunitas | TIGA INSAN: Muttaqin-Shalih-Nafi' | Piagam Madinah Digital 10 Pasal | 280jt warga, 70.4jt keluarga, 800rb masjid*
