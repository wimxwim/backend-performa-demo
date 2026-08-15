// import.ts — Import data real 6.081 UMKM + 256 Masjid + synthetic 5M via COPY streaming
// Bahasa komentar: Indonesia
// Sumber CSV (path absolut, jangan copy file):
//   - UMKM: /home/ngome/GotongRoyong/Docs-wa/Data Kecamatan Pesanggrahan.xlsx.Pesanggrahan.csv (6082 baris, header + 6081 data, 23 kolom)
//   - Masjid: /home/ngome/GotongRoyong/Docs-wa/Data Kecamatan Pesanggrahan.xlsx.Masjid.csv (256 baris data + 2 baris header junk)
// Fitur: streaming csv-parse (bukan readFileSync 2.5GB), COPY FROM STDIN via pg-copy-streams untuk 5M (<15 menit, <500MB), fallback batch 1000 untuk <50000
//        UNLOGGED staging + DROP GIN sebelum COPY, CREATE GIN setelah COPY dengan maintenance_work_mem='1GB'
// Cara pakai: bun run --cwd seed import.ts  |  bun run --cwd seed import.ts --synthetic 100000  |  bun run --cwd seed import.ts --synthetic 5M

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { from as copyFrom } from 'pg-copy-streams';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { generateSyntheticStream } from './generate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ──────────────────────────────────────────────
// Path CSV — FIX bug: path.resolve selalu truthy, operand ketiga mati
// Sebelum: process.env.CSV_UMKM || path.resolve(...) || '/abs/path'  -> '/abs/path' tidak pernah tercapai
// Sesudah: cek existsSync tiap kandidat, baru fallback
// ──────────────────────────────────────────────
function resolveCsvPath(envVal, localRel, absoluteFallback, docsRelFallback) {
  if (envVal && fs.existsSync(envVal)) return envVal;
  const localPath = path.resolve(__dirname, localRel);
  if (fs.existsSync(localPath)) return localPath;
  if (fs.existsSync(absoluteFallback)) return absoluteFallback;
  const docsFallback = path.resolve(__dirname, docsRelFallback);
  if (fs.existsSync(docsFallback)) return docsFallback;
  // kembalikan absoluteFallback sebagai last resort (akan error dengan pesan jelas)
  return absoluteFallback;
}

let CSV_UMKM = resolveCsvPath(
  process.env.CSV_UMKM,
  '../data/Pesanggrahan.csv',
  '/home/ngome/GotongRoyong/Docs-wa/Data Kecamatan Pesanggrahan.xlsx.Pesanggrahan.csv',
  '../../Docs-wa/Data Kecamatan Pesanggrahan.xlsx.Pesanggrahan.csv'
);
let CSV_MASJID = resolveCsvPath(
  process.env.CSV_MASJID,
  '../data/Masjid.csv',
  '/home/ngome/GotongRoyong/Docs-wa/Data Kecamatan Pesanggrahan.xlsx.Masjid.csv',
  '../../Docs-wa/Data Kecamatan Pesanggrahan.xlsx.Masjid.csv'
);

// Fallback check tambahan — jika file tidak ada di path utama, coba fallback ke Docs-wa relatif (legacy log)
if (!fs.existsSync(CSV_UMKM)) {
  console.error(`CSV UMKM tidak ditemukan di ${CSV_UMKM}, set CSV_UMKM env atau copy ke data/Pesanggrahan.csv`);
  const fallbackUmkm = path.resolve(__dirname, '../../Docs-wa/Data Kecamatan Pesanggrahan.xlsx.Pesanggrahan.csv');
  if (fs.existsSync(fallbackUmkm)) {
    CSV_UMKM = fallbackUmkm;
    console.log(`[import] Fallback CSV UMKM: ${CSV_UMKM}`);
  }
}
if (!fs.existsSync(CSV_MASJID)) {
  console.error(`CSV Masjid tidak ditemukan di ${CSV_MASJID}, set CSV_MASJID env atau copy ke data/Masjid.csv`);
  const fallbackMasjid = path.resolve(__dirname, '../../Docs-wa/Data Kecamatan Pesanggrahan.xlsx.Masjid.csv');
  if (fs.existsSync(fallbackMasjid)) {
    CSV_MASJID = fallbackMasjid;
    console.log(`[import] Fallback CSV Masjid: ${CSV_MASJID}`);
  }
}

