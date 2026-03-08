-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "keycloakId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdId" INTEGER NOT NULL,
    "updatedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_keycloakId_key" ON "users"("keycloakId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_createdId_idx" ON "users"("createdId");

-- CreateIndex
CREATE INDEX "users_updatedId_idx" ON "users"("updatedId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_createdId_fkey" FOREIGN KEY ("createdId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_updatedId_fkey" FOREIGN KEY ("updatedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

