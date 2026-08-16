// generate.ts — Generator synthetic UMKM dengan jitter geospasial (STREAMING 10M)
// Bahasa komentar: Indonesia
// Sumber distribusi real: Rekap_by_Kelurahan.csv — Bintaro 31.7% (1931), Petukangan Utara 27.8% (1694),
//   Petukangan Selatan 17.3% (1054), Ulujami 13.5% (821), Pesanggrahan 9.4% (577), sisanya <0.1%
// Sumber kategori real: Data_Kategori.csv — 90 kategori real + 1 tambahan = 91 kategori komprehensif
//   KULINER 948 (15.6%), LAPAK 783, WARUNG MAKAN 648, PASAR JASA 470, AYAM 453, WARKOP 277, KOPI GAYO 271, etc
// Fungsi: export async function* generateSyntheticStream(count, batchSize=10000) -> yield batch 10k (memory flat 64MB)
//         export async function generateSynthetic(count) -> wrapper support hingga 10M (dulu guard 10k)
// Dipakai untuk load test 100k/1M/5M/10M (threshold Fase 3: 5M rows, Fase 2: 500 req/s, Fase 4: 10M)
// Memory: streaming 10k batch ~64MB flat untuk 10M (bukan 7GB jika array), heap flat, progress tiap 100k
// Distribusi 10M: Bintaro 32% (3.2M), Petukangan Utara 28% (2.8M), Selatan 17% (1.7M), Ulujami 13% (1.3M), Pesanggrahan 9% (0.9M)
// Kategori 91: tiap kategori minimal 10k+ di 10M (91*10k=910k, sisa 9.09M weighted KULINER 15% etc), total 100%

import { faker } from '@faker-js/faker/locale/id_ID';
import fs from 'fs';
import path from 'path';

// ──────────────────────────────────────────────
// Konfigurasi distribusi kelurahan (proporsi real 6.081) — PERTAHANKAN 5, update weights 32%/28%/17%/13%/9%
// Untuk 10M: Bintaro 3.2M, Petukangan Utara 2.8M, Selatan 1.7M, Ulujami 1.3M, Pesanggrahan 0.9M (total 9.9M, rounding 10M)
// Jitter ±0.01° lat/lng (~1.1km) — PERTAHANKAN 0.01
// ──────────────────────────────────────────────
const KELURAHAN_DISTRIBUSI = [
  { kelurahan: 'Bintaro', kecamatanId: '3171040', desaId: '3171040001', zipCode: '12330', weight: 0.32, lat: -6.274, lng: 106.762 },
  { kelurahan: 'Petukangan Utara', kecamatanId: '3171040', desaId: '3171040005', zipCode: '12260', weight: 0.28, lat: -6.235, lng: 106.75 },
  { kelurahan: 'Petukangan Selatan', kecamatanId: '3171040', desaId: '3171040004', zipCode: '12270', weight: 0.17, lat: -6.242, lng: 106.755 },
  { kelurahan: 'Ulujami', kecamatanId: '3171040', desaId: '3171040003', zipCode: '12250', weight: 0.13, lat: -6.235, lng: 106.76 },
  { kelurahan: 'Pesanggrahan', kecamatanId: '3171040', desaId: '3171040002', zipCode: '12320', weight: 0.10, lat: -6.253, lng: 106.757 },
];
// Catatan: Pesanggrahan spec 9% (0.09), dibulatkan 0.10 untuk total 100% (0.32+0.28+0.17+0.13+0.10=1.00)
// Jika ingin exact 9%, set Pesanggrahan 0.09 dan Bintaro 0.33 — pickKelurahan handle remainder

