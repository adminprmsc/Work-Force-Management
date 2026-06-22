import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProcurementPackageCompliance } from '../../../domain/entities/procurement-package-compliance.entity';
import { canManagePackageCompliance } from '../../../domain/policies/package-compliance.policy';
import { canReadProcurementPackage } from '../../../domain/policies/procurement-access.policy';
import {
  PROCUREMENT_PACKAGE_COMPLIANCE_REPOSITORY,
  ProcurementPackageComplianceRepositoryPort,
} from '../../ports/procurement-package-compliance.repository.port';
import {
  PROCUREMENT_PACKAGE_REPOSITORY,
  ProcurementPackageRepositoryPort,
} from '../../ports/procurement-package.repository.port';
import { ProcurementActorResolver } from '../../services/procurement-actor.resolver';
import type { AuthenticatedUser } from '../../types/authenticated-user.type';

export interface UpsertPackageComplianceCommand {
  cesmpPlanSubmitted: boolean;
  hseStaffHired: boolean;
  mobilizationDate?: string | null;
}

function parseDateOnly(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Invalid mobilization date');
  }
  return date;
}

function emptyCompliance(packageId: string): ProcurementPackageCompliance {
  const now = new Date();
  return new ProcurementPackageCompliance(
    packageId,
    null,
    null,
    null,
    null,
    null,
    false,
    false,
    now,
    now,
  );
}

@Injectable()
export class GetPackageComplianceUseCase {
  constructor(
    @Inject(PROCUREMENT_PACKAGE_REPOSITORY)
    private readonly packageRepository: ProcurementPackageRepositoryPort,
    @Inject(PROCUREMENT_PACKAGE_COMPLIANCE_REPOSITORY)
    private readonly complianceRepository: ProcurementPackageComplianceRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
  ) {}

  async execute(
    user: AuthenticatedUser,
    packageId: string,
  ): Promise<ProcurementPackageCompliance> {
    const actor = await this.actorResolver.resolve(user);
    const pkg = await this.packageRepository.findById(packageId);
    if (!pkg) {
      throw new NotFoundException('Procurement package not found');
    }
    if (!canReadProcurementPackage(actor, pkg.tehsil.id)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const compliance =
      await this.complianceRepository.findByPackageId(packageId);
    return compliance ?? emptyCompliance(packageId);
  }
}

@Injectable()
export class UpsertPackageComplianceUseCase {
  constructor(
    @Inject(PROCUREMENT_PACKAGE_REPOSITORY)
    private readonly packageRepository: ProcurementPackageRepositoryPort,
    @Inject(PROCUREMENT_PACKAGE_COMPLIANCE_REPOSITORY)
    private readonly complianceRepository: ProcurementPackageComplianceRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
  ) {}

  async execute(
    user: AuthenticatedUser,
    packageId: string,
    command: UpsertPackageComplianceCommand,
  ): Promise<ProcurementPackageCompliance> {
    const actor = await this.actorResolver.resolve(user);
    const pkg = await this.packageRepository.findById(packageId);
    if (!pkg) {
      throw new NotFoundException('Procurement package not found');
    }
    if (!canManagePackageCompliance(actor, pkg.tehsil.id)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const existing = await this.complianceRepository.findByPackageId(packageId);

    let mobilizationDate: Date | null = existing?.mobilizationDate ?? null;
    if (command.mobilizationDate) {
      const requested = parseDateOnly(command.mobilizationDate);
      if (
        existing?.mobilizationDate &&
        existing.mobilizationDate.toISOString().slice(0, 10) !==
          requested.toISOString().slice(0, 10)
      ) {
        throw new BadRequestException(
          'Mobilization date cannot be changed once recorded',
        );
      }
      mobilizationDate = requested;
    }

    return this.complianceRepository.upsertBaseline(
      packageId,
      {
        cesmpPlanSubmitted: command.cesmpPlanSubmitted,
        hseStaffHired: command.hseStaffHired,
        mobilizationDate,
        submittedById: actor.id,
      },
      { existingMobilizationDate: mobilizationDate },
    );
  }
}
