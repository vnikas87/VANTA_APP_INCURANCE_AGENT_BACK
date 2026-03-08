CREATE TABLE "app_licenses" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "maxUsers" INTEGER NOT NULL,
  "allowOverflow" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "app_licenses_pkey" PRIMARY KEY ("id")
);

INSERT INTO "app_licenses" ("id", "maxUsers", "allowOverflow", "updatedAt")
VALUES (1, 1, false, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