// ──────────────────────────────────────────────
// 91 KATEGORI KOMPREHENSIF — ambil dari Data_Kategori.csv (90 real) + 1 tambahan = 91
// Real 90: KULINER 948, LAPAK 783, WARUNG MAKAN 648, PASAR JASA 470, AYAM 453, WARKOP 277, KOPI GAYO 271,
//   MASJID 256, LAUNDRY 207, ATM 135, KAFE 131, MINIMARKET 129, TOKO BERAS 98, FROZEN FOOD 83, PENDIDIKAN 81,
//   WARUNG SAYUR 75, LELE 73, RESIDENCE 72, TRAVEL 63, JUICE 60, CATERING 52, IKAN 51, BAITUL MAAL 50, BEBEK 47,
//   BANK 46, GORENG 45, IKAN HIAS 41, TPQ 39, WARDAH 38, PACKAGING 32, PETERNAKAN 31, WARTEG 30, SALAD 26,
//   KAMBING 26, INSTITUT 24, FORUM 24, KOPERASI 21, TOKO BUAH 16, ADVENTURE 16, BIRD 16, SATE 15, JAHE 14, MADU 14,
//   PONDOK PESANTREN 14, PONDOK YATIM 14, FARM 13, PASAR 12, HOMESTAY 11, RUMAH TAHFIDZ 10, GUDANG 8, MINANG 8,
//   HOTEL 7, BANK SAMPAH 6, KARANG TARUNA 6, PAKAN TERNAK 6, SUNDA 6, JASA KEUANGAN 5, SEAFOOD 5, ORMAS 5,
//   DANAU 3, HIDROPONIK 3, KEBUN 3, TANAMAN HIAS 4, SUPPLY 4, TOKOPEDIA 2, MLM 2, NILA 2, KEFIR 2,
//   COWORKING-SPACE 1, KAWASAN KONSERVASI 1, plus %AYAM% %BAKAR% etc di-merge
// Tambahan 21 kategori modern untuk 10M: RUMAH, KOS, KONTRAKAN, APARTEMEN, TANAH, RUKO, BENGKEL, APOTEK, KLINIK,
//   SEKOLAH, KURSUS, SALON, BARBERSHOP, GYM, FASHION, JASA, SEMBAKO, RETAIL, KESEHATAN, FOTOCOPY, NOTARIS
// Tiap kategori minimal 10k+ di 10M — guarantee via two-phase (910k round-robin + 9.09M weighted)
// ──────────────────────────────────────────────
export const CATEGORY_91_LIST = [
  'KULINER',            // 1 - 15% (1.5M di 10M) - KULINER terbesar 948 real
  'LAPAK',              // 2 - 6% (600k)
  'WARUNG MAKAN',       // 3 - 5% (500k)
  'PASAR JASA',         // 4 - 4% (400k)
  'AYAM',               // 5 - 3.42% (342k)
  'WARKOP',             // 6 - 2% (200k)
  'KOPI GAYO',          // 7 - 1.5% (150k)
  'MASJID',             // 8 - 1.2% (120k)
  'LAUNDRY',            // 9 - 1% (100k) - LAUNDRY 207 real
  'ATM',                // 10 - 0.8% (80k)
  'KAFE',               // 11 - 0.8% (80k) - KAFE 131 real
  'MINIMARKET',         // 12 - 0.7% (70k)
  'TOKO BERAS',         // 13 - 0.6% (60k)
  'FROZEN FOOD',        // 14 - 0.5% (50k)
  'PENDIDIKAN',         // 15 - 0.5% (50k)
  'WARUNG SAYUR',       // 16 - 0.4% (40k)
  'LELE',               // 17 - 0.4% (40k)
  'RESIDENCE',          // 18 - 0.4% (40k) - RESIDENCE 72 (RUMAH)
  'TRAVEL',             // 19 - 0.3% (30k)
  'JUICE',              // 20 - 0.3% (30k)
  'CATERING',           // 21 - 0.3% (30k)
  'IKAN',               // 22 - 0.3% (30k)
  'BAITUL MAAL',        // 23 - 0.25% (25k)
  'BEBEK',              // 24 - 0.25% (25k)
  'BANK',               // 25 - 0.25% (25k)
  'GORENG',             // 26 - 0.2% (20k)
  'IKAN HIAS',          // 27 - 0.2% (20k)
  'TPQ',                // 28 - 0.2% (20k)
  'WARDAH',             // 29 - 0.2% (20k)
  'PACKAGING',          // 30 - 0.15% (15k)
  'PETERNAKAN',         // 31 - 0.15% (15k)
  'WARTEG',             // 32 - 0.15% (15k)
  'SALAD',              // 33 - 0.12% (12k)
  'KAMBING',            // 34 - 0.12% (12k)
  'INSTITUT',           // 35 - 0.12% (12k)
  'FORUM',              // 36 - 0.12% (12k)
  'KOPERASI',           // 37 - 0.1% (10k)
  'TOKO BUAH',          // 38 - 0.1% (10k)
  'ADVENTURE',          // 39 - 0.1% (10k)
  'BIRD',               // 40 - 0.1% (10k)
  'SATE',               // 41 - 0.1% (10k)
  'JAHE',               // 42 - 0.1% (10k)
  'MADU',               // 43 - 0.1% (10k)
  'PONDOK PESANTREN',   // 44 - 0.1% (10k)
  'PONDOK YATIM',       // 45 - 0.1% (10k)
  'FARM',               // 46 - 0.1% (10k)
  'PASAR',              // 47 - 0.1% (10k)
  'HOMESTAY',           // 48 - 0.1% (10k)
  'RUMAH TAHFIDZ',      // 49 - 0.1% (10k) - RUMAH
  'GUDANG',             // 50 - 0.1% (10k)
  'MINANG',             // 51 - 0.1% (10k)
  'HOTEL',              // 52 - 0.1% (10k)
  'BANK SAMPAH',        // 53 - 0.1% (10k)
  'KARANG TARUNA',      // 54 - 0.1% (10k)
  'PAKAN TERNAK',       // 55 - 0.1% (10k)
  'SUNDA',              // 56 - 0.1% (10k)
  'JASA KEUANGAN',      // 57 - 0.1% (10k) - JASA
  'SEAFOOD',            // 58 - 0.1% (10k)
  'ORMAS',              // 59 - 0.1% (10k)
  'DANAU',              // 60 - 0.1% (10k)
  'HIDROPONIK',         // 61 - 0.1% (10k)
  'KEBUN',              // 62 - 0.1% (10k)
  'TANAMAN HIAS',       // 63 - 0.1% (10k)
  'SUPPLY',             // 64 - 0.1% (10k)
  'TOKOPEDIA',          // 65 - 0.1% (10k)
  'MLM',                // 66 - 0.1% (10k)
  'NILA',               // 67 - 0.1% (10k)
  'KEFIR',              // 68 - 0.1% (10k)
  'COWORKING-SPACE',    // 69 - 0.1% (10k)
  'KAWASAN KONSERVASI', // 70 - 0.1% (10k)
  'RUMAH',              // 71 - 8% (800k) - RUMAH minimal 10k, weighted 8%
  'KOS',                // 72 - 3% (300k) - KOS minimal 10k
  'KONTRAKAN',          // 73 - 2% (200k) - KONTRAKAN minimal 10k
  'APARTEMEN',          // 74 - 1.5% (150k) - APARTEMEN minimal 10k
  'TANAH',              // 75 - 1.5% (150k) - TANAH minimal 10k
  'RUKO',               // 76 - 1.5% (150k) - RUKO minimal 10k
  'BENGKEL',            // 77 - 1% (100k) - BENGKEL
  'APOTEK',             // 78 - 1% (100k) - APOTEK
  'KLINIK',             // 79 - 0.8% (80k) - KLINIK
  'SEKOLAH',            // 80 - 0.6% (60k) - SEKOLAH
  'KURSUS',             // 81 - 0.5% (50k) - KURSUS
  'SALON',              // 82 - 0.4% (40k) - SALON
  'BARBERSHOP',         // 83 - 0.4% (40k) - BARBERSHOP
  'GYM',                // 84 - 0.3% (30k) - GYM
  'FASHION',            // 85 - 9% (900k) - FASHION 9% spec
  'JASA',               // 86 - 12% (1.2M) - JASA 12% spec
  'SEMBAKO',            // 87 - 2% (200k) - SEMBAKO
  'RETAIL',             // 88 - 1.5% (150k) - RETAIL
  'KESEHATAN',          // 89 - 1% (100k) - KESEHATAN
  'FOTOCOPY',           // 90 - 0.5% (50k) - FOTOCOPY
  'NOTARIS',            // 91 - 0.3% (30k) - NOTARIS
];

