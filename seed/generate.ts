// generate.ts — Generator synthetic UMKM dengan jitter geospasial (STREAMING)
// Bahasa komentar: Indonesia
// Sumber distribusi real: Rekap_by_Kelurahan.csv — Bintaro 31.7% (1931), Petukangan Utara 27.8% (1694),
//   Petukangan Selatan 17.3% (1054), Ulujami 13.5% (821), Pesanggrahan 9.4% (577), sisanya <0.1%
// Fungsi: export async function* generateSyntheticStream(count, batchSize=10000) -> yield batch 10k (memory flat 7MB)
//         export async function generateSynthetic(count) -> wrapper deprecated guard OOM >10000
// Dipakai untuk load test 100k/1M/5M (threshold Fase 3: 5M rows, Fase 2: 500 req/s)
// Memory: streaming 10k batch ~7MB, bukan 3.5GB untuk 5M

import { faker } from '@faker-js/faker/locale/id_ID';
import fs from 'fs';
import path from 'path';

// ──────────────────────────────────────────────
// Konfigurasi distribusi kelurahan (proporsi real 6.081) — PERTAHANKAN 5
// ──────────────────────────────────────────────
const KELURAHAN_DISTRIBUSI = [
  { kelurahan: 'Bintaro', kecamatanId: '3171040', desaId: '3171040001', zipCode: '12330', weight: 0.317, lat: -6.274, lng: 106.762 },
  { kelurahan: 'Petukangan Utara', kecamatanId: '3171040', desaId: '3171040005', zipCode: '12260', weight: 0.278, lat: -6.235, lng: 106.75 },
  { kelurahan: 'Petukangan Selatan', kecamatanId: '3171040', desaId: '3171040004', zipCode: '12270', weight: 0.173, lat: -6.242, lng: 106.755 },
  { kelurahan: 'Ulujami', kecamatanId: '3171040', desaId: '3171040003', zipCode: '12250', weight: 0.135, lat: -6.235, lng: 106.76 },
  { kelurahan: 'Pesanggrahan', kecamatanId: '3171040', desaId: '3171040002', zipCode: '12320', weight: 0.094, lat: -6.253, lng: 106.757 },
];

// Kategori real terbanyak (dari Rekap_by_Kelurahan.csv)
const CATEGORY0_LIST = [
  'KULINER', 'LAPAK', 'AYAM', 'PASAR JASA', 'WARUNG MAKAN', 'KOPI GAYO',
  'LAUNDRY', 'WARKOP', 'KAFE', 'ATM', 'MINIMARKET', 'FROZEN FOOD',
  'PENDIDIKAN', 'WARUNG SAYUR', 'TOKO BERAS', 'TRAVEL', 'JUICE',
  'BEBEK', 'KULINER', 'KULINER', 'KULINER',
];

const CATEGORY1_LIST = ['MAKANAN', 'MINUMAN', 'JASA', 'RETAIL', 'PENDIDIKAN', 'KESEHATAN', null, null];

const PROVINSI_ID = '31';
const KABUPATEN_ID = '3171';

// ──────────────────────────────────────────────
// Helper: pilih kelurahan berdasarkan bobot distribusi
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
// Helper: jitter ±0.01° lat/lng (sekitar ±1.1km) — PERTAHANKAN 0.01
// ──────────────────────────────────────────────
function jitterCoord(base, jitter) {
  return base + (Math.random() * 2 - 1) * jitter;
}

