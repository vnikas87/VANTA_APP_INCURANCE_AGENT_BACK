import { prisma } from './prisma';
import { LEGACY_API_ROLES } from '../config/roles';

type EnsureActorInput = {
  sub: string;
  username?: string;
  email?: string;
  roles?: string[];
};

function normalizeSubToEmail(sub: string): string {
  const local = sub.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${local}@keycloak.local`;
}

async function getNextUserId(): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT nextval(pg_get_serial_sequence('"users"', 'id'))::int AS id
  `;

  return rows[0].id;
}

function hasAdministratorRole(roles?: string[]): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.some((role) => role.toUpperCase() === LEGACY_API_ROLES.ADMINISTRATOR);
}

async function ensureUserSeatState(userId: number, isAdministrator: boolean): Promise<void> {
  const existingSeat = await prisma.userLicense.findUnique({ where: { userId } });
  if (!existingSeat) {
    await prisma.userLicense.create({
      data: {
        userId,
        isActive: isAdministrator,
        activatedById: isAdministrator ? userId : null,
        activatedAt: new Date(),
        notes: isAdministrator
          ? 'Auto-provisioned active seat for ADMINISTRATOR user'
          : 'Auto-provisioned inactive seat for new Keycloak user',
      },
    });
    return;
  }

  if (isAdministrator && !existingSeat.isActive) {
    await prisma.userLicense.update({
      where: { userId },
      data: {
        isActive: true,
        activatedById: userId,
        activatedAt: new Date(),
        deactivatedAt: null,
        deactivatedById: null,
        notes: 'Auto-activated seat because user has ADMINISTRATOR role',
      },
    });
  }
}

export async function ensureActorUser(input: EnsureActorInput): Promise<number> {
  const isAdministrator = hasAdministratorRole(input.roles);
  const existing = await prisma.user.findUnique({ where: { keycloakId: input.sub } });
  if (existing) {
    await ensureUserSeatState(existing.id, isAdministrator);
    return existing.id;
  }

  const newId = await getNextUserId();
  const name = input.username ?? `keycloak-${input.sub.slice(0, 12)}`;
  const email = input.email ?? normalizeSubToEmail(input.sub);

  try {
    const created = await prisma.user.create({
      data: {
        id: newId,
        keycloakId: input.sub,
        name,
        email,
        createdId: newId,
        updatedId: newId,
      },
    });

    await ensureUserSeatState(created.id, isAdministrator);
    return created.id;
  } catch (error) {
    const again = await prisma.user.findUnique({ where: { keycloakId: input.sub } });
    if (again) {
      await ensureUserSeatState(again.id, isAdministrator);
      return again.id;
    }

    throw error;
  }
}
