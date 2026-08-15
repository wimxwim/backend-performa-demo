# 03c — Proteksi & Scaling (5 Proteksi + Threshold + Replica/Sharding/HA/DR)

> **Branch 03c-proteksi-scaling** — ketahanan saat overload. Sumber: Studi Kasus Shopee Bab 4.2 (6 proteksi), Modul Performa Bab 8 (threshold & scaling), Poster #6 (10 metrik).

---

## 5 Proteksi (Shopee Bab 4.2 → Gotong Royong)

| # | Proteksi | Masalah yang Dicegah | Implementasi Demo | File | Threshold |
|---|----------|----------------------|-------------------|------|-----------|
| 1 | **Rate Limiting (Token Bucket + Leaky Bucket)** | Burst traffic, DDoS, abuse | `express-rate-limit` + `TokenBucket` (burst 20) + `LeakyBucket` queue Kafka 50 | `shared/rateLimiter.ts` | umum 100/menit, berat 10/menit, auth 5/menit, `429 Retry-After: 60` |
| 2 | **Circuit Breaker** | Cascade failure — 1 service down menular | `closed -> open` jika error >50% dalam 10s window, `half-open` setelah 30s, fallback `503` + `circuit_state` metric | `shared/circuitBreaker.ts` | threshold 5 failures, window 10s, halfOpenAfter 30s, failureRate 50% |
| 3 | **Bulkhead** | 1 endpoint lambat habiskan semua thread | Pool isolation: order 20, payment 10, umkm 15, kas 15, queue max 50, reject `503` jika penuh | `shared/bulkhead.ts` | pool per service, `bulkhead_active` + `bulkhead_queue` + `bulkhead_rejected_total` |
| 4 | **Backpressure** | OOM karena produsen lebih cepat dari konsumen | Kafka consumer lag >1000 → `503 + Retry-After: 10`, graceful queue drain | `shared/backpressure.ts` | lag 1000, `kafka_consumer_lag` gauge, `backpressure_rejected_total` |
| 5 | **Graceful Degradation** | Total down saat overload | Feature flag non-critical OFF saat overload: `recommendations`, `analytics`, `promo_banner` OFF; `checkout`, `health` tetap ON | `order-service/src/index-03c.ts` | `graceful_degradation_active` gauge, header `x-degradation: true` |

> Shopee Bab 4.2 sebut 6 proteksi (tambah **Timeout**). Demo ini 5 proteksi inti + timeout via `AbortSignal.timeout(3000)` di `index-03c.ts`.

### Cara Kerja Tiap Proteksi

#### 1. Token Bucket vs Leaky Bucket

```
Token Bucket (burst-friendly):          Leaky Bucket (smooth):
  capacity 120 (100+20 burst)             capacity 50 queue
  refill 100/60s = 1.67 token/detik       leak 10/detik
  req -> tryConsume(1) ? pass : 429       req -> tryAdd() ? queue : 503
```

- Token Bucket untuk **ingress** (client → API) — boleh burst 20 di atas steady 100/menit.
- Leaky Bucket untuk **egress** (API → Kafka) — ratakan ke 10 req/detik, antri max 50.

```ts
// shared/rateLimiter.ts
export const limiterGeneral = rateLimit({
  windowMs: 60*1000, max: 100,
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req,res) => res.status(429).json({ error:'Too Many Requests', retryAfter:60 })
});
```

#### 2. Circuit Breaker State Machine

```
         failures >=5 atau error>50% dalam 10s
  CLOSED ───────────────────────────────────► OPEN ──── 30s ───► HALF-OPEN
    ▲                                         │                   │ │
    │  success                                │  fail fast 503    │ success → CLOSED
    └─────────────────────────────────────────┴───────────────────┘ fail → OPEN
```

```ts
// shared/circuitBreaker.ts
class CircuitBreaker {
  state: 'closed'|'open'|'half-open'; failures=0; threshold=5; windowMs=10000; halfOpenAfter=30000;
  async call(fn){
    if(state==='open' && Date.now()-openedAt<halfOpenAfter) throw 503;
    try{ await fn(); reset() } catch(e){ failures++; if(failures>=threshold) open(); throw e }
  }
}
```

Metric `circuit_state` (0 closed, 1 open, 2 half-open) untuk alert `CircuitOpen >5m`.

#### 3. Bulkhead

```
Tanpa bulkhead: 1 slow endpoint habiskan 100 thread → semua endpoint down
Dengan bulkhead: order 20 | payment 10 | umkm 15 — sekat kapal, 1 bocor tidak tenggelam
```

Queue max 50, reject jika penuh → `503 bulkhead penuh`. Metric `bulkhead_active`, `bulkhead_queue`, `bulkhead_rejected_total`.

#### 4. Backpressure

