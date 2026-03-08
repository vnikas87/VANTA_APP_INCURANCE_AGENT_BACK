import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function connectPrisma(): Promise<void> {
  await prisma.$connect();
  console.log('[DB] Connected to PostgreSQL');
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  console.log('[DB] Disconnected from PostgreSQL');
}