// ──────────────────────────────────────────────
// Helper: normalisasi koordinat (tangani tanpa titik desimal)
// ──────────────────────────────────────────────
function normalizeCoord(raw, type) {
  if (raw === null || raw === undefined) return type === 'lat' ? -6.25 : 106.75;
  const s = String(raw).trim();
  if (s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') {
    return type === 'lat' ? -6.25 : 106.75;
  }
  if (s.includes('.')) {
    const v = parseFloat(s);
    return isNaN(v) ? (type === 'lat' ? -6.25 : 106.75) : v;
  }
  if (type === 'lat') {
    if (s.startsWith('-')) {
      const sign = '-';
      const digits = s.slice(1);
      if (digits.length <= 1) return -6.25;
      return parseFloat(sign + digits[0] + '.' + digits.slice(1));
    }
    return parseFloat(s[0] + '.' + s.slice(1));
  } else {
    if (s.length <= 3) return parseFloat(s);
    return parseFloat(s.slice(0, 3) + '.' + s.slice(3));
  }
}

// ──────────────────────────────────────────────
// Helper: bersihkan string (hapus \r, trim, handle kosong)
// ──────────────────────────────────────────────
function cleanStr(v, fallback = '') {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim().replace(/\r/g, '');
  return s === '' ? fallback : s;
}

// ──────────────────────────────────────────────
// Helper: escape field untuk COPY CSV tab-delimited
// COPY ... WITH (FORMAT csv, DELIMITER E'\t') — perlu escape \t, \n, \r, \, "
// ──────────────────────────────────────────────
function escapeCopyField(v) {
  if (v === null || v === undefined) return '\\N';
  let s = String(v);
  // Escape backslash dulu
  s = s.replace(/\\/g, '\\\\');
  // Escape tab, newline, carriage return
  s = s.replace(/\t/g, ' ');
  s = s.replace(/\n/g, ' ');
  s = s.replace(/\r/g, '');
  // Jika mengandung quote, delimiter, atau perlu quoting, bungkus dengan "
  if (s.includes('"') || s.includes('\t') || s.includes('\n')) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  // Kosong -> \N untuk NULL? tapi kita sudah handle null di atas, kosong tetap string kosong
  return s;
}

// ──────────────────────────────────────────────
// Helper: buat pg Client dari DATABASE_URL
// ──────────────────────────────────────────────
function getPgClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL tidak set — set env untuk COPY bulk');
  }
  return new pg.Client({ connectionString });
}

// ──────────────────────────────────────────────
// Helper: prepare bulk COPY — DROP GIN, SET UNLOGGED, maintenance_work_mem 1GB
// ──────────────────────────────────────────────
async function prepareForBulkCopy(client) {
  console.log('[copy] Prepare bulk COPY: DROP GIN, SET maintenance_work_mem=1GB, UNLOGGED staging...');
  // Set maintenance_work_mem untuk CREATE INDEX cepat
  await client.query(`SET maintenance_work_mem = '1GB'`);
  // Drop GIN trigram sebelum COPY (biar COPY tidak update index per row)
  await client.query(`DROP INDEX IF EXISTS idx_umkm_name_trgm`);
  await client.query(`DROP INDEX IF EXISTS idx_umkm_alamat_trgm`);
  await client.query(`DROP INDEX IF EXISTS idx_umkm_name_alamat_trgm`);
  console.log('[copy] GIN index dropped, maintenance_work_mem=1GB');
  // Buat staging UNLOGGED jika belum ada (LIKE umkm termasuk index B-Tree tapi tanpa GIN)
  await client.query(`
    CREATE UNLOGGED TABLE IF NOT EXISTS umkm_staging (LIKE umkm INCLUDING ALL);
    TRUNCATE umkm_staging;
  `);
  console.log('[copy] UNLOGGED staging umkm_staging siap (TRUNCATE)');
}

