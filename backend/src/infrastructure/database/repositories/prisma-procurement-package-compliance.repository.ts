import { Injectable } from '@nestjs/common';
import {
  ComplianceUserRef,
  ProcurementPackageCompliance,
} from '../../../domain/entities/procurement-package-compliance.entity';
import {
  UpsertPackageComplianceData,
  ProcurementPackageComplianceRepositoryPort,
} from '../../../application/ports/procurement-package-compliance.repository.port';
import {
  asCompliancePrisma,
  type ComplianceRecord,
} from '../prisma/compliance-prisma.access';
import { PrismaService } from '../prisma/prisma.service';

function isBaselineComplete(record: ComplianceRecord): boolean {
  return (
    record.cesmpPlanSubmitted !== null &&
    record.hseStaffHired !== null &&
    record.mobilizationDate !== null
  );
}

export function mapComplianceRecord(
  record: ComplianceRecord,
): ProcurementPackageCompliance {
  return new ProcurementPackageCompliance(
    record.packageId,
    record.cesmpPlanSubmitted,
    record.hseStaffHired,
    record.mobilizationDate,
    record.baselineSubmittedAt,
    record.baselineSubmittedBy
      ? new ComplianceUserRef(
          record.baselineSubmittedBy.id,
          record.baselineSubmittedBy.username,
          record.baselineSubmittedBy.email,
        )
      : null,
    record.mobilizationDate !== null,
    isBaselineComplete(record),
    record.createdAt,
    record.updatedAt,
  );
}

@Injectable()
export class PrismaProcurementPackageComplianceRepository implements ProcurementPackageComplianceRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = {
    baselineSubmittedBy: {
      select: { id: true, username: true, email: true },
    },
  } as const;

  async findByPackageId(packageId: string) {
    const db = asCompliancePrisma(this.prisma);
    const record = await db.procurementPackageCompliance.findUnique({
      where: { packageId },
      include: this.include,
    });
    return record ? mapComplianceRecord(record) : null;
  }

  async isMobilized(packageId: string): Promise<boolean> {
    const db = asCompliancePrisma(this.prisma);
    const record = await db.procurementPackageCompliance.findUnique({
      where: { packageId },
      select: { mobilizationDate: true },
    });
    return record?.mobilizationDate != null;
  }

  async upsertBaseline(
    packageId: string,
    data: UpsertPackageComplianceData,
    options?: { existingMobilizationDate?: Date | null },
  ): Promise<ProcurementPackageCompliance> {
    const db = asCompliancePrisma(this.prisma);
    const mobilizationDate =
      options?.existingMobilizationDate ?? data.mobilizationDate ?? null;

    const baselineComplete =
      data.cesmpPlanSubmitted !== null &&
      data.hseStaffHired !== null &&
      mobilizationDate !== null;

    const record = await db.procurementPackageCompliance.upsert({
      where: { packageId },
      create: {
        packageId,
        cesmpPlanSubmitted: data.cesmpPlanSubmitted,
        hseStaffHired: data.hseStaffHired,
        mobilizationDate,
        baselineSubmittedAt: baselineComplete ? new Date() : null,
        baselineSubmittedById: baselineComplete ? data.submittedById : null,
      },
      update: {
        cesmpPlanSubmitted: data.cesmpPlanSubmitted,
        hseStaffHired: data.hseStaffHired,
        mobilizationDate,
      },
      include: this.include,
    });

    if (baselineComplete && !record.baselineSubmittedAt) {
      const finalized = await db.procurementPackageCompliance.update({
        where: { packageId },
        data: {
          baselineSubmittedAt: new Date(),
          baselineSubmittedById: data.submittedById,
        },
        include: this.include,
      });
      return mapComplianceRecord(finalized);
    }

    return mapComplianceRecord(record);
  }
}
