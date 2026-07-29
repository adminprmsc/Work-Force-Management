import { Role, type Role as RoleType } from "@/modules/auth/roles"
import type { Office, OfficeType } from "@/modules/api/types"

export const ROLE_LABELS: Record<RoleType, string> = {
  SENIOR_MANAGER_ES: "Senior Manager",
  RA_ENVIRONMENT_HO: "RA Environment (HO)",
  RA_ES_TEHSIL: "RA E&S Tehsil",
  WORLD_BANK_USER: "World Bank",
}

export const SM_CREATABLE_ROLES: RoleType[] = [
  Role.RA_ENVIRONMENT_HO,
  Role.RA_ES_TEHSIL,
  Role.WORLD_BANK_USER,
  Role.SENIOR_MANAGER_ES,
]

export const RA_HO_ADMIN_CREATABLE_ROLES: RoleType[] = [
  Role.RA_ENVIRONMENT_HO,
  Role.RA_ES_TEHSIL,
  Role.WORLD_BANK_USER,
]

/** @deprecated Prefer creatableRolesFor(actor) */
export const CREATABLE_ROLES = SM_CREATABLE_ROLES

export type UserAdminActor = {
  role: RoleType
  canManageUsers?: boolean
}

export function isUserAdmin(actor: UserAdminActor): boolean {
  if (actor.role === Role.SENIOR_MANAGER_ES) return true
  return actor.role === Role.RA_ENVIRONMENT_HO && Boolean(actor.canManageUsers)
}

export function creatableRolesFor(actor: UserAdminActor): RoleType[] {
  if (actor.role === Role.SENIOR_MANAGER_ES) return [...SM_CREATABLE_ROLES]
  if (actor.role === Role.RA_ENVIRONMENT_HO && actor.canManageUsers) {
    return [...RA_HO_ADMIN_CREATABLE_ROLES]
  }
  return []
}

export function canChangeUserRole(actor: UserAdminActor): boolean {
  return actor.role === Role.SENIOR_MANAGER_ES
}

export function canGrantUserAdmin(actor: UserAdminActor): boolean {
  return actor.role === Role.SENIOR_MANAGER_ES
}

export function canDeleteTargetUser(
  actor: UserAdminActor,
  targetRole: RoleType,
): boolean {
  if (!isUserAdmin(actor)) return false
  if (actor.role === Role.SENIOR_MANAGER_ES) return true
  return targetRole !== Role.SENIOR_MANAGER_ES
}

export function requiredOfficeTypeForRole(role: RoleType): OfficeType | null {
  switch (role) {
    case Role.RA_ENVIRONMENT_HO:
      return "HEAD_OFFICE"
    case Role.WORLD_BANK_USER:
      return "WORLD_BANK_OFFICE"
    case Role.RA_ES_TEHSIL:
      return "TEHSIL_OFFICE"
    default:
      return null
  }
}

export function roleRequiresOffice(role: RoleType): boolean {
  return requiredOfficeTypeForRole(role) !== null
}

export function officesForRole(offices: Office[], role: RoleType): Office[] {
  const requiredType = requiredOfficeTypeForRole(role)
  if (!requiredType) return []
  return offices.filter((office) => office.type === requiredType)
}

export function formatOfficeOption(office: Office): string {
  if (office.type === "TEHSIL_OFFICE" && office.tehsilName) {
    return `${office.tehsilName} — ${office.name}`
  }
  return office.name
}

export const USERS_PATH = "/dashboard/users"

export function usersCreatePath(): string {
  return `${USERS_PATH}/create`
}

export function usersEditPath(userId: string): string {
  return `${USERS_PATH}/${userId}/edit`
}
