import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { asDate, asDecimal, parseId, requireActorId } from './common';
import type { CreateProductionRecordBody, TransactionBody } from './types';

function toList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item).split(',')).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function toIntList(value: unknown): number[] {
  return toList(value)
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);
}

function toNumber(value: unknown): number | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

type ColumnFilter = {
  columnName: string;
  value: string;
  operator?: string;
};

function parseColumnFilters(value: unknown): ColumnFilter[] {
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => typeof item?.columnName === 'string' && typeof item?.value === 'string')
      .map((item) => ({
        columnName: item.columnName.trim(),
        value: item.value.trim(),
        operator: typeof item.operator === 'string' ? item.operator.trim() : undefined,
      }))
      .filter((item) => item.columnName && item.value);
  } catch {
    return [];
  }
}

function toDateRange(value: string): { gte: Date; lt: Date } | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const gte = new Date(date);
  gte.setHours(0, 0, 0, 0);
  const lt = new Date(gte);
  lt.setDate(lt.getDate() + 1);
  return { gte, lt };
}

// Lists production transactions with policy and financial details.
export async function listProductionRecords(req: Request, res: Response): Promise<Response> {
  try {
    const q = (typeof req.query.q === 'string' ? req.query.q.trim() : '').toLowerCase();
    const customerIds = toIntList(req.query.customerIds);
    const companyIds = toIntList(req.query.companyIds);
    const productionTypeIds = toIntList(req.query.productionTypeIds);
    const insuranceYears = toIntList(req.query.insuranceYears);
    const applicationDateFrom = typeof req.query.applicationDateFrom === 'string' ? req.query.applicationDateFrom : '';
    const applicationDateTo = typeof req.query.applicationDateTo === 'string' ? req.query.applicationDateTo : '';
    const annualNetMin = toNumber(req.query.annualNetMin);
    const annualNetMax = toNumber(req.query.annualNetMax);
    const qNumber = toNumber(req.query.q);
    const columnFilters = parseColumnFilters(req.query.columnFilters);

    const where: Prisma.PolicyTransactionWhereInput = {};
    const and: Prisma.PolicyTransactionWhereInput[] = [];

    if (customerIds.length > 0) {
      and.push({ policy: { customerId: { in: customerIds } } });
    }

    if (companyIds.length > 0) {
      and.push({ policy: { companyId: { in: companyIds } } });
    }

    if (productionTypeIds.length > 0) {
      and.push({ productionTypeId: { in: productionTypeIds } });
    }

    if (insuranceYears.length > 0) {
      and.push({ insuranceYear: { in: insuranceYears } });
    }

    if (applicationDateFrom) {
      and.push({ applicationDate: { gte: new Date(applicationDateFrom) } });
    }

    if (applicationDateTo) {
      and.push({ applicationDate: { lte: new Date(applicationDateTo) } });
    }

    if (annualNetMin !== null || annualNetMax !== null) {
      and.push({
        financials: {
          some: {
            annualNetAmount: {
              ...(annualNetMin !== null ? { gte: new Prisma.Decimal(annualNetMin) } : {}),
              ...(annualNetMax !== null ? { lte: new Prisma.Decimal(annualNetMax) } : {}),
            },
          },
        },
      });
    }

    if (q) {
      const orFilters: Prisma.PolicyTransactionWhereInput[] = [
        { policy: { policyNumber: { contains: q, mode: 'insensitive' } } },
        { policy: { identifier: { contains: q, mode: 'insensitive' } } },
        { policy: { customer: { firstName: { contains: q, mode: 'insensitive' } } } },
        { policy: { customer: { lastName: { contains: q, mode: 'insensitive' } } } },
        { policy: { partner: { name: { contains: q, mode: 'insensitive' } } } },
        { policy: { company: { name: { contains: q, mode: 'insensitive' } } } },
        { policy: { branch: { name: { contains: q, mode: 'insensitive' } } } },
        { documentType: { name: { contains: q, mode: 'insensitive' } } },
        { productionType: { name: { contains: q, mode: 'insensitive' } } },
        { paymentFrequency: { name: { contains: q, mode: 'insensitive' } } },
        { remarks: { contains: q, mode: 'insensitive' } },
      ];

      if (qNumber !== null) {
        orFilters.push(
          { financials: { some: { annualNetAmount: { equals: asDecimal(String(qNumber)) } } } },
          { financials: { some: { contractCommission: { equals: asDecimal(String(qNumber)) } } } },
          { financials: { some: { differenceAmount: { equals: asDecimal(String(qNumber)) } } } }
        );
      }

      and.push({
        OR: orFilters,
      });
    }

    const fieldGroups = new Map<string, ColumnFilter[]>();
    for (const filter of columnFilters) {
      const current = fieldGroups.get(filter.columnName) ?? [];
      current.push(filter);
      fieldGroups.set(filter.columnName, current);
    }

    const byTextOperator = (value: string, operator: string | undefined) => {
      const op = operator ?? 'contains';
      if (op === 'equals') return { equals: value, mode: 'insensitive' as const };
      if (op === 'startsWith') return { startsWith: value, mode: 'insensitive' as const };
      return { contains: value, mode: 'insensitive' as const };
    };

    const byNumberOperator = (value: number, operator: string | undefined) => {
      const op = operator ?? 'equals';
      if (op === 'gte') return { gte: value };
      if (op === 'lte') return { lte: value };
      return { equals: value };
    };

    const byDecimalOperator = (value: number, operator: string | undefined) => {
      const op = operator ?? 'equals';
      const decimal = new Prisma.Decimal(value);
      if (op === 'gte') return { gte: decimal };
      if (op === 'lte') return { lte: decimal };
      return { equals: decimal };
    };

    for (const [field, filters] of fieldGroups) {
      const groupConditions: Prisma.PolicyTransactionWhereInput[] = [];

      for (const filter of filters) {
      const rawValue = filter.value.trim();
      const numericValue = toNumber(rawValue);
      if (!rawValue) continue;

      switch (field) {
        case 'id':
          if (numericValue !== null) groupConditions.push({ id: byNumberOperator(Math.trunc(numericValue), filter.operator) });
          break;
        case 'customer':
          groupConditions.push({
            OR: [
              { policy: { customer: { firstName: byTextOperator(rawValue, filter.operator) } } },
              { policy: { customer: { lastName: byTextOperator(rawValue, filter.operator) } } },
            ],
          });
          break;
        case 'policyNumber':
          groupConditions.push({ policy: { policyNumber: byTextOperator(rawValue, filter.operator) } });
          break;
        case 'identifier':
          groupConditions.push({ policy: { identifier: byTextOperator(rawValue, filter.operator) } });
          break;
        case 'partner':
          groupConditions.push({ policy: { partner: { name: byTextOperator(rawValue, filter.operator) } } });
          break;
        case 'company':
          groupConditions.push({ policy: { company: { name: byTextOperator(rawValue, filter.operator) } } });
          break;
        case 'branch':
          groupConditions.push({ policy: { branch: { name: byTextOperator(rawValue, filter.operator) } } });
          break;
        case 'contractType':
          groupConditions.push({ policy: { contractType: { name: byTextOperator(rawValue, filter.operator) } } });
          break;
        case 'documentType':
          groupConditions.push({ documentType: { name: byTextOperator(rawValue, filter.operator) } });
          break;
        case 'productionType':
          groupConditions.push({ productionType: { name: byTextOperator(rawValue, filter.operator) } });
          break;
        case 'paymentFrequency':
          groupConditions.push({ paymentFrequency: { name: byTextOperator(rawValue, filter.operator) } });
          break;
        case 'applicationDate':
          {
            const date = new Date(rawValue);
            if (!Number.isNaN(date.getTime())) {
              if (filter.operator === 'gte') groupConditions.push({ applicationDate: { gte: date } });
              else if (filter.operator === 'lte') groupConditions.push({ applicationDate: { lte: date } });
              else {
                const range = toDateRange(rawValue);
                if (range) groupConditions.push({ applicationDate: range });
              }
            }
          }
          break;
        case 'issueDate':
          {
            const date = new Date(rawValue);
            if (!Number.isNaN(date.getTime())) {
              if (filter.operator === 'gte') groupConditions.push({ issueDate: { gte: date } });
              else if (filter.operator === 'lte') groupConditions.push({ issueDate: { lte: date } });
              else {
                const range = toDateRange(rawValue);
                if (range) groupConditions.push({ issueDate: range });
              }
            }
          }
          break;
        case 'deliveryDate':
          {
            const date = new Date(rawValue);
            if (!Number.isNaN(date.getTime())) {
              if (filter.operator === 'gte') groupConditions.push({ deliveryDate: { gte: date } });
              else if (filter.operator === 'lte') groupConditions.push({ deliveryDate: { lte: date } });
              else {
                const range = toDateRange(rawValue);
                if (range) groupConditions.push({ deliveryDate: range });
              }
            }
          }
          break;
        case 'insuranceYear':
          if (numericValue !== null) groupConditions.push({ insuranceYear: byNumberOperator(Math.trunc(numericValue), filter.operator) });
          break;
        case 'installmentNumber':
          if (numericValue !== null) groupConditions.push({ installmentNumber: byNumberOperator(Math.trunc(numericValue), filter.operator) });
          break;
        case 'annualNetAmount':
          if (numericValue !== null) {
            groupConditions.push({ financials: { some: { annualNetAmount: byDecimalOperator(numericValue, filter.operator) } } });
          }
          break;
        case 'annualGrossAmount':
          if (numericValue !== null) {
            groupConditions.push({ financials: { some: { annualGrossAmount: byDecimalOperator(numericValue, filter.operator) } } });
          }
          break;
        case 'installmentNetAmount':
          if (numericValue !== null) {
            groupConditions.push({
              financials: { some: { installmentNetAmount: byDecimalOperator(numericValue, filter.operator) } },
            });
          }
          break;
        case 'installmentGrossAmount':
          if (numericValue !== null) {
            groupConditions.push({
              financials: { some: { installmentGrossAmount: byDecimalOperator(numericValue, filter.operator) } },
            });
          }
          break;
        case 'contractRate':
          if (numericValue !== null) {
            groupConditions.push({ financials: { some: { contractRate: byDecimalOperator(numericValue, filter.operator) } } });
          }
          break;
        case 'contractCommission':
          if (numericValue !== null) {
            groupConditions.push({
              financials: { some: { contractCommission: byDecimalOperator(numericValue, filter.operator) } },
            });
          }
          break;
        case 'incomingCommission':
          if (numericValue !== null) {
            groupConditions.push({
              financials: { some: { incomingCommission: byDecimalOperator(numericValue, filter.operator) } },
            });
          }
          break;
        case 'performanceRate':
          if (numericValue !== null) {
            groupConditions.push({
              financials: { some: { performanceRate: byDecimalOperator(numericValue, filter.operator) } },
            });
          }
          break;
        case 'performanceAmount':
          if (numericValue !== null) {
            groupConditions.push({
              financials: { some: { performanceAmount: byDecimalOperator(numericValue, filter.operator) } },
            });
          }
          break;
        case 'differenceAmount':
          if (numericValue !== null) {
            groupConditions.push({
              financials: { some: { differenceAmount: byDecimalOperator(numericValue, filter.operator) } },
            });
          }
          break;
        case 'remarks':
          groupConditions.push({ remarks: byTextOperator(rawValue, filter.operator) });
          break;
        default:
          break;
      }
    }
      if (groupConditions.length === 1) and.push(groupConditions[0]);
      if (groupConditions.length > 1) and.push({ OR: groupConditions });
    }

    if (and.length > 0) where.AND = and;

    const rows = await prisma.policyTransaction.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        documentType: true,
        productionType: true,
        paymentFrequency: true,
        financials: true,
        policy: {
          include: {
            customer: true,
            partner: true,
            company: true,
            branch: true,
            contractType: true,
          },
        },
      },
      take: 500,
    });

    return res.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch production records';
    return res.status(500).json({ error: message });
  }
}