```
Produsen (order) ──► Kafka queue ──► Konsumen (payment)
                      lag 1200 >1000 → 503 Retry-After:10
                      produsen melambat, konsumen kejar
```

`kafka_consumer_lag` gauge di-update consumer tiap 5s. Middleware tolak request baru jika `lag >1000` atau `draining=true`. Graceful drain tunggu queue habis sebelum shutdown.

#### 5. Graceful Degradation

```
Normal:   checkout ✅  rekomendasi ✅  analytics ✅  promo ✅
Overload: checkout ✅  rekomendasi ❌  analytics ❌  promo ❌  (header x-degradation: true)
```

Trigger overload: `circuit open` ATAU `bulkhead queued >=40` ATAU `backpressure lag>1000`. Non-critical dimatikan via feature flag in-memory (tidak query DB).

---

## Threshold Kuantitatif (Shopee → GR)

| Metrik | Threshold Shopee | Threshold GR (Konservatif) | Tindakan Saat Tercapai | Monitor |
|--------|-----------------|---------------------------|------------------------|---------|
| **Data size** | >1 TB | **>500 GB** | Sharding / read replica / TiDB | `pg_database_size()`, Grafana disk |
| **Single table rows** | >10M | **>5M** | Partitioning, archiving, MatView | `pg_class.reltuples` |
| **Write QPS** | >1000/detik | **>500/detik** | Pisah write/read, Kafka queue, batch | `pg_stat_database`, Prometheus |
| **P99 cache** | >1ms → Redis | **>5ms → Redis** | Wajib cache hot data | Redis INFO, histogram |
| **Monitor alert** | — | **80% threshold** | Alert otomatis, jangan tunggu 100% | Prometheus alert rule |

> Detail di `docs/threshold-scaling.md` — decision tree kapan vertical vs horizontal.

---

## Vertical vs Horizontal Scaling

| Aspek | Vertical (Scale Up) | Horizontal (Scale Out) |
|-------|---------------------|------------------------|
| Cara | Tambah RAM/CPU 1 server (2→8 vCPU, 4→32 GB) | Tambah server 1→5→20 + load balancer |
| Cocok untuk | MVP–Fase 2, <1000 req/s, <500 GB | Fase 3+, >1000 req/s, >500 GB |
| Biaya | Linear, murah awal | Butuh LB + replica, mahal tapi elastis |
| Batas | Max 1 mesin (64 vCPU/256 GB) | Hampir tak terbatas (auto-scale) |
| Downtime | Butuh restart saat upgrade | Rolling update, zero downtime |
| Demo | `POSTGRES shared_buffers 256MB → 1GB` | `docker compose up --scale order-service=3` + nginx LB |

**Keputusan**: MVP–Fase 2 vertical cukup. Fase 3 horizontal wajib (lihat `threshold-scaling.md`).

---

## Read Replica

```
            ┌─────────────┐
            │  Primary    │  write (INSERT/UPDATE) + WAL
            │  postgres:5432
            └──────┬──────┘
                   │ streaming replication (WAL)
          ┌────────┴────────┐
          │  Replica 1      │  read (SELECT) — laporan, cari, feed
          │  postgres:5433  │
          └─────────────────┘
          │  Replica 2      │  read — analytics, backup
```

- **Kapan**: read QPS >70% total, write <30%. Replica kurangi beban primary 50-70%.
- **Lag**: monitor `pg_stat_replication` — alert jika lag >1s.
- **Demo**: `DATABASE_URL` write ke `postgres:5432`, `REPLICA_URL` read ke `postgres:5433` (konfigur via `shared/db.ts` jika ada).

---

## Sharding — Hash vs Range

| Strategi | Cara | Kelebihan | Kelemahan | Cocok untuk |
|----------|------|-----------|-----------|-------------|
| **Hash** | `shard = hash(community_id) % N` | Distribusi merata, no hotspot | Cross-shard query mahal, reshard sulit | `financial_ledger` per komunitas |
| **Range** | `shard 1: 2024-Q1, shard 2: 2024-Q2` | Range scan cepat, archiving mudah | Hotspot jika 1 range ramai | `audit_log` per waktu |

```
Hash sharding (GR):
  community_id hash → shard 0/1/2/3 → 4 Postgres
  query: SELECT * FROM ledger WHERE community_id='xxx' → 1 shard saja

Range sharding:
  timestamp 2024-01 → shard 0, 2024-02 → shard 1
  query: SELECT * FROM ledger WHERE timestamp BETWEEN '2024-01' AND '2024-02' → 2 shard
```

**Threshold**: >1 TB atau >10M rows per tabel → evaluasi sharding (atau TiDB/CockroachDB).

---

## HA / DR — RTO <15m, RPO <1m

