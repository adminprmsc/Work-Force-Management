import { UserRole } from '../entities/user.entity';
import type { ProcurementActorContext } from './procurement-access.policy';
import { canManageProcurementPackages } from './procurement-access.policy';

export function canManagePackageCompliance(
  actor: ProcurementActorContext,
  tehsilId: string,
): boolean {
  if (canManageProcurementPackages(actor.role)) {
    return true;
  }
  if (actor.role === UserRole.RA_ES_TEHSIL) {
    return actor.tehsilId === tehsilId;
  }
  return false;
}
