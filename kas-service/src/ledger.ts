// ledger.ts — Express routes untuk Kas Ledger SHA-256 Hash Chain
// Bahasa komentar: Indonesia
// Sumber: Ringkasan Backend Bab 5 + spec lock 7 Fondasi #6
// Endpoints:
//   POST /api/kas     — input kas (trigger SHA-256 otomatis di DB)
//   POST /api/donasi  — input donasi (tulis ke financial_ledger + zis_distribution)
//   GET  /api/ledger/verify — loop verifikasi hash chain
//   GET  /api/kas      — laporan kas (daftar + ringkasan)
// Cara pakai: import { registerLedgerRoutes } dari './ledger.js' lalu app.use

import { Router } from 'express';
import crypto from 'crypto';

// Helper SHA-256 (untuk verifikasi di GET /api/ledger/verify)
function sha256Hex(input) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

// ──────────────────────────────────────────────
// Factory: buat router ledger dengan dependency prisma
// prisma: instance PrismaClient (di-inject dari kas-service utama)
// ──────────────────────────────────────────────
export function createLedgerRouter(prisma) {
  const router = Router();

  // ──────────────────────────────────────────
  // POST /api/kas — Input kas (trigger SHA-256 hash chain otomatis)
  // Body: { amount, description, recipient_id, actor_id, community_id? }
  // Spec: prisma.kasLedger.create({ data: { amount, description, recipient_id, actor_id } })
  // Trigger BEFORE INSERT akan isi hash_prev + hash_self — jangan kirim manual!
  // ──────────────────────────────────────────
  router.post('/api/kas', async (req, res) => {
    try {
      const { amount, description, recipient_id, recipientId, actor_id, actorId, community_id, communityId } = req.body;

      // Normalisasi key (support snake_case & camelCase)
      const recipient = recipient_id || recipientId;
      const actor = actor_id || actorId;
      const community = community_id || communityId || null;

      // Validasi
      if (amount === undefined || amount === null || isNaN(Number(amount))) {
        return res.status(400).json({ error: 'amount wajib angka' });
      }
      if (!description || String(description).trim() === '') {
        return res.status(400).json({ error: 'description wajib diisi' });
      }
      if (!recipient || String(recipient).trim() === '') {
        return res.status(400).json({ error: 'recipient_id wajib diisi' });
      }
      if (!actor || String(actor).trim() === '') {
        return res.status(400).json({ error: 'actor_id wajib diisi' });
      }

      const numericAmount = Number(amount);
      if (numericAmount <= 0) {
        return res.status(400).json({ error: 'amount harus > 0' });
      }

      // Insert — trigger secure_ledger_hash() akan isi hash_prev + hash_self
      // Jangan kirim hash_prev/hash_self manual, biarkan trigger yang hitung
      const created = await prisma.$queryRawUnsafe(
        `INSERT INTO financial_ledger (amount, description, recipient_id, actor_id, hash_prev, hash_self, community_id)
         VALUES ($1, $2, $3, $4, 'pending', 'pending', $5)
         RETURNING id, amount, description, recipient_id, actor_id, hash_prev, hash_self, timestamp, community_id;`,
        String(numericAmount),
        String(description).trim(),
        String(recipient).trim(),
        String(actor).trim(),
        community ? String(community) : null
      );

      // $queryRawUnsafe return array — ambil baris pertama
      const row = Array.isArray(created) ? created[0] : created;

      // Audit log (non-financial) — catat aksi create kas
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO audit_log (actor_id, action, entity, entity_id, new_data)
           VALUES ($1, 'create', 'kas', $2, $3);`,
          String(actor).trim(),
          String(row?.id || ''),
          JSON.stringify({ amount: numericAmount, description, recipient, actor })
        );
      } catch (_e) {
        // Audit log gagal tidak boleh blok transaksi kas — log saja
        console.warn('[ledger] Gagal tulis audit_log:', _e.message);
      }

      return res.status(201).json({
        success: true,
        data: row,
        message: 'Kas berhasil dicatat (hash chain SHA-256 otomatis)',
      });
    } catch (err) {
      console.error('[POST /api/kas] ERROR:', err);
      return res.status(500).json({ error: 'Gagal mencatat kas', detail: err.message });
    }
  });

  // ──────────────────────────────────────────
  // POST /api/donasi — Input donasi + distribusi ZIS opsional
  // Body: { amount, description, recipient_id, actor_id, asnaf? }
  // asnaf: array [{ category: 'fakir', percentage: 25 }, ...] — total harus 100%
  // ──────────────────────────────────────────
  router.post('/api/donasi', async (req, res) => {
    try {
      const { amount, description, recipient_id, recipientId, actor_id, actorId, asnaf, community_id, communityId } = req.body;

      const recipient = recipient_id || recipientId;
      const actor = actor_id || actorId;
      const community = community_id || communityId || null;

      if (amount === undefined || isNaN(Number(amount))) {
        return res.status(400).json({ error: 'amount wajib angka' });
      }
      if (!description || String(description).trim() === '') {
        return res.status(400).json({ error: 'description wajib diisi' });
      }
      if (!recipient) return res.status(400).json({ error: 'recipient_id wajib' });
      if (!actor) return res.status(400).json({ error: 'actor_id wajib' });

      const numericAmount = Number(amount);
      if (numericAmount <= 0) return res.status(400).json({ error: 'amount harus > 0' });

      // Validasi asnaf jika ada — total percentage harus 100
      if (asnaf && Array.isArray(asnaf) && asnaf.length > 0) {
        const totalPct = asnaf.reduce((s, a) => s + Number(a.percentage || 0), 0);
        if (Math.abs(totalPct - 100) > 0.01) {
          return res.status(400).json({ error: `Total percentage asnaf harus 100, got ${totalPct}` });
        }
        const validAsnaf = ['fakir', 'miskin', 'amil', 'mualaf', 'riqab', 'gharim', 'fisabilillah', 'ibnu_sabil'];
        for (const a of asnaf) {
          if (!validAsnaf.includes(a.category)) {
            return res.status(400).json({ error: `asnaf_category tidak valid: ${a.category}` });
          }
        }
      }

      // Insert ke financial_ledger (trigger hash chain)
      const inserted = await prisma.$queryRawUnsafe(
        `INSERT INTO financial_ledger (amount, description, recipient_id, actor_id, hash_prev, hash_self, community_id)
         VALUES ($1, $2, $3, $4, 'pending', 'pending', $5)
         RETURNING id, amount, description, recipient_id, actor_id, hash_prev, hash_self, timestamp;`,
        String(numericAmount),
        String(description).trim(),
        String(recipient).trim(),
        String(actor).trim(),
        community ? String(community) : null
      );
      const ledgerRow = Array.isArray(inserted) ? inserted[0] : inserted;
      const ledgerId = ledgerRow?.id;

      // Jika ada asnaf, insert ke zis_distribution
      let distributions = [];
      if (asnaf && Array.isArray(asnaf) && asnaf.length > 0 && ledgerId) {
        for (const a of asnaf) {
          const pct = Number(a.percentage);
          const allocated = (numericAmount * pct) / 100;
          const dist = await prisma.$queryRawUnsafe(
            `INSERT INTO zis_distribution (zis_collection_id, asnaf_category, percentage, allocated_amount)
             VALUES ($1, $2, $3, $4)
             RETURNING id, zis_collection_id, asnaf_category, percentage, allocated_amount, distributed_status;`,
            String(ledgerId),
            a.category,
            String(pct),
            String(allocated)
          );
          const dRow = Array.isArray(dist) ? dist[0] : dist;
          distributions.push(dRow);
        }
      }

      return res.status(201).json({
        success: true,
        data: { ledger: ledgerRow, distributions },
        message: 'Donasi berhasil dicatat' + (distributions.length ? ` + ${distributions.length} distribusi ZIS` : ''),
      });
    } catch (err) {
      console.error('[POST /api/donasi] ERROR:', err);
      return res.status(500).json({ error: 'Gagal mencatat donasi', detail: err.message });
    }
  });

  // ──────────────────────────────────────────
  // GET /api/ledger/verify — Verifikasi hash chain SHA-256
  // Spec: loop SELECT * ORDER BY id, hitung digest, bandingkan hash_self
  // Response: { valid: boolean, brokenAt: number|null, total: number, checked: number }
  // ──────────────────────────────────────────
  router.get('/api/ledger/verify', async (_req, res) => {
    try {
      const rows = await prisma.$queryRawUnsafe(`
        SELECT id, amount, description, recipient_id, actor_id, hash_prev, hash_self
        FROM financial_ledger
        ORDER BY id ASC;
      `);

      const total = rows.length;

      if (total === 0) {
        return res.json({ valid: true, brokenAt: null, total: 0, checked: 0, message: 'Ledger kosong' });
      }

      const GENESIS = '0000000000000000000000000000000000000000000000000000000000000000';
      let prevHash = GENESIS;
      let brokenAt = null;
      let checked = 0;

      for (const row of rows) {
        const id = String(row.id);
        const amount = String(row.amount);
        const description = String(row.description);
        const recipientId = String(row.recipient_id);
        const actorId = String(row.actor_id);
        const hashPrevDb = String(row.hash_prev);
        const hashSelfDb = String(row.hash_self);

        // Cek hash_prev chain
        if (hashPrevDb !== prevHash) {
          if (brokenAt === null) brokenAt = Number(id);
        }

        // Hitung ulang hash_self
        const raw = `${amount}|${description}|${recipientId}|${actorId}|${hashPrevDb}`;
        const expectedSelf = sha256Hex(raw);

        if (expectedSelf !== hashSelfDb) {
          if (brokenAt === null) brokenAt = Number(id);
        }

        prevHash = hashSelfDb;
        checked++;
      }

      const valid = brokenAt === null;
      return res.json({
        valid,
        brokenAt,
        total,
        checked,
        message: valid ? `Valid — ${total} baris hash chain utuh` : `Broken di id=${brokenAt}`,
      });
    } catch (err) {
      console.error('[GET /api/ledger/verify] ERROR:', err);
      return res.status(500).json({ error: 'Gagal verifikasi ledger', detail: err.message });
    }
  });

  // ──────────────────────────────────────────
  // GET /api/kas — Laporan kas (daftar + pagination sederhana)
  // Query: ?community_id=xxx&limit=20&offset=0
  // ──────────────────────────────────────────
  router.get('/api/kas', async (req, res) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit), 10) || 20, 100);
      const offset = parseInt(String(req.query.offset), 10) || 0;
      const communityId = (req.query.community_id as string) || (req.query.communityId as string) || null;

      let rows;
      let totalRows;

      if (communityId) {
        rows = await prisma.$queryRawUnsafe(
          `SELECT id, amount, description, recipient_id, actor_id, hash_prev, hash_self, timestamp, community_id
           FROM financial_ledger
           WHERE community_id = $1
           ORDER BY timestamp DESC
           LIMIT $2 OFFSET $3;`,
          String(communityId),
          limit,
          offset
        );
        const cnt = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*)::int as cnt FROM financial_ledger WHERE community_id = $1;`,
          String(communityId)
        );
        totalRows = cnt[0]?.cnt ?? rows.length;
      } else {
        rows = await prisma.$queryRawUnsafe(
          `SELECT id, amount, description, recipient_id, actor_id, hash_prev, hash_self, timestamp, community_id
           FROM financial_ledger
           ORDER BY timestamp DESC
           LIMIT $1 OFFSET $2;`,
          limit,
          offset
        );
        const cnt = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as cnt FROM financial_ledger;`);
        totalRows = cnt[0]?.cnt ?? rows.length;
      }

      return res.json({
        data: rows,
        pagination: { limit, offset, total: totalRows },
      });
    } catch (err) {
      console.error('[GET /api/kas] ERROR:', err);
      return res.status(500).json({ error: 'Gagal ambil kas', detail: err.message });
    }
  });

  return router;
}

export default createLedgerRouter;
