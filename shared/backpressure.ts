// shared/backpressure.ts — Backpressure: Kafka consumer lag >1000 -> 503 + header Retry-After, graceful queue drain
// Bahasa komentar: Indonesia
// Sumber: Studi Kasus Shopee Bab 4.2 — backpressure = hulu melambat jika hilir penuh, jangan OOM

import client from 'prom-client';

export const backpressureLagGauge = new client.Gauge({
  name: 'kafka_consumer_lag',
  help: 'Kafka consumer lag (jumlah pesan belum diproses)',
  labelNames: ['topic', 'group'] as const,
});
export const backpressureRejectedTotal = new client.Counter({
  name: 'backpressure_rejected_total',
  help: 'Total request ditolak karena backpressure',
  labelNames: ['reason'] as const,
});

export interface BackpressureOptions {
  lagThreshold?: number; // default 1000
  retryAfterSec?: number; // default 10
  topic?: string;
  group?: string;
}

export class Backpressure {
  lagThreshold: number;
  retryAfterSec: number;
  topic: string;
  group: string;
  private lag = 0;
  private draining = false;

  constructor(opts: BackpressureOptions = {}) {
    this.lagThreshold = opts.lagThreshold ?? 1000;
    this.retryAfterSec = opts.retryAfterSec ?? 10;
    this.topic = opts.topic ?? 'orders';
    this.group = opts.group ?? 'order-consumer';
  }

  // Dipanggil consumer untuk update lag (mis. dari Kafka admin atau queue length)
  setLag(lag: number) {
    this.lag = lag;
    try { backpressureLagGauge.set({ topic: this.topic, group: this.group }, lag); } catch {}
  }

  getLag(): number { return this.lag; }

  isOverloaded(): boolean {
    return this.lag > this.lagThreshold || this.draining;
  }

  // Middleware Express — jika lag >1000 -> 503 + Retry-After
  middleware() {
    return (_req: any, res: any, next: any) => {
      if (this.isOverloaded()) {
        try { backpressureRejectedTotal.inc({ reason: 'lag_exceeded' }); } catch {}
        res.setHeader('Retry-After', String(this.retryAfterSec));
        return res.status(503).json({
          error: 'Service overloaded - backpressure',
          lag: this.lag,
          threshold: this.lagThreshold,
          retryAfter: this.retryAfterSec,
        });
      }
      next();
    };
  }

  // Graceful queue drain — set draining true, tolak request baru, tunggu lag turun
  async startDrain(timeoutMs = 30_000): Promise<void> {
    this.draining = true;
    const start = Date.now();
    while (this.lag > 0 && Date.now() - start < timeoutMs) {
      // simulasi drain: lag berkurang 100 per 500ms jika ada consumer
      await new Promise((r) => setTimeout(r, 500));
    }
    this.draining = false;
  }

  stopDrain() { this.draining = false; }

  stats() {
    return { lag: this.lag, threshold: this.lagThreshold, overloaded: this.isOverloaded(), draining: this.draining, retryAfter: this.retryAfterSec };
  }
}

// Singleton default
export const orderBackpressure = new Backpressure({ lagThreshold: 1000, retryAfterSec: 10, topic: 'orders', group: 'order-consumer' });
export const paymentBackpressure = new Backpressure({ lagThreshold: 1000, retryAfterSec: 10, topic: 'payments', group: 'payment-consumer' });

export default Backpressure;