// ──────────────────────────────────────────────
// Helper: restore setelah COPY — CREATE GIN, RESET maintenance_work_mem, VACUUM ANALYZE
// ──────────────────────────────────────────────
async function restoreAfterBulkCopy(client, useStaging) {
  console.log('[copy] Restore: CREATE GIN, RESET maintenance_work_mem, VACUUM ANALYZE...');
  // Jika pakai staging, pindahkan ke umkm utama
  if (useStaging) {
    console.log('[copy] Memindahkan staging -> umkm (INSERT ... SELECT)...');
    const moveStart = Date.now();
    // Insert dari staging ke umkm (ON CONFLICT DO NOTHING)
    await client.query(`
      INSERT INTO umkm (id, data_id, name, lat, lng, alamat, telepon, provinsi_id, kabupaten_id, kecamatan_id, desa_id, kelurahan, zip_code, zip_code_chk, image, category0, category1, product, line)
      SELECT id, data_id, name, lat, lng, alamat, telepon, provinsi_id, kabupaten_id, kecamatan_id, desa_id, kelurahan, zip_code, zip_code_chk, image, category0, category1, product, line
      FROM umkm_staging
      ON CONFLICT (data_id) DO NOTHING;
    `);
    const moved = await client.query(`SELECT COUNT(*)::int as cnt FROM umkm_staging`);
    console.log(`[copy] Staging moved ${moved.rows[0].cnt} rows dalam ${Date.now() - moveStart}ms`);
    await client.query(`DROP TABLE IF EXISTS umkm_staging`);
  }
  // Recreate GIN dengan maintenance_work_mem 1GB (masih set)
  await client.query(`CREATE INDEX IF NOT EXISTS idx_umkm_name_trgm ON umkm USING GIN (name gin_trgm_ops)`);
  console.log('[copy] GIN idx_umkm_name_trgm recreated');
  await client.query(`CREATE INDEX IF NOT EXISTS idx_umkm_alamat_trgm ON umkm USING GIN (alamat gin_trgm_ops)`);
  console.log('[copy] GIN idx_umkm_alamat_trgm recreated');
  await client.query(`CREATE INDEX IF NOT EXISTS idx_umkm_name_alamat_trgm ON umkm USING GIN ((name || ' ' || alamat) gin_trgm_ops)`);
  console.log('[copy] GIN idx_umkm_name_alamat_trgm recreated');
  await client.query(`RESET maintenance_work_mem`);
  await client.query(`VACUUM ANALYZE umkm`);
  console.log('[copy] VACUUM ANALYZE umkm selesai');
}