| Komponen | HA (High Availability) | DR (Disaster Recovery) |
|----------|------------------------|------------------------|
| **Postgres** | Streaming replica + Patroni auto-failover (RTO 30s) | WAL archive ke S3 + PITR (RPO 1m) |
| **Redis** | Sentinel / Cluster 3 node | AOF + RDB snapshot tiap 60s ke S3 |
| **App** | 3 replica + LB health check `/health` | Image di registry, `compose up` di region lain |
| **Kafka** | 3 broker, replication factor 3 | MirrorMaker ke cluster DR |

```
RTO (Recovery Time Objective): <15 menit — dari down sampai up lagi
RPO (Recovery Point Objective): <1 menit — data hilang maksimal 1 menit terakhir
```

**Verifikasi DR**:
```bash
# Backup WAL
pg_basebackup -h primary -D /backup -Ft -z -P
# Restore PITR
pg_restore --target-time="2024-01-15 10:00:00"
```

---

## Diagram Arsitektur 03c

```
                    ┌─────────────────────────────────────────────────┐
                    │              API Gateway / Nginx                │
                    │  rate limit 100/menit + burst 20 (Token Bucket) │
                    └──────────────────────┬──────────────────────────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
     ┌────────▼────────┐          ┌────────▼────────┐          ┌────────▼────────┐
     │ order-service   │          │ payment-service │          │ umkm-service    │
     │  :3001          │  circuit │  :3002          │          │  :3003          │
     │  bulkhead 20    │◄────────►│  bulkhead 10    │          │  bulkhead 15    │
     │  backpressure   │  breaker │                 │          │  cache Redis    │
     │  degradation    │  50%/10s │                 │          │  GIN + MatView  │
     └────────┬────────┘          └────────┬────────┘          └────────┬────────┘
              │  Leaky Bucket 10/detik     │                            │
              └────────────┬───────────────┘                            │
                           │ Kafka queue max 50                         │
                  ┌────────▼────────┐                                   │
                  │ Kafka :9092     │                                   │
                  │ lag >1000 → 503 │                                   │
                  └────────┬────────┘                                   │
                           │ Debezium CDC                               │
              ┌────────────┼────────────────┐                            │
              │            │                │                            │
     ┌────────▼─────┐ ┌────▼─────┐  ┌──────▼──────┐            ┌────────▼────────┐
     │ Postgres     │ │ Redis    │  │ PgBouncer   │            │ Elasticsearch   │
     │ :5432 primary│ │ :6379    │  │ :6432 pool25│            │ :9200           │
     │ replica :5433│ │          │  │             │            │ ClickHouse :8123│
     └──────────────┘ └──────────┘  └─────────────┘            └─────────────────┘
                           │
              ┌────────────┼────────────────┐
              │ Observabilitas (04)         │
              │ Prometheus 9090, Grafana 3000, Loki 3100, OTEL 4317, Jaeger 16686
              └─────────────────────────────┘
```

---

## Cara Verifikasi

```bash
# Jalankan 03c
DATABASE_URL=postgres://demo:demo123@localhost:6432/gotongroyong_demo \
REDIS_URL=redis://localhost:6379 \
PAYMENT_URL=http://localhost:3002/charge \
  bun run --cwd order-service src/index-03c.ts

# 1. Rate limit — 101 request/menit -> 429
for i in $(seq 1 110); do curl -s http://localhost:3001/api/komunitas/xxx -H "x-forwarded-for: 1.2.3.4" | head; done

# 2. Circuit breaker — matikan payment, lihat circuit OPEN
curl http://localhost:3001/health | jq .circuit
# { state: "open", failures: 5 } -> checkout -> 503 circuit OPEN

# 3. Bulkhead — burst 30 concurrent -> sebagian 503 bulkhead penuh
seq 1 30 | xargs -P30 -I{} curl -s http://localhost:3001/api/komunitas/xxx | grep -c "bulkhead"

# 4. Backpressure — set lag >1000 (via API atau langsung)
curl http://localhost:3001/health | jq .backpressure

# 5. Degradation — saat overload, /api/rekomendasi -> []
curl http://localhost:3001/api/rekomendasi | jq .degraded

# 6. Threshold — cek docs/threshold-scaling.md
cat docs/threshold-scaling.md
```

---

## File Terkait

- `shared/rateLimiter.ts` — TokenBucket + LeakyBucket + limiterGeneral/Heavy/Auth
- `shared/circuitBreaker.ts` — CircuitBreaker + circuit_state gauge
- `shared/bulkhead.ts` — Bulkhead pool 20/10/15 + queue 50
- `shared/backpressure.ts` — Backpressure lag 1000 + 503 Retry-After
- `order-service/src/index-03c.ts` — Express + 5 proteksi + degradation + /health + /metrics
- `docs/threshold-scaling.md` — decision tree 80% alert
- `observability/prometheus.yml` — scrape + alert
- `observability/alerts.yml` — threshold Bab 8.4
