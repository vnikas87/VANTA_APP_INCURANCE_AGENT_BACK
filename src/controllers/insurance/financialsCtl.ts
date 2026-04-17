import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { asDecimal, parseId, requireActorId } from './common';
import type { FinancialBody } from './types';

// Lists policy financial rows with transaction context.
export async function listPolicyFinancials(_req: Request, res: Response): Promise<Response> {
  try {
    const rows = await prisma.policyFinancial.findMany({
      orderBy: { id: 'desc' },
      include: {
        transaction: {
          include: {
            policy: { include: { customer: true } },
          },
        },
      },
      take: 500,
    });
    return res.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch policy financials';
    return res.status(500).json({ error: message });
  }
}

// Gets one policy financial row by id.
export async function getPolicyFinancialById(req: Request, res: Response): Promise<Response> {
  try {
    const id = parseId(req.params.id);
    const row = await prisma.policyFinancial.findUnique({
      where: { id },
      include: {
        transaction: {
          include: {
            policy: { include: { customer: true } },
          },
        },
      },
    });

    if (!row) return res.status(404).json({ error: 'Not Found' });
    return res.json(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch policy financial';
    if (message.includes('Invalid id')) return res.status(400).json({ error: message });
    return res.status(500).json({ error: message });
  }
}

// Creates a policy financial row for a policy transaction.
export async function createPolicyFinancial(req: Request, res: Response): Promise<Response> {
  try {
    const actorId = requireActorId(req);
    const transactionId = Number((req.body as { transactionId?: number }).transactionId);
    const body = req.body as FinancialBody & { transactionId?: number };

    if (!Number.isInteger(transactionId) || transactionId <= 0) {
      return res.status(400).json({ error: 'transactionId is required' });
    }

    const created = await prisma.policyFinancial.create({
      data: {
        transactionId,
        annualNetAmount: asDecimal(body.annualNetAmount),
        annualGrossAmount: asDecimal(body.annualGrossAmount),
        installmentNetAmount: asDecimal(body.installmentNetAmount),
        installmentGrossAmount: asDecimal(body.installmentGrossAmount),
        contractRate: asDecimal(body.contractRate),
        contractCommission: asDecimal(body.contractCommission),
        incomingCommission: asDecimal(body.incomingCommission),
        performanceRate: asDecimal(body.performanceRate),
        performanceAmount: asDecimal(body.performanceAmount),
        differenceAmount: asDecimal(body.differenceAmount),
        createdId: actorId,
        updatedId: actorId,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create policy financial';
    return res.status(400).json({ error: message });
  }
}

// Updates an existing policy financial row.
export async function updatePolicyFinancial(req: Request, res: Response): Promise<Response> {
  try {
    const actorId = requireActorId(req);
    const id = parseId(req.params.id);
    const body = req.body as FinancialBody;

    const updated = await prisma.policyFinancial.update({
      where: { id },
      data: {
        annualNetAmount: asDecimal(body.annualNetAmount),
        annualGrossAmount: asDecimal(body.annualGrossAmount),
        installmentNetAmount: asDecimal(body.installmentNetAmount),
        installmentGrossAmount: asDecimal(body.installmentGrossAmount),
        contractRate: asDecimal(body.contractRate),
        contractCommission: asDecimal(body.contractCommission),
        incomingCommission: asDecimal(body.incomingCommission),
        performanceRate: asDecimal(body.performanceRate),
        performanceAmount: asDecimal(body.performanceAmount),
        differenceAmount: asDecimal(body.differenceAmount),
        updatedId: actorId,
      },
    });

    return res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update policy financial';
    if (message.includes('Invalid id')) return res.status(400).json({ error: message });
    if (message.includes('Record to update not found')) return res.status(404).json({ error: 'Not Found' });
    return res.status(400).json({ error: message });
  }
}

// Deletes a policy financial row by id.
export async function deletePolicyFinancial(req: Request, res: Response): Promise<Response> {
  try {
    const id = parseId(req.params.id);
    await prisma.policyFinancial.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete policy financial';
    if (message.includes('Invalid id')) return res.status(400).json({ error: message });
    if (message.includes('Record to delete does not exist')) return res.status(404).json({ error: 'Not Found' });
    return res.status(400).json({ error: message });
  }
}
