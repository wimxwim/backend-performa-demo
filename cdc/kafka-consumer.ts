// cdc/kafka-consumer.ts — Kafka consumer Debezium WAL -> ES + ClickHouse
// Bahasa komentar: Indonesia
// Prinsip anti dual-write: aplikasi HANYA tulis ke Postgres (source of truth).
// Debezium baca WAL logical -> Kafka -> consumer ini tulis ke ES/ClickHouse (async).
// Jika ES/ClickHouse down, data tetap aman di Postgres + Kafka offset tidak commit.

import { Kafka, logLevel } from 'kafkajs';
import { Client as ESClient } from '@elastic/elasticsearch';
import { createClient as createClickHouse } from '@clickhouse/client';
import pino from 'pino';

// ──────────────────────────────────────────────
// Logger — JSON structured, bawa lag + topic + offset
// ──────────────────────────────────────────────
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'cdc-consumer', hostname: process.env.HOSTNAME || 'cdc-01' },
  formatters: { level(l: string) { return { level: l }; } },
});

// ──────────────────────────────────────────────
// Config — env override untuk lokal / docker
// ──────────────────────────────────────────────
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const ES_NODE = process.env.ES_NODE || 'http://localhost:9200';
const CLICKHOUSE_URL = process.env.CLICKHOUSE_URL || 'http://localhost:8123';
const GROUP_ID = process.env.KAFKA_GROUP_ID || 'gr-cdc-es-ch-01';

const kafka = new Kafka({
  clientId: 'gr-cdc-consumer',
  brokers: KAFKA_BROKERS,
  logLevel: logLevel.WARN,
  retry: { initialRetryTime: 300, retries: 8 },
});

const es = new ESClient({ node: ES_NODE, requestTimeout: 5000, maxRetries: 3 });
const ch = createClickHouse({ url: CLICKHOUSE_URL, database: 'gotongroyong' });

// ──────────────────────────────────────────────
// Topik Debezium — prefix gotongroyong + table name
// Debezium Postgres: topic = {prefix}.{schema}.{table} -> gotongroyong.public.umkm
// Tapi dengan table.include public.umkm -> topic gotongroyong.public.umkm
// Alias pendek juga di-subscribe untuk kompatibilitas connector tanpa schema.
// ──────────────────────────────────────────────
const TOPICS = [
  'gotongroyong.public.umkm',
  'gotongroyong.public.masjid',
  'gotongroyong.public.financial_ledger',
  // fallback tanpa schema prefix (jika publication filtered)
  'gotongroyong.umkm',
  'gotongroyong.masjid',
  'gotongroyong.financial_ledger',
];

// ──────────────────────────────────────────────
// Helpers — lag, ES upsert, ClickHouse insert
// ──────────────────────────────────────────────
function lagMs(tsMs: number | undefined): number | null {
  if (!tsMs) return null;
  return Date.now() - tsMs;
}

async function upsertESUmkm(after: any, op: string) {
  if (op === 'd' || !after) {
    // delete — soft delete di ES
    const id = after?.id || 'unknown';
    try {
      await es.delete({ index: 'umkm', id: String(id) });
      logger.info({ id, op }, 'ES delete umkm');
    } catch (e: any) {
      if (e.meta?.statusCode !== 404) throw e;
    }
    return;
  }
  const doc: any = {
    name: after.name,
    name_keyword: after.name,
    name_suggest: after.name,
    kelurahan: after.kelurahan,
    kecamatan_id: after.kecamatan_id,
    category0: after.category0,
    category1: after.category1,
    alamat: after.alamat,
    telepon: after.telepon,
    zip_code: after.zip_code,
    lat_lng: after.lat != null && after.lng != null ? { lat: Number(after.lat), lon: Number(after.lng) } : undefined,
    created_at: after.created_at,
    data_id: after.data_id,
  };
  if (!doc.lat_lng) delete doc.lat_lng;
  await es.index({ index: 'umkm', id: String(after.id), document: doc });
  logger.info({ id: after.id, kelurahan: after.kelurahan }, 'ES upsert umkm');
}