// ──────────────────────────────────────────────
// Helper: parse koordinat raw (tangani data tanpa titik desimal)
// ──────────────────────────────────────────────
function normalizeCoord(raw, type) {
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
// Helper: buat satu object UMKM synthetic (19 kolom shape sama)
// ──────────────────────────────────────────────
function makeOneSynthetic(idx, startId, baseLat, baseLng, jitter) {
  const kel = pickKelurahan();
  const centerLat = baseLat !== -6.25 ? baseLat : kel.lat;
  const centerLng = baseLng !== 106.75 ? baseLng : kel.lng;
  const lat = jitterCoord(centerLat, jitter);
  const lng = jitterCoord(centerLng, jitter);
  const category0 = faker.helpers.arrayElement(CATEGORY0_LIST);
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
// Fungsi utama STREAMING: generateSyntheticStream
// Yield batch 10k object — memory flat ~7MB untuk 5M (bukan 3.5GB)
// ──────────────────────────────────────────────
export async function* generateSyntheticStream(
  count,
  batchSize = 10000,
  baseLat = -6.25,
  baseLng = 106.75,
  jitter = 0.01
) {
  const startId = Date.now();
  let generated = 0;
  while (generated < count) {
    const curBatch = Math.min(batchSize, count - generated);
    const batch = new Array(curBatch);
    for (let i = 0; i < curBatch; i++) {
      batch[i] = makeOneSynthetic(generated + i, startId, baseLat, baseLng, jitter);
    }
    generated += curBatch;
    yield batch;
    // Beri kesempatan event loop untuk GC (hindari block)
    if (generated < count) await new Promise((r) => setImmediate(r));
  }
}

// ──────────────────────────────────────────────
// Wrapper deprecated: generateSynthetic (sync-like) — HANYA untuk count <=10000
// Guard OOM: throw jika >10000, paksa pakai streaming
// ──────────────────────────────────────────────
export async function generateSynthetic(
  count,
  baseLat = -6.25,
  baseLng = 106.75,
  jitter = 0.01
) {
  if (count > 10000) {
    throw new Error(
      `generateSynthetic OOM guard: count=${count} > 10000, gunakan generateSyntheticStream(count, batchSize) dengan for await...of untuk memory flat 7MB (5M = 3.5GB jika array)`
    );
  }
  const result = [];
  for await (const batch of generateSyntheticStream(count, 10000, baseLat, baseLng, jitter)) {
    result.push(...batch);
  }
  return result;
}

// ──────────────────────────────────────────────
// Helper: parse count string "5M", "100k", "1_000_000", "5000000"
// ──────────────────────────────────────────────
function parseCountStr(s) {
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
// CLI: streaming untuk 5M — jangan JSON.stringify full array
// Usage: bun run generate.ts --count 100000
//        bun run generate.ts --synthetic 5M --out ./synthetic.ndjson
//        bun run generate.ts --synthetic 1000000 --out ./synthetic.jsonl
//        node --loader ts-node/esm seed/generate.ts --synthetic 1000
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

  let outPath = null;
  if (outArg) {
    if (outArg.includes('=')) outPath = outArg.split('=')[1];
    else {
      const outIdx = args.indexOf('--out');
      if (outIdx !== -1 && args[outIdx + 1]) outPath = args[outIdx + 1];
    }
  }

  console.log(`[generate] Membuat ${finalCount.toLocaleString('id-ID')} data synthetic (streaming batch 10k)...`);
  console.log(`[generate] Distribusi: Bintaro 31.7%, Petukangan Utara 27.8%, Petukangan Selatan 17.3%, Ulujami 13.5%, Pesanggrahan 9.4%`);
  console.log(`[generate] Jitter: +-0.01 deg (~1.1km), pusat baseLat=-6.25 baseLng=106.75, faker id_ID`);
  console.log(`[generate] Memory: streaming flat ~7MB (bukan 3.5GB untuk 5M)`);

  const start = Date.now();
  let total = 0;
  const dist = {};
  let outStream = null;
  let isNdjson = true;

  if (outPath) {
    const fullOut = path.resolve(outPath);
    // Tentukan format: .ndjson/.jsonl = NDJSON streaming, .json = NDJSON juga untuk 5M (jangan array)
    isNdjson = ndjsonFlag || fullOut.endsWith('.ndjson') || fullOut.endsWith('.jsonl') || finalCount > 10000;
    if (isNdjson) {
      outStream = fs.createWriteStream(fullOut, { encoding: 'utf-8' });
      console.log(`[generate] Output NDJSON streaming ke ${fullOut} (bukan JSON array — hemat memory)`);
    } else {
      // Untuk count kecil <=10000, boleh JSON array
      console.log(`[generate] Output JSON array ke ${fullOut} (count kecil)`);
    }
  }

  // Jika outPath dan NDJSON, streaming tulis per baris
  if (outStream) {
    for await (const batch of generateSyntheticStream(finalCount, 10000, -6.25, 106.75, 0.01)) {
      for (const obj of batch) {
        outStream.write(JSON.stringify(obj) + '\n');
        dist[obj.kelurahan] = (dist[obj.kelurahan] || 0) + 1;
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
      outStream.end((err) => (err ? reject(err) : resolve()));
      outStream.on('finish', resolve);
      outStream.on('error', reject);
    });
    const elapsed = Date.now() - start;
    const fullOut = path.resolve(outPath);
    const sizeMB = (fs.statSync(fullOut).size / 1024 / 1024).toFixed(2);
    console.log(`[generate] Selesai ${total.toLocaleString('id-ID')} baris dalam ${elapsed}ms (${(total / (elapsed / 1000)).toFixed(0)} rows/s)`);
    console.log(`[generate] Disimpan NDJSON ke ${fullOut} (${sizeMB} MB)`);
  } else if (outPath && !isNdjson) {
    // Fallback JSON array untuk count kecil (<=10000) — pakai streaming concat
    const all = [];
    for await (const batch of generateSyntheticStream(finalCount, 10000, -6.25, 106.75, 0.01)) {
      all.push(...batch);
      total += batch.length;
      if (total % 100000 === 0 || total === finalCount) {
        const elapsed = Date.now() - start;
        const rps = elapsed > 0 ? (total / (elapsed / 1000)).toFixed(0) : '0';
        console.log(`[generate] Progress: ${total}/${finalCount} — ${rps} rows/s`);
      }
      for (const o of batch) dist[o.kelurahan] = (dist[o.kelurahan] || 0) + 1;
    }
    const fullOut = path.resolve(outPath);
    fs.writeFileSync(fullOut, JSON.stringify(all, null, 2));
    const elapsed = Date.now() - start;
    console.log(`[generate] Selesai ${all.length.toLocaleString('id-ID')} baris dalam ${elapsed}ms`);
    console.log(`[generate] Disimpan JSON array ke ${fullOut} (${(fs.statSync(fullOut).size / 1024 / 1024).toFixed(2)} MB)`);
    total = all.length;
  } else {
    // Tanpa --out: hanya generate + validasi distribusi (streaming, tidak simpan)
    for await (const batch of generateSyntheticStream(finalCount, 10000, -6.25, 106.75, 0.01)) {
      for (const obj of batch) {
        dist[obj.kelurahan] = (dist[obj.kelurahan] || 0) + 1;
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
    const sampleBatch = [];
    for await (const b of generateSyntheticStream(1, 1, -6.25, 106.75, 0.01)) {
      sampleBatch.push(...b);
      break;
    }
    console.log(`[generate] Contoh: ${JSON.stringify(sampleBatch[0], null, 2).slice(0, 400)}...`);
  }

  console.log('[generate] Distribusi aktual:');
  for (const [k, v] of Object.entries(dist)) {
    const cnt = v as number;
    console.log(`  - ${k}: ${cnt} (${((cnt / total) * 100).toFixed(1)}%)`);
  }

  if (shouldInsert) {
    console.log('[generate] Mode --insert: akan insert ke DB via import.ts logic (gunakan bun run import --synthetic)');
  }
  if (!outPath && !shouldInsert) {
    console.log('[generate] Tips: gunakan --out synthetic.ndjson untuk simpan NDJSON streaming, atau --synthetic 5M --out untuk 5M');
  }
}
