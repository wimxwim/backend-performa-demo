# Threshold & Scaling Decision Tree (80% Alert)

> **Aturan emas**: alert di **80%**, bukan 100%. Jangan tunggu penuh baru panik. Sumber: Spec lock Bab 7 (Shopee → GR), Modul Performa Bab 8.

---

## Threshold Table

| Metrik | Threshold Shopee | Threshold GR (Konservatif) | Alert 80% | Tindakan |
|--------|-----------------|---------------------------|-----------|----------|
| **Data size** | >1 TB | **>500 GB** | **400 GB** | Evaluasi sharding / replica / TiDB |
| **Single table rows** | >10M | **>5M** | **4M** | Partitioning, archiving, MatView |
| **Write QPS** | >1000/detik | **>500/detik** | **400/detik** | Pisah write/read, Kafka queue, batch |
| **P99 cache** | >1ms → Redis | **>5ms → Redis** | **4ms** | Wajib cache hot data |
| **Disk** | — | **85%** | **80%** | Scale storage / archiving |
| **CPU** | — | **80%** | **70%** | Scale vertical/horizontal |
| **DB pool** | — | **80%** | **70%** | Naikkan pool 25→50 atau replica |
| **p95 latency** | — | **500ms warning, 1000ms critical** | **400ms** | Cek pg_stat_statements + EXPLAIN |
| **Error rate** | — | **1% warning, 5% critical** | **0.8%** | Incident, cek Loki + Jaeger |

---

## Decision Tree — Kapan Scaling?

```
                    ┌─────────────────────────┐
                    │  Metrik >80% threshold? │
                    └────────────┬────────────┘
                                 │ ya
                    ┌────────────▼────────────┐
                    │  Jenis bottleneck?      │
                    └────┬──────┬──────┬──────┘
                         │      │      │
              ┌──────────▼──┐ ┌─▼──┐ ┌▼──────────┐
              │  CPU/Memory │ │ DB │ │ Throughput│
              │  >80%       │ │    │ │ >500 req/s│
              └──────┬──────┘ └──┬─┘ └─────┬─────┘
                     │           │         │
        ┌────────────▼──┐  ┌─────▼────┐ ┌──▼──────────────┐
        │ Vertical dulu │  │ Cek query│ │ Horizontal      │
        │ 2→4→8 vCPU    │  │ EXPLAIN  │ │ +1→3→5 instance │
        │ jika <1000 RPS│  │ + index  │ │ + LB nginx      │
        └──────┬────────┘  └─────┬────┘ └──┬──────────────┘
               │                 │         │
               │  masih >80%?    │ masih >80%? 
               └────────┬────────┘         │
                        │ ya               │ ya
               ┌────────▼────────┐ ┌───────▼────────┐
               │ Horizontal      │ │ Auto-scale     │
               │ + LB            │ │ (Fase 4-5)     │
               └─────────────────┘ └────────────────┘
```

### Contoh Keputusan

| Skenario | Metrik | Keputusan | Alasan |
|----------|--------|-----------|--------|
| MVP 500 req/s, CPU 60%, DB 200ms | <80% semua | **Tidak scale** | Masih aman, vertical cukup |
| Fase 2 800 req/s, CPU 85%, p95 600ms | CPU 85% >80% | **Vertical 4→8 vCPU** | <1000 RPS, 1 server masih cukup |
| Fase 3 3000 req/s, CPU 90%, DB 500ms | Throughput >500 | **Horizontal 1→3 + LB** | >1000 RPS wajib horizontal |
| Table `financial_ledger` 6M rows, query 800ms | Rows 6M >5M | **Partitioning + MatView** | Single table >5M |
| Disk 82%, Data 450 GB | Disk 82% >80% | **Alert, siapkan sharding** | Jangan tunggu 500 GB |

---

## Vertical vs Horizontal — Kapan Pindah?

| Fase | Throughput | Server | Strategi | Biaya |
|------|------------|--------|----------|-------|
| **MVP** (Bln 1-6) | 100 req/s | 1 | Vertical (2 vCPU/4GB) | Rp 0 |
| **Fase 2** (Bln 7-12) | 500 req/s | 1-2 | Vertical (4 vCPU/8GB) + PgBouncer 25 | Rp 0-500rb |
| **Fase 3** (Bln 13-24) | 5000 req/s | 5-10 | **Horizontal** + LB + replica | Rp 1,5-5jt |
| **Fase 4** (Bln 25+) | 50000 req/s | 20-50 | Horizontal + auto-scale + sharding | Rp 10jt+ |

**Trigger pindah vertical → horizontal**:
- Throughput >1000 req/s **ATAU**
- CPU >80% setelah vertical max (8 vCPU) **ATAU**
- Data >500 GB

---

## Monitor 80% — Cara Pasang Alert

```yaml
# observability/alerts.yml — alert di 80%, bukan 100%
- alert: DiskUsageHigh
  expr: (node_filesystem_size_bytes - node_filesystem_avail_bytes) / node_filesystem_size_bytes * 100 > 85
  for: 5m
  labels: { severity: warning }
  annotations: { summary: "Disk >85% — siapkan scale" }

- alert: DBPoolHigh
  expr: pgbouncer_pools_client_active_connections / pgbouncer_pools_client_max_connections * 100 > 80
  for: 5m
  labels: { severity: warning }
```

Lihat `observability/alerts.yml` untuk 6 alert lengkap (p95, error, DB, disk, CPU, cache).

---

## Checklist Sebelum Scaling

- [ ] `EXPLAIN ANALYZE` — pastikan bukan query buruk (index missing, Seq Scan)
- [ ] `pg_stat_statements` — top 5 slowest query sudah di-optimize?
- [ ] Redis hit rate >80%? Jika <80%, perbaiki cache dulu sebelum scale DB
- [ ] PgBouncer pool 25 cukup? Cek `SHOW POOLS` — jika `wait_clients >0`, naikkan pool
- [ ] GZIP/Brotli aktif? Payload 100KB → 20KB sudah?
- [ ] Baru scale infra jika 4 cek di atas sudah OK tapi masih >80%

> **Jangan scale infra untuk menutupi query buruk.** 1 index GIN bisa 200x lebih murah dari 1 server baru.

---

## File Terkait

- `docs/03c-proteksi-scaling.md` — 5 proteksi + replica/sharding/HA/DR
- `observability/prometheus.yml` — scrape 10 jobs
- `observability/alerts.yml` — 6 alert Bab 8.4
- `observability/grafana/dashboards/performa.json` — 10 metrik Poster #6
