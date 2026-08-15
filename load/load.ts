// load/load.ts — k6-style load test (Bun/Node, tanpa k6 binary)
// Bahasa komentar: Indonesia
// Fitur: TARGET=http://localhost:8080, 100 VUs, hit /api/cari, /api/kas, /api/komunitas, hitung p50/p95/p99/p99.9, error rate

const TARGET = process.env.TARGET || 'http://localhost:3003';
const VUS = Number(process.env.VUS || 100);
const DURATION_S = Number(process.env.DURATION || 30);
const REQUESTS_PER_VU = Number(process.env.REQUESTS_PER_VU || 20);

// Endpoint yang di-hit (sesuai spec 16 endpoint SLA)
const ENDPOINTS = [
  { method: 'GET', path: '/api/cari?q=ayam', name: 'cari' },
  { method: 'GET', path: '/api/kas?limit=20', name: 'kas' },
  { method: 'GET', path: '/api/komunitas/demo', name: 'komunitas' },
  { method: 'GET', path: '/api/umkm?page=1&limit=20', name: 'umkm-list' },
  { method: 'GET', path: '/health', name: 'health' },
];

type Result = { latencyMs: number; ok: boolean; status: number; endpoint: string };

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil(p * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

function printTable(latencies: number[], results: Result[]) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const total = results.length;
  const errors = results.filter((r) => !r.ok).length;
  const errorRate = total ? (errors / total) * 100 : 0;
  const avg = total ? latencies.reduce((a, b) => a + b, 0) / total : 0;
  const min = sorted[0] ?? 0;
  const max = sorted[sorted.length - 1] ?? 0;

  // Hitung percentile exact sesuai spec
  const p50 = percentile(sorted, 0.5);
  const p95 = percentile(sorted, 0.95);
  const p99 = percentile(sorted, 0.99);
  const p999 = percentile(sorted, 0.999);

  console.log('');
  console.log('========================================');
  console.log('  Load Test Result — Gotong Royong Demo');
  console.log('========================================');
  console.log(`  TARGET        : ${TARGET}`);
  console.log(`  VUs           : ${VUS}`);
  console.log(`  Requests/VU   : ${REQUESTS_PER_VU}`);
  console.log(`  Total requests: ${total}`);
  console.log(`  Duration      : ${DURATION_S}s (simulated)`);
  console.log('----------------------------------------');
  console.log(`  min           : ${min.toFixed(2)} ms`);
  console.log(`  avg           : ${avg.toFixed(2)} ms`);
  console.log(`  p50           : ${p50.toFixed(2)} ms`);
  console.log(`  p95           : ${p95.toFixed(2)} ms`);
  console.log(`  p99           : ${p99.toFixed(2)} ms`);
  console.log(`  p99.9         : ${p999.toFixed(2)} ms`);
  console.log(`  max           : ${max.toFixed(2)} ms`);
  console.log('----------------------------------------');
  console.log(`  error rate    : ${errorRate.toFixed(2)}% (${errors}/${total})`);
  console.log('----------------------------------------');

  // Per-endpoint breakdown
  const byEndpoint: Record<string, number[]> = {};
  const byEndpointErrors: Record<string, number> = {};
  for (const r of results) {
    if (!byEndpoint[r.endpoint]) byEndpoint[r.endpoint] = [];
    byEndpoint[r.endpoint].push(r.latencyMs);
    if (!r.ok) byEndpointErrors[r.endpoint] = (byEndpointErrors[r.endpoint] || 0) + 1;
  }
  console.log('  Per-endpoint:');
  for (const ep of Object.keys(byEndpoint)) {
    const arr = byEndpoint[ep].sort((a, b) => a - b);
    const epP50 = percentile(arr, 0.5);
    const epP95 = percentile(arr, 0.95);
    const epP99 = percentile(arr, 0.99);
    const epErr = byEndpointErrors[ep] || 0;
    console.log(`    ${ep.padEnd(16)} count=${String(arr.length).padStart(4)} p50=${epP50.toFixed(1).padStart(7)} p95=${epP95.toFixed(1).padStart(7)} p99=${epP99.toFixed(1).padStart(7)} err=${epErr}`);
  }
  console.log('========================================');

  // SLA check sesuai spec 16 endpoint
  console.log('  SLA check (spec Bab 10.1):');
  console.log(`    p50 < 50ms (read)  : ${p50 < 50 ? 'PASS' : 'FAIL'} (${p50.toFixed(1)}ms)`);
  console.log(`    p95 < 200ms        : ${p95 < 200 ? 'PASS' : 'FAIL'} (${p95.toFixed(1)}ms)`);
  console.log(`    p99 < 500ms        : ${p99 < 500 ? 'PASS' : 'FAIL'} (${p99.toFixed(1)}ms)`);
  console.log(`    error < 0.1%       : ${errorRate < 0.1 ? 'PASS' : 'FAIL'} (${errorRate.toFixed(2)}%)`);
  console.log('========================================');
  console.log('');
}

async function hitOne(endpoint: (typeof ENDPOINTS)[number]): Promise<Result> {
  const url = TARGET.replace(/\/$/, '') + endpoint.path;
  const start = Date.now();
  try {
    const resp = await fetch(url, { method: endpoint.method });
    const latencyMs = Date.now() - start;
    return { latencyMs, ok: resp.ok, status: resp.status, endpoint: endpoint.name };
  } catch {
    const latencyMs = Date.now() - start;
    return { latencyMs, ok: false, status: 0, endpoint: endpoint.name };
  }
}

async function runVU(vuId: number): Promise<Result[]> {
  const out: Result[] = [];
  for (let i = 0; i < REQUESTS_PER_VU; i++) {
    // Tiap iterasi hit beberapa endpoint paralel — simulasi burst
    const batch = ENDPOINTS.map((ep) => hitOne(ep));
    const results = await Promise.all(batch);
    out.push(...results);

    // Jeda kecil antar iterasi (jangan spam tanpa jeda)
    if (i < REQUESTS_PER_VU - 1) {
      await new Promise((r) => setTimeout(r, 10));
    }
  }
  if (vuId % 20 === 0) console.log(`  VU ${vuId} done (${out.length} reqs)`);
  return out;
}

async function main() {
  console.log(`[load] TARGET=${TARGET} VUS=${VUS} REQUESTS_PER_VU=${REQUESTS_PER_VU} ENDPOINTS=${ENDPOINTS.map((e) => e.path).join(', ')}`);
  console.log(`[load] Total requests estimasi: ${VUS * REQUESTS_PER_VU * ENDPOINTS.length}`);
  console.log(`[load] Mulai load test...`);

  const startAll = Date.now();

  // Jalankan VUs paralel — Promise.all per batch agar tidak OOM
  const BATCH = 20;
  const allResults: Result[] = [];
  for (let b = 0; b < VUS; b += BATCH) {
    const batchVUs = Math.min(BATCH, VUS - b);
    const promises: Promise<Result[]>[] = [];
    for (let v = 0; v < batchVUs; v++) {
      promises.push(runVU(b + v));
    }
    const batchResults = await Promise.all(promises);
    for (const r of batchResults) allResults.push(...r);
    console.log(`[load] Batch ${Math.floor(b / BATCH) + 1}/${Math.ceil(VUS / BATCH)} done, total so far: ${allResults.length}`);
  }

  const totalMs = Date.now() - startAll;
  console.log(`[load] Selesai dalam ${totalMs}ms, total results: ${allResults.length}`);

  const latencies = allResults.map((r) => r.latencyMs);
  printTable(latencies, allResults);
}

main().catch((e) => {
  console.error('[load] fatal:', e);
  process.exit(1);
});
