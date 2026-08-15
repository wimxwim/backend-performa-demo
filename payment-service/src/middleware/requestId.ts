// payment-service/src/middleware/requestId.ts — Branch 02 PROPER
// Bahasa komentar: Indonesia

import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import logger from '../logger.js';

export interface RequestWithId extends Request {
  requestId: string;
  log: typeof logger;
}

export function requestIdMiddleware(req: RequestWithId, res: Response, next: NextFunction) {
  const id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  const userId = (req.body?.userId as string) || undefined;
  req.log = userId ? logger.child({ requestId: id, userId }) : logger.child({ requestId: id });
  next();
}

export default requestIdMiddleware;
