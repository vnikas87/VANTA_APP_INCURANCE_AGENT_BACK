import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { requireActorId } from './common';

type GridPreferencesBody = {
  filtersJson?: unknown;
  sortingJson?: unknown;
  columnOrderJson?: unknown;
  hiddenColumnNamesJson?: unknown;
  groupingJson?: unknown;
  visibleFilterKeysJson?: unknown;
  tableFiltersJson?: unknown;
};

function parseViewKey(value: unknown): string {
  const viewKey = typeof value === 'string' ? value.trim() : '';
  if (!viewKey) {
    throw new Error('viewKey is required');
  }
  if (viewKey.length > 100) {
    throw new Error('viewKey is too long');
  }
  return viewKey;
}

// Loads one saved grid preference record for the authenticated user and selected view.
export async function getGridPreference(req: Request, res: Response): Promise<Response> {
  try {
    const userId = requireActorId(req);
    const viewKey = parseViewKey(req.params.viewKey);

    const row = await prisma.userGridPreference.findUnique({
      where: {
        userId_viewKey: {
          userId,
          viewKey,
        },
      },
      select: {
        id: true,
        viewKey: true,
        filtersJson: true,
        sortingJson: true,
        columnOrderJson: true,
        hiddenColumnNamesJson: true,
        groupingJson: true,
        visibleFilterKeysJson: true,
        tableFiltersJson: true,
        updatedAt: true,
      },
    });

    return res.json(row ?? null);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load grid preference';
    if (message.includes('viewKey')) return res.status(400).json({ error: message });
    return res.status(500).json({ error: message });
  }
}

// Saves or updates one grid preference record for the authenticated user and selected view.
export async function upsertGridPreference(req: Request, res: Response): Promise<Response> {
  try {
    const userId = requireActorId(req);
    const viewKey = parseViewKey(req.params.viewKey);
    const body = (req.body ?? {}) as GridPreferencesBody;

    const row = await prisma.userGridPreference.upsert({
      where: {
        userId_viewKey: {
          userId,
          viewKey,
        },
      },
      create: {
        userId,
        viewKey,
        filtersJson: body.filtersJson as any,
        sortingJson: body.sortingJson as any,
        columnOrderJson: body.columnOrderJson as any,
        hiddenColumnNamesJson: body.hiddenColumnNamesJson as any,
        groupingJson: body.groupingJson as any,
        visibleFilterKeysJson: body.visibleFilterKeysJson as any,
        tableFiltersJson: body.tableFiltersJson as any,
        createdId: userId,
        updatedId: userId,
      },
      update: {
        filtersJson: body.filtersJson as any,
        sortingJson: body.sortingJson as any,
        columnOrderJson: body.columnOrderJson as any,
        hiddenColumnNamesJson: body.hiddenColumnNamesJson as any,
        groupingJson: body.groupingJson as any,
        visibleFilterKeysJson: body.visibleFilterKeysJson as any,
        tableFiltersJson: body.tableFiltersJson as any,
        updatedId: userId,
      },
      select: {
        id: true,
        viewKey: true,
        filtersJson: true,
        sortingJson: true,
        columnOrderJson: true,
        hiddenColumnNamesJson: true,
        groupingJson: true,
        visibleFilterKeysJson: true,
        tableFiltersJson: true,
        updatedAt: true,
      },
    });

    return res.json(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save grid preference';
    if (message.includes('viewKey')) return res.status(400).json({ error: message });
    return res.status(400).json({ error: message });
  }
}
