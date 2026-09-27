import { Role } from '@prisma/client';

export const ROLES = {
  USER: Role.USER,
  ADMIN: Role.ADMIN,
  SUPERADMIN: Role.SUPERADMIN,
} as const;

export type UserRole = Role;

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.USER]: 1,
  [Role.ADMIN]: 2,
  [Role.SUPERADMIN]: 3,
};
