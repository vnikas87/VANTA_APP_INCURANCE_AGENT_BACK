import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { getLicenseUsage, getOrCreateAppLicense } from '../lib/license';
import { hashLicenseCode, verifyLicenseCode } from '../lib/licenseCode';
import { prisma } from '../lib/prisma';

type UpdateLicenseBody = {
  maxUsers?: number;
  allowOverflow?: boolean;
  notes?: string;
};

type ActivateLicenseBody = {
  code?: string;
};

type ToggleUserSeatBody = {
  isActive?: boolean;
  notes?: string;
};

function toDateFromUnixSeconds(value?: number): Date | null {
  if (!value) return null;
  return new Date(value * 1000);
}

export async function getLicenseStatus(_req: Request, res: Response): Promise<Response> {
  try {
    const license = await getOrCreateAppLicense();
    const usedUsers = await getLicenseUsage();
    const seats = await prisma.userLicense.findMany({
      orderBy: [{ isActive: 'desc' }, { activatedAt: 'desc' }],
      include: {
        user: { select: { id: true, keycloakId: true, name: true, email: true } },
        activatedBy: { select: { id: true, name: true } },
        deactivatedBy: { select: { id: true, name: true } },
      },
      take: 200,
    });

    const grants = await prisma.licenseGrant.findMany({
      orderBy: { activatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        tokenId: true,
        seats: true,
        expiresAt: true,
        isActive: true,
        issuedTo: true,
        activatedAt: true,
        deactivatedAt: true,
      },
    });

    return res.json({
      license,
      usage: {
        usedUsers,
        availableSeats: Math.max(0, license.maxUsers - usedUsers),
        atLimit: license.isActive && !license.allowOverflow && usedUsers >= license.maxUsers,
      },
      seats,
      grants,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch license status';
    return res.status(500).json({ error: message });
  }
}

export async function updateLicenseStatus(req: Request, res: Response): Promise<Response> {
  try {
    const { maxUsers, allowOverflow, notes } = req.body as UpdateLicenseBody;

    if (maxUsers !== undefined && (!Number.isInteger(maxUsers) || maxUsers <= 0)) {
      return res.status(400).json({ error: 'maxUsers must be a positive integer' });
    }

    const updated = await prisma.appLicense.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        maxUsers: maxUsers ?? 1,
        isActive: true,
        allowOverflow: allowOverflow ?? false,
        notes,
      },
      update: {
        maxUsers,
        allowOverflow,
        notes,
      },
    });

    const usedUsers = await getLicenseUsage();

    return res.json({
      license: updated,
      usage: {
        usedUsers,
        availableSeats: Math.max(0, updated.maxUsers - usedUsers),
        atLimit: updated.isActive && !updated.allowOverflow && usedUsers >= updated.maxUsers,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update license status';
    return res.status(400).json({ error: message });
  }
}

export async function activateLicenseCode(req: Request, res: Response): Promise<Response> {
  try {
    const { code } = req.body as ActivateLicenseBody;
    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'code is required' });
    }

    const payload = verifyLicenseCode(code, {
      publicKey: process.env.LICENSE_PUBLIC_KEY,
      expectedIssuer: process.env.LICENSE_EXPECTED_ISSUER,
      expectedAudience: process.env.LICENSE_EXPECTED_AUDIENCE,
      expectedTenantCode: process.env.LICENSE_TENANT_CODE,
    });
    const metadata = payload as Prisma.InputJsonValue;

    const tokenId = payload.jti as string;
    const codeHash = hashLicenseCode(code);
    const seats = payload.seats as number;
    const tenantCode = typeof payload.tenantCode === 'string' ? payload.tenantCode : null;
    const expiresAt = toDateFromUnixSeconds(payload.exp);

    const existingGrant = await prisma.licenseGrant.findFirst({
      where: {
        OR: [{ tokenId }, { codeHash }],
      },
    });

    if (existingGrant && existingGrant.isActive) {
      return res.status(409).json({ error: 'License code already activated' });
    }

    const currentLicense = await getOrCreateAppLicense();
    if (currentLicense.tenantCode && tenantCode && currentLicense.tenantCode !== tenantCode) {
      return res.status(409).json({
        error: `License tenant mismatch. Current tenant=${currentLicense.tenantCode}, code tenant=${tenantCode}`,
      });
    }

    const actorId = req.user?.dbUserId;

    const result = await prisma.$transaction(async (tx) => {
      await tx.licenseGrant.updateMany({
        where: { isActive: true },
        data: {
          isActive: false,
          deactivatedAt: new Date(),
          deactivatedById: actorId,
        },
      });

      const grant = await tx.licenseGrant.upsert({
        where: { tokenId },
        create: {
          tokenId,
          codeHash,
          seats,
          tenantCode: tenantCode ?? undefined,
          expiresAt,
          issuedTo: typeof payload.issuedTo === 'string' ? payload.issuedTo : undefined,
          metadata,
          isActive: true,
          activatedById: actorId,
        },
        update: {
          codeHash,
          seats,
          tenantCode: tenantCode ?? undefined,
          expiresAt,
          issuedTo: typeof payload.issuedTo === 'string' ? payload.issuedTo : undefined,
          metadata,
          isActive: true,
          activatedById: actorId,
          deactivatedAt: null,
          deactivatedById: null,
        },
      });

      const license = await tx.appLicense.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          maxUsers: seats,
          isActive: true,
          allowOverflow: false,
          tenantCode: tenantCode ?? undefined,
          expiresAt,
          licenseTokenId: tokenId,
          notes: typeof payload.notes === 'string' ? payload.notes : 'Activated by signed code',
        },
        update: {
          maxUsers: seats,
          isActive: true,
          tenantCode: tenantCode ?? undefined,
          expiresAt,
          licenseTokenId: tokenId,
          notes: typeof payload.notes === 'string' ? payload.notes : 'Activated by signed code',
        },
      });

      return { grant, license };
    });

    const usedUsers = await getLicenseUsage();

    return res.json({
      message: 'License activated successfully',
      grant: result.grant,
      license: result.license,
      usage: {
        usedUsers,
        availableSeats: Math.max(0, result.license.maxUsers - usedUsers),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to activate license';
    return res.status(400).json({ error: message });
  }
}

export async function deactivateLicense(req: Request, res: Response): Promise<Response> {
  try {
    const actorId = req.user?.dbUserId;

    await prisma.$transaction(async (tx) => {
      await tx.licenseGrant.updateMany({
        where: { isActive: true },
        data: {
          isActive: false,
          deactivatedAt: new Date(),
          deactivatedById: actorId,
        },
      });

      await tx.appLicense.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          maxUsers: 0,
          isActive: false,
          allowOverflow: false,
          tenantCode: null,
          expiresAt: null,
          licenseTokenId: null,
          notes: 'License manually deactivated',
        },
        update: {
          maxUsers: 0,
          isActive: false,
          allowOverflow: false,
          tenantCode: null,
          expiresAt: null,
          licenseTokenId: null,
          notes: 'License manually deactivated',
        },
      });

      await tx.userLicense.updateMany({
        where: { isActive: true },
        data: {
          isActive: false,
          deactivatedAt: new Date(),
          deactivatedById: actorId,
          notes: 'Auto-deactivated: license deactivated',
        },
      });
    });

    return res.json({ message: 'License deactivated and all allocated seats were released' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to deactivate license';
    return res.status(400).json({ error: message });
  }
}