// Distribusi 91 kategori weighted — total 100% (1.00)
// KULINER 15% (1.5M), JASA 12% (1.2M), FASHION 9% (900k), RUMAH 8% (800k), LAPAK 6% (600k),
// WARUNG MAKAN 5% (500k), PASAR JASA 4% (400k), AYAM 3.42% (342k), KOS 3% (300k), KONTRAKAN 2% (200k),
// SEMBAKO 2% (200k), WARKOP 2% (200k), KOPI GAYO 1.5% (150k), APARTEMEN 1.5% (150k), TANAH 1.5% (150k),
// RUKO 1.5% (150k), RETAIL 1.5% (150k), MASJID 1.2% (120k), LAUNDRY 1% (100k), BENGKEL 1% (100k),
// APOTEK 1% (100k), KESEHATAN 1% (100k), ATM 0.8% (80k), KAFE 0.8% (80k), KLINIK 0.8% (80k),
// MINIMARKET 0.7% (70k), SEKOLAH 0.6% (60k), TOKO BERAS 0.6% (60k), FROZEN FOOD 0.5% (50k),
// PENDIDIKAN 0.5% (50k), KURSUS 0.5% (50k), FOTOCOPY 0.5% (50k), WARUNG SAYUR 0.4% (40k),
// LELE 0.4% (40k), RESIDENCE 0.4% (40k), SALON 0.4% (40k), BARBERSHOP 0.4% (40k), TRAVEL 0.3% (30k),
// JUICE 0.3% (30k), CATERING 0.3% (30k), IKAN 0.3% (30k), GYM 0.3% (30k), NOTARIS 0.3% (30k),
// BAITUL MAAL 0.25% (25k), BEBEK 0.25% (25k), BANK 0.25% (25k), GORENG 0.2% (20k), IKAN HIAS 0.2% (20k),
// TPQ 0.2% (20k), WARDAH 0.2% (20k), PACKAGING 0.15% (15k), PETERNAKAN 0.15% (15k), WARTEG 0.15% (15k),
// SALAD 0.12% (12k), KAMBING 0.12% (12k), INSTITUT 0.12% (12k), FORUM 0.12% (12k), KOPERASI 0.1% (10k),
// TOKO BUAH 0.1% (10k), ADVENTURE 0.1% (10k), BIRD 0.1% (10k), SATE 0.1% (10k), JAHE 0.1% (10k),
// MADU 0.1% (10k), PONDOK PESANTREN 0.1% (10k), PONDOK YATIM 0.1% (10k), FARM 0.1% (10k), PASAR 0.1% (10k),
// HOMESTAY 0.1% (10k), RUMAH TAHFIDZ 0.1% (10k), GUDANG 0.1% (10k), MINANG 0.1% (10k), HOTEL 0.1% (10k),
// BANK SAMPAH 0.1% (10k), KARANG TARUNA 0.1% (10k), PAKAN TERNAK 0.1% (10k), SUNDA 0.1% (10k),
// JASA KEUANGAN 0.1% (10k), SEAFOOD 0.1% (10k), ORMAS 0.1% (10k), DANAU 0.1% (10k), HIDROPONIK 0.1% (10k),
// KEBUN 0.1% (10k), TANAMAN HIAS 0.1% (10k), SUPPLY 0.1% (10k), TOKOPEDIA 0.1% (10k), MLM 0.1% (10k),
// NILA 0.1% (10k), KEFIR 0.1% (10k), COWORKING-SPACE 0.1% (10k), KAWASAN KONSERVASI 0.1% (10k)
// Total 100% — tiap kategori minimal 10k di 10M (910k guarantee + 9.09M weighted)
export const CATEGORY_91_WEIGHTS = [
  0.15,   // KULINER 15% - KULINER
  0.06,   // LAPAK 6%
  0.05,   // WARUNG MAKAN 5%
  0.04,   // PASAR JASA 4%
  0.0342, // AYAM 3.42%
  0.02,   // WARKOP 2%
  0.015,  // KOPI GAYO 1.5%
  0.012,  // MASJID 1.2%
  0.01,   // LAUNDRY 1% - LAUNDRY
  0.008,  // ATM 0.8%
  0.008,  // KAFE 0.8%
  0.007,  // MINIMARKET 0.7%
  0.006,  // TOKO BERAS 0.6%
  0.005,  // FROZEN FOOD 0.5%
  0.005,  // PENDIDIKAN 0.5%
  0.004,  // WARUNG SAYUR 0.4%
  0.004,  // LELE 0.4%
  0.004,  // RESIDENCE 0.4% - RUMAH
  0.003,  // TRAVEL 0.3%
  0.003,  // JUICE 0.3%
  0.003,  // CATERING 0.3%
  0.003,  // IKAN 0.3%
  0.0025, // BAITUL MAAL 0.25%
  0.0025, // BEBEK 0.25%
  0.0025, // BANK 0.25%
  0.002,  // GORENG 0.2%
  0.002,  // IKAN HIAS 0.2%
  0.002,  // TPQ 0.2%
  0.002,  // WARDAH 0.2%
  0.0015, // PACKAGING 0.15%
  0.0015, // PETERNAKAN 0.15%
  0.0015, // WARTEG 0.15%
  0.0012, // SALAD 0.12%
  0.0012, // KAMBING 0.12%
  0.0012, // INSTITUT 0.12%
  0.0012, // FORUM 0.12%
  0.001,  // KOPERASI 0.1%
  0.001,  // TOKO BUAH 0.1%
  0.001,  // ADVENTURE 0.1%
  0.001,  // BIRD 0.1%
  0.001,  // SATE 0.1%
  0.001,  // JAHE 0.1%
  0.001,  // MADU 0.1%
  0.001,  // PONDOK PESANTREN 0.1%
  0.001,  // PONDOK YATIM 0.1%
  0.001,  // FARM 0.1%
  0.001,  // PASAR 0.1%
  0.001,  // HOMESTAY 0.1%
  0.001,  // RUMAH TAHFIDZ 0.1% - RUMAH
  0.001,  // GUDANG 0.1%
  0.001,  // MINANG 0.1%
  0.001,  // HOTEL 0.1%
  0.001,  // BANK SAMPAH 0.1%
  0.001,  // KARANG TARUNA 0.1%
  0.001,  // PAKAN TERNAK 0.1%
  0.001,  // SUNDA 0.1%
  0.001,  // JASA KEUANGAN 0.1% - JASA
  0.001,  // SEAFOOD 0.1%
  0.001,  // ORMAS 0.1%
  0.001,  // DANAU 0.1%
  0.001,  // HIDROPONIK 0.1%
  0.001,  // KEBUN 0.1%
  0.001,  // TANAMAN HIAS 0.1%
  0.001,  // SUPPLY 0.1%
  0.001,  // TOKOPEDIA 0.1%
  0.001,  // MLM 0.1%
  0.001,  // NILA 0.1%
  0.001,  // KEFIR 0.1%
  0.001,  // COWORKING-SPACE 0.1%
  0.001,  // KAWASAN KONSERVASI 0.1%
  0.08,   // RUMAH 8% - RUMAH
  0.03,   // KOS 3% - KOS
  0.02,   // KONTRAKAN 2% - KOS
  0.015,  // APARTEMEN 1.5% - RUMAH
  0.015,  // TANAH 1.5% - RUMAH
  0.015,  // RUKO 1.5% - RUMAH
  0.01,   // BENGKEL 1%
  0.01,   // APOTEK 1%
  0.008,  // KLINIK 0.8%
  0.006,  // SEKOLAH 0.6%
  0.005,  // KURSUS 0.5%
  0.004,  // SALON 0.4%
  0.004,  // BARBERSHOP 0.4%
  0.003,  // GYM 0.3%
  0.09,   // FASHION 9% - FASHION
  0.12,   // JASA 12% - JASA
  0.02,   // SEMBAKO 2%
  0.015,  // RETAIL 1.5%
  0.01,   // KESEHATAN 1%
  0.005,  // FOTOCOPY 0.5%
  0.003,  // NOTARIS 0.3%
];

