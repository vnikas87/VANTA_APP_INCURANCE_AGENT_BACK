import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

type CliOptions = {
  seats: number;
  days: number;
  issuer: string;
  audience: string;
  tenantCode?: string;
  issuedTo?: string;
  notes?: string;
  privateKeyPath: string;
};

function parseArgs(argv: string[]): CliOptions {
  const map = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key.startsWith('--') && value && !value.startsWith('--')) {
      map.set(key, value);
      i += 1;
    }
  }

  const seatsRaw = map.get('--seats') ?? '1';
  const daysRaw = map.get('--days') ?? '30';
  const seats = Number(seatsRaw);
  const days = Number(daysRaw);

  if (!Number.isInteger(seats) || seats <= 0) {
    throw new Error('--seats must be a positive integer');
  }

  if (!Number.isInteger(days) || days < 0) {
    throw new Error('--days must be an integer >= 0 (use 0 for no expiry)');
  }

  const issuer = map.get('--issuer') ?? process.env.LICENSE_EXPECTED_ISSUER ?? 'bluegame-licensing';
  const audience =
    map.get('--audience') ?? process.env.LICENSE_EXPECTED_AUDIENCE ?? 'bluegame-backend';
  const issuedTo = map.get('--issued-to');
  const tenantCode = map.get('--tenant-code') ?? process.env.LICENSE_TENANT_CODE;
  const notes = map.get('--notes');
  const privateKeyPath =
    map.get('--private-key') ?? process.env.LICENSE_PRIVATE_KEY_PATH ?? 'license/private.pem';

  return { seats, days, issuer, audience, tenantCode, issuedTo, notes, privateKeyPath };
}

function toBase64Url(value: string | Buffer): string {
  const encoded = Buffer.isBuffer(value)
    ? value.toString('base64')
    : Buffer.from(value, 'utf8').toString('base64');
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function issueLicenseJwt(options: CliOptions): string {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    jti: crypto.randomUUID(),
    iss: options.issuer,
    aud: options.audience,
    iat: now,
    exp: options.days === 0 ? undefined : now + options.days * 24 * 60 * 60,
    seats: options.seats,
    tenantCode: options.tenantCode,
    issuedTo: options.issuedTo,
    notes: options.notes,
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const privateKeyAbs = path.resolve(process.cwd(), options.privateKeyPath);
  const privateKey = fs.readFileSync(privateKeyAbs, 'utf8');

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(privateKey);

  return `${signingInput}.${toBase64Url(signature)}`;
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const token = issueLicenseJwt(options);

  // eslint-disable-next-line no-console
  console.log(token);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  // eslint-disable-next-line no-console
  console.error(`[license:issue] ${message}`);
  process.exit(1);
}
