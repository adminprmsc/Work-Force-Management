export const Role = {
  SENIOR_MANAGER_ES: 'SENIOR_MANAGER_ES',
  RA_ENVIRONMENT_HO: 'RA_ENVIRONMENT_HO',
  RA_ES_TEHSIL: 'RA_ES_TEHSIL',
  WORLD_BANK_USER: 'WORLD_BANK_USER',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export function isRaTehsilRole(role: Role): boolean {
  return role === Role.RA_ES_TEHSIL;
}