// ──────────────────────────────────────────────
// Import UMKM — streaming csv-parse (bukan readFileSync 2.5GB)
// Kolom CSV: line,product,dataId,name,dataLat,dataLng,alamat,telepon,provinsiId,kabupatenId,kecamatanId,desaId,Kelurahan,zipCode,zipCodeChk,image,category0,category1,...
// ──────────────────────────────────────────────
async function importUmkm(prisma) {
  console.log('[import] Membaca CSV UMKM (streaming):', CSV_UMKM);

  if (!fs.existsSync(CSV_UMKM)) {
    throw new Error(`File CSV UMKM tidak ditemukan: ${CSV_UMKM}`);
  }

  // Kosongkan tabel dulu (idempotent untuk re-seed)
  console.log('[import] Mengosongkan tabel umkm...');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE umkm RESTART IDENTITY CASCADE;`).catch(() => {
    console.log('[import] TRUNCATE gagal, lanjut insert (mungkin tabel kosong)');
  });

  let inserted = 0;
  const batchSize = 1000;
  let batchValues = [];
  let batchParams = [];
  let paramIdx = 1;
  let totalRecords = 0;

  const parser = fs.createReadStream(CSV_UMKM).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
    })
  );

  // Kumpulkan header untuk log
  let headerLogged = false;

  for await (const r of parser) {
    if (!headerLogged) {
      console.log(`[import] Kolom terdeteksi: ${Object.keys(r).join(', ')}`);
      console.log(`[import] Contoh baris 1: ${JSON.stringify(r, null, 2).slice(0, 500)}...`);
      headerLogged = true;
    }
    totalRecords++;

    const dataId = cleanStr(r.dataId);
    if (!dataId) continue;

    const name = cleanStr(r.name, 'UMKM Tanpa Nama');
    const lat = normalizeCoord(r.dataLat, 'lat');
    const lng = normalizeCoord(r.dataLng, 'lng');
    const alamat = cleanStr(r.alamat, '-');
    const telepon = cleanStr(r.telepon) || null;
    const provinsiId = cleanStr(r.provinsiId, '31');
    const kabupatenId = cleanStr(r.kabupatenId, '3171');
    const kecamatanId = cleanStr(r.kecamatanId, '3171040');
    const desaId = cleanStr(r.desaId) || null;
    const kelurahan = cleanStr(r.Kelurahan, 'Bintaro');
    const zipCode = cleanStr(r.zipCode, '12330');
    const zipCodeChk = cleanStr(r.zipCodeChk) || null;
    const image = cleanStr(r.image) || null;
    const category0 = cleanStr(r.category0, 'KULINER') || 'KULINER';
    const category1 = cleanStr(r.category1) || null;
    const product = cleanStr(r.product) || null;
    const line = r.line ? parseInt(String(r.line), 10) || null : null;

    const safeLat = lat < -7 || lat > -6 ? -6.25 : lat;
    const safeLng = lng < 106 || lng > 107.5 ? 106.75 : lng;

    batchValues.push(
      `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`
    );
    batchParams.push(
      `umkm_${dataId.slice(0, 12)}_${inserted + batchValues.length}`,
      dataId,
      name,
      safeLat,
      safeLng,
      alamat,
      telepon,
      provinsiId,
      kabupatenId,
      kecamatanId,
      desaId,
      kelurahan,
      zipCode,
      zipCodeChk,
      image,
      category0,
      category1,
      product,
      line
    );

    if (batchValues.length >= batchSize) {
      const sql = `
        INSERT INTO umkm (id, data_id, name, lat, lng, alamat, telepon, provinsi_id, kabupaten_id, kecamatan_id, desa_id, kelurahan, zip_code, zip_code_chk, image, category0, category1, product, line)
        VALUES ${batchValues.join(', ')}
        ON CONFLICT (data_id) DO NOTHING;
      `;
      await prisma.$executeRawUnsafe(sql, ...batchParams);
      inserted += batchValues.length;
      console.log(`[import] UMKM progress: ${inserted}/${totalRecords} (streaming batch ${batchSize})`);
      batchValues = [];
      batchParams = [];
      paramIdx = 1;
    }
  }

  // Sisa batch terakhir
  if (batchValues.length > 0) {
    const sql = `
      INSERT INTO umkm (id, data_id, name, lat, lng, alamat, telepon, provinsi_id, kabupaten_id, kecamatan_id, desa_id, kelurahan, zip_code, zip_code_chk, image, category0, category1, product, line)
      VALUES ${batchValues.join(', ')}
      ON CONFLICT (data_id) DO NOTHING;
    `;
    await prisma.$executeRawUnsafe(sql, ...batchParams);
    inserted += batchValues.length;
    console.log(`[import] UMKM progress: ${inserted}/${totalRecords} (final batch)`);
  }

  console.log(`[import] Total baris UMKM (streaming): ${totalRecords} -> inserted batch: ${inserted}`);

  const count = await prisma.umkm.count();
  console.log(`[import] UMKM selesai — inserted batch: ${inserted}, count di DB: ${count}`);
  if (count < 6000) {
    console.warn(`[import] WARNING: count UMKM ${count} < 6000, cek CSV atau error insert`);
  } else {
    console.log(`[import] UMKM OK: ${count} baris (target 6081)`);
  }
  return count;
}

// ──────────────────────────────────────────────
// Import Masjid — streaming csv-parse, handle 2 baris header junk
// ──────────────────────────────────────────────
async function importMasjid(prisma) {
  console.log('[import] Membaca CSV Masjid (streaming):', CSV_MASJID);

  if (!fs.existsSync(CSV_MASJID)) {
    throw new Error(`File CSV Masjid tidak ditemukan: ${CSV_MASJID}`);
  }

  console.log('[import] Mengosongkan tabel masjid...');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE masjid RESTART IDENTITY CASCADE;`).catch(() => {
    console.log('[import] TRUNCATE masjid gagal, lanjut insert');
  });

  // Baca file, skip baris junk pertama, lalu streaming parse sisa
  const rawHeader = fs.readFileSync(CSV_MASJID, 'utf-8').split('\n');
  const headerLine = rawHeader[1];
  // Buat stream dari baris 2+ (data) dengan headerLine sebagai header
  const dataContent = headerLine + '\n' + rawHeader.slice(2).join('\n');
  // Untuk streaming, kita buat Readable dari string (256 baris kecil, tidak masalah)
  // Tapi tetap pakai streaming parser agar konsisten
  const readable = Readable.from([dataContent]);

  const parser = readable.pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
    })
  );

  let inserted = 0;
  const batchSize = 1000;
  let batchValues = [];
  let batchParams = [];
  let paramIdx = 1;
  let totalRecords = 0;
  let headerLogged = false;

  for await (const r of parser) {
    if (!headerLogged) {
      console.log(`[import] Kolom Masjid: ${Object.keys(r).join(', ')}`);
      console.log(`[import] Contoh masjid 1: ${JSON.stringify(r, null, 2).slice(0, 500)}...`);
      headerLogged = true;
    }
    totalRecords++;

    const idRaw = cleanStr(r.No);
    const id = parseInt(idRaw, 10);
    if (isNaN(id)) continue;

    const name = cleanStr(r.name, `Masjid ${id}`);
    const tipe = cleanStr(r.Tipe, 'MASJID').toUpperCase();
    const safeTipe = tipe === 'MUSHOLLA' ? 'MUSHOLLA' : 'MASJID';
    const kelurahan = cleanStr(r.Kelurahan, 'Bintaro');
    const kodePos = cleanStr(r['Kode Pos']) || null;
    const lat = normalizeCoord(r.dataLat, 'lat');
    const lng = normalizeCoord(r.dataLng, 'lng');
    const alamat = cleanStr(r.alamat, '-');
    const pic = cleanStr(r.PIC) || null;
    const kasMasjid = cleanStr(r['Kas Masjid Terakhir']) || null;

    const safeLat = lat < -7 || lat > -6 ? -6.25 : lat;
    const safeLng = lng < 106 || lng > 107.5 ? 106.75 : lng;

    batchValues.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`);
    batchParams.push(id, name, safeTipe, kelurahan, kodePos, safeLat, safeLng, alamat, pic, kasMasjid);

    if (batchValues.length >= batchSize) {
      const sql = `
        INSERT INTO masjid (id, name, tipe, kelurahan, kode_pos, lat, lng, alamat, pic, kas_masjid)
        VALUES ${batchValues.join(', ')}
        ON CONFLICT (id) DO NOTHING;
      `;
      await prisma.$executeRawUnsafe(sql, ...batchParams);
      inserted += batchValues.length;
      console.log(`[import] Masjid progress: ${inserted}/${totalRecords}`);
      batchValues = [];
      batchParams = [];
      paramIdx = 1;
    }
  }

  if (batchValues.length > 0) {
    const sql = `
      INSERT INTO masjid (id, name, tipe, kelurahan, kode_pos, lat, lng, alamat, pic, kas_masjid)
      VALUES ${batchValues.join(', ')}
      ON CONFLICT (id) DO NOTHING;
    `;
    await prisma.$executeRawUnsafe(sql, ...batchParams);
    inserted += batchValues.length;
    console.log(`[import] Masjid progress: ${inserted}/${totalRecords}`);
  }

  console.log(`[import] Total baris Masjid data: ${totalRecords}`);

  const count = await prisma.masjid.count();
  console.log(`[import] Masjid selesai — inserted: ${inserted}, count DB: ${count}`);
  if (count < 250) {
    console.warn(`[import] WARNING: count Masjid ${count} < 250, cek CSV`);
  } else {
    console.log(`[import] Masjid OK: ${count} baris (target 256)`);
  }
  return count;
}

// ──────────────────────────────────────────────
// Synthetic COPY bulk — untuk count >= 50000 (5M)
// Pattern: async function* tsvGenerator() yield `${id}\t${name}\t...` + pipeline(Readable.from(tsvGenerator()), client.query(copyFrom(...)))
// ──────────────────────────────────────────────
async function importSyntheticCopy(syntheticCount) {
  const startTime = Date.now();
  console.log(`[synthetic] COPY bulk ${syntheticCount.toLocaleString('id-ID')} rows via pg-copy-streams (target <15 menit, <500MB)...`);

  const client = getPgClient();
  await client.connect();

  try {
    // Prepare: DROP GIN, UNLOGGED staging, maintenance_work_mem 1GB
    await prepareForBulkCopy(client);

    // Tentukan target COPY: staging jika ada, else umkm langsung
    const useStaging = true;
    const copyTarget = useStaging ? 'umkm_staging' : 'umkm';
    const copySql = `COPY ${copyTarget} (id, data_id, name, lat, lng, alamat, telepon, provinsi_id, kabupaten_id, kecamatan_id, desa_id, kelurahan, zip_code, zip_code_chk, image, category0, category1, product, line) FROM STDIN WITH (FORMAT csv, DELIMITER E'\t', QUOTE E'\b', ESCAPE E'\\')`;

    let totalYielded = 0;
    let lastProgress = 0;

    // Generator TSV — yield per baris tab-delimited
    async function* tsvGenerator() {
      for await (const batch of generateSyntheticStream(syntheticCount, 10000, -6.25, 106.75, 0.01)) {
        for (const r of batch) {
          const id = `syn_${r.dataId.slice(0, 16)}`;
          const fields = [
            escapeCopyField(id),
            escapeCopyField(r.dataId),
            escapeCopyField(r.name),
            escapeCopyField(r.lat),
            escapeCopyField(r.lng),
            escapeCopyField(r.alamat),
            escapeCopyField(r.telepon),
            escapeCopyField(r.provinsiId),
            escapeCopyField(r.kabupatenId),
            escapeCopyField(r.kecamatanId),
            escapeCopyField(r.desaId),
            escapeCopyField(r.kelurahan),
            escapeCopyField(r.zipCode),
            escapeCopyField(r.zipCodeChk),
            escapeCopyField(r.image),
            escapeCopyField(r.category0),
            escapeCopyField(r.category1),
            escapeCopyField(r.product),
            escapeCopyField(r.line),
          ];
          yield fields.join('\t') + '\n';
        }
        totalYielded += batch.length;
        // Progress tiap 100k
        if (totalYielded - lastProgress >= 100000 || totalYielded === syntheticCount) {
          const elapsed = Date.now() - startTime;
          const rps = elapsed > 0 ? (totalYielded / (elapsed / 1000)).toFixed(0) : '0';
          const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
          console.log(`[synthetic] COPY progress: ${totalYielded.toLocaleString('id-ID')}/${syntheticCount.toLocaleString('id-ID')} (${((totalYielded / syntheticCount) * 100).toFixed(1)}%) — ${rps} rows/s — heap ${mem} MB`);
          lastProgress = totalYielded;
        }
      }
    }

    // Pipeline COPY
    const copyStream = client.query(copyFrom(copySql));
    const readable = Readable.from(tsvGenerator());

    await pipeline(readable, copyStream);

    const copyElapsed = Date.now() - startTime;
    console.log(`[synthetic] COPY selesai ${totalYielded.toLocaleString('id-ID')} rows dalam ${copyElapsed}ms (${(totalYielded / (copyElapsed / 1000)).toFixed(0)} rows/s)`);

    // Restore: CREATE GIN, VACUUM ANALYZE, pindahkan staging
    await restoreAfterBulkCopy(client, useStaging);

    const totalElapsed = Date.now() - startTime;
    console.log(`[synthetic] Total waktu COPY + index: ${totalElapsed}ms (${(totalElapsed / 1000).toFixed(1)}s)`);

    // Verifikasi count via Prisma
    const prisma = new PrismaClient();
    const totalUmkm = await prisma.umkm.count();
    await prisma.$disconnect();
    console.log(`[synthetic] Selesai — total UMKM di DB sekarang: ${totalUmkm.toLocaleString('id-ID')} (rowCount COPY: ${totalYielded.toLocaleString('id-ID')}, waktu: ${(totalElapsed / 1000).toFixed(1)}s)`);
    return totalUmkm;
  } finally {
    await client.end().catch(() => {});
  }
}

// ──────────────────────────────────────────────
// Synthetic fallback batch INSERT — untuk count < 50000 (test kecil tetap jalan)
// ──────────────────────────────────────────────
async function importSyntheticBatch(prisma, syntheticCount) {
  const startTime = Date.now();
  console.log(`[synthetic] Fallback batch INSERT ${syntheticCount.toLocaleString('id-ID')} rows (count < 50000, test kecil)...`);
  let insertedSyn = 0;
  const batchSize = 1000;

  for await (const batch of generateSyntheticStream(syntheticCount, 10000, -6.25, 106.75, 0.01)) {
    // Bagi batch 10k menjadi sub-batch 1000 untuk INSERT
    for (let i = 0; i < batch.length; i += batchSize) {
      const subBatch = batch.slice(i, i + batchSize);
      const values = [];
      const params = [];
      let paramIdx = 1;
      for (const r of subBatch) {
        values.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`);
        params.push(
          `syn_${r.dataId.slice(0, 16)}`,
          r.dataId,
          r.name,
          r.lat,
          r.lng,
          r.alamat,
          r.telepon,
          r.provinsiId,
          r.kabupatenId,
          r.kecamatanId,
          r.desaId,
          r.kelurahan,
          r.zipCode,
          r.zipCodeChk,
          r.image,
          r.category0,
          r.category1,
          r.product,
          r.line
        );
      }
      const sql = `
        INSERT INTO umkm (id, data_id, name, lat, lng, alamat, telepon, provinsi_id, kabupaten_id, kecamatan_id, desa_id, kelurahan, zip_code, zip_code_chk, image, category0, category1, product, line)
        VALUES ${values.join(', ')}
        ON CONFLICT (data_id) DO NOTHING;
      `;
      await prisma.$executeRawUnsafe(sql, ...params);
      insertedSyn += subBatch.length;
      if (insertedSyn % 10000 === 0 || insertedSyn === syntheticCount) {
        const elapsed = Date.now() - startTime;
        const rps = elapsed > 0 ? (insertedSyn / (elapsed / 1000)).toFixed(0) : '0';
        console.log(`[synthetic] Progress: ${insertedSyn}/${syntheticCount} (${((insertedSyn / syntheticCount) * 100).toFixed(1)}%) — ${rps} rows/s`);
      }
    }
  }
  const totalUmkm = await prisma.umkm.count();
  const elapsed = Date.now() - startTime;
  console.log(`[synthetic] Selesai batch — total UMKM di DB sekarang: ${totalUmkm.toLocaleString('id-ID')} (waktu: ${(elapsed / 1000).toFixed(1)}s, rowCount: ${insertedSyn})`);
  return totalUmkm;
}

