// umkm-service/src/index.ts — Branch 01 ANTI-PATTERN
// Bahasa komentar: Indonesia
// Jebakan: LIKE '%keyword%' tanpa pg_trgm (Seq Scan), N+1 query di GET /api/umkm/:id, console.log tanpa level

import express from 'express';

const app = express();
const PORT = Number(process.env.PORT || 3003);

app.use(express.json());

// Simulasi data UMKM in-memory (ganti DB query di branch 03)
const MOCK_UMKM = Array.from({ length: 100 }, (_, i) => ({
  id: `umkm_${i + 1}`,
  dataId: `data_${i + 1}`,
  name: ['Warung Makan Sederhana', 'Kuliner Bintaro', 'Lapak Ayam Geprek', 'Toko Kelontong Berkah', 'Warung Kopi Kenangan'][i % 5] + ' ' + (i + 1),
  kelurahan: ['Bintaro', 'Petukangan Utara', 'Petukangan Selatan', 'Ulujami', 'Pesanggrahan'][i % 5],
  category0: ['KULINER', 'LAPAK', 'AYAM', 'WARUNG MAKAN', 'TOKO'][i % 5],
  alamat: 'Jl. Contoh No. ' + (i + 1) + ' Pesanggrahan',
  telepon: '0812' + String(10000000 + i),
}));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'umkm-service', branch: '01-console-log' });
});

// GET /api/cari?q=keyword — ANTI-PATTERN: LIKE '%keyword%' tanpa index GIN
// Di Postgres: SELECT * FROM umkm WHERE name LIKE '%ayam%' — Seq Scan 6.081 baris tiap request
// P99 bohong: p50 kecil saat data sedikit, meledak saat 6k+ baris
app.get('/api/cari', (req, res) => {
  const q = String(req.query.q || req.query.keyword || '').trim();
  console.log('cari q=' + q + ' ip=' + req.ip);
  console.log('query: SELECT * FROM umkm WHERE name LIKE \'%' + q + '%\' OR alamat LIKE \'%' + q + '%\'');

  if (!q) {
    console.log('cari tanpa keyword, return all');
    return res.json({ data: MOCK_UMKM.slice(0, 20), total: MOCK_UMKM.length, note: 'ANTI-PATTERN: LIKE %keyword% Seq Scan' });
  }

  // Simulasi LIKE '%keyword%' — scan semua baris (O(n))
  const lower = q.toLowerCase();
  const filtered = MOCK_UMKM.filter((u) => u.name.toLowerCase().includes(lower) || u.alamat.toLowerCase().includes(lower));

  console.log('cari result count=' + filtered.length + ' for q=' + q);
  res.json({ data: filtered.slice(0, 20), total: filtered.length, q, note: 'Seq Scan tanpa pg_trgm GIN' });
});

// GET /api/umkm/:id — ANTI-PATTERN: N+1 query
// Contoh N+1: 1 query ambil UMKM, lalu loop N query ambil tiap relasi (mis. komunitas, ulasan)
app.get('/api/umkm/:id', async (req, res) => {
  const id = req.params.id;
  console.log('get umkm id=' + id);
  console.log('query: SELECT * FROM umkm WHERE id=' + id);

  const found = MOCK_UMKM.find((u) => u.id === id);
  if (!found) {
    console.log('umkm not found id=' + id);
    return res.status(404).json({ error: 'UMKM tidak ditemukan' });
  }

  // ANTI-PATTERN N+1: simulasi query tambahan per relasi di loop
  // Di produksi: for (const rel of relations) { await prisma.relation.findMany({ where: { umkmId: id } }) }
  console.log('N+1 query start for umkm ' + id);
  const relations = ['ulasan', 'produk', 'komunitas'];
  const extra: Record<string, unknown> = {};
  for (const rel of relations) {
    console.log('query: SELECT * FROM ' + rel + ' WHERE umkm_id=' + id + ' (N+1 ke-' + (relations.indexOf(rel) + 1) + ')');
    // Simulasi delay per query N+1
    await new Promise((r) => setTimeout(r, 5));
    extra[rel] = [{ id: rel + '_1', umkmId: id, note: 'N+1 query anti-pattern' }];
  }
  console.log('N+1 done for umkm ' + id + ' extra keys=' + Object.keys(extra).join(','));

  res.json({ ...found, ...extra, note: 'N+1: 1 + 3 query, seharusnya JOIN atau IN (...)' });
});

// GET /api/umkm — list dengan pagination OFFSET (lambat di halaman dalam)
app.get('/api/umkm', (req, res) => {
  const page = parseInt(String(req.query.page || '1'), 10);
  const limit = Math.min(parseInt(String(req.query.limit || '20'), 10), 100);
  const offset = (page - 1) * limit;
  console.log('list umkm page=' + page + ' limit=' + limit + ' offset=' + offset);
  console.log('query: SELECT * FROM umkm LIMIT ' + limit + ' OFFSET ' + offset + ' (OFFSET lambat di page dalam)');

  const data = MOCK_UMKM.slice(offset, offset + limit);
  res.json({ data, pagination: { page, limit, offset, total: MOCK_UMKM.length } });
});

app.listen(PORT, () => {
  console.log('umkm-service 01 listening on port ' + PORT);
});
