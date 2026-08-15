// shared/bulkhead.ts — Bulkhead: thread pool isolation per service
// Bahasa komentar: Indonesia
// Spec: order pool 20, payment 10, umkm 15, queue max 50, reject jika penuh
// Sumber: Studi Kasus Shopee Bab 4.2 — bulkhead = sekat kapal, 1 service down tidak tenggelamkan semua

import client from 'prom-client';

// ──────────────────────────────────────────────
// Metrics bulkhead
// ──────────────────────────────────────────────
export const bulkheadActiveGauge = new client.Gauge({
  name: 'bulkhead_active',
  help: 'Jumlah slot aktif di bulkhead pool',
  labelNames: ['service'] as const,
});
export const bulkheadQueueGauge = new client.Gauge({
  name: 'bulkhead_queue',
  help: 'Jumlah antrian di bulkhead pool',
  labelNames: ['service'] as const,
});
export const bulkheadRejectedTotal = new client.Counter({
  name: 'bulkhead_rejected_total',
  help: 'Total request ditolak karena bulkhead penuh',
  labelNames: ['service'] as const,
});

export interface BulkheadOptions {
  service: string;
  poolSize: number; // max concurrent
  queueMax?: number; // default 50
}

export class Bulkhead {
  readonly service: string;
  readonly poolSize: number;
  readonly queueMax: number;
  private active = 0;
  private queue: Array<{ fn: () => Promise<any>; resolve: (v: any) => void; reject: (e: any) => void }> = [];

  constructor(opts: BulkheadOptions) {
    this.service = opts.service;
    this.poolSize = opts.poolSize;
    this.queueMax = opts.queueMax ?? 50;
    this.updateGauges();
  }

  private updateGauges() {
    try {
      bulkheadActiveGauge.set({ service: this.service }, this.active);
      bulkheadQueueGauge.set({ service: this.service }, this.queue.length);
    } catch {}
  }

  // ──────────────────────────────────────────────
  // run — eksekusi dengan isolasi pool
  // Jika pool penuh -> masuk queue (max 50). Jika queue penuh -> reject 503
  // ──────────────────────────────────────────────
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active < this.poolSize) {
      return this.execute(fn);
    }
    // pool penuh — coba queue
    if (this.queue.length >= this.queueMax) {
      try { bulkheadRejectedTotal.inc({ service: this.service }); } catch {}
      const err: any = new Error(`Bulkhead ${this.service} penuh - pool ${this.poolSize} queue ${this.queueMax}`);
      err.status = 503;
      err.code = 'BULKHEAD_FULL';
      throw err;
    }
    // queue dan tunggu giliran
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.updateGauges();
    });
  }

  private async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.active++;
    this.updateGauges();
    try {
      const result = await fn();
      return result;
    } finally {
      this.active--;
      this.updateGauges();
      this.drainQueue();
    }
  }

  private drainQueue() {
    if (this.queue.length === 0) return;
    if (this.active >= this.poolSize) return;
    const next = this.queue.shift()!;
    this.updateGauges();
    this.execute(next.fn).then(next.resolve).catch(next.reject);
  }

  stats() {
    return { service: this.service, poolSize: this.poolSize, active: this.active, queued: this.queue.length, queueMax: this.queueMax };
  }

  // graceful drain — tunggu queue selesai sebelum shutdown
  async drainAll(timeoutMs = 10_000): Promise<void> {
    const start = Date.now();
    while ((this.active > 0 || this.queue.length > 0) && Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}

// ──────────────────────────────────────────────
// Pool presets — sesuai spec Bab 4.2
// ──────────────────────────────────────────────
export const orderBulkhead = new Bulkhead({ service: 'order', poolSize: 20, queueMax: 50 });
export const paymentBulkhead = new Bulkhead({ service: 'payment', poolSize: 10, queueMax: 50 });
export const umkmBulkhead = new Bulkhead({ service: 'umkm', poolSize: 15, queueMax: 50 });
export const kasBulkhead = new Bulkhead({ service: 'kas', poolSize: 15, queueMax: 50 });

export function getBulkhead(service: string): Bulkhead {
  switch (service) {
    case 'order': return orderBulkhead;
    case 'payment': return paymentBulkhead;
    case 'umkm': return umkmBulkhead;
    case 'kas': return kasBulkhead;
    default: return orderBulkhead;
  }
}

export default Bulkhead;
