import { NextFunction, Request, Response } from 'express';

export function requireRoles(requiredRoles: string[]) {
  const normalizedRequired = requiredRoles.map((r) => r.toUpperCase());

  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const userRoles = (req.user?.roles ?? []).map((r) => r.toUpperCase());
    const ok = normalizedRequired.some((role) => userRoles.includes(role));

    if (!ok) {
      return res.status(403).json({ error: 'Forbidden: missing required role' });
    }

    return next();
  };
}
