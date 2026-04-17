import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { parseId, requireActorId, toSingle } from './common';
import type { LookupItemBody, LookupRouteKey } from './types';

const lookupConfig = {
  'partners': {
    findMany: () => prisma.partner.findMany({ orderBy: { name: 'asc' } }),
    create: (body: LookupItemBody, actorId: number) =>
      prisma.partner.create({
        data: {
          code: body.code,
          name: body.name?.trim() ?? '',
          greekLabel: body.greekLabel,
          isActive: body.isActive ?? true,
          createdId: actorId,
          updatedId: actorId,
        },
      }),
    update: (id: number, body: LookupItemBody, actorId: number) =>
      prisma.partner.update({
        where: { id },
        data: {
          code: body.code,
          name: body.name,
          greekLabel: body.greekLabel,
          isActive: body.isActive,
          updatedId: actorId,
        },
      }),
    delete: (id: number) => prisma.partner.delete({ where: { id } }),
  },
  'companies': {
    findMany: () => prisma.insuranceCompany.findMany({ orderBy: { name: 'asc' } }),
    create: (body: LookupItemBody, actorId: number) =>
      prisma.insuranceCompany.create({
        data: {
          code: body.code,
          name: body.name?.trim() ?? '',
          greekLabel: body.greekLabel,
          isActive: body.isActive ?? true,
          createdId: actorId,
          updatedId: actorId,
        },
      }),
    update: (id: number, body: LookupItemBody, actorId: number) =>
      prisma.insuranceCompany.update({
        where: { id },
        data: {
          code: body.code,
          name: body.name,
          greekLabel: body.greekLabel,
          isActive: body.isActive,
          updatedId: actorId,
        },
      }),
    delete: (id: number) => prisma.insuranceCompany.delete({ where: { id } }),
  },
  'branches': {
    findMany: () => prisma.insuranceBranch.findMany({ orderBy: { name: 'asc' } }),
    create: (body: LookupItemBody, actorId: number) =>
      prisma.insuranceBranch.create({
        data: {
          code: body.code,
          name: body.name?.trim() ?? '',
          greekLabel: body.greekLabel,
          isActive: body.isActive ?? true,
          createdId: actorId,
          updatedId: actorId,
        },
      }),
    update: (id: number, body: LookupItemBody, actorId: number) =>
      prisma.insuranceBranch.update({
        where: { id },
        data: {
          code: body.code,
          name: body.name,
          greekLabel: body.greekLabel,
          isActive: body.isActive,
          updatedId: actorId,
        },
      }),
    delete: (id: number) => prisma.insuranceBranch.delete({ where: { id } }),
  },
  'contract-types': {
    findMany: () => prisma.contractType.findMany({ orderBy: { name: 'asc' }, include: { company: true } }),
    create: (body: LookupItemBody, actorId: number) =>
      prisma.contractType.create({
        data: {
          code: body.code,
          name: body.name?.trim() ?? '',
          greekLabel: body.greekLabel,
          companyId: body.companyId ?? null,
          createdId: actorId,
          updatedId: actorId,
        },
        include: { company: true },
      }),
    update: (id: number, body: LookupItemBody, actorId: number) =>
      prisma.contractType.update({
        where: { id },
        data: {
          code: body.code,
          name: body.name,
          greekLabel: body.greekLabel,
          companyId: body.companyId,
          updatedId: actorId,
        },
        include: { company: true },
      }),
    delete: (id: number) => prisma.contractType.delete({ where: { id } }),
  },
  'document-types': {
    findMany: () => prisma.documentType.findMany({ orderBy: { name: 'asc' } }),
    create: (body: LookupItemBody, actorId: number) =>
      prisma.documentType.create({
        data: {
          code: body.code,
          name: body.name?.trim() ?? '',
          greekLabel: body.greekLabel,
          isActive: body.isActive ?? true,
          createdId: actorId,
          updatedId: actorId,
        },
      }),
    update: (id: number, body: LookupItemBody, actorId: number) =>
      prisma.documentType.update({
        where: { id },
        data: {
          code: body.code,
          name: body.name,
          greekLabel: body.greekLabel,
          isActive: body.isActive,
          updatedId: actorId,
        },
      }),
    delete: (id: number) => prisma.documentType.delete({ where: { id } }),
  },
  'production-types': {
    findMany: () => prisma.productionType.findMany({ orderBy: { name: 'asc' } }),
    create: (body: LookupItemBody, actorId: number) =>
      prisma.productionType.create({
        data: {
          code: body.code,
          name: body.name?.trim() ?? '',
          greekLabel: body.greekLabel,
          isActive: body.isActive ?? true,
          createdId: actorId,
          updatedId: actorId,
        },
      }),
    update: (id: number, body: LookupItemBody, actorId: number) =>
      prisma.productionType.update({
        where: { id },
        data: {
          code: body.code,
          name: body.name,
          greekLabel: body.greekLabel,
          isActive: body.isActive,
          updatedId: actorId,
        },
      }),
    delete: (id: number) => prisma.productionType.delete({ where: { id } }),
  },
  'payment-frequencies': {
    findMany: () => prisma.paymentFrequency.findMany({ orderBy: { value: 'asc' } }),
    create: (body: LookupItemBody, actorId: number) =>
      prisma.paymentFrequency.create({
        data: {
          value: body.value ?? 0,
          name: body.name,
          greekLabel: body.greekLabel,
          createdId: actorId,
          updatedId: actorId,
        },
      }),
    update: (id: number, body: LookupItemBody, actorId: number) =>
      prisma.paymentFrequency.update({
        where: { id },
        data: {
          value: body.value,
          name: body.name,
          greekLabel: body.greekLabel,
          updatedId: actorId,
        },
      }),
    delete: (id: number) => prisma.paymentFrequency.delete({ where: { id } }),
  },
};

