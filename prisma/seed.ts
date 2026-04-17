import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getNextUserId(): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT nextval(pg_get_serial_sequence('"users"', 'id'))::int AS id
  `;
  return rows[0].id;
}

async function ensureBootstrapUser(): Promise<number> {
  const existing = await prisma.user.findUnique({
    where: { keycloakId: 'system-seed' },
  });

  if (!existing) {
    const id = await getNextUserId();

    await prisma.user.create({
      data: {
        id,
        keycloakId: 'system-seed',
        name: 'System Seed',
        email: 'system-seed@keycloak.local',
        createdId: id,
        updatedId: id,
      },
    });

    return id;
  }

  await prisma.user.update({
    where: { id: existing.id },
    data: {
      updatedId: existing.id,
      name: existing.name,
    },
  });

  return existing.id;
}

async function seedNavigation(): Promise<void> {
  const navRoleSeeds = [
    { name: 'ADMINISTRATOR', description: 'Legacy administrator role with full access', isSystem: true },
    { name: 'ADMIN', description: 'API admin and navigation super access', isSystem: true },
    { name: 'EDITOR', description: 'API editor role', isSystem: true },
    { name: 'VIEWER', description: 'API viewer role', isSystem: true },
    { name: 'CEO_MANAGEMENT', description: 'CEO management role', isSystem: true },
    { name: 'OPS_MNG', description: 'Operations manager role', isSystem: true },
    { name: 'ADMIN_MNG', description: 'Admin manager role', isSystem: true },
    { name: 'NAV_ADMIN', description: 'Navigation admin role', isSystem: true },
    { name: 'NAV_ADMINISTRATOR', description: 'Navigation administrator role', isSystem: true },
    { name: 'NAV_MANAGEMENT', description: 'Navigation management role', isSystem: true },
    { name: 'OPS_MANAGEMENT', description: 'Operations management role', isSystem: true },
    { name: 'ADMIN_MANAGEMENT', description: 'Administration management role', isSystem: true },
    { name: 'OPS_USER', description: 'Operations user role', isSystem: true },
    { name: 'ADMIN_USER', description: 'Admin user role', isSystem: true },
    { name: 'EXT_USER', description: 'External user role', isSystem: true },
  ];

  for (const role of navRoleSeeds) {
    await prisma.navigationRole.upsert({
      where: { name: role.name },
      create: role,
      update: {
        description: role.description,
        isSystem: role.isSystem,
      },
    });
  }

  const dashboardGroup = await prisma.navigationGroup.upsert({
    where: { name: 'Dashboard' },
    create: { name: 'Dashboard', sortOrder: 1 },
    update: { sortOrder: 1 },
  });

  const settingsGroup = await prisma.navigationGroup.upsert({
    where: { name: 'Settings' },
    create: { name: 'Settings', sortOrder: 2 },
    update: { sortOrder: 2 },
  });

  const folder = await prisma.navigationFolder.upsert({
    where: {
      groupId_name: {
        groupId: dashboardGroup.id,
        name: 'Folder',
      },
    },
    create: {
      groupId: dashboardGroup.id,
      name: 'Folder',
      sortOrder: 1,
    },
    update: {
      groupId: dashboardGroup.id,
      name: 'Folder',
      sortOrder: 1,
    },
  });

  const subFolderUsers = await prisma.navigationSubFolder.upsert({
    where: {
      folderId_path: {
        folderId: folder.id,
        path: '/settings/access-control/users',
      },
    },
    create: {
      folderId: folder.id,
      name: 'Users Management',
      path: '/settings/access-control/users',
      sortOrder: 1,
    },
    update: {
      name: 'Users Management',
      sortOrder: 1,
    },
  });

  const subFolderDashboardHome = await prisma.navigationSubFolder.upsert({
    where: {
      folderId_path: {
        folderId: folder.id,
        path: '/',
      },
    },
    create: {
      folderId: folder.id,
      name: 'Dashboard Home',
      path: '/',
      sortOrder: 0,
    },
    update: {
      name: 'Dashboard Home',
      sortOrder: 0,
    },
  });

  const subFolderSettingsUsers = await prisma.navigationSubFolder.upsert({
    where: {
      folderId_path: {
        folderId: folder.id,
        path: '/settings/access-control/users/details',
      },
    },
    create: {
      folderId: folder.id,
      name: 'Users Details',
      path: '/settings/access-control/users/details',
      sortOrder: 2,
    },
    update: {
      name: 'Users Details',
      sortOrder: 2,
    },
  });

  const settingsFolder = await prisma.navigationFolder.upsert({
    where: {
      groupId_name: {
        groupId: settingsGroup.id,
        name: 'Access Control',
      },
    },
    create: {
      groupId: settingsGroup.id,
      name: 'Access Control',
      sortOrder: 1,
    },
    update: {
      groupId: settingsGroup.id,
      name: 'Access Control',
      sortOrder: 1,
    },
  });

  const subFolderNavRules = await prisma.navigationSubFolder.upsert({
    where: {
      folderId_path: {
        folderId: settingsFolder.id,
        path: '/settings/access-control/navigation',
      },
    },
    create: {
      folderId: settingsFolder.id,
      name: 'Navigation Rules',
      path: '/settings/access-control/navigation',
      sortOrder: 1,
    },
    update: {
      name: 'Navigation Rules',
      sortOrder: 1,
    },
  });

  const subFolderLicense = await prisma.navigationSubFolder.upsert({
    where: {
      folderId_path: {
        folderId: settingsFolder.id,
        path: '/settings/access-control/license',
      },
    },
    create: {
      folderId: settingsFolder.id,
      name: 'License Management',
      path: '/settings/access-control/license',
      sortOrder: 2,
    },
    update: {
      name: 'License Management',
      sortOrder: 2,
    },
  });

  const insuranceGroup = await prisma.navigationGroup.upsert({
    where: { name: 'Insurance' },
    create: { name: 'Insurance', sortOrder: 3 },
    update: { sortOrder: 3 },
  });

  const insuranceSettingsFolder = await prisma.navigationFolder.upsert({
    where: {
      groupId_name: {
        groupId: insuranceGroup.id,
        name: 'Configuration',
      },
    },
    create: {
      groupId: insuranceGroup.id,
      name: 'Configuration',
      sortOrder: 1,
    },
    update: {
      sortOrder: 1,
    },
  });

  const insuranceOperationsFolder = await prisma.navigationFolder.upsert({
    where: {
      groupId_name: {
        groupId: insuranceGroup.id,
        name: 'Operations',
      },
    },
    create: {
      groupId: insuranceGroup.id,
      name: 'Operations',
      sortOrder: 2,
    },
    update: {
      sortOrder: 2,
    },
  });

  const legacyLookupsSubFolder = await prisma.navigationSubFolder.findUnique({
    where: {
      folderId_path: {
        folderId: insuranceSettingsFolder.id,
        path: '/settings/insurance/lookups',
      },
    },
  });

  if (legacyLookupsSubFolder) {
    await prisma.navigationAccessRule.deleteMany({
      where: { subFolderId: legacyLookupsSubFolder.id },
    });
    await prisma.navigationSubFolder.delete({
      where: { id: legacyLookupsSubFolder.id },
    });
  }

  const subFolderInsurancePartners = await prisma.navigationSubFolder.upsert({
    where: {
      folderId_path: {
        folderId: insuranceSettingsFolder.id,
        path: '/settings/insurance/partners',
      },
    },
    create: {
      folderId: insuranceSettingsFolder.id,
      name: 'Insurance Partners',
      path: '/settings/insurance/partners',
      sortOrder: 1,
    },
    update: {
      name: 'Insurance Partners',
      sortOrder: 1,
    },
  });

  const subFolderInsuranceCompanies = await prisma.navigationSubFolder.upsert({
    where: {
      folderId_path: {
        folderId: insuranceSettingsFolder.id,
        path: '/settings/insurance/companies',
      },
    },
    create: {
      folderId: insuranceSettingsFolder.id,
      name: 'Insurance Companies',
      path: '/settings/insurance/companies',
      sortOrder: 2,
    },
    update: {
      name: 'Insurance Companies',
      sortOrder: 2,
    },
  });

  const subFolderInsuranceBranches = await prisma.navigationSubFolder.upsert({
    where: {
      folderId_path: {
        folderId: insuranceSettingsFolder.id,
        path: '/settings/insurance/branches',
      },
    },
    create: {
      folderId: insuranceSettingsFolder.id,
      name: 'Insurance Branches',
      path: '/settings/insurance/branches',
      sortOrder: 3,
    },
    update: {
      name: 'Insurance Branches',
      sortOrder: 3,
    },
  });

  const subFolderInsuranceContractTypes = await prisma.navigationSubFolder.upsert({
    where: {
      folderId_path: {
        folderId: insuranceSettingsFolder.id,
        path: '/settings/insurance/contract-types',
      },
    },
    create: {
      folderId: insuranceSettingsFolder.id,
      name: 'Insurance Contract Types',
      path: '/settings/insurance/contract-types',
      sortOrder: 4,
    },
    update: {
      name: 'Insurance Contract Types',
      sortOrder: 4,
    },
  });

  const subFolderInsuranceDocumentTypes = await prisma.navigationSubFolder.upsert({
    where: {
      folderId_path: {
        folderId: insuranceSettingsFolder.id,
        path: '/settings/insurance/document-types',
      },
    },
    create: {
      folderId: insuranceSettingsFolder.id,
      name: 'Insurance Document Types',
      path: '/settings/insurance/document-types',
      sortOrder: 5,
    },
    update: {
      name: 'Insurance Document Types',
      sortOrder: 5,
    },
  });

  const subFolderInsuranceProductionTypes = await prisma.navigationSubFolder.upsert({
    where: {
      folderId_path: {
        folderId: insuranceSettingsFolder.id,
        path: '/settings/insurance/production-types',
      },
    },
    create: {
      folderId: insuranceSettingsFolder.id,
      name: 'Insurance Production Types',
      path: '/settings/insurance/production-types',
      sortOrder: 6,
    },
    update: {
      name: 'Insurance Production Types',
      sortOrder: 6,
    },
  });

  const subFolderInsurancePaymentFrequencies = await prisma.navigationSubFolder.upsert({
    where: {
      folderId_path: {
        folderId: insuranceSettingsFolder.id,
        path: '/settings/insurance/payment-frequencies',
      },
    },
    create: {
      folderId: insuranceSettingsFolder.id,
      name: 'Insurance Payment Frequencies',
      path: '/settings/insurance/payment-frequencies',
      sortOrder: 7,
    },
    update: {
      name: 'Insurance Payment Frequencies',
      sortOrder: 7,
    },
  });

  const subFolderInsuranceCustomers = await prisma.navigationSubFolder.upsert({
    where: {
      folderId_path: {
        folderId: insuranceSettingsFolder.id,
        path: '/settings/insurance/customers',
      },
    },
    create: {
      folderId: insuranceSettingsFolder.id,
      name: 'Insurance Customers',
      path: '/settings/insurance/customers',
      sortOrder: 8,
    },
    update: {
      name: 'Insurance Customers',
      sortOrder: 8,
    },
  });

  const subFolderInsurancePolicies = await prisma.navigationSubFolder.upsert({
    where: {
      folderId_path: {
        folderId: insuranceSettingsFolder.id,
        path: '/settings/insurance/policies',
      },
    },
    create: {
      folderId: insuranceSettingsFolder.id,
      name: 'Insurance Policies',
      path: '/settings/insurance/policies',
      sortOrder: 9,
    },
    update: {
      name: 'Insurance Policies',
      sortOrder: 9,
    },
  });

  const subFolderInsuranceProduction = await prisma.navigationSubFolder.upsert({
    where: {
      folderId_path: {
        folderId: insuranceOperationsFolder.id,
        path: '/insurance/production',
      },
    },
    create: {
      folderId: insuranceOperationsFolder.id,
      name: 'Production Management',
      path: '/insurance/production',
      sortOrder: 1,
    },
    update: {
      name: 'Production Management',
      sortOrder: 1,
    },
  });

  const roleSeeds = [
    { role: 'ADMINISTRATOR', access: true },
    { role: 'ADMIN', access: true },
    { role: 'EDITOR', access: true },
    { role: 'VIEWER', access: false },
    { role: 'CEO_MANAGEMENT', access: true },
    { role: 'OPS_MNG', access: false },
    { role: 'ADMIN_MNG', access: true },
    { role: 'NAV_ADMIN', access: true },
    { role: 'NAV_ADMINISTRATOR', access: true },
    { role: 'NAV_MANAGEMENT', access: true },
    { role: 'OPS_MANAGEMENT', access: false },
    { role: 'ADMIN_MANAGEMENT', access: true },
    { role: 'OPS_USER', access: false },
    { role: 'ADMIN_USER', access: true },
    { role: 'EXT_USER', access: false },
  ];

  for (const entry of roleSeeds) {
    await prisma.navigationAccessRule.upsert({
      where: {
        subFolderId_roleName: {
          subFolderId: subFolderDashboardHome.id,
          roleName: entry.role,
        },
      },
      create: {
        subFolderId: subFolderDashboardHome.id,
        roleName: entry.role,
        canAccess: true,
      },
      update: {
        canAccess: true,
      },
    });

    await prisma.navigationAccessRule.upsert({
      where: {
        subFolderId_roleName: {
          subFolderId: subFolderUsers.id,
          roleName: entry.role,
        },
      },
      create: {
        subFolderId: subFolderUsers.id,
        roleName: entry.role,
        canAccess: entry.access,
      },
      update: {
        canAccess: entry.access,
      },
    });

    await prisma.navigationAccessRule.upsert({
      where: {
        subFolderId_roleName: {
          subFolderId: subFolderSettingsUsers.id,
          roleName: entry.role,
        },
      },
      create: {
        subFolderId: subFolderSettingsUsers.id,
        roleName: entry.role,
        canAccess: entry.access,
      },
      update: {
        canAccess: entry.access,
      },
    });

    await prisma.navigationAccessRule.upsert({
      where: {
        subFolderId_roleName: {
          subFolderId: subFolderNavRules.id,
          roleName: entry.role,
        },
      },
      create: {
        subFolderId: subFolderNavRules.id,
        roleName: entry.role,
        canAccess: entry.role === 'ADMIN',
      },
      update: {
        canAccess: entry.role === 'ADMIN',
      },
    });

    await prisma.navigationAccessRule.upsert({
      where: {
        subFolderId_roleName: {
          subFolderId: subFolderLicense.id,
          roleName: entry.role,
        },
      },
      create: {
        subFolderId: subFolderLicense.id,
        roleName: entry.role,
        canAccess: entry.role === 'ADMIN' || entry.role === 'ADMINISTRATOR',
      },
      update: {
        canAccess: entry.role === 'ADMIN' || entry.role === 'ADMINISTRATOR',
      },
    });

    await prisma.navigationAccessRule.upsert({
      where: {
        subFolderId_roleName: {
          subFolderId: subFolderInsurancePartners.id,
          roleName: entry.role,
        },
      },
      create: {
        subFolderId: subFolderInsurancePartners.id,
        roleName: entry.role,
        canAccess: entry.role === 'ADMIN' || entry.role === 'ADMINISTRATOR' || entry.role === 'EDITOR',
      },
      update: {
        canAccess: entry.role === 'ADMIN' || entry.role === 'ADMINISTRATOR' || entry.role === 'EDITOR',
      },
    });

    await prisma.navigationAccessRule.upsert({
      where: {
        subFolderId_roleName: {
          subFolderId: subFolderInsuranceCompanies.id,
          roleName: entry.role,
        },
      },
      create: {
        subFolderId: subFolderInsuranceCompanies.id,
        roleName: entry.role,
        canAccess: entry.role === 'ADMIN' || entry.role === 'ADMINISTRATOR' || entry.role === 'EDITOR',
      },
      update: {
        canAccess: entry.role === 'ADMIN' || entry.role === 'ADMINISTRATOR' || entry.role === 'EDITOR',
      },
    });

    await prisma.navigationAccessRule.upsert({
      where: {
        subFolderId_roleName: {
          subFolderId: subFolderInsuranceBranches.id,
          roleName: entry.role,
        },
      },
      create: {
        subFolderId: subFolderInsuranceBranches.id,
        roleName: entry.role,
        canAccess: entry.role === 'ADMIN' || entry.role === 'ADMINISTRATOR' || entry.role === 'EDITOR',
      },
      update: {
        canAccess: entry.role === 'ADMIN' || entry.role === 'ADMINISTRATOR' || entry.role === 'EDITOR',
      },
    });

    await prisma.navigationAccessRule.upsert({
      where: {
        subFolderId_roleName: {
          subFolderId: subFolderInsuranceContractTypes.id,
          roleName: entry.role,
        },
      },
      create: {
        subFolderId: subFolderInsuranceContractTypes.id,
        roleName: entry.role,
        canAccess: entry.role === 'ADMIN' || entry.role === 'ADMINISTRATOR' || entry.role === 'EDITOR',
      },
      update: {
        canAccess: entry.role === 'ADMIN' || entry.role === 'ADMINISTRATOR' || entry.role === 'EDITOR',
      },
    });

    await prisma.navigationAccessRule.upsert({
      where: {
        subFolderId_roleName: {
          subFolderId: subFolderInsuranceDocumentTypes.id,
          roleName: entry.role,
        },
      },
      create: {
        subFolderId: subFolderInsuranceDocumentTypes.id,
        roleName: entry.role,
        canAccess: entry.role === 'ADMIN' || entry.role === 'ADMINISTRATOR' || entry.role === 'EDITOR',
      },
      update: {
        canAccess: entry.role === 'ADMIN' || entry.role === 'ADMINISTRATOR' || entry.role === 'EDITOR',
      },
    });

    await prisma.navigationAccessRule.upsert({
      where: {
        subFolderId_roleName: {
          subFolderId: subFolderInsuranceProductionTypes.id,
          roleName: entry.role,
        },
      },
      create: {
        subFolderId: subFolderInsuranceProductionTypes.id,
        roleName: entry.role,
        canAccess: entry.role === 'ADMIN' || entry.role === 'ADMINISTRATOR' || entry.role === 'EDITOR',
      },
      update: {
        canAccess: entry.role === 'ADMIN' || entry.role === 'ADMINISTRATOR' || entry.role === 'EDITOR',
      },
    });

    await prisma.navigationAccessRule.upsert({
      where: {
        subFolderId_roleName: {
          subFolderId: subFolderInsurancePaymentFrequencies.id,
          roleName: entry.role,
        },
      },
      create: {
        subFolderId: subFolderInsurancePaymentFrequencies.id,
        roleName: entry.role,
        canAccess: entry.role === 'ADMIN' || entry.role === 'ADMINISTRATOR' || entry.role === 'EDITOR',
      },
      update: {
        canAccess: entry.role === 'ADMIN' || entry.role === 'ADMINISTRATOR' || entry.role === 'EDITOR',
      },
    });

    await prisma.navigationAccessRule.upsert({
      where: {
        subFolderId_roleName: {
          subFolderId: subFolderInsuranceCustomers.id,
          roleName: entry.role,
        },
      },
      create: {
        subFolderId: subFolderInsuranceCustomers.id,
        roleName: entry.role,
        canAccess: entry.role === 'ADMIN' || entry.role === 'ADMINISTRATOR' || entry.role === 'EDITOR',
      },
      update: {
        canAccess: entry.role === 'ADMIN' || entry.role === 'ADMINISTRATOR' || entry.role === 'EDITOR',
      },
    });

    await prisma.navigationAccessRule.upsert({
      where: {
        subFolderId_roleName: {
          subFolderId: subFolderInsurancePolicies.id,
          roleName: entry.role,
        },
      },
      create: {
        subFolderId: subFolderInsurancePolicies.id,
        roleName: entry.role,
        canAccess: entry.role === 'ADMIN' || entry.role === 'ADMINISTRATOR' || entry.role === 'EDITOR',
      },
      update: {
        canAccess: entry.role === 'ADMIN' || entry.role === 'ADMINISTRATOR' || entry.role === 'EDITOR',
      },
    });

    await prisma.navigationAccessRule.upsert({
      where: {
        subFolderId_roleName: {
          subFolderId: subFolderInsuranceProduction.id,
          roleName: entry.role,
        },
      },
      create: {
        subFolderId: subFolderInsuranceProduction.id,
        roleName: entry.role,
        canAccess:
          entry.role === 'ADMIN' ||
          entry.role === 'ADMINISTRATOR' ||
          entry.role === 'EDITOR' ||
          entry.role === 'VIEWER',
      },
      update: {
        canAccess:
          entry.role === 'ADMIN' ||
          entry.role === 'ADMINISTRATOR' ||
          entry.role === 'EDITOR' ||
          entry.role === 'VIEWER',
      },
    });
  }
}

async function seedLicense(): Promise<void> {
  const maxUsersFromEnv = Number(process.env.LICENSE_MAX_USERS ?? '1');
  const maxUsers = Number.isInteger(maxUsersFromEnv) && maxUsersFromEnv > 0 ? maxUsersFromEnv : 1;

  await prisma.appLicense.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      maxUsers,
      isActive: false,
      allowOverflow: false,
      notes: 'No active license code yet',
    },
    update: {
      maxUsers,
      allowOverflow: false,
      expiresAt: null,
      licenseTokenId: null,
    },
  });
}

async function seedInsuranceLookups(seedUserId: number): Promise<void> {
  const partnerSeeds = ['Direct', 'Broker Channel'];
  const companySeeds = ['GROUPAMA', 'MINETTA'];
  const branchSeeds = ['Οχημάτων', 'Υγείας', 'Πυρός'];
  const contractTypeSeeds = ['Main Contract'];
  const documentTypeSeeds = ['Τιμολόγιο', 'Απόδειξη'];
  const productionTypeSeeds = ['Νέα Παραγωγή', 'Ανανέωση'];
  const paymentFrequencySeeds = [1, 2, 4, 12];

  for (const name of partnerSeeds) {
    const existing = await prisma.partner.findFirst({ where: { name } });
    if (existing) {
      await prisma.partner.update({
        where: { id: existing.id },
        data: { updatedId: seedUserId },
      });
      continue;
    }
    await prisma.partner.create({
      data: { name, createdId: seedUserId, updatedId: seedUserId },
    });
  }

  for (const name of companySeeds) {
    await prisma.insuranceCompany.upsert({
      where: { name },
      create: { name, createdId: seedUserId, updatedId: seedUserId },
      update: { updatedId: seedUserId },
    });
  }

  for (const name of branchSeeds) {
    await prisma.insuranceBranch.upsert({
      where: { name },
      create: { name, createdId: seedUserId, updatedId: seedUserId },
      update: { updatedId: seedUserId },
    });
  }

  for (const name of contractTypeSeeds) {
    await prisma.contractType.upsert({
      where: { name },
      create: { name, createdId: seedUserId, updatedId: seedUserId },
      update: { updatedId: seedUserId },
    });
  }

  for (const name of documentTypeSeeds) {
    await prisma.documentType.upsert({
      where: { name },
      create: { name, createdId: seedUserId, updatedId: seedUserId },
      update: { updatedId: seedUserId },
    });
  }

  for (const name of productionTypeSeeds) {
    await prisma.productionType.upsert({
      where: { name },
      create: { name, createdId: seedUserId, updatedId: seedUserId },
      update: { updatedId: seedUserId },
    });
  }

  for (const value of paymentFrequencySeeds) {
    await prisma.paymentFrequency.upsert({
      where: { value },
      create: {
        value,
        name: `Every ${value}`,
        createdId: seedUserId,
        updatedId: seedUserId,
      },
      update: { updatedId: seedUserId },
    });
  }
}

async function main() {
  const seedUserId = await ensureBootstrapUser();
  await seedLicense();
  await seedNavigation();
  await seedInsuranceLookups(seedUserId);

  // eslint-disable-next-line no-console
  console.log('Seed complete: bootstrap user + navigation rules');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
