import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

type GroupBody = {
  name?: string;
  sortOrder?: number;
};

type FolderBody = {
  groupId?: number;
  name?: string;
  sortOrder?: number;
};

type SubFolderBody = {
  folderId?: number;
  name?: string;
  path?: string;
  sortOrder?: number;
};

type RuleBody = {
  subFolderId?: number;
  roleName?: string;
  canAccess?: boolean;
};

type MoveFolderBody = {
  targetGroupId?: number;
  targetIndex?: number;
};

type MoveSubFolderBody = {
  targetFolderId?: number;
  targetIndex?: number;
};

const ROLE_ADMINISTRATOR = 'ADMINISTRATOR';
const ROLE_OPS_USER = 'OPS_USER';

const OPS_ALLOWED_EXACT_PATHS = new Set(['/']);
const OPS_ALLOWED_PREFIXES = ['/insurance/production', '/settings/profile'];

function normalizeRoles(roles: string[]): string[] {
  const normalized = roles.map((role) => role.toUpperCase().trim());

  // Support old/new naming to avoid lockouts during role migration.
  if (
    normalized.includes('OPS') ||
    normalized.includes('OPS_USER') ||
    normalized.includes('OPS_MANAGEMENT')
  ) {
    normalized.push('OPS');
    normalized.push(ROLE_OPS_USER);
  }

  if (normalized.includes('ADMIN')) {
    normalized.push(ROLE_ADMINISTRATOR);
  }

  return Array.from(new Set(normalized.filter(Boolean)));
}

function canAccessPath(path: string, roles: string[]): boolean {
  if (roles.includes(ROLE_ADMINISTRATOR)) {
    return true;
  }

  if (!roles.includes(ROLE_OPS_USER)) {
    return false;
  }

  if (OPS_ALLOWED_EXACT_PATHS.has(path)) {
    return true;
  }

  if (OPS_ALLOWED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return true;
  }

  return false;
}

async function isAllowedNavigationRole(roleName: string): Promise<boolean> {
  const normalized = roleName.toUpperCase().trim();
  return normalized === ROLE_ADMINISTRATOR || normalized === ROLE_OPS_USER;
}

export async function getNavigationMenu(req: Request, res: Response): Promise<Response> {
  try {
    const userRoles = normalizeRoles(req.user?.roles ?? []);
    if (!userRoles.includes(ROLE_ADMINISTRATOR) && !userRoles.includes(ROLE_OPS_USER)) {
      return res.json([]);
    }

    const groups = await prisma.navigationGroup.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        folders: {
          orderBy: { sortOrder: 'asc' },
          include: {
            subFolders: {
              orderBy: { sortOrder: 'asc' },
              include: { rules: true },
            },
          },
        },
      },
    });

    const filtered = groups
      .map((group) => ({
        ...group,
        folders: group.folders
          .map((folder) => ({
            ...folder,
            subFolders: folder.subFolders.filter((sub) => canAccessPath(sub.path, userRoles)),
          }))
          .filter((folder) => folder.subFolders.length > 0),
      }))
      .filter((group) => group.folders.length > 0);

    return res.json(filtered);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load navigation menu';
    return res.status(500).json({ error: message });
  }
}

export async function getNavigationAdmin(_req: Request, res: Response): Promise<Response> {
  try {
    const allowedRuleRoles = new Set([ROLE_ADMINISTRATOR, ROLE_OPS_USER]);
    const data = await prisma.navigationGroup.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        folders: {
          orderBy: { sortOrder: 'asc' },
          include: {
            subFolders: {
              orderBy: { sortOrder: 'asc' },
              include: { rules: { orderBy: { roleName: 'asc' } } },
            },
          },
        },
      },
    });

    const filtered = data.map((group) => ({
      ...group,
      folders: group.folders.map((folder) => ({
        ...folder,
        subFolders: folder.subFolders.map((subFolder) => ({
          ...subFolder,
          rules: subFolder.rules.filter((rule) => allowedRuleRoles.has(rule.roleName.toUpperCase())),
        })),
      })),
    }));

    return res.json(filtered);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load admin navigation';
    return res.status(500).json({ error: message });
  }
}

