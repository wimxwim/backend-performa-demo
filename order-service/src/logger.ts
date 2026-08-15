// order-service/src/logger.ts — Branch 02 PROPER (Pino JSON structured)
// Bahasa komentar: Indonesia
// Spec exact PZN: level LOG_LEVEL env, base {service, hostname}, formatters.level, redact [Redacted], transport pino-pretty dev / JSON prod

import pino from 'pino';
import os from 'os';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    service: 'order-service',
    hostname: os.hostname(),
  },
  formatters: {
    level(label: string) {
      return { level: label };
    },
  },
  redact: {
    paths: ['req.body.password', 'req.body.card', 'card', 'password', 'token', '*.password'],
    remove: false,
    censor: '[Redacted]',
  },
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty', options: { colorize: true } },
});

export default logger;
