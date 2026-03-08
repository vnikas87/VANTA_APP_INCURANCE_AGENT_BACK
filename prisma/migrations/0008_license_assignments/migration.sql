ALTER TABLE "app_licenses"
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "licenseTokenId" TEXT;

CREATE TABLE "license_grants" (
  "id" SERIAL NOT NULL,
  "tokenId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "seats" INTEGER NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "issuedTo" TEXT,
  "metadata" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "activatedById" INTEGER,
  "deactivatedById" INTEGER,
  "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deactivatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "license_grants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "license_grants_tokenId_key" ON "license_grants"("tokenId");
CREATE UNIQUE INDEX "license_grants_codeHash_key" ON "license_grants"("codeHash");
CREATE INDEX "license_grants_isActive_idx" ON "license_grants"("isActive");
CREATE INDEX "license_grants_activatedById_idx" ON "license_grants"("activatedById");
CREATE INDEX "license_grants_deactivatedById_idx" ON "license_grants"("deactivatedById");

ALTER TABLE "license_grants"
ADD CONSTRAINT "license_grants_activatedById_fkey" FOREIGN KEY ("activatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "license_grants"
ADD CONSTRAINT "license_grants_deactivatedById_fkey" FOREIGN KEY ("deactivatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "user_licenses" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "activatedById" INTEGER,
  "deactivatedById" INTEGER,
  "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deactivatedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_licenses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_licenses_userId_key" ON "user_licenses"("userId");
CREATE INDEX "user_licenses_isActive_idx" ON "user_licenses"("isActive");
CREATE INDEX "user_licenses_activatedById_idx" ON "user_licenses"("activatedById");
CREATE INDEX "user_licenses_deactivatedById_idx" ON "user_licenses"("deactivatedById");

ALTER TABLE "user_licenses"
ADD CONSTRAINT "user_licenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_licenses"
ADD CONSTRAINT "user_licenses_activatedById_fkey" FOREIGN KEY ("activatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user_licenses"
ADD CONSTRAINT "user_licenses_deactivatedById_fkey" FOREIGN KEY ("deactivatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
