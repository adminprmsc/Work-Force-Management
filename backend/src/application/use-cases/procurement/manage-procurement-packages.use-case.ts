import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProcurementPackage } from '../../../domain/entities/procurement-package.entity';
import { UserRole } from '../../../domain/entities/user.entity';
import {
  canManageProcurementPackages,
  canReadProcurementPackage,
  canReadProcurementPackages,
} from '../../../domain/policies/procurement-access.policy';
import {
  PROCUREMENT_PACKAGE_REPOSITORY,
  ProcurementPackageRepositoryPort,
} from '../../ports/procurement-package.repository.port';
import {
  normalizeName,
  ProcurementActorResolver,
} from '../../services/procurement-actor.resolver';
import { ProcurementPackageValidator } from '../../services/procurement-package.validator';
import { ProcurementPackageNamingService } from '../../services/procurement-package-naming.service';
import { ProcurementPackageBudgetEnricher } from '../../services/procurement-package-budget.enricher';
import type { AuthenticatedUser } from '../../types/authenticated-user.type';

export interface CreateProcurementPackageCommand {
  name: string;
  budgetAmount: number;
  contractorId: string;
  consultantId: string;
  tehsilId: string;
  villageIds: string[];
}

export interface UpdateProcurementPackageCommand {
  budgetAmount?: number;
  villageIds?: string[];
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}

async function assertUniquePackageName(
  repository: ProcurementPackageRepositoryPort,
  name: string,
  excludeId?: string,
) {
  const existing = await repository.findByName(name);
  if (existing && existing.id !== excludeId) {
    throw new ConflictException(
      'A procurement package with this name already exists',
    );
  }
}

@Injectable()
export class ListProcurementPackagesUseCase {
  constructor(
    @Inject(PROCUREMENT_PACKAGE_REPOSITORY)
    private readonly packageRepository: ProcurementPackageRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
    private readonly budgetEnricher: ProcurementPackageBudgetEnricher,
  ) {}

  async execute(user: AuthenticatedUser): Promise<ProcurementPackage[]> {
    const actor = await this.actorResolver.resolve(user);
    if (!canReadProcurementPackages(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const filter =
      actor.role === UserRole.RA_ES_TEHSIL && actor.tehsilId
        ? { tehsilId: actor.tehsilId }
        : undefined;

    const packages = await this.packageRepository.findAll(filter);
    return this.budgetEnricher.enrich(packages);
  }
}

@Injectable()
export class GetProcurementPackageUseCase {
  constructor(
    @Inject(PROCUREMENT_PACKAGE_REPOSITORY)
    private readonly packageRepository: ProcurementPackageRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
    private readonly budgetEnricher: ProcurementPackageBudgetEnricher,
  ) {}

  async execute(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ProcurementPackage> {
    const actor = await this.actorResolver.resolve(user);
    if (!canReadProcurementPackages(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const pkg = await this.packageRepository.findById(id);
    if (!pkg) {
      throw new NotFoundException('Procurement package not found');
    }

    if (!canReadProcurementPackage(actor, pkg.tehsil.id)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.budgetEnricher.enrichOne(pkg);
  }
}

@Injectable()
export class PreviewProcurementPackageNameUseCase {
  constructor(
    private readonly namingService: ProcurementPackageNamingService,
    private readonly actorResolver: ProcurementActorResolver,
  ) {}

  async execute(user: AuthenticatedUser, tehsilId: string) {
    const actor = await this.actorResolver.resolve(user);
    if (!canManageProcurementPackages(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.namingService.previewTehsilNaming(tehsilId);
  }
}

@Injectable()
export class CreateProcurementPackageUseCase {
  constructor(
    @Inject(PROCUREMENT_PACKAGE_REPOSITORY)
    private readonly packageRepository: ProcurementPackageRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
    private readonly packageValidator: ProcurementPackageValidator,
    private readonly namingService: ProcurementPackageNamingService,
  ) {}

  async execute(
    user: AuthenticatedUser,
    command: CreateProcurementPackageCommand,
  ): Promise<ProcurementPackage> {
    const actor = await this.actorResolver.resolve(user);
    if (!canManageProcurementPackages(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (command.budgetAmount < 0) {
      throw new BadRequestException('Budget amount cannot be negative');
    }

    const namePart = normalizeName(command.name);
    if (!namePart) {
      throw new BadRequestException('Package name is required');
    }

    const input = {
      contractorId: command.contractorId,
      consultantId: command.consultantId,
      tehsilId: command.tehsilId,
      villageIds: command.villageIds,
    };
    await this.packageValidator.validate(input);

    const name = await this.namingService.resolvePackageName(
      namePart,
      command.tehsilId,
    );

    await assertUniquePackageName(this.packageRepository, name);

    return this.packageRepository.create({
      name,
      budgetAmount: formatMoney(command.budgetAmount),
      ...input,
    });
  }
}

@Injectable()
export class UpdateProcurementPackageUseCase {
  constructor(
    @Inject(PROCUREMENT_PACKAGE_REPOSITORY)
    private readonly packageRepository: ProcurementPackageRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
    private readonly packageValidator: ProcurementPackageValidator,
  ) {}

  async execute(
    user: AuthenticatedUser,
    id: string,
    command: UpdateProcurementPackageCommand,
  ): Promise<ProcurementPackage> {
    const actor = await this.actorResolver.resolve(user);
    if (!canManageProcurementPackages(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const existing = await this.packageRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Procurement package not found');
    }

    if (
      command.budgetAmount === undefined &&
      command.villageIds === undefined
    ) {
      throw new BadRequestException(
        'Provide budget amount and/or villages to update',
      );
    }

    if (command.budgetAmount !== undefined && command.budgetAmount < 0) {
      throw new BadRequestException('Budget amount cannot be negative');
    }

    const villageIds =
      command.villageIds ?? existing.villages.map((village) => village.id);

    if (command.villageIds) {
      await this.packageValidator.validate({
        contractorId: existing.contractor.id,
        consultantId: existing.consultant.id,
        tehsilId: existing.tehsil.id,
        villageIds,
      });
    }

    return this.packageRepository.update(id, {
      budgetAmount:
        command.budgetAmount !== undefined
          ? formatMoney(command.budgetAmount)
          : undefined,
      villageIds: command.villageIds,
    });
  }
}

@Injectable()
export class DeleteProcurementPackageUseCase {
  constructor(
    @Inject(PROCUREMENT_PACKAGE_REPOSITORY)
    private readonly packageRepository: ProcurementPackageRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
  ) {}

  async execute(user: AuthenticatedUser, id: string): Promise<void> {
    const actor = await this.actorResolver.resolve(user);
    if (!canManageProcurementPackages(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const existing = await this.packageRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Procurement package not found');
    }

    await this.packageRepository.delete(id);
  }
}
