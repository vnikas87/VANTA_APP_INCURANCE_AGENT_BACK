-- CreateTable
CREATE TABLE "user_grid_preferences" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "viewKey" TEXT NOT NULL,
    "filtersJson" JSONB,
    "sortingJson" JSONB,
    "columnOrderJson" JSONB,
    "hiddenColumnNamesJson" JSONB,
    "groupingJson" JSONB,
    "visibleFilterKeysJson" JSONB,
    "createdId" INTEGER NOT NULL,
    "updatedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_grid_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_grid_preferences_userId_idx" ON "user_grid_preferences"("userId");

-- CreateIndex
CREATE INDEX "user_grid_preferences_createdId_idx" ON "user_grid_preferences"("createdId");

-- CreateIndex
CREATE INDEX "user_grid_preferences_updatedId_idx" ON "user_grid_preferences"("updatedId");

-- CreateIndex
CREATE UNIQUE INDEX "user_grid_preferences_userId_viewKey_key" ON "user_grid_preferences"("userId", "viewKey");

-- AddForeignKey
ALTER TABLE "user_grid_preferences" ADD CONSTRAINT "user_grid_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_grid_preferences" ADD CONSTRAINT "user_grid_preferences_createdId_fkey" FOREIGN KEY ("createdId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_grid_preferences" ADD CONSTRAINT "user_grid_preferences_updatedId_fkey" FOREIGN KEY ("updatedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
