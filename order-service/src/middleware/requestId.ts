// order-service/src/middleware/requestId.ts — Branch 02 PROPER
// Bahasa komentar: Indonesia
// Spec: crypto.randomUUID(), req.headers['x-request-id'] || uuid, res.setHeader, req.log = logger.child({requestId, userId})

import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import logger from '../logger.js';

// Extend Express Request untuk requestId + log
export interface RequestWithId extends Request {
  requestId: string;
  log: typeof logger;
}

export function requestIdMiddleware(req: RequestWithId, res: Response, next: NextFunction) {
  const id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);

  // Child logger dengan requestId — semua log di request ini bawa requestId
  const userId = (req.body?.userId as string) || (req.query?.userId as string) || undefined;
  req.log = userId ? logger.child({ requestId: id, userId }) : logger.child({ requestId: id });

  next();
}

export default requestIdMiddleware;
