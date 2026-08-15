// umkm-service/src/index-proper.ts — Branch 02 PROPER (log JSON, requestId, latency)
// Bahasa komentar: Indonesia
// Catatan: query masih LIKE Seq Scan & N+1 di 02 — optimasi pg_trgm + JOIN di branch 03

import express from 'express';
import logger from './logger.js';
import { requestIdMiddleware, type RequestWithId } from './middleware/requestId.js';

const app = express();
const PORT = Number(process.env.PORT || 3003);

app.use(express.json());
app.use(requestIdMiddleware as any);
app.use((req: RequestWithId, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    req.log.info({ latency_ms: Date.now() - start, status: res.statusCode, method: req.method, path: req.path }, 'request completed');
  });
  next();
});

const MOCK_UMKM = Array.from({ length: 100 }, (_, i) => ({
  id: `umkm_${i + 1}`,
  dataId: `data_${i + 1}`,
  name: ['Warung Makan Sederhana', 'Kuliner Bintaro', 'Lapak Ayam Geprek', 'Toko Kelontong Berkah', 'Warung Kopi Kenangan'][i % 5] + ' ' + (i + 1),
  kelurahan: ['Bintaro', 'Petukangan Utara', 'Petukangan Selatan', 'Ulujami', 'Pesanggrahan'][i % 5],
  category0: ['KULINER', 'LAPAK', 'AYAM', 'WARUNG MAKAN', 'TOKO'][i % 5],
  alamat: 'Jl. Contoh No. ' + (i + 1) + ' Pesanggrahan',
  telepon: '0812' + String(10000000 + i),
}));

app.get('/health', (req: RequestWithId, res) => {
  req.log.debug('health check');
  res.json({ status: 'ok', service: 'umkm-service', branch: '02-proper-logging' });
});

app.get('/api/cari', (req: RequestWithId, res) => {
  const q = String(req.query.q || '').trim();
  req.log.info({ q }, 'cari requested');
  if (!q) return res.json({ data: MOCK_UMKM.slice(0, 20), total: MOCK_UMKM.length });
  const lower = q.toLowerCase();
  const filtered = MOCK_UMKM.filter((u) => u.name.toLowerCase().includes(lower) || u.alamat.toLowerCase().includes(lower));
  req.log.info({ q, resultCount: filtered.length }, 'cari result');
  res.json({ data: filtered.slice(0, 20), total: filtered.length, q, note: '02 proper log, Seq Scan tetap — pg_trgm di 03' });
});

app.get('/api/umkm/:id', async (req: RequestWithId, res) => {
  const id = req.params.id;
  req.log.info({ umkmId: id }, 'get umkm');
  const found = MOCK_UMKM.find((u) => u.id === id);
  if (!found) {
    req.log.warn({ umkmId: id }, 'umkm not found');
    return res.status(404).json({ error: 'UMKM tidak ditemukan' });
  }
  const relations = ['ulasan', 'produk', 'komunitas'];
  const extra: Record<string, unknown> = {};
  for (const rel of relations) {
    req.log.debug({ umkmId: id, relation: rel }, 'N+1 query (akan dioptimasi di 03)');
    await new Promise((r) => setTimeout(r, 5));
    extra[rel] = [{ id: rel + '_1', umkmId: id }];
  }
  res.json({ ...found, ...extra });
});

app.get('/api/umkm', (req: RequestWithId, res) => {
  const page = parseInt(String(req.query.page || '1'), 10);
  const limit = Math.min(parseInt(String(req.query.limit || '20'), 10), 100);
  const offset = (page - 1) * limit;
  req.log.info({ page, limit, offset }, 'list umkm');
  res.json({ data: MOCK_UMKM.slice(offset, offset + limit), pagination: { page, limit, offset, total: MOCK_UMKM.length } });
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'umkm-service 02 proper listening');
});