export async function createGroup(req: Request, res: Response): Promise<Response> {
  try {
    const { name, sortOrder } = req.body as GroupBody;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const created = await prisma.navigationGroup.create({
      data: {
        name,
        sortOrder: sortOrder ?? 0,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create group';
    return res.status(400).json({ error: message });
  }
}

export async function updateGroup(req: Request, res: Response): Promise<Response> {
  try {
    const id = Number(req.params.id);
    const { name, sortOrder } = req.body as GroupBody;

    const updated = await prisma.navigationGroup.update({
      where: { id },
      data: {
        name,
        sortOrder,
      },
    });

    return res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update group';
    return res.status(400).json({ error: message });
  }
}

export async function deleteGroup(req: Request, res: Response): Promise<Response> {
  try {
    const id = Number(req.params.id);
    await prisma.navigationGroup.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete group';
    return res.status(400).json({ error: message });
  }
}

export async function createFolder(req: Request, res: Response): Promise<Response> {
  try {
    const { groupId, name, sortOrder } = req.body as FolderBody;
    if (!groupId || !name) return res.status(400).json({ error: 'groupId and name are required' });

    const created = await prisma.navigationFolder.create({
      data: {
        groupId,
        name,
        sortOrder: sortOrder ?? 0,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create folder';
    return res.status(400).json({ error: message });
  }
}

export async function updateFolder(req: Request, res: Response): Promise<Response> {
  try {
    const id = Number(req.params.id);
    const { groupId, name, sortOrder } = req.body as FolderBody;

    const updated = await prisma.navigationFolder.update({
      where: { id },
      data: {
        groupId,
        name,
        sortOrder,
      },
    });

    return res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update folder';
    return res.status(400).json({ error: message });
  }
}

export async function deleteFolder(req: Request, res: Response): Promise<Response> {
  try {
    const id = Number(req.params.id);
    await prisma.navigationFolder.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete folder';
    return res.status(400).json({ error: message });
  }
}

export async function moveFolder(req: Request, res: Response): Promise<Response> {
  try {
    const id = Number(req.params.id);
    const { targetGroupId, targetIndex } = req.body as MoveFolderBody;
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'invalid folder id' });
    }
    if (!targetGroupId || !Number.isInteger(targetGroupId) || targetGroupId <= 0) {
      return res.status(400).json({ error: 'targetGroupId is required' });
    }

    await prisma.$transaction(async (tx) => {
      const moving = await tx.navigationFolder.findUnique({ where: { id } });
      if (!moving) throw new Error('Folder not found');

      const sourceGroupId = moving.groupId;
      const target = await tx.navigationGroup.findUnique({ where: { id: targetGroupId } });
      if (!target) throw new Error('Target group not found');

      const sourceFolders = await tx.navigationFolder.findMany({
        where: { groupId: sourceGroupId },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      });

      const sourceWithout = sourceFolders.filter((item) => item.id !== id);

      const targetBase =
        sourceGroupId === targetGroupId
          ? sourceWithout
          : await tx.navigationFolder.findMany({
              where: { groupId: targetGroupId },
              orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
            });

      const boundedIndex = Math.max(0, Math.min(targetIndex ?? targetBase.length, targetBase.length));
      const targetWithMoved = [...targetBase];
      targetWithMoved.splice(boundedIndex, 0, { ...moving, groupId: targetGroupId });

      await Promise.all(
        sourceWithout.map((item, index) =>
          tx.navigationFolder.update({
            where: { id: item.id },
            data: { groupId: sourceGroupId, sortOrder: index },
          })
        )
      );

      await Promise.all(
        targetWithMoved.map((item, index) =>
          tx.navigationFolder.update({
            where: { id: item.id },
            data: { groupId: targetGroupId, sortOrder: index },
          })
        )
      );
    });

    const moved = await prisma.navigationFolder.findUnique({ where: { id } });
    return res.json(moved);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to move folder';
    return res.status(400).json({ error: message });
  }
}

export async function createSubFolder(req: Request, res: Response): Promise<Response> {
  try {
    const { folderId, name, path, sortOrder } = req.body as SubFolderBody;
    if (!folderId || !name || !path) {
      return res.status(400).json({ error: 'folderId, name and path are required' });
    }

    const created = await prisma.navigationSubFolder.create({
      data: {
        folderId,
        name,
        path,
        sortOrder: sortOrder ?? 0,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create sub folder';
    return res.status(400).json({ error: message });
  }
}

export async function updateSubFolder(req: Request, res: Response): Promise<Response> {
  try {
    const id = Number(req.params.id);
    const { folderId, name, path, sortOrder } = req.body as SubFolderBody;

    const updated = await prisma.navigationSubFolder.update({
      where: { id },
      data: {
        folderId,
        name,
        path,
        sortOrder,
      },
    });

    return res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update sub folder';
    return res.status(400).json({ error: message });
  }
}

export async function deleteSubFolder(req: Request, res: Response): Promise<Response> {
  try {
    const id = Number(req.params.id);
    await prisma.navigationSubFolder.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete sub folder';
    return res.status(400).json({ error: message });
  }
}

export async function moveSubFolder(req: Request, res: Response): Promise<Response> {
  try {
    const id = Number(req.params.id);
    const { targetFolderId, targetIndex } = req.body as MoveSubFolderBody;
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'invalid sub folder id' });
    }
    if (!targetFolderId || !Number.isInteger(targetFolderId) || targetFolderId <= 0) {
      return res.status(400).json({ error: 'targetFolderId is required' });
    }

    await prisma.$transaction(async (tx) => {
      const moving = await tx.navigationSubFolder.findUnique({ where: { id } });
      if (!moving) throw new Error('Sub folder not found');

      const sourceFolderId = moving.folderId;
      const target = await tx.navigationFolder.findUnique({ where: { id: targetFolderId } });
      if (!target) throw new Error('Target folder not found');

      const sourceSubFolders = await tx.navigationSubFolder.findMany({
        where: { folderId: sourceFolderId },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      });

      const sourceWithout = sourceSubFolders.filter((item) => item.id !== id);

      const targetBase =
        sourceFolderId === targetFolderId
          ? sourceWithout
          : await tx.navigationSubFolder.findMany({
              where: { folderId: targetFolderId },
              orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
            });

      const boundedIndex = Math.max(0, Math.min(targetIndex ?? targetBase.length, targetBase.length));
      const targetWithMoved = [...targetBase];
      targetWithMoved.splice(boundedIndex, 0, { ...moving, folderId: targetFolderId });

      await Promise.all(
        sourceWithout.map((item, index) =>
          tx.navigationSubFolder.update({
            where: { id: item.id },
            data: { folderId: sourceFolderId, sortOrder: index },
          })
        )
      );

      await Promise.all(
        targetWithMoved.map((item, index) =>
          tx.navigationSubFolder.update({
            where: { id: item.id },
            data: { folderId: targetFolderId, sortOrder: index },
          })
        )
      );
    });

    const moved = await prisma.navigationSubFolder.findUnique({ where: { id } });
    return res.json(moved);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to move sub folder';
    return res.status(400).json({ error: message });
  }
}

export async function createRule(req: Request, res: Response): Promise<Response> {
  try {
    const { subFolderId, roleName, canAccess } = req.body as RuleBody;
    if (!subFolderId || !roleName) {
      return res.status(400).json({ error: 'subFolderId and roleName are required' });
    }
    if (!(await isAllowedNavigationRole(roleName))) {
      return res.status(400).json({ error: 'Invalid roleName for navigation rule' });
    }

    const created = await prisma.navigationAccessRule.upsert({
      where: {
        subFolderId_roleName: {
          subFolderId,
          roleName: roleName.toUpperCase(),
        },
      },
      create: {
        subFolderId,
        roleName: roleName.toUpperCase(),
        canAccess: canAccess ?? true,
      },
      update: {
        canAccess: canAccess ?? true,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create rule';
    return res.status(400).json({ error: message });
  }
}

export async function updateRule(req: Request, res: Response): Promise<Response> {
  try {
    const id = Number(req.params.id);
    const { roleName, canAccess } = req.body as RuleBody;
    if (roleName && !(await isAllowedNavigationRole(roleName))) {
      return res.status(400).json({ error: 'Invalid roleName for navigation rule' });
    }

    const updated = await prisma.navigationAccessRule.update({
      where: { id },
      data: {
        roleName: roleName ? roleName.toUpperCase() : undefined,
        canAccess,
      },
    });

    return res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update rule';
    return res.status(400).json({ error: message });
  }
}

export async function deleteRule(req: Request, res: Response): Promise<Response> {
  try {
    const id = Number(req.params.id);
    await prisma.navigationAccessRule.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete rule';
    return res.status(400).json({ error: message });
  }
}
