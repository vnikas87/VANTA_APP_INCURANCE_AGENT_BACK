import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

function resolveRouteTemplate(req: Request): string {
  const base = req.baseUrl ?? '';

  if (req.route?.path) {
    const routePath = typeof req.route.path === 'string' ? req.route.path : req.path;
    return `${base}${routePath}`;
  }

  return req.originalUrl || req.url;
}

export function auditLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();

  res.on('finish', () => {
    const routeTemplate = resolveRouteTemplate(req);
    const method = req.method;
    const functionName = `${method} ${routeTemplate}`;

    void prisma.apiCallLog
      .create({
        data: {
          userId: req.user?.dbUserId,
          userName: req.user?.username ?? req.user?.email ?? req.user?.sub ?? null,
          method,
          route: routeTemplate,
          functionName,
          statusCode: res.statusCode,
          calledAt: new Date(startedAt),
        },
      })
      .catch((error: unknown) => {
        console.error('[AUDIT] Failed to write api_call_logs row', error);
      });
  });

  next();
}
