ALTER TABLE "app_licenses"
ADD COLUMN IF NOT EXISTS "tenantCode" TEXT;

ALTER TABLE "license_grants"
ADD COLUMN IF NOT EXISTS "tenantCode" TEXT;

CREATE INDEX IF NOT EXISTS "license_grants_tenantCode_idx" ON "license_grants"("tenantCode");
