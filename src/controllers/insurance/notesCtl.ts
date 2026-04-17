import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { parseId, requireActorId } from './common';

type NoteBody = {
  policyId?: number | null;
  transactionId?: number | null;
  noteType?: string | null;
  text?: string;
};

// Lists policy notes with linked policy/transaction.
export async function listPolicyNotes(_req: Request, res: Response): Promise<Response> {
  try {
    const rows = await prisma.policyNote.findMany({
      orderBy: { id: 'desc' },
      include: {
        policy: { include: { customer: true } },
        transaction: true,
      },
      take: 500,
    });
    return res.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch policy notes';
    return res.status(500).json({ error: message });
  }
}

// Gets a single policy note by id.
export async function getPolicyNoteById(req: Request, res: Response): Promise<Response> {
  try {
    const id = parseId(req.params.id);
    const row = await prisma.policyNote.findUnique({
      where: { id },
      include: {
        policy: { include: { customer: true } },
        transaction: true,
      },
    });

    if (!row) return res.status(404).json({ error: 'Not Found' });
    return res.json(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch policy note';
    if (message.includes('Invalid id')) return res.status(400).json({ error: message });
    return res.status(500).json({ error: message });
  }
}

// Creates a policy note linked to policy or transaction.
export async function createPolicyNote(req: Request, res: Response): Promise<Response> {
  try {
    const actorId = requireActorId(req);
    const body = req.body as NoteBody;

    if (!body.text?.trim()) {
      return res.status(400).json({ error: 'text is required' });
    }

    const created = await prisma.policyNote.create({
      data: {
        policyId: body.policyId ?? null,
        transactionId: body.transactionId ?? null,
        noteType: body.noteType ?? null,
        text: body.text.trim(),
        createdId: actorId,
        updatedId: actorId,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create policy note';
    return res.status(400).json({ error: message });
  }
}

// Updates a policy note by id.
export async function updatePolicyNote(req: Request, res: Response): Promise<Response> {
  try {
    const actorId = requireActorId(req);
    const id = parseId(req.params.id);
    const body = req.body as NoteBody;

    const updated = await prisma.policyNote.update({
      where: { id },
      data: {
        policyId: body.policyId,
        transactionId: body.transactionId,
        noteType: body.noteType,
        text: body.text,
        updatedId: actorId,
      },
    });

    return res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update policy note';
    if (message.includes('Invalid id')) return res.status(400).json({ error: message });
    if (message.includes('Record to update not found')) return res.status(404).json({ error: 'Not Found' });
    return res.status(400).json({ error: message });
  }
}

// Deletes a policy note by id.
export async function deletePolicyNote(req: Request, res: Response): Promise<Response> {
  try {
    const id = parseId(req.params.id);
    await prisma.policyNote.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete policy note';
    if (message.includes('Invalid id')) return res.status(400).json({ error: message });
    if (message.includes('Record to delete does not exist')) return res.status(404).json({ error: 'Not Found' });
    return res.status(400).json({ error: message });
  }
}
