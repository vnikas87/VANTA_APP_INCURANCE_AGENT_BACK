import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';

type CreateUserBody = {
  keycloakId?: string;
  name?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  companyRole?: string;
  signature?: string;
  avatarUrl?: string;
};

type UpdateUserBody = {
  keycloakId?: string;
  name?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  companyRole?: string;
  signature?: string;
  avatarUrl?: string;
};

type UpdateMyProfileBody = {
  name?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  companyRole?: string;
  signature?: string;
};

type UploadAvatarBody = {
  imageDataUrl?: string;
};

function requireActorId(req: Request): number {
  const actorId = req.user?.dbUserId;
  if (!actorId) {
    throw new Error('Authenticated DB user not found');
  }

  return actorId;
}

function saveAvatarDataUrl(dataUrl: string, keycloakId: string): string {
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image format. Use PNG/JPEG/WEBP data URL');
  }

  const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
  const base64 = match[2];
  const buffer = Buffer.from(base64, 'base64');

  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error('Image too large. Max size is 5MB');
  }

  const uploadDir = path.resolve(process.cwd(), 'uploads', 'avatars');
  fs.mkdirSync(uploadDir, { recursive: true });

  const safeId = keycloakId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeId}_${Date.now()}.${extension}`;
  const absolutePath = path.join(uploadDir, filename);
  fs.writeFileSync(absolutePath, buffer);

  return `/uploads/avatars/${filename}`;
}

export async function getCurrentUser(req: Request, res: Response): Promise<Response> {
  try {
    const actorId = requireActorId(req);

    const user = await prisma.user.findUnique({
      where: { id: actorId },
      include: {
        createdBy: { select: { id: true, keycloakId: true, name: true } },
        updatedBy: { select: { id: true, keycloakId: true, name: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Authenticated user not found' });
    }

    const notifications = await prisma.authEventLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        eventType: true,
        details: true,
        createdAt: true,
      },
    });

    await prisma.authEventLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        eventType: 'LOGIN_SYNC',
        sourcePath: req.originalUrl,
        details: 'User synchronized on authenticated frontend bootstrap',
      },
    });

    return res.json({ user, notifications });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch current user';
    return res.status(400).json({ error: message });
  }
}

export async function updateMyProfile(req: Request, res: Response): Promise<Response> {
  try {
    const actorId = requireActorId(req);
    const { name, email, phone, mobilePhone, companyRole, signature } = req.body as UpdateMyProfileBody;

    const updated = await prisma.user.update({
      where: { id: actorId },
      data: {
        name,
        email,
        phone,
        mobilePhone,
        companyRole,
        signature,
        updatedId: actorId,
      },
    });

    return res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    if (message.includes('Unique constraint')) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    return res.status(400).json({ error: message });
  }
}

export async function uploadMyAvatar(req: Request, res: Response): Promise<Response> {
  try {
    const actorId = requireActorId(req);
    const { imageDataUrl } = req.body as UploadAvatarBody;
    if (!imageDataUrl) {
      return res.status(400).json({ error: 'imageDataUrl is required' });
    }

    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { keycloakId: true },
    });
    if (!actor) {
      return res.status(404).json({ error: 'Authenticated user not found' });
    }

    const avatarUrl = saveAvatarDataUrl(imageDataUrl, actor.keycloakId);
    const updated = await prisma.user.update({
      where: { id: actorId },
      data: {
        avatarUrl,
        updatedId: actorId,
      },
    });

    return res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload avatar';
    return res.status(400).json({ error: message });
  }
}

export async function getAllUsers(_req: Request, res: Response): Promise<Response> {
  try {
    const users = await prisma.user.findMany({
      include: {
        createdBy: { select: { id: true, keycloakId: true, name: true } },
        updatedBy: { select: { id: true, keycloakId: true, name: true } },
      },
      orderBy: { id: 'asc' },
    });

    return res.json(users);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch users';
    return res.status(500).json({ error: message });
  }
}

export async function getUserById(req: Request, res: Response): Promise<Response> {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'invalid user id' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, keycloakId: true, name: true } },
        updatedBy: { select: { id: true, keycloakId: true, name: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Not Found' });
    }

    return res.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch user';
    return res.status(500).json({ error: message });
  }
}

export async function getUserDetails(req: Request, res: Response): Promise<Response> {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'invalid user id' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, keycloakId: true, name: true } },
        updatedBy: { select: { id: true, keycloakId: true, name: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Not Found' });
    }

    const [apiLogs, authLogs] = await Promise.all([
      prisma.apiCallLog.findMany({
        where: { userId: id },
        orderBy: { calledAt: 'desc' },
        take: 50,
      }),
      prisma.authEventLog.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    return res.json({ user, apiLogs, authLogs });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch user details';
    return res.status(500).json({ error: message });
  }
}

export async function createUser(req: Request, res: Response): Promise<Response> {
  try {
    const { keycloakId, name, email, phone, mobilePhone, companyRole, signature, avatarUrl } = req.body as CreateUserBody;

    if (!keycloakId || !name || !email) {
      return res.status(400).json({ error: 'keycloakId, name and email are required' });
    }

    const actorId = requireActorId(req);

    const user = await prisma.user.create({
      data: {
        keycloakId,
        name,
        email,
        phone,
        mobilePhone,
        companyRole,
        signature,
        avatarUrl,
        createdId: actorId,
        updatedId: actorId,
      },
      include: {
        createdBy: { select: { id: true, keycloakId: true, name: true } },
        updatedBy: { select: { id: true, keycloakId: true, name: true } },
      },
    });

    return res.status(201).json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user';

    if (message.includes('Unique constraint')) {
      return res.status(409).json({ error: 'keycloakId or email already exists' });
    }

    return res.status(400).json({ error: message });
  }
}

export async function updateUser(req: Request, res: Response): Promise<Response> {
  try {
    const id = Number(req.params.id);
    const { keycloakId, name, email, phone, mobilePhone, companyRole, signature, avatarUrl } = req.body as UpdateUserBody;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'invalid user id' });
    }

    const actorId = requireActorId(req);

    const user = await prisma.user.update({
      where: { id },
      data: {
        keycloakId,
        name,
        email,
        phone,
        mobilePhone,
        companyRole,
        signature,
        avatarUrl,
        updatedId: actorId,
      },
      include: {
        createdBy: { select: { id: true, keycloakId: true, name: true } },
        updatedBy: { select: { id: true, keycloakId: true, name: true } },
      },
    });

    return res.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user';

    if (message.includes('Record to update not found')) {
      return res.status(404).json({ error: 'Not Found' });
    }

    if (message.includes('Unique constraint')) {
      return res.status(409).json({ error: 'keycloakId or email already exists' });
    }

    return res.status(400).json({ error: message });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<Response> {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'invalid user id' });
    }

    await prisma.user.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete user';
    if (message.includes('Record to delete does not exist')) {
      return res.status(404).json({ error: 'Not Found' });
    }
    if (message.includes('Foreign key constraint')) {
      return res.status(409).json({ error: 'Cannot delete user referenced by audit fields' });
    }
    return res.status(400).json({ error: message });
  }
}
