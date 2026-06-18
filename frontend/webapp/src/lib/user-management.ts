import { Role, type Role as RoleType } from "@/modules/auth/roles"
import type { Office, OfficeType } from "@/modules/api/types"

export const ROLE_LABELS: Record<RoleType, string> = {
  SENIOR_MANAGER_ES: "Senior Manager",
  RA_ENVIRONMENT_HO: "RA Environment (HO)",
  RA_ES_TEHSIL: "RA E&S Tehsil",
  WORLD_BANK_USER: "World Bank",
}

export const CREATABLE_ROLES: RoleType[] = [
  Role.RA_ENVIRONMENT_HO,
  Role.RA_ES_TEHSIL,
  Role.WORLD_BANK_USER,
  Role.SENIOR_MANAGER_ES,
]

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
