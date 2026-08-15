# 04 — Observabilitas (3 Pilar: Metrics / Logs / Traces)

> **Branch 04-observability** — melihat apa yang terjadi di dalam sistem. Sumber: Modul Performa Bab 8 (observabilitas), Poster #6 (10 metrik), PZN logging 4 tahap (Alloy → Loki → Grafana, OTEL → Jaeger).

---

## 3 Pilar Observabilitas

| Pilar | Stack Demo | Port | Fungsi | Data |
|-------|-----------|------|--------|------|
| **Metrics** | **Prometheus** (9090) + **Grafana** (3000) + `prom-client` | 9090, 3000 | Angka: RPS, latency histogram, CPU/memory, DB pool, cache hit rate | `prometheus.yml` 11 scrape jobs, interval 15s |
| **Logs** | **Grafana Alloy** (12345) → **Loki** (3100) → Grafana | 3100, 12345 | Teks terstruktur: Pino JSON + requestId + latency_ms | `alloy/config.alloy` + `loki/loki.yml` |
| **Traces** | **OTEL Collector** (4317 gRPC / 4318 HTTP) → **Jaeger** (16686) | 4317, 4318, 16686 | Jejak request lintas service: order → payment → DB/Redis | `otel-collector/config.yaml` + `shared/tracing.ts` |
| **DB** | `pg_stat_statements` + slow log | — | Query lambat, N+1, Seq Scan | `scripts/explain-demo.sql` |

> Ketiga pilar saling melengkapi: **metrics** kasih tahu *apa* yang lambat, **logs** kasih tahu *kenapa*, **traces** kasih tahu *di mana* bottleneck.

---

## Metrics — Prometheus + Grafana (10 Metrik Poster #6)

### 10 Metrik Wajib

| # | Metrik | PromQL | Target | Panel Grafana |
|---|--------|--------|--------|---------------|
| 1 | **Response Time** | `histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))` | p50 <50ms read | Panel 1 |
| 2 | **P95 / P99** | `histogram_quantile(0.95, ...)` / `0.99` | p95 <200ms, p99 <500ms | Panel 1 (3 garis) |
| 3 | **Throughput (RPS)** | `sum(rate(http_requests_total[5m]))` | MVP 100 → Fase 5 200k+ | Panel 2 |
| 4 | **Latency (TTFB)** | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` | TTFB <200ms | Panel 3 |
| 5 | **Error Rate** | `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))` | <0.1% | Panel 4 |
| 6 | **Availability** | `avg_over_time(up[5m]) *100` | 99.5% MVP → 99.9% Fase 3+ | Panel 5 (stat) |
| 7 | **CPU Usage** | `100 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m]))*100` | <70% avg, alert 80% | Panel 6 |
| 8 | **Memory Usage** | `(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)*100` | <70% avg, alert 80% | Panel 7 |
| 9 | **DB Query Time** | `histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m]))` | <50ms p95 | Panel 8 |
| 10 | **Cache Hit Rate** | `sum(rate(cache_hit_total{hit="true"}[5m])) / sum(rate(cache_hit_total[5m]))*100` | >80% | Panel 9 |

### Cara Buka Grafana

```bash
# Jalankan observability
podman-compose -f compose.yaml -f compose.observability.yaml --profile observability up -d

# Buka Grafana
open http://localhost:3000  # admin / admin
# Dashboard: Gotong Royong — Performa (10 Metrik Poster #6)  (uid: performa-gr)
# Panel 10: Per Endpoint — 16 SLA (p95 ms, rate, error per route)
# Panel 11-13: Circuit Breaker, Bulkhead, Backpressure
```

### Prometheus Scrape — 11 Jobs (interval 15s)

```yaml
# observability/prometheus.yml — global scrape_interval 15s
scrape_configs:
  - job_name: order-service   # order-service:3001 /metrics
  - job_name: payment-service # payment-service:3002
  - job_name: umkm-service    # umkm-service:3003
  - job_name: kas-service     # kas-service:3004
  - job_name: pgbouncer       # pgbouncer:9127
  - job_name: redis           # redis:9121
  - job_name: postgres        # postgres:9187
  - job_name: node            # node:9100
  - job_name: prometheus      # localhost:9090
  - job_name: loki            # loki:3100
  - job_name: otel-collector  # otel-collector:8889