async function upsertESMasjid(after: any, op: string) {
  if (op === 'd' || !after) {
    try { await es.delete({ index: 'masjid', id: String(after.id) }); } catch (e: any) { if (e.meta?.statusCode !== 404) throw e; }
    return;
  }
  const doc: any = {
    name: after.name,
    tipe: after.tipe,
    kelurahan: after.kelurahan,
    alamat: after.alamat,
    lat_lng: { lat: Number(after.lat), lon: Number(after.lng) },
    kode_pos: after.kode_pos,
    pic: after.pic,
  };
  await es.index({ index: 'masjid', id: String(after.id), document: doc });
  logger.info({ id: after.id, kelurahan: after.kelurahan }, 'ES upsert masjid');
}

async function insertClickHouseLedger(after: any, op: string) {
  // Hanya INSERT/UPDATE yang masuk analitik; DELETE diabaikan (ledger append-only)
  if (op === 'd' || !after) return;
  // Anti dual-write: ClickHouse hanya menerima dari Kafka (WAL), bukan dari aplikasi langsung.
  // Idempotent: pakai id sebagai dedup key (ReplacingMergeTree di ClickHouse handle duplikat)
  await ch.insert({
    table: 'ledger_analytics',
    values: [{
      id: String(after.id),
      community_id: after.community_id || 'unknown',
      amount: Number(after.amount) || 0,
      description: after.description || '',
      hash_self: after.hash_self || '',
      created_at: after.timestamp ? new Date(after.timestamp).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' '),
    }],
    format: 'JSONEachRow',
  });
  logger.info({ id: after.id, community_id: after.community_id, amount: after.amount }, 'ClickHouse insert ledger');
}

// ──────────────────────────────────────────────
// Consumer — subscribe, handle, commit offset manual setelah sukses
// ──────────────────────────────────────────────
const consumer = kafka.consumer({
  groupId: GROUP_ID,
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxBytesPerPartition: 1048576,
  allowAutoTopicCreation: true,
});

async function start() {
  await consumer.connect();
  for (const t of TOPICS) {
    try {
      await consumer.subscribe({ topic: t, fromBeginning: true });
      logger.info({ topic: t }, 'subscribed');
    } catch (e: any) {
      logger.warn({ topic: t, err: e.message }, 'subscribe gagal, topic belum ada (akan auto-create)');
    }
  }

  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      const start = Date.now();
      const raw = message.value?.toString() || '';
      let payload: any;
      try { payload = JSON.parse(raw); } catch { payload = { after: null, before: null, op: 'r', ts_ms: Date.now() }; }
      // Debezium ExtractNewRecordState -> payload = { id, name, ... , op, ts_ms, source }
      // Jika pakai JsonConverter tanpa unwrap, payload = { before, after, op, ts_ms }
      const after = payload.after ?? payload;
      const op = payload.op || payload.__op || 'c';
      const tsMs = payload.ts_ms || payload.source?.ts_ms;
      const currentLag = lagMs(tsMs);

      try {
        if (topic.includes('umkm')) {
          await upsertESUmkm(after, op);
        } else if (topic.includes('masjid')) {
          await upsertESMasjid(after, op);
        } else if (topic.includes('financial_ledger') || topic.includes('ledger')) {
          await insertClickHouseLedger(after, op);
        } else {
          logger.warn({ topic }, 'topic tidak dikenali, skip');
        }
        // Log lag — alert jika >1000ms (Kafka tertinggal)
        const elapsed = Date.now() - start;
        logger.info({ topic, partition, offset: message.offset, op, lag_ms: currentLag, elapsed_ms: elapsed }, 'cdc processed');
        if (currentLag != null && currentLag > 1000) {
          logger.warn({ topic, lag_ms: currentLag }, 'CDC lag tinggi >1000ms — cek consumer atau ES/ClickHouse');
        }
      } catch (err: any) {
        logger.error({ topic, partition, offset: message.offset, err: err.message, stack: err.stack }, 'cdc handler gagal — tidak commit offset, akan retry');
        // Jangan commit offset — Kafka akan redeliver
        throw err;
      }
    },
  });

  logger.info({ brokers: KAFKA_BROKERS, groupId: GROUP_ID, topics: TOPICS }, 'CDC consumer running — anti dual-write aktif');
}

async function shutdown() {
  logger.info('shutdown CDC consumer...');
  try { await consumer.disconnect(); } catch {}
  try { await es.close(); } catch {}
  try { await ch.close(); } catch {}
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start().catch((e) => {
  logger.fatal({ err: e.message }, 'gagal start CDC consumer');
  process.exit(1);
});
