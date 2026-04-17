import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { normalizeCustomerFullName, parseId, requireActorId } from './common';
import type { CustomerBody } from './types';

// Lists all customers ordered by surname and first name.
export async function listCustomers(_req: Request, res: Response): Promise<Response> {
  try {
    const customers = await prisma.customer.findMany({ orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] });
    return res.json(customers);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch customers';
    return res.status(500).json({ error: message });
  }
}

// Creates a customer and sets audit fields from authenticated user.
export async function createCustomer(req: Request, res: Response): Promise<Response> {
  try {
    const actorId = requireActorId(req);
    const body = req.body as CustomerBody;

    if (!body.lastName?.trim()) {
      return res.status(400).json({ error: 'lastName is required' });
    }

    const created = await prisma.customer.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName.trim(),
        fullName: normalizeCustomerFullName(body),
        phone: body.phone,
        mobilePhone: body.mobilePhone,
        email: body.email,
        taxNumber: body.taxNumber,
        notes: body.notes,
        createdId: actorId,
        updatedId: actorId,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create customer';
    return res.status(400).json({ error: message });
  }
}

// Updates a customer by id and refreshes audit metadata.
export async function updateCustomer(req: Request, res: Response): Promise<Response> {
  try {
    const actorId = requireActorId(req);
    const id = parseId(req.params.id);
    const body = req.body as CustomerBody;

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        fullName: normalizeCustomerFullName(body),
        phone: body.phone,
        mobilePhone: body.mobilePhone,
        email: body.email,
        taxNumber: body.taxNumber,
        notes: body.notes,
        updatedId: actorId,
      },
    });

    return res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update customer';
    if (message.includes('Invalid id')) return res.status(400).json({ error: message });
    if (message.includes('Record to update not found')) return res.status(404).json({ error: 'Not Found' });
    return res.status(400).json({ error: message });
  }
}

// Deletes a customer when no dependent policies exist.
export async function deleteCustomer(req: Request, res: Response): Promise<Response> {
  try {
    const id = parseId(req.params.id);
    await prisma.customer.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete customer';
    if (message.includes('Invalid id')) return res.status(400).json({ error: message });
    if (message.includes('Record to delete does not exist')) return res.status(404).json({ error: 'Not Found' });
    if (message.includes('Foreign key constraint')) {
      return res.status(409).json({ error: 'Cannot delete customer because policies already exist.' });
    }
    return res.status(400).json({ error: message });
  }
}
