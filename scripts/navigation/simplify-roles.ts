import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ALLOWED_ROLES = ['ADMINISTRATOR', 'OPS_USER'] as const;

async function main(): Promise<void> {
  await prisma.navigationRole.upsert({
    where: { name: 'ADMINISTRATOR' },
    create: {
      name: 'ADMINISTRATOR',
      description: 'Legacy administrator role with full access',
      isSystem: true,
    },
    update: {
      description: 'Legacy administrator role with full access',
      isSystem: true,
    },
  });

  await prisma.navigationRole.upsert({
    where: { name: 'OPS_USER' },
    create: {
      name: 'OPS_USER',
      description: 'Operations user role',
      isSystem: true,
    },
    update: {
      description: 'Operations user role',
      isSystem: true,
    },
  });

  const deleteRules = await prisma.navigationAccessRule.deleteMany({
    where: {
      roleName: {
        notIn: [...ALLOWED_ROLES],
      },
    },
  });

  const deleteRoles = await prisma.navigationRole.deleteMany({
    where: {
      name: {
        notIn: [...ALLOWED_ROLES],
      },
    },
  });

  // eslint-disable-next-line no-console
  console.log(
    `[NAV] Simplified roles. Deleted rules: ${deleteRules.count}, deleted roles: ${deleteRoles.count}. Allowed: ${ALLOWED_ROLES.join(
      ', '
    )}`
  );
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('[NAV] simplify-roles failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

