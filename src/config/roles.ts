export const API_ROLES = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
  OPS: 'OPS',
} as const;

export const LEGACY_API_ROLES = {
  ADMINISTRATOR: 'ADMINISTRATOR',
} as const;

export const NAV_ROLES = [
  'ADMIN',
  'NAV_ADMIN',
  'NAV_ADMINISTRATOR',
  'NAV_MANAGEMENT',
  'OPS_MANAGEMENT',
  'ADMIN_MANAGEMENT',
  'OPS_USER',
  'ADMIN_USER',
  'EXT_USER',
] as const;

export type ApiRole = (typeof API_ROLES)[keyof typeof API_ROLES];
export type NavRole = (typeof NAV_ROLES)[number];
