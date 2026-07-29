import { Role, type Role as RoleType, roleToDashboardPath } from "@/modules/auth/roles"

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

export function procurementPackagesPath(role: RoleType): string {
  return `${roleToDashboardPath(role)}/procurement/packages`
}

export function procurementPackageEditPath(role: RoleType, packageId: string): string {
  return `${procurementPackagesPath(role)}/${packageId}`
}

export function procurementPackageCreatePath(role: RoleType): string {
  return `${procurementPackagesPath(role)}/new`
}
