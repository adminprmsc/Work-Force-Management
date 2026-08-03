import { UserRole } from '../entities/user.entity';

const MOBILE_APP_MANAGERS: UserRole[] = [
  UserRole.SENIOR_MANAGER_ES,
  UserRole.RA_ENVIRONMENT_HO,
];

export function canManageMobileApp(role: UserRole): boolean {
  return MOBILE_APP_MANAGERS.includes(role);
}