// Validasi: total weights harus 1.00 (100%)
const _weightSum = CATEGORY_91_WEIGHTS.reduce((a, b) => a + b, 0);
// Jika tidak 1.00, normalisasi otomatis di pickCategoryWeighted

// Kategori legacy untuk backward compat (21+8) — tetap ada tapi deprecated, gunakan CATEGORY_91_LIST
const CATEGORY0_LIST = CATEGORY_91_LIST.slice(0, 21);
const CATEGORY1_LIST = ['MAKANAN', 'MINUMAN', 'JASA', 'RETAIL', 'PENDIDIKAN', 'KESEHATAN', null, null];

const PROVINSI_ID = '31';
const KABUPATEN_ID = '3171';

// ──────────────────────────────────────────────
// Helper: pilih kelurahan berdasarkan bobot distribusi — PERTAHANKAN weighted random
// Bintaro 32% (3.2M), Petukangan Utara 28% (2.8M), Selatan 17% (1.7M), Ulujami 13% (1.3M), Pesanggrahan 9% (0.9M)
// ──────────────────────────────────────────────
function pickKelurahan() {
  const r = Math.random();
  let acc = 0;
  for (const k of KELURAHAN_DISTRIBUSI) {
    acc += k.weight;
    if (r < acc) return k;
  }
  return KELURAHAN_DISTRIBUSI[0];
}

