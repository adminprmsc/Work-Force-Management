import type { PrismaService } from './prisma.service';

export type ComplianceInclude = {
  baselineSubmittedBy: {
    select: { id: true; username: true; email: true };
  };
};

export type ComplianceRecord = {
  packageId: string;
  cesmpPlanSubmitted: boolean | null;
  hseStaffHired: boolean | null;
  mobilizationDate: Date | null;
  baselineSubmittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  baselineSubmittedBy: {
    id: string;
    username: string;
    email: string;
  } | null;
};

type ComplianceDelegate = {
  findUnique(args: {
    where: { packageId: string };
    include: ComplianceInclude;
  }): Promise<ComplianceRecord | null>;
  findUnique(args: {
    where: { packageId: string };
    select: { mobilizationDate: true };
  }): Promise<{ mobilizationDate: Date | null } | null>;
  upsert(args: {
    where: { packageId: string };
    create: {
      packageId: string;
      cesmpPlanSubmitted: boolean;
      hseStaffHired: boolean;
      mobilizationDate: Date | null;
      baselineSubmittedAt: Date | null;
      baselineSubmittedById: string | null;
    };
    update: {
      cesmpPlanSubmitted: boolean;
      hseStaffHired: boolean;
      mobilizationDate: Date | null;
    };
    include: ComplianceInclude;
  }): Promise<ComplianceRecord>;
  update(args: {
    where: { packageId: string };
    data: {
      baselineSubmittedAt: Date;
      baselineSubmittedById: string;
    };
    include: ComplianceInclude;
  }): Promise<ComplianceRecord>;
};

export type CompliancePrismaAccess = {
  procurementPackageCompliance: ComplianceDelegate;
};

export function asCompliancePrisma(
  prisma: PrismaService,
): CompliancePrismaAccess {
  return prisma as unknown as CompliancePrismaAccess;
}
