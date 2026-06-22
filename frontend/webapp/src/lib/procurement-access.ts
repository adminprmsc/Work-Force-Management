import { Role, type Role as RoleType } from "@/modules/auth/roles"

const PROCUREMENT_MANAGERS: RoleType[] = [Role.SENIOR_MANAGER_ES, Role.RA_ENVIRONMENT_HO]

const PROCUREMENT_READERS: RoleType[] = [
  Role.SENIOR_MANAGER_ES,
  Role.RA_ENVIRONMENT_HO,
  Role.WORLD_BANK_USER,
  Role.RA_ES_TEHSIL,
]

export function canManageProcurement(role: RoleType): boolean {
  return PROCUREMENT_MANAGERS.includes(role)
}

export function canReadProcurementPackages(role: RoleType): boolean {
  return PROCUREMENT_READERS.includes(role)
}

export function canManagePackageCompliance(role: RoleType): boolean {
  return canManageProcurement(role) || role === Role.RA_ES_TEHSIL
}
