-- CreateTable
CREATE TABLE "api_call_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "userName" TEXT,
    "method" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "functionName" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "calledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "api_call_logs_userId_idx" ON "api_call_logs"("userId");

-- CreateIndex
CREATE INDEX "api_call_logs_calledAt_idx" ON "api_call_logs"("calledAt");

-- AddForeignKey
ALTER TABLE "api_call_logs" ADD CONSTRAINT "api_call_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
