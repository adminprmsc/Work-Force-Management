import { UserRole, OfficeType } from '../entities/user.entity';

const CREATABLE_ROLES: Record<UserRole, UserRole[]> = {
  [UserRole.SENIOR_MANAGER_ES]: [
    UserRole.SENIOR_MANAGER_ES,
    UserRole.RA_ENVIRONMENT_HO,
    UserRole.RA_ES_TEHSIL,
    UserRole.WORLD_BANK_USER,
  ],
  [UserRole.RA_ENVIRONMENT_HO]: [],
  [UserRole.RA_ES_TEHSIL]: [],
  [UserRole.WORLD_BANK_USER]: [],
};

export function canCreateRole(
  actorRole: UserRole,
  targetRole: UserRole,
): boolean {
  return CREATABLE_ROLES[actorRole].includes(targetRole);
}

export function canManageUser(actorRole: UserRole): boolean {
  return actorRole === UserRole.SENIOR_MANAGER_ES;
}

export function canDeleteUser(actorRole: UserRole): boolean {
  return actorRole === UserRole.SENIOR_MANAGER_ES;
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
