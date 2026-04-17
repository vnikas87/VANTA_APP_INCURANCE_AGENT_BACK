import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { asDate, parseId, requireActorId } from './common';
import type { PolicyBody } from './types';

// Lists all policies with related customer and lookup entities.
export async function listPolicies(_req: Request, res: Response): Promise<Response> {
  try {
    const policies = await prisma.policy.findMany({
      orderBy: { id: 'desc' },
      include: {
        customer: true,
        partner: true,
        company: true,
        branch: true,
        contractType: true,
      },
    });
    return res.json(policies);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch policies';
    return res.status(500).json({ error: message });
  }
}

// Creates a policy row and links it to customer and optional lookup values.
export async function createPolicy(req: Request, res: Response): Promise<Response> {
  try {
    const actorId = requireActorId(req);
    const body = req.body as PolicyBody;

    if (!body.customerId || !Number.isInteger(body.customerId)) {
      return res.status(400).json({ error: 'customerId is required' });
    }

    const created = await prisma.policy.create({
      data: {
        policyNumber: body.policyNumber,
        identifier: body.identifier,
        customerId: body.customerId,
        partnerId: body.partnerId ?? null,
        companyId: body.companyId ?? null,
        branchId: body.branchId ?? null,
        contractTypeId: body.contractTypeId ?? null,
        startDate: asDate(body.startDate),
        endDate: asDate(body.endDate),
        isActive: body.isActive ?? true,
        createdId: actorId,
        updatedId: actorId,
      },
      include: {
        customer: true,
        partner: true,
        company: true,
        branch: true,
        contractType: true,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create policy';
    if (message.includes('Unique constraint')) return res.status(409).json({ error: message });
    return res.status(400).json({ error: message });
  }
}

// Gets one policy with related entities by id.
export async function getPolicyById(req: Request, res: Response): Promise<Response> {
  try {
    const id = parseId(req.params.id);
    const policy = await prisma.policy.findUnique({
      where: { id },
      include: {
        customer: true,
        partner: true,
        company: true,
        branch: true,
        contractType: true,
        transactions: { include: { financials: true } },
      },
    });

    if (!policy) return res.status(404).json({ error: 'Not Found' });
    return res.json(policy);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch policy';
    if (message.includes('Invalid id')) return res.status(400).json({ error: message });
    return res.status(500).json({ error: message });
  }
}

// Updates a policy row by id.
export async function updatePolicy(req: Request, res: Response): Promise<Response> {
  try {
    const actorId = requireActorId(req);
    const id = parseId(req.params.id);
    const body = req.body as PolicyBody;

    const updated = await prisma.policy.update({
      where: { id },
      data: {
        policyNumber: body.policyNumber,
        identifier: body.identifier,
        customerId: body.customerId,
        partnerId: body.partnerId,
        companyId: body.companyId,
        branchId: body.branchId,
        contractTypeId: body.contractTypeId,
        startDate: asDate(body.startDate),
        endDate: asDate(body.endDate),
        isActive: body.isActive,
        updatedId: actorId,
      },
      include: {
        customer: true,
        partner: true,
        company: true,
        branch: true,
        contractType: true,
      },
    });

    return res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update policy';
    if (message.includes('Invalid id')) return res.status(400).json({ error: message });
    if (message.includes('Record to update not found')) return res.status(404).json({ error: 'Not Found' });
    if (message.includes('Unique constraint')) return res.status(409).json({ error: message });
    return res.status(400).json({ error: message });
  }
}

// Deletes a policy and cascades dependent transactions/notes where allowed.
export async function deletePolicy(req: Request, res: Response): Promise<Response> {
  try {
    const id = parseId(req.params.id);
    await prisma.policy.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete policy';
    if (message.includes('Invalid id')) return res.status(400).json({ error: message });
    if (message.includes('Record to delete does not exist')) return res.status(404).json({ error: 'Not Found' });
    return res.status(400).json({ error: message });
  }
}
