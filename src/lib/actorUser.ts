import { prisma } from './prisma';

type EnsureActorInput = {
  sub: string;
  username?: string;
  email?: string;
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

export async function ensureActorUser(input: EnsureActorInput): Promise<number> {
  const existing = await prisma.user.findUnique({ where: { keycloakId: input.sub } });
  if (existing) {
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

    return created.id;
  } catch (error) {
    const again = await prisma.user.findUnique({ where: { keycloakId: input.sub } });
    if (again) {
      return again.id;
    }

    throw error;
  }
}
