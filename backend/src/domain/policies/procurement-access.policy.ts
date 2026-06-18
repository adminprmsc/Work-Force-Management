import { UserRole } from '../entities/user.entity';

export interface ProcurementActorContext {
  id: string;
  role: UserRole;
  tehsilId: string | null;
}

const PROCUREMENT_MANAGERS: UserRole[] = [
  UserRole.SENIOR_MANAGER_ES,
  UserRole.RA_ENVIRONMENT_HO,
];

const PROCUREMENT_READERS: UserRole[] = [
  UserRole.SENIOR_MANAGER_ES,
  UserRole.RA_ENVIRONMENT_HO,
  UserRole.WORLD_BANK_USER,
  UserRole.RA_ES_TEHSIL,
];

export function canManageProcurementMasters(role: UserRole): boolean {
  return PROCUREMENT_MANAGERS.includes(role);
}

export function canManageProcurementPackages(role: UserRole): boolean {
  return PROCUREMENT_MANAGERS.includes(role);
}

export function canReadProcurementPackages(role: UserRole): boolean {
  return PROCUREMENT_READERS.includes(role);
}

export function canReadProcurementPackage(
  actor: ProcurementActorContext,
  tehsilId: string,
): boolean {
  if (!canReadProcurementPackages(actor.role)) {
    return false;
  }

  if (actor.role === UserRole.RA_ES_TEHSIL) {
    return actor.tehsilId === tehsilId;
  }

  return true;
}
