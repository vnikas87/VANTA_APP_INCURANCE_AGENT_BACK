import crypto from 'crypto';

type VerifyOptions = {
  expectedIssuer?: string;
  expectedAudience?: string;
  publicKey?: string;
};

type JwtPayload = {
  sub?: string;
  preferred_username?: string;
  email?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  realm_access?: {
    roles?: string[];
  };
  resource_access?: Record<string, { roles?: string[] }>;
  [key: string]: unknown;
};

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  const padded = pad ? normalized + '='.repeat(4 - pad) : normalized;
  return Buffer.from(padded, 'base64').toString('utf8');
}

function parseJwtParts(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Token must have 3 parts');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = JSON.parse(decodeBase64Url(encodedHeader)) as { alg?: string };
  const payload = JSON.parse(decodeBase64Url(encodedPayload)) as JwtPayload;
  const signature = Buffer.from(
    encodedSignature.replace(/-/g, '+').replace(/_/g, '/'),
    'base64'
  );

  return {
    header,
    payload,
    signature,
    signingInput: `${encodedHeader}.${encodedPayload}`,
  };
}

function verifyRS256(signingInput: string, signature: Buffer, publicKeyPem: string): boolean {
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(signingInput);
  verifier.end();
  return verifier.verify(publicKeyPem, signature);
}

function normalizePublicKey(key: string): string {
  const normalizedNewlines = key.replace(/\\n/g, '\n').trim();
  if (normalizedNewlines.includes('BEGIN PUBLIC KEY')) {
    return normalizedNewlines;
  }
  return `-----BEGIN PUBLIC KEY-----\n${normalizedNewlines}\n-----END PUBLIC KEY-----`;
}

export function verifyJwt(token: string, options: VerifyOptions = {}): JwtPayload {
  const { expectedIssuer, expectedAudience, publicKey } = options;
  if (!publicKey) {
    throw new Error('Missing KEYCLOAK_PUBLIC_KEY for token verification');
  }

  const { header, payload, signature, signingInput } = parseJwtParts(token);

  if (header.alg !== 'RS256') {
    throw new Error(`Unsupported JWT algorithm: ${header.alg}`);
  }

  const isValidSignature = verifyRS256(signingInput, signature, normalizePublicKey(publicKey));
  if (!isValidSignature) {
    throw new Error('Invalid token signature');
  }

  const now = Math.floor(Date.now() / 1000);

  if (typeof payload.exp === 'number' && now >= payload.exp) {
    throw new Error('Token has expired');
  }

  if (typeof payload.nbf === 'number' && now < payload.nbf) {
    throw new Error('Token not active yet');
  }

  if (expectedIssuer && payload.iss !== expectedIssuer) {
    throw new Error('Invalid token issuer');
  }

  if (expectedAudience) {
    const aud = payload.aud;
    const audList = Array.isArray(aud) ? aud : [aud];
    if (!audList.includes(expectedAudience)) {
      throw new Error('Invalid token audience');
    }
  }

  return payload;
}

export function extractRoles(payload: JwtPayload, clientId?: string): string[] {
  const roles = new Set<string>();

  const realmRoles = payload?.realm_access?.roles ?? [];
  realmRoles.forEach((role) => roles.add(role.toUpperCase()));

  if (clientId) {
    const clientRoles = payload?.resource_access?.[clientId]?.roles ?? [];
    clientRoles.forEach((role) => roles.add(role.toUpperCase()));
  }

  return Array.from(roles);
}
