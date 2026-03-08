import { prisma } from './prisma';

export class LicenseLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LicenseLimitError';
  }
}

export async function getOrCreateAppLicense() {
  const existing = await prisma.appLicense.findUnique({ where: { id: 1 } });
  if (existing) return existing;

  return prisma.appLicense.create({
    data: {
      id: 1,
      maxUsers: 1,
      isActive: false,
      allowOverflow: false,
      notes: 'No active license yet',
    },
  });
}

export async function getLicenseUsage() {
  const usedUsers = await prisma.userLicense.count({
    where: { isActive: true },
  });
  return usedUsers;
}

export async function assertUserHasLicenseSeat(userId: number): Promise<void> {
  const license = await getOrCreateAppLicense();

  if (!license.isActive) {
    throw new LicenseLimitError('License is not active. Activate a license code first.');
  }

  if (license.expiresAt && new Date() >= license.expiresAt) {
    throw new LicenseLimitError('License has expired. Activate a new license code.');
  }

  const existingSeat = await prisma.userLicense.findUnique({ where: { userId } });
  if (existingSeat?.isActive) {
    if (!license.allowOverflow) {
      const activeSeats = await prisma.userLicense.findMany({
        where: { isActive: true },
        orderBy: [{ activatedAt: 'asc' }, { id: 'asc' }],
        select: { userId: true },
      });

      const allowedSeatCount = Math.max(0, license.maxUsers);
      const allowedUserIds = new Set(activeSeats.slice(0, allowedSeatCount).map((seat) => seat.userId));
      if (!allowedUserIds.has(userId)) {
        await prisma.userLicense.updateMany({
          where: { userId, isActive: true },
          data: {
            isActive: false,
            deactivatedAt: new Date(),
            notes: 'Auto-deactivated: over license limit',
          },
        });

        throw new LicenseLimitError(
          `License limit reached: only ${allowedSeatCount} active seat(s) allowed. Your seat was deactivated.`
        );
      }
    }
    return;
  }

  const usedUsers = await getLicenseUsage();
  if (!license.allowOverflow && usedUsers >= license.maxUsers) {
    throw new LicenseLimitError(
      `License limit reached: ${usedUsers}/${license.maxUsers} seats used. Request more seats.`
    );
  }

  throw new LicenseLimitError(
    'User has no assigned license seat. Please contact administrator to assign a license.'
  );
}
