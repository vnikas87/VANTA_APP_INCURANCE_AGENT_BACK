import { NextFunction, Request, Response } from 'express';
import { ensureActorUser } from '../lib/actorUser';
import { assertUserHasLicenseSeat, LicenseLimitError } from '../lib/license';
import { LEGACY_API_ROLES } from '../config/roles';
import { extractRoles, verifyJwt } from '../lib/jwt';

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization ?? '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: missing bearer token' });
    }

    const payload = verifyJwt(token, {
      publicKey: process.env.KEYCLOAK_PUBLIC_KEY,
      expectedIssuer: process.env.KEYCLOAK_ISSUER,
      expectedAudience: process.env.KEYCLOAK_AUDIENCE,
    });

    const sub = typeof payload.sub === 'string' ? payload.sub : '';
    if (!sub) {
      return res.status(401).json({ error: 'Unauthorized: JWT sub is missing' });
    }

    const username =
      typeof payload.preferred_username === 'string' ? payload.preferred_username : undefined;
    const email = typeof payload.email === 'string' ? payload.email : undefined;
    const roles = extractRoles(payload, process.env.KEYCLOAK_CLIENT_ID);
    const hasLicenseBypassRole = roles.includes(LEGACY_API_ROLES.ADMINISTRATOR);

    // Auto-sync Keycloak user into users table on first successful auth.
    const dbUserId = await ensureActorUser({ sub, username, email });
    const isLicenseAdminRoute = req.originalUrl.startsWith('/api/license');
    if (!isLicenseAdminRoute && !hasLicenseBypassRole) {
      await assertUserHasLicenseSeat(dbUserId);
    }

    req.user = {
      sub,
      dbUserId,
      username,
      email,
      roles,
      tokenPayload: payload,
    };

    return next();
  } catch (error) {
    if (error instanceof LicenseLimitError) {
      return res.status(403).json({ error: error.message, code: 'LICENSE_LIMIT_REACHED' });
    }
    const message = error instanceof Error ? error.message : 'invalid token';
    return res.status(401).json({ error: `Unauthorized: ${message}` });
  }
}
