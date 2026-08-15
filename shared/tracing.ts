// shared/tracing.ts — OTEL SDK: NodeSDK + OTLPTraceExporter (4317) + instrumentations http/express/pg/redis
// Bahasa komentar: Indonesia
// Spec: span per request, propagate x-request-id as traceId, export ke OTEL Collector 4317

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

let sdk: NodeSDK | null = null;

export function initTracing(serviceName: string) {
  const exporter = new OTLPTraceExporter({
    // OTEL Collector OTLP HTTP 4318, gRPC 4317 — auto-instrumentations pakai http exporter
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  });

  sdk = new NodeSDK({
    traceExporter: exporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
    serviceName,
  });

  try {
    sdk.start();
    console.log(`[tracing] OTEL SDK started for ${serviceName} -> ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces'}`);
  } catch (e) {
    console.error('[tracing] OTEL SDK failed to start', e);
  }

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    try { await sdk?.shutdown(); } catch {}
  });

  return sdk;
}

export async function shutdownTracing() {
  try { await sdk?.shutdown(); } catch {}
}

// ──────────────────────────────────────────────
// Middleware: buat span per request, propagate x-request-id
// Jika header x-request-id ada -> pakai sebagai trace correlation (baggage)
// ──────────────────────────────────────────────
export function tracingMiddleware(serviceName: string) {
  return (req: Request & { requestId?: string }, res: Response, next: NextFunction) => {
    const tracer = trace.getTracer(serviceName);
    const requestId = (req.headers['x-request-id'] as string) || req.requestId || crypto.randomUUID();
    // set header agar downstream bisa korelasi
    if (!req.headers['x-request-id']) req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);

    const span = tracer.startSpan(`${req.method} ${req.path}`, {
      attributes: {
        'http.method': req.method,
        'http.route': req.path,
        'http.request_id': requestId,
        'service.name': serviceName,
      },
    });

    // simpan span di context
    const ctx = trace.setSpan(context.active(), span);
    context.with(ctx, () => {
      const start = Date.now();
      res.on('finish', () => {
        span.setAttribute('http.status_code', res.statusCode);
        span.setAttribute('latency_ms', Date.now() - start);
        if (res.statusCode >= 500) span.setStatus({ code: SpanStatusCode.ERROR });
        span.end();
      });
      next();
    });
  };
}

// Helper untuk manual span di service call (mis. DB query, Redis)
export function withSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const tracer = trace.getTracer('manual');
  const span = tracer.startSpan(name);
  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (e: any) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: e.message });
      span.recordException(e);
      throw e;
    } finally {
      span.end();
    }
  });
}

export default { initTracing, shutdownTracing, tracingMiddleware, withSpan };
