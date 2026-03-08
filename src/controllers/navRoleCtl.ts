import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

type NavRoleBody = {
  name?: string;
  description?: string;
  isSystem?: boolean;
};

export async function getNavigationRoles(_req: Request, res: Response): Promise<Response> {
  try {
    const roles = await prisma.navigationRole.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });

    return res.json(roles);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch navigation roles';
    return res.status(500).json({ error: message });
  }
}

export async function createNavigationRole(req: Request, res: Response): Promise<Response> {
  try {
    const { name, description, isSystem } = req.body as NavRoleBody;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    const created = await prisma.navigationRole.create({
      data: {
        name: name.trim().toUpperCase(),
        description: description?.trim() || null,
        isSystem: Boolean(isSystem),
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create navigation role';
    if (message.includes('Unique constraint')) {
      return res.status(409).json({ error: 'Navigation role already exists' });
    }
    return res.status(400).json({ error: message });
  }
}

export async function updateNavigationRole(req: Request, res: Response): Promise<Response> {
  try {
    const id = Number(req.params.id);
    const { name, description, isSystem } = req.body as NavRoleBody;
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'invalid role id' });
    }

    const existing = await prisma.navigationRole.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const nextName = name?.trim().toUpperCase();

    const updated = await prisma.$transaction(async (tx) => {
      const role = await tx.navigationRole.update({
        where: { id },
        data: {
          name: nextName,
          description: description !== undefined ? description?.trim() || null : undefined,
          isSystem,
        },
      });

      if (nextName && nextName !== existing.name) {
        await tx.navigationAccessRule.updateMany({
          where: { roleName: existing.name },
          data: { roleName: nextName },
        });
      }

      return role;
    });

    return res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update navigation role';
    if (message.includes('Unique constraint')) {
      return res.status(409).json({ error: 'Navigation role already exists' });
    }
    return res.status(400).json({ error: message });
  }
}

export async function deleteNavigationRole(req: Request, res: Response): Promise<Response> {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'invalid role id' });
    }

    const existing = await prisma.navigationRole.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const usedCount = await prisma.navigationAccessRule.count({
      where: { roleName: existing.name },
    });

    if (usedCount > 0) {
      return res.status(409).json({
        error: `Role is used in ${usedCount} navigation rule(s). Remove rules first.`,
      });
    }

    await prisma.navigationRole.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete navigation role';
    return res.status(400).json({ error: message });
  }
}
