import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectPrisma(): Promise<void> {
  const retryMs = Number(process.env.DB_CONNECT_RETRY_MS ?? 3000);
  const maxRetries = Number(process.env.DB_CONNECT_MAX_RETRIES ?? 0); // 0 = infinite
  let attempt = 0;

  while (true) {
    try {
      attempt += 1;
      await prisma.$connect();
      console.log(`[DB] Connected to PostgreSQL (attempt ${attempt})`);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const shouldStop = maxRetries > 0 && attempt >= maxRetries;

      console.error(
        `[DB] Connection attempt ${attempt} failed: ${message}. ${
          shouldStop ? 'No more retries.' : `Retrying in ${retryMs}ms...`
        }`
      );

      if (shouldStop) {
        throw error;
      }

      await sleep(retryMs);
    }
  }
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  console.log('[DB] Disconnected from PostgreSQL');
}
