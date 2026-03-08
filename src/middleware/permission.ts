import { NextFunction, Request, Response } from 'express';
import { methodRoles } from '../config/permissions';

export function permissionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
  const allowedRoles = methodRoles[req.method] ?? [];
  const userRoles = req.user?.roles ?? [];

  const hasAccess = userRoles.some((role) => allowedRoles.includes(role));

  if (!hasAccess) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return next();
}
