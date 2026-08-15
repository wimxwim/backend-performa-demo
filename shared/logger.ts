// shared/logger.ts — Factory Pino untuk 4 service
// Bahasa komentar: Indonesia
// Dipakai: createLogger('order-service'), createLogger('payment-service'), dst.
// Spec exact PZN: pino({ level, base:{service, hostname}, formatters.level, redact, transport })

import pino from 'pino';
import os from 'os';

export function createLogger(serviceName: string) {
  return pino({
    level: process.env.LOG_LEVEL || 'info',
    base: {
      service: serviceName,
      hostname: os.hostname(),
    },
    formatters: {
      level(label: string) {
        return { level: label };
      },
    },
    redact: {
      paths: ['req.body.password', 'req.body.card', 'card', 'password', 'token', '*.password', 'req.headers.authorization'],
      remove: false,
      censor: '[Redacted]',
    },
    transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty', options: { colorize: true } },
  });
}

export default createLogger;