```

---

## Logs — Alloy → Loki → Grafana (LogQL)

### Alur

```
App (Pino JSON) → stdout Docker → Alloy (discovery.docker) → loki.source.docker
  → stage.json → stage.labels {service, level} → stage.structured_metadata {requestId, userId, latency_ms}
  → loki.write → Loki 3100 → Grafana Explore / Dashboard Loki
```

### Anti Cardinality Explosion

- **Labels** hanya `service`, `level` (low cardinality, di-index Loki).
- **Structured metadata** untuk `requestId`, `userId`, `latency_ms` (high cardinality, tidak di-index, tapi bisa di-query).

```alloy
stage.labels { values = { service = "service", level = "level" } }
stage.structured_metadata { values = { requestId = "requestId", userId = "userId", latency_ms = "latency_ms" } }
```

### Cara Query Loki (LogQL)

```logql
# 1. Semua log order + payment
{service=~"order|payment|umkm|kas"} | json

# 2. Filter by requestId (korelasi lintas service)
{service=~"order|payment|umkm|kas"} | json | requestId="550e8400-e29b-41d4-a716-446655440000"

# 3. Hanya error
{service=~"order|payment|umkm|kas"} | json | level="error"

# 4. Latency >500ms (lambat)
{service=~"order|payment|umkm|kas"} | json | latency_ms > 500

# 5. Hitung error per 5 menit
sum by (service) (count_over_time({service=~"order|payment|umkm|kas"} | json | level="error" [5m]))

# 6. Rata-rata latency dari logs
avg by (service) (rate({service=~"order|payment|umkm|kas"} | json | unwrap latency_ms [5m]))
```

### Grafana Loki Dashboard (uid: loki-gr)

- Panel 1: Logs semua service (json + requestId)
- Panel 2: Error level only
- Panel 3: Filter by `requestId` (template variable)
- Panel 4-5: Log volume & error rate
- Panel 6: Latency dari logs (unwrap latency_ms)

Buka: Grafana → Dashboard **Gotong Royong — Logs (Loki)** atau Explore → Loki → jalankan LogQL di atas.

---

## Traces — OTEL → Jaeger (Flame Graph)

### Alur

```
App (shared/tracing.ts) → OTLP HTTP 4318 / gRPC 4317 → OTEL Collector (batch processor)
  → otlp/jaeger → Jaeger 16686 (UI + flame graph)
  → prometheus 8889 (metrics pipeline)
