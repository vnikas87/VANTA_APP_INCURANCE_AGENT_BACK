CREATE TABLE "navigation_roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "navigation_roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "navigation_roles_name_key" ON "navigation_roles"("name");
CREATE INDEX "navigation_roles_name_idx" ON "navigation_roles"("name");