// Creates a production transaction and optional financial row in one DB transaction.
export async function createProductionRecord(req: Request, res: Response): Promise<Response> {
  try {
    const actorId = requireActorId(req);
    const body = req.body as CreateProductionRecordBody;

    if (!body.transaction) {
      return res.status(400).json({ error: 'transaction payload is required' });
    }

    const transactionPayload = body.transaction;
    const result = await prisma.$transaction(async (tx) => {
      let policyId = body.policyId;

      if (!policyId && body.policy) {
        if (!body.policy.customerId || !Number.isInteger(body.policy.customerId)) {
          throw new Error('policy.customerId is required when policyId is not provided');
        }

        const createdPolicy = await tx.policy.create({
          data: {
            policyNumber: body.policy.policyNumber,
            identifier: body.policy.identifier,
            customerId: body.policy.customerId,
            partnerId: body.policy.partnerId ?? null,
            companyId: body.policy.companyId ?? null,
            branchId: body.policy.branchId ?? null,
            contractTypeId: body.policy.contractTypeId ?? null,
            startDate: asDate(body.policy.startDate),
            endDate: asDate(body.policy.endDate),
            isActive: body.policy.isActive ?? true,
            createdId: actorId,
            updatedId: actorId,
          },
        });

        policyId = createdPolicy.id;
      }

      if (!policyId) {
        throw new Error('policyId or policy object is required');
      }

      const createdTransaction = await tx.policyTransaction.create({
        data: {
          policyId,
          applicationDate: asDate(transactionPayload.applicationDate),
          issueDate: asDate(transactionPayload.issueDate),
          deliveryDate: asDate(transactionPayload.deliveryDate),
          documentTypeId: transactionPayload.documentTypeId ?? null,
          productionTypeId: transactionPayload.productionTypeId ?? null,
          paymentFrequencyId: transactionPayload.paymentFrequencyId ?? null,
          insuranceYear: transactionPayload.insuranceYear ?? null,
          installmentNumber: transactionPayload.installmentNumber ?? null,
          remarks: transactionPayload.remarks ?? null,
          createdId: actorId,
          updatedId: actorId,
        },
      });

      if (body.financial) {
        await tx.policyFinancial.create({
          data: {
            transactionId: createdTransaction.id,
            annualNetAmount: asDecimal(body.financial.annualNetAmount),
            annualGrossAmount: asDecimal(body.financial.annualGrossAmount),
            installmentNetAmount: asDecimal(body.financial.installmentNetAmount),
            installmentGrossAmount: asDecimal(body.financial.installmentGrossAmount),
            contractRate: asDecimal(body.financial.contractRate),
            contractCommission: asDecimal(body.financial.contractCommission),
            incomingCommission: asDecimal(body.financial.incomingCommission),
            performanceRate: asDecimal(body.financial.performanceRate),
            performanceAmount: asDecimal(body.financial.performanceAmount),
            differenceAmount: asDecimal(body.financial.differenceAmount),
            createdId: actorId,
            updatedId: actorId,
          },
        });
      }

      return tx.policyTransaction.findUnique({
        where: { id: createdTransaction.id },
        include: {
          documentType: true,
          productionType: true,
          paymentFrequency: true,
          financials: true,
          policy: {
            include: {
              customer: true,
              partner: true,
              company: true,
              branch: true,
              contractType: true,
            },
          },
        },
      });
    });

    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create production record';
    if (message.includes('Unique constraint')) return res.status(409).json({ error: message });
    return res.status(400).json({ error: message });
  }
}

