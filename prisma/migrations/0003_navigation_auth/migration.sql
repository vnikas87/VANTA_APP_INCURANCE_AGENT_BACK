-- CreateTable
CREATE TABLE "auth_event_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "userName" TEXT,
    "eventType" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation_groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigation_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation_folders" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigation_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation_sub_folders" (
    "id" SERIAL NOT NULL,
    "folderId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigation_sub_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation_access_rules" (
    "id" SERIAL NOT NULL,
    "subFolderId" INTEGER NOT NULL,
    "roleName" TEXT NOT NULL,
    "canAccess" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigation_access_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_event_logs_userId_idx" ON "auth_event_logs"("userId");

-- CreateIndex
CREATE INDEX "auth_event_logs_createdAt_idx" ON "auth_event_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "navigation_groups_name_key" ON "navigation_groups"("name");

-- CreateIndex
CREATE INDEX "navigation_groups_sortOrder_idx" ON "navigation_groups"("sortOrder");

-- CreateIndex
CREATE INDEX "navigation_folders_groupId_idx" ON "navigation_folders"("groupId");

-- CreateIndex
CREATE INDEX "navigation_folders_sortOrder_idx" ON "navigation_folders"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "navigation_folders_groupId_name_key" ON "navigation_folders"("groupId", "name");

-- CreateIndex
CREATE INDEX "navigation_sub_folders_folderId_idx" ON "navigation_sub_folders"("folderId");

-- CreateIndex
CREATE INDEX "navigation_sub_folders_sortOrder_idx" ON "navigation_sub_folders"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "navigation_sub_folders_folderId_path_key" ON "navigation_sub_folders"("folderId", "path");

-- CreateIndex
CREATE INDEX "navigation_access_rules_subFolderId_idx" ON "navigation_access_rules"("subFolderId");

-- CreateIndex
CREATE INDEX "navigation_access_rules_roleName_idx" ON "navigation_access_rules"("roleName");

-- CreateIndex
CREATE UNIQUE INDEX "navigation_access_rules_subFolderId_roleName_key" ON "navigation_access_rules"("subFolderId", "roleName");

-- AddForeignKey
ALTER TABLE "auth_event_logs" ADD CONSTRAINT "auth_event_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigation_folders" ADD CONSTRAINT "navigation_folders_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "navigation_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigation_sub_folders" ADD CONSTRAINT "navigation_sub_folders_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "navigation_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigation_access_rules" ADD CONSTRAINT "navigation_access_rules_subFolderId_fkey" FOREIGN KEY ("subFolderId") REFERENCES "navigation_sub_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