// ──────────────────────────────────────────────
// Helper: pilih kategori 91 weighted — bukan uniform, tapi weighted sesuai CATEGORY_91_WEIGHTS
// KULINER 15% (1.5M), JASA 12% (1.2M), FASHION 9% (900k), RUMAH 8% (800k), etc — total 100%
// Tiap kategori minimal 10k di 10M via two-phase guarantee di generateSyntheticStream
// ──────────────────────────────────────────────
function pickCategory91Weighted(): string {
  const r = Math.random();
  let acc = 0;
  // Normalisasi jika sum !=1.00
  const sum = _weightSum;
  for (let i = 0; i < CATEGORY_91_LIST.length; i++) {
    acc += CATEGORY_91_WEIGHTS[i] / sum;
    if (r < acc) return CATEGORY_91_LIST[i];
  }
  return CATEGORY_91_LIST[0]; // fallback KULINER
}

// ──────────────────────────────────────────────
// Helper: jitter ±0.01° lat/lng (sekitar ±1.1km) — PERTAHANKAN 0.01
// Untuk 10M: jitter tetap 0.01, pusat baseLat=-6.25 baseLng=106.75, faker id_ID
// ──────────────────────────────────────────────
function jitterCoord(base: number, jitter: number) {
  return base + (Math.random() * 2 - 1) * jitter;
}

// ──────────────────────────────────────────────
// Helper: parse koordinat raw (tangani data tanpa titik desimal)
// ──────────────────────────────────────────────
function normalizeCoord(raw: any, type: string) {
  if (raw === null || raw === undefined) return type === 'lat' ? -6.25 : 106.75;
  const s = String(raw).trim();
  if (s === '' || s === 'null' || s === 'undefined') return type === 'lat' ? -6.25 : 106.75;
  if (s.includes('.')) {
    const v = parseFloat(s);
    return isNaN(v) ? (type === 'lat' ? -6.25 : 106.75) : v;
  }
  if (type === 'lat') {
    if (s.startsWith('-')) {
      return parseFloat('-6.' + s.slice(2));
    }
    return parseFloat('6.' + s.slice(1));
  } else {
    return parseFloat(s.slice(0, 3) + '.' + s.slice(3));
  }
}

// ──────────────────────────────────────────────
// Helper: buat satu object UMKM synthetic (19 kolom shape sama) — 91 kategori weighted
// ──────────────────────────────────────────────
function makeOneSynthetic(idx: number, startId: number, baseLat: number, baseLng: number, jitter: number, forcedCategory?: string) {
  const kel = pickKelurahan();
  const centerLat = baseLat !== -6.25 ? baseLat : kel.lat;
  const centerLng = baseLng !== 106.75 ? baseLng : kel.lng;
  const lat = jitterCoord(centerLat, jitter);
  const lng = jitterCoord(centerLng, jitter);
  // Weighted pick 91 kategori — bukan cuma 21+8, tapi 91 komprehensif
  const category0 = forcedCategory ?? pickCategory91Weighted();
  const category1 = faker.helpers.arrayElement(CATEGORY1_LIST);
  const productName = faker.commerce.productName();
  const name = `${productName} ${kel.kelurahan} ${faker.number.int({ min: 1, max: 999 })}`;
  const dataId = String(startId + idx) + String(faker.number.int({ min: 100000, max: 999999 }));
  return {
    dataId,
    name,
    lat,
    lng,
    alamat: `Jl. ${faker.location.street()} No.${faker.number.int({ min: 1, max: 200 })}, ${kel.kelurahan}, Kec. Pesanggrahan, Jakarta Selatan ${kel.zipCode}`,
    telepon: faker.phone.number('08##########'),
    provinsiId: PROVINSI_ID,
    kabupatenId: KABUPATEN_ID,
    kecamatanId: kel.kecamatanId,
    desaId: kel.desaId,
    kelurahan: kel.kelurahan,
    zipCode: kel.zipCode,
    zipCodeChk: String(faker.number.int({ min: -50, max: 50 })),
    image: faker.image.url({ width: 640, height: 480 }),
    category0,
    category1,
    product: faker.commerce.product(),
    line: 6082 + idx + 1,
  };
}

