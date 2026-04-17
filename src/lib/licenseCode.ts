import crypto from 'crypto';

type VerifyLicenseOptions = {
  publicKey?: string;
  expectedIssuer?: string;
  expectedAudience?: string;
  expectedTenantCode?: string;
};

export type LicenseCodePayload = {
  jti?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  seats?: number;
  tenantCode?: string;
  issuedTo?: string;
  notes?: string;
  [key: string]: unknown;
};

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  const padded = pad ? normalized + '='.repeat(4 - pad) : normalized;
  return Buffer.from(padded, 'base64').toString('utf8');
}

function normalizePublicKey(key: string): string {
  const trimmed = key.trim();
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed;

  const normalizedNewlines = unquoted.replace(/\\r/g, '').replace(/\\n/g, '\n').trim();
  if (normalizedNewlines.includes('BEGIN PUBLIC KEY')) {
    return normalizedNewlines;
  }
  return `-----BEGIN PUBLIC KEY-----\n${normalizedNewlines}\n-----END PUBLIC KEY-----`;
}

function verifyRS256(signingInput: string, signature: Buffer, publicKeyPem: string): boolean {
  try {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(signingInput);
    verifier.end();
    return verifier.verify(publicKeyPem, signature);
  } catch {
    throw new Error(
      'Invalid LICENSE_PUBLIC_KEY format. Use a PEM public key (or single-line value with escaped \\n).'
    );
  }
}

function normalizeToken(code: string): string {
  const trimmed = code.trim();
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed;

  // JWT must not contain any spaces/newlines when copied from text editors/email.
  return unquoted.replace(/\s+/g, '');
}

export function hashLicenseCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim()).digest('hex');
}

export function verifyLicenseCode(
  code: string,
  options: VerifyLicenseOptions = {}
): LicenseCodePayload {
  const token = normalizeToken(code);
  const { publicKey, expectedIssuer, expectedAudience, expectedTenantCode } = options;

  if (!publicKey) {
    throw new Error('Missing LICENSE_PUBLIC_KEY');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('License code must be a JWT with 3 parts');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = JSON.parse(decodeBase64Url(encodedHeader)) as { alg?: string };
  const payload = JSON.parse(decodeBase64Url(encodedPayload)) as LicenseCodePayload;

  if (header.alg !== 'RS256') {
    throw new Error(`Unsupported license code algorithm: ${header.alg}`);
  }

  const signature = Buffer.from(encodedSignature.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const isValidSignature = verifyRS256(signingInput, signature, normalizePublicKey(publicKey));
  if (!isValidSignature) {
    throw new Error('Invalid license code signature');
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && now >= payload.exp) {
    throw new Error('License code has expired');
  }

  if (expectedIssuer && payload.iss !== expectedIssuer) {
    throw new Error('Invalid license code issuer');
  }

  if (expectedAudience) {
    const aud = payload.aud;
    const audList = Array.isArray(aud) ? aud : [aud];
    if (!audList.includes(expectedAudience)) {
      throw new Error('Invalid license code audience');
    }
  }

  if (expectedTenantCode) {
    if (payload.tenantCode !== expectedTenantCode) {
      throw new Error('Invalid license tenant code');
    }
  }

  if (!payload.jti || typeof payload.jti !== 'string') {
    throw new Error('License code must include jti');
  }

  if (!payload.seats || !Number.isInteger(payload.seats) || payload.seats <= 0) {
    throw new Error('License code must include positive integer seats');
  }

  return payload;
}
