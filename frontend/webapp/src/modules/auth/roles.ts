export const Role = {
  SENIOR_MANAGER_ES: "SENIOR_MANAGER_ES",
  RA_ENVIRONMENT_HO: "RA_ENVIRONMENT_HO",
  RA_ES_TEHSIL: "RA_ES_TEHSIL",
  WORLD_BANK_USER: "WORLD_BANK_USER",
} as const

export type Role = (typeof Role)[keyof typeof Role]

export function roleToDashboardPath(role: Role): string {
  switch (role) {
    case Role.SENIOR_MANAGER_ES:
      return "/dashboard/senior-manager"
    case Role.WORLD_BANK_USER:
      return "/dashboard/world-bank"
    case Role.RA_ENVIRONMENT_HO:
      return "/dashboard/ra-environment"
    case Role.RA_ES_TEHSIL:
      return "/dashboard/ra-tehsil"
    default:
      return "/dashboard"
  }
}