function resolveLookupConfig(type: string) {
  const entry = lookupConfig[type as LookupRouteKey];
  if (!entry) {
    throw new Error('Unsupported lookup type');
  }
  return entry;
}

// Returns all insurance lookup tables used by forms and filters.
export async function getInsuranceLookups(_req: Request, res: Response): Promise<Response> {
  try {
    const [partners, companies, branches, contractTypes, documentTypes, productionTypes, paymentFrequencies] =
      await Promise.all([
        prisma.partner.findMany({ orderBy: { name: 'asc' } }),
        prisma.insuranceCompany.findMany({ orderBy: { name: 'asc' } }),
        prisma.insuranceBranch.findMany({ orderBy: { name: 'asc' } }),
        prisma.contractType.findMany({ orderBy: { name: 'asc' }, include: { company: true } }),
        prisma.documentType.findMany({ orderBy: { name: 'asc' } }),
        prisma.productionType.findMany({ orderBy: { name: 'asc' } }),
        prisma.paymentFrequency.findMany({ orderBy: { value: 'asc' } }),
      ]);

    return res.json({
      partners,
      companies,
      branches,
      contractTypes,
      documentTypes,
      productionTypes,
      paymentFrequencies,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch lookups';
    return res.status(500).json({ error: message });
  }
}

// Lists lookup rows for a specific lookup type.
export async function listLookupItems(req: Request, res: Response): Promise<Response> {
  try {
    const lookupType = toSingle(req.params.type);
    const config = resolveLookupConfig(lookupType);
    const data = await config.findMany();
    return res.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch lookup items';
    const code = message.includes('Unsupported') ? 400 : 500;
    return res.status(code).json({ error: message });
  }
}

// Creates a new lookup row in the requested lookup type.
export async function createLookupItem(req: Request, res: Response): Promise<Response> {
  try {
    const actorId = requireActorId(req);
    const lookupType = toSingle(req.params.type);
    const config = resolveLookupConfig(lookupType);
    const body = req.body as LookupItemBody;

    if (lookupType === 'payment-frequencies') {
      if (!Number.isInteger(body.value) || (body.value ?? 0) <= 0) {
        return res.status(400).json({ error: 'value must be a positive integer' });
      }
    } else if (!body.name?.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    const created = await config.create(body, actorId);
    return res.status(201).json(created);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create lookup item';
    const code = message.includes('Unique constraint') ? 409 : 400;
    return res.status(code).json({ error: message });
  }
}

// Updates an existing lookup row.
export async function updateLookupItem(req: Request, res: Response): Promise<Response> {
  try {
    const actorId = requireActorId(req);
    const lookupType = toSingle(req.params.type);
    const config = resolveLookupConfig(lookupType);
    const id = parseId(req.params.id);
    const body = req.body as LookupItemBody;

    const updated = await config.update(id, body, actorId);
    return res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update lookup item';
    if (message.includes('Invalid id')) return res.status(400).json({ error: message });
    if (message.includes('Record to update not found')) return res.status(404).json({ error: 'Not Found' });
    if (message.includes('Unique constraint')) return res.status(409).json({ error: message });
    return res.status(400).json({ error: message });
  }
}

// Deletes a lookup row if it is not used by other records.
export async function deleteLookupItem(req: Request, res: Response): Promise<Response> {
  try {
    const lookupType = toSingle(req.params.type);
    const config = resolveLookupConfig(lookupType);
    const id = parseId(req.params.id);
    await config.delete(id);
    return res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete lookup item';
    if (message.includes('Invalid id')) return res.status(400).json({ error: message });
    if (message.includes('Record to delete does not exist')) return res.status(404).json({ error: 'Not Found' });
    if (message.includes('Foreign key constraint')) {
      return res.status(409).json({ error: 'Cannot delete lookup item because it is already used.' });
    }
    return res.status(400).json({ error: message });
  }
}
