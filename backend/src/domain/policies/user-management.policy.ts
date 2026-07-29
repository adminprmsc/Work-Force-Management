import { UserRole, OfficeType } from '../entities/user.entity';

export type UserAdminActor = {
  role: UserRole;
  canManageUsers?: boolean;
};

const SM_CREATABLE_ROLES: UserRole[] = [
  UserRole.SENIOR_MANAGER_ES,
  UserRole.RA_ENVIRONMENT_HO,
  UserRole.RA_ES_TEHSIL,
  UserRole.WORLD_BANK_USER,
];

/** Roles an RA HO with user-admin can create (not Senior Manager). */
const RA_HO_ADMIN_CREATABLE_ROLES: UserRole[] = [
  UserRole.RA_ENVIRONMENT_HO,
  UserRole.RA_ES_TEHSIL,
  UserRole.WORLD_BANK_USER,
];

export function isUserAdmin(actor: UserAdminActor): boolean {
  if (actor.role === UserRole.SENIOR_MANAGER_ES) return true;
  return (
    actor.role === UserRole.RA_ENVIRONMENT_HO && Boolean(actor.canManageUsers)
  );
}

export function canCreateRole(
  actor: UserAdminActor,
  targetRole: UserRole,
): boolean {
  if (actor.role === UserRole.SENIOR_MANAGER_ES) {
    return SM_CREATABLE_ROLES.includes(targetRole);
  }
  if (actor.role === UserRole.RA_ENVIRONMENT_HO && actor.canManageUsers) {
    return RA_HO_ADMIN_CREATABLE_ROLES.includes(targetRole);
  }
  return false;
}

export function canManageUser(actor: UserAdminActor): boolean {
  return isUserAdmin(actor);
}

/** Whether actor may update/delete/reset a user with the given role. */
export function canAdministerTarget(
  actor: UserAdminActor,
  targetRole: UserRole,
): boolean {
  if (!isUserAdmin(actor)) return false;
  if (actor.role === UserRole.SENIOR_MANAGER_ES) return true;
  // Delegated RA HO admins cannot administer Senior Managers.
  return targetRole !== UserRole.SENIOR_MANAGER_ES;
}

export function canDeleteUser(
  actor: UserAdminActor,
  targetRole: UserRole,
): boolean {
  return canAdministerTarget(actor, targetRole);
}

export function canChangeRole(
  actor: UserAdminActor,
  targetRole: UserRole,
): boolean {
  return (
    actor.role === UserRole.SENIOR_MANAGER_ES &&
    SM_CREATABLE_ROLES.includes(targetRole)
  );
}

export function canGrantUserAdmin(
  actor: UserAdminActor,
  targetRole: UserRole,
): boolean {
  return (
    actor.role === UserRole.SENIOR_MANAGER_ES &&
    targetRole === UserRole.RA_ENVIRONMENT_HO
  );
}

export function creatableRolesFor(actor: UserAdminActor): UserRole[] {
  if (actor.role === UserRole.SENIOR_MANAGER_ES) return [...SM_CREATABLE_ROLES];
  if (actor.role === UserRole.RA_ENVIRONMENT_HO && actor.canManageUsers) {
    return [...RA_HO_ADMIN_CREATABLE_ROLES];
  }
  return [];
}

export function requiredOfficeTypeForRole(role: UserRole): OfficeType | null {
  switch (role) {
    case UserRole.RA_ENVIRONMENT_HO:
      return OfficeType.HEAD_OFFICE;
    case UserRole.WORLD_BANK_USER:
      return OfficeType.WORLD_BANK_OFFICE;
    case UserRole.RA_ES_TEHSIL:
      return OfficeType.TEHSIL_OFFICE;
    default:
      return null;
  }
}

export function roleRequiresOffice(role: UserRole): boolean {
  return requiredOfficeTypeForRole(role) !== null;
}