```

### Instrumentasi

```ts
// shared/tracing.ts — NodeSDK + OTLPTraceExporter + auto-instrumentations
initTracing('order-service'); // di index-03c.ts
app.use(tracingMiddleware('order-service')); // span per request, propagate x-request-id
// auto: http, express, pg, redis — tanpa ubah kode bisnis
```

Setiap request buat span: `GET /api/komunitas/:id` → `pg.query` → `redis.get`. Span bawa `x-request-id` sebagai korelasi dengan logs (Loki `requestId` = traceId).

### Cara Buka Jaeger

```bash
open http://localhost:16686
# Service: order-service → cari trace by requestId atau latency >500ms
# Flame graph: lihat span terlama (mis. DB 200ms, Redis 5ms, HTTP 300ms)
# Identifikasi N+1: banyak span pg.query berulang dalam 1 trace
```

### Contoh Trace

```
Trace 550e8400... (320ms total)
├── order-service: GET /checkout  (320ms)
│   ├── bulkhead acquire          (1ms)
│   ├── circuit breaker check     (0.5ms)
│   └── payment-service: POST /charge (280ms)
│       ├── pg.query INSERT ledger (40ms)
│       └── redis.set idempotency (5ms)
└── redis.get cache               (2ms)
```

Jika `payment-service` lambat 280ms → flame graph langsung tunjuk `pg.query 40ms` atau downstream timeout.

---

## Alert — Threshold Bab 8.4 → WA / Email

### 6 Alert Wajib (observability/alerts.yml)

| Alert | Expr | Warning | Critical | Action |
|-------|------|---------|----------|--------|
| **P95High** | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) >0.5` | >500ms 5m | >1000ms 5m | Cek pg_stat_statements + EXPLAIN |
| **ErrorRate** | `5xx / total >0.01` | >1% 5m | >5% 5m | Cek Loki error + circuit breaker |
| **DBPoolHigh** | `pgbouncer active/max >80` | >80% 5m | — | Naikkan pool 25→50 |
| **DiskUsageHigh** | `disk used >85` | >85% 5m | — | Scale storage / sharding |
| **CPUHigh** | `CPU >80` | >80% 5m | — | Vertical / horizontal |
| **CacheHitLow** | `hit <80` | <80% 5m | — | Cek TTL + Redis |
| **ServiceDown** | `up==0` | — | 2m | `docker ps` + logs |
| **CircuitOpen** | `circuit_state==1` | >5m | — | Cek downstream health |

### Cara Pasang Notifikasi WA / Email

```yaml
# alertmanager.yml (jika pakai Alertmanager)
route:
  group_by: [alertname, service]
  receiver: wa-email
receivers:
  - name: wa-email
    webhook_configs:
      - url: http://wablas:3000/webhook  # WA via Wablas/Fazz
    email_configs:
      - to: ops@gotongroyong.id
        from: alert@gotongroyong.id
        smarthost: smtp.gmail.com:587
```

Tanpa Alertmanager, Prometheus UI → Alerts tab sudah tampil, dan Grafana → Alerting → Contact points → tambah WA/Email webhook.

---

## Cara Verifikasi Lengkap

```bash
# 1. Jalankan semua (app + observability)
podman-compose -f compose.yaml -f compose.observability.yaml --profile observability up -d

# 2. Generate traffic
bun run --cwd load load.ts  # atau k6 run load/k6.js

# 3. Cek Prometheus — 11 targets UP
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# 4. Cek Grafana — 10 metrik + per-endpoint + proteksi
open http://localhost:3000/d/performa-gr

# 5. Cek Loki — LogQL
curl -G "http://localhost:3100/loki/api/v1/query_range" --data-urlencode 'query={service=~"order|payment|umkm|kas"} | json | level="error"' | jq

# 6. Cek Jaeger — traces
open http://localhost:16686

# 7. Cek alerts firing
curl http://localhost:9090/api/v1/alerts | jq
```

---

## File Terkait

- `observability/prometheus.yml` + `prometheus/prometheus.yml` — 11 scrape jobs, 15s
- `observability/alerts.yml` + `prometheus/alerts.yml` — 8 alerts Bab 8.4
- `observability/grafana/dashboards/performa.json` — 13 panel (10 metrik + 16 SLA + proteksi)
- `observability/grafana/dashboards/loki.json` — 6 panel Loki + LogQL
- `observability/alloy/config.alloy` — discovery.docker + structured_metadata
- `observability/otel-collector/config.yaml` + `otel/collector.yml` — OTLP 4317/4318 → Jaeger + Prometheus
- `observability/loki/loki.yml` — retention 31d, allow_structured_metadata
- `observability/grafana/provisioning/` — datasources + dashboards auto-provision
- `shared/tracing.ts` — OTEL SDK + x-request-id propagation
- `shared/rateLimiter.ts`, `circuitBreaker.ts`, `bulkhead.ts`, `backpressure.ts` — metrics untuk dashboard proteksi
- `docs/03c-proteksi-scaling.md` — 5 proteksi + HA/DR
- `docs/threshold-scaling.md` — decision tree 80%
