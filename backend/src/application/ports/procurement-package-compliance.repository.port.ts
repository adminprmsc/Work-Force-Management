import { ProcurementPackageCompliance } from '../../domain/entities/procurement-package-compliance.entity';

export interface UpsertPackageComplianceData {
  cesmpPlanSubmitted: boolean;
  hseStaffHired: boolean;
  mobilizationDate?: Date | null;
  submittedById: string;
}

export abstract class ProcurementPackageComplianceRepositoryPort {
  abstract findByPackageId(
    packageId: string,
  ): Promise<ProcurementPackageCompliance | null>;
  abstract upsertBaseline(
    packageId: string,
    data: UpsertPackageComplianceData,
    options?: { existingMobilizationDate?: Date | null },
  ): Promise<ProcurementPackageCompliance>;
  abstract isMobilized(packageId: string): Promise<boolean>;
}

export const PROCUREMENT_PACKAGE_COMPLIANCE_REPOSITORY = Symbol(
  'PROCUREMENT_PACKAGE_COMPLIANCE_REPOSITORY',
);
