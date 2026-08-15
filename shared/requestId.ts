// shared/requestId.ts — Shared middleware requestId untuk 4 service
// Bahasa komentar: Indonesia
// Spec: app.use((req,res,next)=>{ const id = req.headers['x-request-id'] || crypto.randomUUID(); req.requestId=id; res.setHeader('x-request-id',id); req.log = logger.child({requestId:id}); next(); })
// Latency: app.use((req,res,next)=>{ const start=Date.now(); res.on('finish',()=>{ req.log.info({latency_ms:Date.now()-start, status:res.statusCode, method:req.method, path:req.path}, 'request completed') }); next(); })

import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import type pino from 'pino';

export interface RequestWithId extends Request {
  requestId: string;
  log: pino.Logger;
}

export function createRequestIdMiddleware(logger: pino.Logger) {
  return (req: RequestWithId, res: Response, next: NextFunction) => {
    const id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
    req.requestId = id;
    res.setHeader('x-request-id', id);
    req.log = logger.child({ requestId: id });
    next();
  };
}

export function createLatencyMiddleware() {
  return (req: RequestWithId, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      req.log.info(
        { latency_ms: Date.now() - start, status: res.statusCode, method: req.method, path: req.path },
        'request completed'
      );
    });
    next();
  };
}

export default createRequestIdMiddleware;
