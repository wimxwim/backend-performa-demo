// shared/rateLimiter.ts — Token Bucket + Leaky Bucket + express-rate-limit middleware
// Bahasa komentar: Indonesia
// Spec: Token Bucket 100 req/menit umum, 10 berat, 5 auth, burst 20 + Leaky Bucket queue Kafka
// Middleware: express-rate-limit keyGenerator req.user?.id || req.ip, 429 Retry-After

import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

// ──────────────────────────────────────────────
// Token Bucket — in-memory, cocok untuk single instance
// Untuk multi-instance pakai Redis store (RateLimit Redis)
// Rumus: tokens -= 1 tiap request, refill rate = max/windowMs
// Burst 20 = maxTokens = 20 di atas refill steady
// ──────────────────────────────────────────────
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  constructor(
    private capacity: number, // burst + steady
    private refillRatePerMs: number // token per ms
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  private refill() {
    const now = Date.now();
    const delta = now - this.lastRefill;
    this.tokens = Math.min(this.capacity, this.tokens + delta * this.refillRatePerMs);
    this.lastRefill = now;
  }

  tryConsume(count = 1): boolean {
    this.refill();
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }

  getTokens(): number {
    this.refill();
    return this.tokens;
  }
}

// ──────────────────────────────────────────────
// Leaky Bucket — queue + leak rate tetap, untuk Kafka/backpressure
// Jika queue > maxQueue -> reject 503 + Retry-After
// ──────────────────────────────────────────────
export class LeakyBucket {
  private queue: number = 0;
  private lastLeak: number = Date.now();

  constructor(
    private capacity: number, // max queue 50
    private leakRatePerMs: number // mis. 1 token per 100ms = 10 req/detik
  ) {}

  private leak() {
    const now = Date.now();
    const delta = now - this.lastLeak;
    const leaked = Math.floor(delta * this.leakRatePerMs);
    this.queue = Math.max(0, this.queue - leaked);
    if (leaked > 0) this.lastLeak = now;
  }

  tryAdd(): boolean {
    this.leak();
    if (this.queue < this.capacity) {
      this.queue += 1;
      return true;
    }
    return false;
  }

  size(): number {
    this.leak();
    return this.queue;
  }

  drain() {
    this.queue = 0;
  }
}

// ──────────────────────────────────────────────
// Konfigurasi threshold — Bab 8.4 & Poster #6
// umum 100/menit, berat 10/menit, auth 5/menit, burst 20
// ──────────────────────────────────────────────
export const LIMITS = {
  general: { windowMs: 60 * 1000, max: 100, burst: 20 },
  heavy: { windowMs: 60 * 1000, max: 10, burst: 5 },
  auth: { windowMs: 60 * 1000, max: 5, burst: 5 },
} as const;

// Helper keyGenerator — pakai user.id jika login, fallback IP
// Penting: jangan pakai req.ip langsung jika di belakang proxy — set trust proxy
function keyGen(req: Request): string {
  const user = (req as any).user;
  if (user?.id) return String(user.id);
  return req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
}

function handler429(_req: Request, res: Response) {
  res.setHeader('Retry-After', '60');
  res.status(429).json({ error: 'Too Many Requests', retryAfter: 60 });
}

// ──────────────────────────────────────────────
// Export middleware express-rate-limit — dipakai di order-service/src/index-03c.ts
// limiterGeneral, limiterHeavy, limiterAuth
// ──────────────────────────────────────────────
export const limiterGeneral = rateLimit({
  windowMs: LIMITS.general.windowMs,
  max: LIMITS.general.max,
  keyGenerator: (req: Request) => keyGen(req),
  handler: handler429,
  standardHeaders: true,
  legacyHeaders: false,
  // burst via skipFailedRequests false — burst 20 ditangani TokenBucket terpisah jika perlu
});

export const limiterHeavy = rateLimit({
  windowMs: LIMITS.heavy.windowMs,
  max: LIMITS.heavy.max,
  keyGenerator: (req: Request) => keyGen(req),
  handler: (req: Request, res: Response) => {
    res.setHeader('Retry-After', '60');
    res.status(429).json({ error: 'Too Many Requests - heavy endpoint', retryAfter: 60 });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const limiterAuth = rateLimit({
  windowMs: LIMITS.auth.windowMs,
  max: LIMITS.auth.max,
  keyGenerator: (req: Request) => keyGen(req),
  handler: (req: Request, res: Response) => {
    res.setHeader('Retry-After', '60');
    res.status(429).json({ error: 'Too Many Requests - auth throttled', retryAfter: 60 });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ──────────────────────────────────────────────
// TokenBucket instances untuk burst control tambahan
// Dipakai: if (!generalBucket.tryConsume()) return 429
// ──────────────────────────────────────────────
export const generalBucket = new TokenBucket(
  LIMITS.general.max + LIMITS.general.burst,
  LIMITS.general.max / LIMITS.general.windowMs
);
export const heavyBucket = new TokenBucket(
  LIMITS.heavy.max + LIMITS.heavy.burst,
  LIMITS.heavy.max / LIMITS.heavy.windowMs
);
export const authBucket = new TokenBucket(
  LIMITS.auth.max + LIMITS.auth.burst,
  LIMITS.auth.max / LIMITS.auth.windowMs
);

// Leaky Bucket untuk Kafka queue — mis. order queue max 50, leak 10 req/detik
export const kafkaLeakyBucket = new LeakyBucket(50, 10 / 1000);

export default { TokenBucket, LeakyBucket, limiterGeneral, limiterHeavy, limiterAuth, generalBucket, heavyBucket, authBucket, kafkaLeakyBucket, LIMITS };