// ──────────────────────────────────────────────
// Fungsi utama STREAMING: generateSyntheticStream — support 10M, heap flat 64MB, batch 10k
// Yield batch 10k object — memory flat ~64MB untuk 10M (bukan 7GB jika array)
// Guarantee: tiap kategori minimal 10k+ di 10M via two-phase (910k round-robin + 9.09M weighted)
// Progress log tiap 100k, jitter 0.01, KELURAHAN_DISTRIBUSI weights, faker id_ID
// ──────────────────────────────────────────────
export async function* generateSyntheticStream(
  count: number,
  batchSize = 10000,
  baseLat = -6.25,
  baseLng = 106.75,
  jitter = 0.01
) {
  if (count > 10_000_000) {
    throw new Error(`generateSyntheticStream: count=${count} > 10_000_000 (10M max), gunakan batch streaming atau split file`);
  }
  const startId = Date.now();
  let generated = 0;

  // Two-phase guarantee untuk 10M: tiap kategori minimal 10k
  // Jika count >= 910k (91*10k), alokasikan 10k per kategori dulu (910k), sisa weighted
  const guaranteeThreshold = 91 * 10000; // 910k
  const needsGuarantee = count >= guaranteeThreshold;
  let guaranteeIdx = 0; // index kategori untuk guarantee phase
  let guaranteeRemaining = needsGuarantee ? guaranteeThreshold : 0;
  // Untuk guarantee, kita butuh 10k per kategori = 910k, tapi batch 10k => 91 batch guarantee
  // Sisa count - 910k akan weighted

  while (generated < count) {
    const curBatch = Math.min(batchSize, count - generated);
    const batch = new Array(curBatch);
    for (let i = 0; i < curBatch; i++) {
      const globalIdx = generated + i;
      let forcedCat: string | undefined = undefined;
      // Guarantee phase: first 910k distributed round-robin 10k per kategori
      if (needsGuarantee && globalIdx < guaranteeThreshold) {
        const catIdx = Math.floor(globalIdx / 10000); // 0..90, tiap 10k satu kategori
        forcedCat = CATEGORY_91_LIST[catIdx];
      }
      batch[i] = makeOneSynthetic(globalIdx, startId, baseLat, baseLng, jitter, forcedCat);
    }
    generated += curBatch;
    yield batch;
    // Beri kesempatan event loop untuk GC (hindari block) — heap flat 64MB
    if (generated < count) await new Promise<void>((r) => setImmediate(r));
  }
}

// ──────────────────────────────────────────────
// Wrapper: generateSynthetic — support hingga 10M (dulu guard 10k, sekarang 10M)
// Untuk count <=10000 tetap pakai array, untuk >10000 pakai streaming concat (tapi tetap memory flat via batch)
// Guard OOM: throw jika >10M, paksa pakai streaming generateSyntheticStream untuk >10M
// ──────────────────────────────────────────────
export async function generateSynthetic(
  count: number,
  baseLat = -6.25,
  baseLng = 106.75,
  jitter = 0.01
) {
  if (count > 10_000_000) {
    throw new Error(
      `generateSynthetic OOM guard: count=${count} > 10_000_000 (10M max), gunakan generateSyntheticStream(count, batchSize) dengan for await...of untuk memory flat 64MB (10M = 7GB jika array)`
    );
  }
  // Untuk count besar >100k, tetap streaming tapi concat (hati-hati memory, tapi support hingga 10M jika heap cukup)
  // Rekomendasi: untuk 10M gunakan generateSyntheticStream langsung dengan --out NDJSON
  if (count > 100000) {
    console.warn(`[generate] Warning: generateSynthetic count=${count} besar, gunakan generateSyntheticStream untuk heap flat 64MB`);
  }
  const result: any[] = [];
  for await (const batch of generateSyntheticStream(count, 10000, baseLat, baseLng, jitter)) {
    result.push(...batch);
  }
  return result;
}

// ──────────────────────────────────────────────
// Helper: parse count string "5M", "100k", "1_000_000", "5000000", "10M"
// ──────────────────────────────────────────────
function parseCountStr(s: any) {
  if (s === null || s === undefined) return NaN;
  const str = String(s).trim().toLowerCase().replace(/_/g, '').replace(/,/g, '');
  if (str.endsWith('m')) {
    const n = parseFloat(str.slice(0, -1));
    return isNaN(n) ? NaN : Math.round(n * 1_000_000);
  }
  if (str.endsWith('k')) {
    const n = parseFloat(str.slice(0, -1));
    return isNaN(n) ? NaN : Math.round(n * 1000);
  }
  const n = parseInt(str, 10);
  return isNaN(n) ? NaN : n;
}

// ──────────────────────────────────────────────
// CLI: streaming untuk 10M — jangan JSON.stringify full array
// Usage: bun run generate.ts --count 100000
//        bun run generate.ts --synthetic 5M --out ./synthetic.ndjson
//        bun run generate.ts --synthetic 10M --out ./synthetic_10m.ndjson
//        bun run generate.ts --synthetic 1000000 --out ./synthetic.jsonl
//        node --loader ts-node/esm seed/generate.ts --synthetic 1000
//        npx tsx seed/generate.ts --synthetic 10000 --out /tmp/test_10k.ndjson
// Estimasi 10M: 100 detik @50K rows/s, 2.5GB per 5M -> 5GB per 10M NDJSON, heap flat 64MB
// ──────────────────────────────────────────────
const isMain = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('generate.ts');

