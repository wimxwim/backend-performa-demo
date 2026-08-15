# 05 — CDC Streaming (Debezium WAL -> Kafka -> ES / ClickHouse)

> **Branch 05-cdc** — sinkronisasi real-time tanpa dual-write. Sumber: Modul Performa Bab 5.5 + Bab 6 (CDC, Debezium, Kafka, batch ETL, anti dual-write), spec lock Bab 10.2.

---

## Diagram Alur

```
Postgres (WAL logical) --(Debezium pgoutput)--> Kafka (9092) --+--> Elasticsearch (9200) geo_distance <10ms
                                                                +--> ClickHouse (8123) OLAP agregasi
                                                                +--> (opsional) Redis Streams

Batch ETL alternatif (non real-time): cron 00:00 -> SELECT * FROM umkm WHERE updated_at > last_sync -> bulk ES/ClickHouse
```

---

## Kenapa CDC, Bukan Dual-Write

**Dual-write (berbahaya)**:

```ts
// JANGAN: tulis ke 2 DB di aplikasi
await prisma.umkm.create({ data });   // Postgres OK
await es.index({ index: 'umkm', ... }); // ES gagal -> data tidak bisa dicari (inkonsisten)
```

Jika salah satu gagal, data tidak konsisten. Tidak ada transaksi lintas DB. Retry manual = duplikat. Solusi: **tulis hanya ke Postgres (source of truth)**, biarkan Debezium baca WAL dan sebar ke Kafka -> consumer tulis ke ES/ClickHouse. Postgres + WAL = durable, Kafka = buffer, ES/ClickHouse = derived (bisa rebuild dari Postgres kapan saja).

---

## Debezium — Membaca WAL

- `wal_level = logical`, `max_replication_slots = 4`, `max_wal_senders = 4` (sudah di `compose.yaml`).
- Connector: `io.debezium.connector.postgresql.PostgresConnector`, `plugin.name = pgoutput`, `slot.name = debezium`, `publication.name = dbz_publication`.
- `topic.prefix = gotongroyong`, `table.include.list = public.umkm,public.masjid,public.financial_ledger`.
- Snapshot awal `initial`, lalu streaming CDC. `tombstones.on.delete = false`, `provide.transaction.metadata = true`.
- Daftar connector: `curl http://localhost:8083/connectors` — buat: `curl -X POST http://localhost:8083/connectors -H 'Content-Type: application/json' -d @cdc/debezium-connector.json`.

---

## Kafka — Event Streaming

- Broker `kafka:29092` (internal), `localhost:9092` (host). Topic auto-create, atau buat manual: `kafka-topics --create --topic gotongroyong.public.umkm --bootstrap-server localhost:9092`.
- Consumer group `gr-cdc-es-ch-01` — subscribe `gotongroyong.public.umkm`, `gotongroyong.public.masjid`, `gotongroyong.public.financial_ledger`.
- Lag dimonitor: `lag_ms = now - ts_ms` (Debezium `ts_ms`). Alert jika `lag_ms > 1000`.
- Offset commit manual setelah ES/ClickHouse sukses — jika gagal, tidak commit, Kafka redeliver (at-least-once, idempotent via `id` dedup di ES/ClickHouse ReplacingMergeTree).

---

## Elasticsearch — Geospasial + Full-Text

- Mapping: `umkm` text `analyzer indonesian` + `keyword` + `completion suggest`, `lat_lng geo_point`, `created_at date`, `kelurahan keyword`; `masjid` `geo_point`.
- Query geospasial: `geo_distance 5km` + `sort _geo_distance` -> **<10ms** untuk 256 masjid (vs PostGIS ~50ms). Demo: `GET /api/masjid-terdekat?lat=-6.25&lng=106.75&radius=5km`.
- Full-text: `multi_match` + `highlight` + `fuzziness AUTO` -> `GET /api/cari-es?q=ayam`.
- Fallback: jika ES down, `index-05.ts` otomatis fallback ke `pg_trgm GIN` (`name % 'ayam' ORDER BY similarity DESC` 10-50ms) — tidak ada error ke user.

---

## ClickHouse — OLAP

- `ledger_analytics` MergeTree `ORDER BY (community_id, created_at)` `PARTITION BY toYYYYMM(created_at)`, `ReplacingMergeTree` untuk idempotent.
- Materialized view `mv_ledger_daily` (SummingMergeTree) agregasi `sum(amount)` per `community_id` per `day` — untuk dashboard OKR.
- Insert via consumer `ch.insert({ table: 'ledger_analytics', values: [...] })` — batch 1k row optimal.

---

## Batch ETL Alternatif (Non Real-Time)

Untuk laporan bulanan / statistik historis yang tidak butuh detik:

```bash
# cron 00:00 — ekstrak Postgres -> ClickHouse
psql -c "COPY (SELECT * FROM financial_ledger WHERE timestamp > now() - interval '1 day') TO STDOUT CSV" \
  | clickhouse-client --query "INSERT INTO ledger_analytics FORMAT CSV"
```

Lebih sederhana, tanpa Kafka, cukup untuk Fase MVP-Fase 2. CDC untuk real-time search & dashboard.

---

## Demo

```bash
# 1. Jalankan CDC stack
podman-compose -f compose.yaml -f compose.observability.yaml --profile cdc up -d

# 2. Buat connector Debezium
curl -X POST http://localhost:8083/connectors -H 'Content-Type: application/json' -d @cdc/debezium-connector.json

# 3. Jalankan consumer
bun run cdc/kafka-consumer.ts

# 4. ES demo (index, bulk, query)
bash scripts/es-demo.sh

# 5. Test geospasial <10ms
curl "http://localhost:3003/api/masjid-terdekat?lat=-6.25&lng=106.75&radius=5km" | jq '.meta.took_ms'
# expect <10

# 6. Test full-text + fallback
curl "http://localhost:3003/api/cari-es?q=ayam" | jq '.meta'
# ES up -> source elasticsearch; ES down -> postgres-pg_trgm-fallback
```

---

## File Terkait

- `cdc/debezium-connector.json` — connector Postgres (wal_level logical, slot debezium, topic gotongroyong)
- `cdc/kafka-consumer.ts` — KafkaJS consumer (subscribe 3 topik, write ES + ClickHouse, log lag, anti dual-write)
- `cdc/elasticsearch-mapping.json` — mapping umkm + masjid (indonesian analyzer, geo_point, keyword, suggest)
- `cdc/clickhouse-schema.sql` — MergeTree + materialized view daily sum
- `umkm-service/src/index-05.ts` — Express + ES geospasial + fallback pg_trgm
- `scripts/es-demo.sh` — curl ES demo (create index, bulk, geo_distance, full-text, verify <10ms)
- `compose.observability.yaml` profile `cdc` — zookeeper, kafka, debezium, elasticsearch, clickhouse