// Gets one production transaction by id with full relations.
export async function getProductionRecordById(req: Request, res: Response): Promise<Response> {
  try {
    const id = parseId(req.params.id);
    const row = await prisma.policyTransaction.findUnique({
      where: { id },
      include: {
        documentType: true,
        productionType: true,
        paymentFrequency: true,
        financials: true,
        notes: true,
        policy: {
          include: {
            customer: true,
            partner: true,
            company: true,
            branch: true,
            contractType: true,
          },
        },
      },
    });

    if (!row) return res.status(404).json({ error: 'Not Found' });
    return res.json(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch production record';
    if (message.includes('Invalid id')) return res.status(400).json({ error: message });
    return res.status(500).json({ error: message });
  }
}

// Updates a production transaction by id.
export async function updateProductionRecord(req: Request, res: Response): Promise<Response> {
  try {
    const actorId = requireActorId(req);
    const id = parseId(req.params.id);
    const body = req.body as TransactionBody & { policyId?: number };

    const updated = await prisma.policyTransaction.update({
      where: { id },
      data: {
        policyId: body.policyId,
        applicationDate: asDate(body.applicationDate),
        issueDate: asDate(body.issueDate),
        deliveryDate: asDate(body.deliveryDate),
        documentTypeId: body.documentTypeId,
        productionTypeId: body.productionTypeId,
        paymentFrequencyId: body.paymentFrequencyId,
        insuranceYear: body.insuranceYear,
        installmentNumber: body.installmentNumber,
        remarks: body.remarks,
        updatedId: actorId,
      },
      include: {
        documentType: true,
        productionType: true,
        paymentFrequency: true,
        financials: true,
        policy: { include: { customer: true } },
      },
    });

    return res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update production record';
    if (message.includes('Invalid id')) return res.status(400).json({ error: message });
    if (message.includes('Record to update not found')) return res.status(404).json({ error: 'Not Found' });
    return res.status(400).json({ error: message });
  }
}

// Deletes a production transaction by id.
export async function deleteProductionRecord(req: Request, res: Response): Promise<Response> {
  try {
    const id = parseId(req.params.id);
    await prisma.policyTransaction.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete production record';
    if (message.includes('Invalid id')) return res.status(400).json({ error: message });
    if (message.includes('Record to delete does not exist')) return res.status(404).json({ error: 'Not Found' });
    return res.status(400).json({ error: message });
  }
}