// ──────────────────────────────────────────────
// Main — jalankan import real + opsi synthetic
// Usage: bun run import.ts [--synthetic 100000]  ( <50000 batch, >=50000 COPY)
// ──────────────────────────────────────────────
async function main() {
  const prisma = new PrismaClient();
  const args = process.argv.slice(2);
  const syntheticIdx = args.indexOf('--synthetic');
  let syntheticCount = 0;
  if (syntheticIdx !== -1 && args[syntheticIdx + 1]) {
    // Support "5M", "100k"
    const raw = args[syntheticIdx + 1].trim().toLowerCase().replace(/_/g, '').replace(/,/g, '');
    if (raw.endsWith('m')) syntheticCount = Math.round(parseFloat(raw.slice(0, -1)) * 1_000_000);
    else if (raw.endsWith('k')) syntheticCount = Math.round(parseFloat(raw.slice(0, -1)) * 1000);
    else syntheticCount = parseInt(raw, 10) || 0;
  }

  try {
    console.log('========================================');
    console.log(' Gotong Royong — Seed Import Real CSV (streaming) + COPY bulk');
    console.log('========================================');
    console.log(`[main] DATABASE_URL: ${process.env.DATABASE_URL ? '***set***' : 'NOT SET (pakai default)'}`);
    console.log(`[main] Synthetic count: ${syntheticCount ? syntheticCount.toLocaleString('id-ID') : 'tidak (hanya real)'} ${syntheticCount >= 50000 ? '(COPY bulk)' : syntheticCount > 0 ? '(batch fallback)' : ''}`);

    const umkmCount = await importUmkm(prisma);
    const masjidCount = await importMasjid(prisma);

    // Verifikasi akhir
    console.log('----------------------------------------');
    console.log(`[verify] UMKM: ${umkmCount} (target 6081) — ${umkmCount === 6081 ? 'PASS' : umkmCount >= 6000 ? 'OK' : 'FAIL'}`);
    console.log(`[verify] Masjid: ${masjidCount} (target 256) — ${masjidCount >= 254 ? 'PASS' : 'FAIL'}`);
    console.log(`[verify] Total: ${umkmCount + masjidCount} baris`);

    // Synthetic jika diminta
    if (syntheticCount > 0) {
      console.log('----------------------------------------');
      if (syntheticCount >= 50000) {
        // COPY bulk untuk 5M — <15 menit, <500MB
        await importSyntheticCopy(syntheticCount);
      } else {
        // Fallback batch untuk test kecil
        await importSyntheticBatch(prisma, syntheticCount);
      }
    }

    console.log('========================================');
    console.log(' Seed selesai — jalankan verify: bun run verify-ledger.ts');
    console.log('========================================');
  } catch (err) {
    console.error('[import] ERROR:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
