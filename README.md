# Backend Documentation

TypeScript + Express + Prisma + Keycloak + HTTPS

Base URL (local): `https://localhost:3001/api`

## 1. Architecture Overview

- Auth: Keycloak JWT (RS256 verification with `KEYCLOAK_PUBLIC_KEY`)
- API: Express 5
- ORM/DB: Prisma + PostgreSQL
- Transport: HTTPS
- License: Signed license code activation + per-user seat enforcement

Main flow:
1. User authenticates in Keycloak.
2. Frontend sends bearer token to backend.
3. Backend verifies JWT and syncs user into `users`.
4. Backend enforces license seat on protected endpoints.
5. If license check fails, backend returns `403` with `code=LICENSE_LIMIT_REACHED`.

## 2. Project Structure

- `src/server.ts`: HTTPS server bootstrap
- `src/app.ts`: Express app, middleware, routes
- `src/routes/*`: route registration
- `src/controllers/*`: endpoint logic
- `src/middleware/auth.ts`: JWT validation + license guard
- `src/lib/license.ts`: license seat enforcement rules
- `src/lib/licenseCode.ts`: signed license code verification
- `prisma/schema/*`: split Prisma schema files
- `prisma.config.ts`: Prisma datasource config (Prisma 7-style config)
- `scripts/license/issue.ts`: generate signed license codes

## 3. Environment Variables

Use `backend/.env`.

```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bluegame?schema=public

# Keycloak JWT verification
KEYCLOAK_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\\n...\\n-----END PUBLIC KEY-----
KEYCLOAK_ISSUER=http://localhost:8080/realms/bluegameRealm
KEYCLOAK_AUDIENCE=account
KEYCLOAK_CLIENT_ID=myclient

# License code verification (public key only)
LICENSE_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\\n...\\n-----END PUBLIC KEY-----
LICENSE_EXPECTED_ISSUER=bluegame-licensing
LICENSE_EXPECTED_AUDIENCE=bluegame-backend
LICENSE_TENANT_CODE=bluegame-client

# HTTPS
HTTPS_KEY_PATH=certs/server.key
HTTPS_CERT_PATH=certs/server.crt
```

Important:
- Do not store signing private key in backend runtime.
- Backend verifies with `LICENSE_PUBLIC_KEY` only.

## 4. Local Setup

From `backend/`:

```bash
docker compose up -d
npm install
npm run cert:dev
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

## 5. Database License Tables

- `app_licenses`
  - current active license state (`maxUsers`, `isActive`, `expiresAt`, `tenantCode`)
- `license_grants`
  - activated license-code history (`tokenId/jti`, seats, active/inactive, who activated)
- `user_licenses`
  - per-user seat assignment (`isActive`, activated/deactivated metadata)

## 6. License System (Critical)

### 6.1 Activation Model

License is activated by a signed code (JWT-like token, RS256).

Validation checks in backend:
- `alg` must be `RS256`
- valid signature (with `LICENSE_PUBLIC_KEY`)
- valid `iss`, `aud`, optional `tenantCode`
- not expired (`exp`)
- has `jti`
- has positive integer `seats`

If valid:
- previous active grant is deactivated
- new grant is activated in `license_grants`
- `app_licenses.maxUsers` becomes `seats`
- `app_licenses.isActive=true`

### 6.2 Seat Enforcement Model

Enforcement happens in `authMiddleware` for all protected routes except `/api/license*`.

Rules:
1. If app license is inactive -> block.
2. If app license is expired -> block.
3. User must have active seat in `user_licenses`.
4. If active seat count exceeds `maxUsers`:
   - only first `maxUsers` seats (by `activatedAt`) remain valid
   - overflow seat is auto-deactivated
   - overflow user is blocked

Backend block response:

```json
{
  "error": "...",
  "code": "LICENSE_LIMIT_REACHED"
}
```

Frontend contract:
- on `403` + `LICENSE_LIMIT_REACHED`: show blocking popup and sign out user.

### 6.3 No Auto-Seat Assignment

Seats are assigned explicitly by admin (`PATCH /api/license/users/:userId`).
There is no automatic seat assignment at login.

## 7. License APIs

License endpoints are protected by:
- `authMiddleware`
- `permissionMiddleware`
- `requireRoles([ADMIN, ADMINISTRATOR])`

### `GET /api/license`
Returns:
- current license
- usage (`usedUsers`, `availableSeats`, `atLimit`)
- seat list
- grants history

### `POST /api/license/activate`
Body:

```json
{
  "code": "<SIGNED_LICENSE_CODE>"
}
```

Activates signed code.

### `POST /api/license/deactivate`
Effects:
- deactivates active grant(s)
- sets app license inactive
- deactivates all active user seats

### `PATCH /api/license/users/:userId`
Body:

```json
{
  "isActive": true,
  "notes": "Assigned by admin"
}
```

Use:
- `isActive=true` to allocate seat
- `isActive=false` to release seat

If user does not exist in app DB, API returns:
- `404` with guidance that user must login once or be created first.

## 8. Issuing License Codes (Vendor Side)

Generate key pair once (vendor machine):

```bash
mkdir -p license
openssl genrsa -out license/private.pem 2048
openssl rsa -in license/private.pem -pubout -out license/public.pem
```

Issue code:

```bash
npm run license:issue -- \
  --private-key license/private.pem \
  --seats 10 \
  --days 365 \
  --issuer bluegame-licensing \
  --audience bluegame-backend \
  --tenant-code bluegame-client \
  --issued-to "Client A"
```

No-expiry code:

```bash
npm run license:issue -- \
  --private-key license/private.pem \
  --seats 10 \
  --days 0 \
  --issuer bluegame-licensing \
  --audience bluegame-backend \
  --tenant-code bluegame-client \
  --issued-to "Client A"
```

## 9. User + Keycloak Behavior

- `ensureActorUser` creates first-time user in `users` using token `sub` as `keycloakId`.
- `createdId` and `updatedId` point to self on first create.
- If Keycloak user never touched backend, seat assignment by user ID will fail until user exists in `users`.

## 10. Routes Summary

- `GET /api/health`
- `GET /api/users/me`
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`
- `GET /api/navigation/menu`
- `GET /api/navigation/admin`
- `GET /api/license`
- `POST /api/license/activate`
- `POST /api/license/deactivate`
- `PATCH /api/license/users/:userId`

## 11. Troubleshooting

### `Can't reach database server at localhost:5432`
- Start DB: `docker compose up -d`
- Check container health: `docker ps`

### `Unauthorized: Invalid token ...`
- Verify `KEYCLOAK_PUBLIC_KEY`, `KEYCLOAK_ISSUER`, `KEYCLOAK_AUDIENCE`
- Verify Keycloak token comes from the configured realm/client

### `LICENSE_LIMIT_REACHED`
- Activate license first (`POST /api/license/activate`)
- Check seat count (`GET /api/license`)
- Assign seat to user (`PATCH /api/license/users/:userId`)
- Increase seats by activating new code with larger `--seats`

### `License tenant mismatch`
- `LICENSE_TENANT_CODE` must match code payload tenant

## 12. Security Notes

- Keep private signing key outside deployed backend.
- Rotate exposed Keycloak `client_secret` and test user passwords after demos/tests.
- Prefer short-lived operational tokens and controlled role assignments.
