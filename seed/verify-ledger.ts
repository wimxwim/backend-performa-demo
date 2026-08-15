// verify-ledger.ts — Verifikasi SHA-256 hash chain financial_ledger
// Bahasa komentar: Indonesia
// Sumber: Ringkasan Backend Bab 5 — GET /api/ledger/verify loop hash chain
// Fungsi: loop SELECT * ORDER BY id, hitung digest SHA-256, bandingkan hash_self
// Cara pakai:
//   bun run --cwd seed verify-ledger.ts              (via Prisma langsung)
//   LEDGER_API_URL=http://localhost:3004 bun run --cwd seed verify-ledger.ts  (via HTTP endpoint)

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// ──────────────────────────────────────────────
// Helper: hitung SHA-256 hex dari raw string
// Formula exact dari trigger: amount|description|recipient_id|actor_id|hash_prev
// ──────────────────────────────────────────────
function sha256Hex(input) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

// ──────────────────────────────────────────────
// Verifikasi via DB langsung (Prisma)
// ──────────────────────────────────────────────
async function verifyViaDb(prisma) {
  console.log('[verify] Mengambil semua baris financial_ledger ORDER BY id...');

  // Ambil via raw query agar dapat semua kolom termasuk hash (Prisma BigInt handling)
  const rows = await prisma.$queryRawUnsafe(`
    SELECT id, amount, description, recipient_id, actor_id, hash_prev, hash_self
    FROM financial_ledger
    ORDER BY id ASC;
  `);

  const total = rows.length;
  console.log(`[verify] Total baris ledger: ${total}`);

  if (total === 0) {
    console.log('[verify] Ledger kosong — tidak ada yang perlu diverifikasi');
    return { valid: true, brokenAt: null, total: 0, checked: 0 };
  }

  const GENESIS = '0000000000000000000000000000000000000000000000000000000000000000';
  let prevHash = GENESIS;
  let brokenAt = null;
  let checked = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const id = String(row.id);
    const amount = String(row.amount);
    const description = String(row.description);
    const recipientId = String(row.recipient_id);
    const actorId = String(row.actor_id);
    const hashPrevDb = String(row.hash_prev);
    const hashSelfDb = String(row.hash_self);

    // 1. Cek hash_prev harus sama dengan hash_self baris sebelumnya (atau genesis)
    if (hashPrevDb !== prevHash) {
      console.error(`[verify] BROKEN hash_prev di id=${id} (baris ke-${i + 1})`);
      console.error(`  Expected hash_prev: ${prevHash}`);
      console.error(`  Actual   hash_prev: ${hashPrevDb}`);
      if (brokenAt === null) brokenAt = Number(id);
      // tetap lanjut untuk deteksi semua broken
    }

    // 2. Hitung ulang hash_self dan bandingkan
    const raw = `${amount}|${description}|${recipientId}|${actorId}|${hashPrevDb}`;
    const expectedSelf = sha256Hex(raw);

    if (expectedSelf !== hashSelfDb) {
      console.error(`[verify] BROKEN hash_self di id=${id} (baris ke-${i + 1})`);
      console.error(`  Raw string: ${raw.slice(0, 120)}...`);
      console.error(`  Expected hash_self: ${expectedSelf}`);
      console.error(`  Actual   hash_self: ${hashSelfDb}`);
      if (brokenAt === null) brokenAt = Number(id);
    }

    prevHash = hashSelfDb; // untuk iterasi berikutnya (pakai yang di DB, bukan expected)
    checked++;

    // Log progress per 1000 untuk ledger besar
    if (checked % 1000 === 0 || checked === total) {
      console.log(`[verify] Progress: ${checked}/${total} — ${brokenAt ? 'BROKEN at ' + brokenAt : 'OK'}`);
    }
  }

  const valid = brokenAt === null;
  console.log('----------------------------------------');
  if (valid) {
    console.log(`[verify] VALID — semua ${total} baris hash chain utuh`);
  } else {
    console.log(`[verify] INVALID — rantai patah di id=${brokenAt}, total ${total} baris, checked ${checked}`);
  }
  return { valid, brokenAt, total, checked };
}

// ──────────────────────────────────────────────
// Verifikasi via HTTP endpoint (GET /api/ledger/verify)
// ──────────────────────────────────────────────
async function verifyViaHttp(apiUrl) {
  const url = `${apiUrl.replace(/\/$/, '')}/api/ledger/verify`;
  console.log(`[verify] Fetch HTTP: GET ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} dari ${url}`);
  }
  const data = await res.json();
  console.log('[verify] Response HTTP:', JSON.stringify(data, null, 2));
  return data;
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
async function main() {
  const apiUrl = process.env.LEDGER_API_URL || process.env.KAS_API_URL || null;

  // Jika LEDGER_API_URL di-set, coba via HTTP dulu
  if (apiUrl) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await verifyViaHttp(apiUrl);
      console.log('----------------------------------------');
      console.log(`[verify] HTTP valid=${result.valid}, brokenAt=${result.brokenAt ?? 'null'}, total=${result.total ?? '?'}`);
      process.exit(result.valid ? 0 : 2);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[verify] HTTP gagal (${msg}), fallback ke DB langsung...`);
    }
  }

  // Fallback: verifikasi langsung via Prisma
  const prisma = new PrismaClient();
  try {
    console.log('========================================');
    console.log(' Gotong Royong — Verify Ledger SHA-256');
    console.log('========================================');
    console.log(`[main] DATABASE_URL: ${process.env.DATABASE_URL ? '***set***' : 'NOT SET'}`);

    const result = await verifyViaDb(prisma);

    // Output JSON ringkas untuk piping
    console.log(JSON.stringify({ valid: result.valid, brokenAt: result.brokenAt, total: result.total }, null, 2));

    process.exit(result.valid ? 0 : 2);
  } catch (err) {
    console.error('[verify] ERROR:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