if (isMain) {
  const args = process.argv.slice(2);
  const countArg = args.find((a) => a.startsWith('--count'));
  const syntheticArg = args.find((a) => a.startsWith('--synthetic'));
  const outArg = args.find((a) => a.startsWith('--out'));
  const shouldInsert = args.includes('--insert');
  const ndjsonFlag = args.includes('--ndjson');

  // Parsing --count / --synthetic dengan spasi atau =
  let finalCount = 1000;
  let found = false;

  const countIdx = args.indexOf('--count');
  if (countIdx !== -1 && args[countIdx + 1] && !args[countIdx + 1].startsWith('--')) {
    const parsed = parseCountStr(args[countIdx + 1]);
    if (!isNaN(parsed)) { finalCount = parsed; found = true; }
  } else if (countArg && countArg.includes('=')) {
    const parsed = parseCountStr(countArg.split('=')[1]);
    if (!isNaN(parsed)) { finalCount = parsed; found = true; }
  }

  const synIdx = args.indexOf('--synthetic');
  if (synIdx !== -1 && args[synIdx + 1] && !args[synIdx + 1].startsWith('--')) {
    const parsed = parseCountStr(args[synIdx + 1]);
    if (!isNaN(parsed)) { finalCount = parsed; found = true; }
  } else if (syntheticArg && syntheticArg.includes('=')) {
    const parsed = parseCountStr(syntheticArg.split('=')[1]);
    if (!isNaN(parsed)) { finalCount = parsed; found = true; }
  }

  // Fallback: jika tidak ada flag, cek arg pertama numeric
  if (!found && args[0] && !args[0].startsWith('--')) {
    const parsed = parseCountStr(args[0]);
    if (!isNaN(parsed)) finalCount = parsed;
  }

  let outPath: string | null = null;
  if (outArg) {
    if (outArg.includes('=')) outPath = outArg.split('=')[1];
    else {
      const outIdx = args.indexOf('--out');
      if (outIdx !== -1 && args[outIdx + 1]) outPath = args[outIdx + 1];
    }
  }

  console.log(`[generate] Membuat ${finalCount.toLocaleString('id-ID')} data synthetic (streaming batch 10k, 91 kategori)...`);
  console.log(`[generate] Distribusi kelurahan: Bintaro 32% (3.2M), Petukangan Utara 28% (2.8M), Selatan 17% (1.7M), Ulujami 13% (1.3M), Pesanggrahan 9% (0.9M)`);
  console.log(`[generate] Distribusi 91 kategori: KULINER 15% (1.5M), JASA 12% (1.2M), FASHION 9% (900k), RUMAH 8% (800k), tiap kategori minimal 10k+`);
  console.log(`[generate] Jitter: +-0.01 deg (~1.1km), pusat baseLat=-6.25 baseLng=106.75, faker id_ID`);
  console.log(`[generate] Memory: streaming flat ~64MB untuk 10M (bukan 7GB jika array), batch 10k, progress tiap 100k`);
  console.log(`[generate] Estimasi 10M: ~100 detik @50K rows/s, 5GB NDJSON (2.5GB per 5M), heap flat 64MB`);

  const start = Date.now();
  let total = 0;
  const dist: Record<string, number> = {};
  const catDist: Record<string, number> = {};
  let outStream: fs.WriteStream | null = null;
  let isNdjson = true;

  if (outPath) {
    const fullOut = path.resolve(outPath);
    // Tentukan format: .ndjson/.jsonl = NDJSON streaming, .json = NDJSON juga untuk 10M (jangan array)
    isNdjson = ndjsonFlag || fullOut.endsWith('.ndjson') || fullOut.endsWith('.jsonl') || finalCount > 10000;
    if (isNdjson) {
      outStream = fs.createWriteStream(fullOut, { encoding: 'utf-8' });
      console.log(`[generate] Output NDJSON streaming ke ${fullOut} (bukan JSON array — hemat memory, support 10M)`);
    } else {
      // Untuk count kecil <=10000, boleh JSON array
      console.log(`[generate] Output JSON array ke ${fullOut} (count kecil)`);
    }
  }

  // Jika outPath dan NDJSON, streaming tulis per baris — support 10M
  if (outStream) {
    for await (const batch of generateSyntheticStream(finalCount, 10000, -6.25, 106.75, 0.01)) {
      for (const obj of batch) {
        outStream.write(JSON.stringify(obj) + '\n');
        dist[obj.kelurahan] = (dist[obj.kelurahan] || 0) + 1;
        catDist[obj.category0] = (catDist[obj.category0] || 0) + 1;
      }
      total += batch.length;
      if (total % 100000 === 0 || total === finalCount) {
        const elapsed = Date.now() - start;
        const rps = elapsed > 0 ? (total / (elapsed / 1000)).toFixed(0) : '0';
        const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
        console.log(`[generate] Progress: ${total.toLocaleString('id-ID')}/${finalCount.toLocaleString('id-ID')} (${((total / finalCount) * 100).toFixed(1)}%) — ${rps} rows/s — heap ${mem} MB`);
      }
    }
    await new Promise<void>((resolve, reject) => {
      outStream.end((err: any) => (err ? reject(err) : resolve()));
      outStream.on('finish', resolve);
      outStream.on('error', reject);
    });
    const elapsed = Date.now() - start;
    const fullOut = path.resolve(outPath!);
    const sizeMB = (fs.statSync(fullOut).size / 1024 / 1024).toFixed(2);
    console.log(`[generate] Selesai ${total.toLocaleString('id-ID')} baris dalam ${elapsed}ms (${(total / (elapsed / 1000)).toFixed(0)} rows/s)`);
    console.log(`[generate] Disimpan NDJSON ke ${fullOut} (${sizeMB} MB)`);
  } else if (outPath && !isNdjson) {
    // Fallback JSON array untuk count kecil (<=10000) — pakai streaming concat
    const all: any[] = [];
    for await (const batch of generateSyntheticStream(finalCount, 10000, -6.25, 106.75, 0.01)) {
      all.push(...batch);
      total += batch.length;
      if (total % 100000 === 0 || total === finalCount) {
        const elapsed = Date.now() - start;
        const rps = elapsed > 0 ? (total / (elapsed / 1000)).toFixed(0) : '0';
        console.log(`[generate] Progress: ${total}/${finalCount} — ${rps} rows/s`);
      }
      for (const o of batch) {
        dist[o.kelurahan] = (dist[o.kelurahan] || 0) + 1;
        catDist[o.category0] = (catDist[o.category0] || 0) + 1;
      }
    }
    const fullOut = path.resolve(outPath);
    fs.writeFileSync(fullOut, JSON.stringify(all, null, 2));
    const elapsed = Date.now() - start;
    console.log(`[generate] Selesai ${all.length.toLocaleString('id-ID')} baris dalam ${elapsed}ms`);
    console.log(`[generate] Disimpan JSON array ke ${fullOut} (${(fs.statSync(fullOut).size / 1024 / 1024).toFixed(2)} MB)`);
    total = all.length;
  } else {
    // Tanpa --out: hanya generate + validasi distribusi (streaming, tidak simpan) — support 10M
    for await (const batch of generateSyntheticStream(finalCount, 10000, -6.25, 106.75, 0.01)) {
      for (const obj of batch) {
        dist[obj.kelurahan] = (dist[obj.kelurahan] || 0) + 1;
        catDist[obj.category0] = (catDist[obj.category0] || 0) + 1;
      }
      total += batch.length;
      if (total % 100000 === 0 || total === finalCount) {
        const elapsed = Date.now() - start;
        const rps = elapsed > 0 ? (total / (elapsed / 1000)).toFixed(0) : '0';
        const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
        console.log(`[generate] Progress: ${total.toLocaleString('id-ID')}/${finalCount.toLocaleString('id-ID')} (${((total / finalCount) * 100).toFixed(1)}%) — ${rps} rows/s — heap ${mem} MB`);
      }
    }
    const elapsed = Date.now() - start;
    console.log(`[generate] Selesai ${total.toLocaleString('id-ID')} baris dalam ${elapsed}ms (${(total / (elapsed / 1000)).toFixed(0)} rows/s)`);
    // Tampilkan contoh satu batch terakhir
    const sampleBatch: any[] = [];
    for await (const b of generateSyntheticStream(1, 1, -6.25, 106.75, 0.01)) {
      sampleBatch.push(...b);
      break;
    }
    console.log(`[generate] Contoh: ${JSON.stringify(sampleBatch[0], null, 2).slice(0, 400)}...`);
  }

  console.log('[generate] Distribusi kelurahan aktual:');
  for (const [k, v] of Object.entries(dist)) {
    const cnt = v as number;
    console.log(`  - ${k}: ${cnt} (${((cnt / total) * 100).toFixed(1)}%)`);
  }
  console.log('[generate] Distribusi 91 kategori aktual (top 15):');
  const sortedCats = Object.entries(catDist).sort((a, b) => (b[1] as number) - (a[1] as number));
  for (const [k, v] of sortedCats.slice(0, 15)) {
    const cnt = v as number;
    console.log(`  - ${k}: ${cnt} (${((cnt / total) * 100).toFixed(2)}%)`);
  }
  console.log(`[generate] Total kategori unik: ${Object.keys(catDist).length} (target 91)`);
  const minCat = Math.min(...Object.values(catDist) as number[]);
  const maxCat = Math.max(...Object.values(catDist) as number[]);
  console.log(`[generate] Kategori min: ${minCat}, max: ${maxCat}, tiap kategori minimal 10k di 10M: ${minCat >= 10000 || total < 910000 ? 'OK' : 'CHECK (count kecil)'}`);

  if (shouldInsert) {
    console.log('[generate] Mode --insert: akan insert ke DB via import.ts logic (gunakan bun run import --synthetic)');
  }
  if (!outPath && !shouldInsert) {
    console.log('[generate] Tips: gunakan --out synthetic.ndjson untuk simpan NDJSON streaming, atau --synthetic 10M --out untuk 10M');
    console.log('[generate] Estimasi 10M: 100 detik @50K rows/s, 5GB NDJSON, heap flat 64MB, tiap kategori 10k+');
  }
}
