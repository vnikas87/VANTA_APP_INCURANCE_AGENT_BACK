import { Prisma } from '@prisma/client';
import { Request } from 'express';
import type { CustomerBody } from './types';

export function requireActorId(req: Request): number {
  const actorId = req.user?.dbUserId;
  if (!actorId) {
    throw new Error('Authenticated DB user not found');
  }
  return actorId;
}

export function toSingle(value: unknown): string {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }
  return typeof value === 'string' ? value : '';
}

export function parseId(value: unknown): number {
  const id = Number(toSingle(value));
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('Invalid id');
  }
  return id;
}

export function asDate(value?: string | null): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid date format');
  }
  return d;
}

export function asDecimal(value?: number | string | null): Prisma.Decimal | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return new Prisma.Decimal(value);
}

export function normalizeCustomerFullName(input: CustomerBody): string | null {
  if (input.fullName && input.fullName.trim()) return input.fullName.trim();
  const first = input.firstName?.trim() ?? '';
  const last = input.lastName?.trim() ?? '';
  const full = `${last} ${first}`.trim();
  return full || null;
}