export async function setUserSeatStatus(req: Request, res: Response): Promise<Response> {
  try {
    const userId = Number(req.params.userId);
    const { isActive, notes } = req.body as ToggleUserSeatBody;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'invalid user id' });
    }
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive boolean is required' });
    }

    const actorId = req.user?.dbUserId;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      return res.status(404).json({
        error:
          'User not found in application database. User must login once (or be created in Users Management) before assigning a license seat.',
      });
    }
    const license = await getOrCreateAppLicense();
    const existing = await prisma.userLicense.findUnique({ where: { userId } });

    if (isActive) {
      if (!license.isActive) {
        return res.status(409).json({ error: 'Cannot assign seat: license is inactive' });
      }
      if (license.expiresAt && new Date() >= license.expiresAt) {
        return res.status(409).json({ error: 'Cannot assign seat: license has expired' });
      }
      if (!license.allowOverflow && !existing?.isActive) {
        const usedUsers = await getLicenseUsage();
        if (usedUsers >= license.maxUsers) {
          return res.status(409).json({
            error: `Cannot assign seat: no seats available (${usedUsers}/${license.maxUsers})`,
          });
        }
      }
    }

    const updated = await prisma.userLicense.upsert({
      where: { userId },
      create: {
        userId,
        isActive,
        notes,
        activatedById: isActive ? actorId : undefined,
        deactivatedById: !isActive ? actorId : undefined,
        deactivatedAt: !isActive ? new Date() : null,
      },
      update: {
        isActive,
        notes,
        activatedById: isActive ? actorId : undefined,
        deactivatedById: !isActive ? actorId : undefined,
        deactivatedAt: !isActive ? new Date() : null,
      },
      include: {
        user: { select: { id: true, name: true, email: true, keycloakId: true } },
      },
    });

    return res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user license seat';
    return res.status(400).json({ error: message });
  }
}
