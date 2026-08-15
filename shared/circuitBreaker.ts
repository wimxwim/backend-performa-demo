// shared/circuitBreaker.ts — Circuit Breaker: closed -> open jika error >50% dalam 10s window, half-open setelah 30s
// Bahasa komentar: Indonesia
// Spec: state closed|open|half-open, failures, threshold 5, windowMs 10000, halfOpenAfter 30000, fallback 503 + metrics circuit_state
// Sumber: Studi Kasus Shopee Bab 4.2 — 6 proteksi (circuit breaker salah satu)

import client from 'prom-client';

// ──────────────────────────────────────────────
// Metric circuit_state — 0 closed, 1 open, 2 half-open
// Dipakai di Grafana + alert circuit open > 5m
// ──────────────────────────────────────────────
export const circuitStateGauge = new client.Gauge({
  name: 'circuit_state',
  help: 'Circuit breaker state: 0=closed 1=open 2=half-open',
  labelNames: ['service', 'target'] as const,
});

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  threshold?: number; // jumlah failure untuk open (default 5)
  windowMs?: number; // window evaluasi 10s
  halfOpenAfter?: number; // 30s sebelum half-open
  service?: string;
  target?: string; // mis. payment-service
  failureRateThreshold?: number; // 0.5 = 50% error dalam window -> open
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
}

export class CircuitBreaker {
  state: CircuitState = 'closed';
  failures = 0;
  successes = 0;
  threshold: number;
  windowMs: number;
  halfOpenAfter: number;
  failureRateThreshold: number;
  private openedAt: number = 0;
  private windowStart: number = Date.now();
  private service: string;
  private target: string;
  private onStateChange?: (from: CircuitState, to: CircuitState) => void;

  constructor(opts: CircuitBreakerOptions = {}) {
    this.threshold = opts.threshold ?? 5;
    this.windowMs = opts.windowMs ?? 10_000;
    this.halfOpenAfter = opts.halfOpenAfter ?? 30_000;
    this.failureRateThreshold = opts.failureRateThreshold ?? 0.5;
    this.service = opts.service ?? 'order-service';
    this.target = opts.target ?? 'downstream';
    this.onStateChange = opts.onStateChange;
    this.setGauge();
  }

  private setGauge() {
    const val = this.state === 'closed' ? 0 : this.state === 'open' ? 1 : 2;
    try {
      circuitStateGauge.set({ service: this.service, target: this.target }, val);
    } catch {}
  }

  private transition(to: CircuitState) {
    if (this.state === to) return;
    const from = this.state;
    this.state = to;
    if (to === 'open') this.openedAt = Date.now();
    if (to === 'closed') {
      this.failures = 0;
      this.successes = 0;
      this.windowStart = Date.now();
    }
    this.setGauge();
    this.onStateChange?.(from, to);
  }

  private isWindowExpired(): boolean {
    return Date.now() - this.windowStart >= this.windowMs;
  }

  private shouldOpen(): boolean {
    const total = this.failures + this.successes;
    if (total === 0) return false;
    // dua kondisi open: absolute threshold ATAU failure rate >50% dalam window
    if (this.failures >= this.threshold) return true;
    if (total >= 5 && this.failures / total >= this.failureRateThreshold) return true;
    return false;
  }

  private maybeResetWindow() {
    if (this.isWindowExpired()) {
      this.failures = 0;
      this.successes = 0;
      this.windowStart = Date.now();
    }
  }

  // ──────────────────────────────────────────────
  // call — bungkus downstream call dengan circuit
  // Jika open dan belum 30s -> throw 503 langsung (fail fast)
  // Jika half-open -> coba 1 request, jika sukses close, jika gagal open lagi
  // ──────────────────────────────────────────────
  async call<T>(fn: () => Promise<T>): Promise<T> {
    // OPEN: cek apakah sudah waktunya half-open
    if (this.state === 'open') {
      if (Date.now() - this.openedAt < this.halfOpenAfter) {
        const err: any = new Error('Circuit breaker OPEN - downstream unavailable');
        err.status = 503;
        err.code = 'CIRCUIT_OPEN';
        throw err;
      }
      // waktunya coba lagi
      this.transition('half-open');
    }

    // HALF-OPEN: hanya 1 trial — jika sukses -> closed, gagal -> open lagi
    if (this.state === 'half-open') {
      try {
        const result = await fn();
        this.transition('closed');
        this.successes++;
        return result;
      } catch (e: any) {
        this.transition('open');
        this.failures++;
        throw e;
      }
    }

    // CLOSED: normal path
    this.maybeResetWindow();
    try {
      const result = await fn();
      this.successes++;
      // jika failure rate sudah tinggi dalam window -> open
      if (this.shouldOpen()) this.transition('open');
      return result;
    } catch (e: any) {
      this.failures++;
      if (this.shouldOpen()) this.transition('open');
      throw e;
    }
  }

  // Untuk health check & metrics
  getState(): { state: CircuitState; failures: number; successes: number; openedAt: number } {
    return { state: this.state, failures: this.failures, successes: this.successes, openedAt: this.openedAt };
  }

  // Manual reset — untuk test atau admin endpoint
  reset() {
    this.transition('closed');
  }

  // Force open — untuk chaos test
  forceOpen() {
    this.transition('open');
  }
}

// Singleton default untuk order -> payment
export const paymentCircuit = new CircuitBreaker({
  threshold: 5,
  windowMs: 10_000,
  halfOpenAfter: 30_000,
  service: 'order-service',
  target: 'payment-service',
  failureRateThreshold: 0.5,
});

export default CircuitBreaker;
