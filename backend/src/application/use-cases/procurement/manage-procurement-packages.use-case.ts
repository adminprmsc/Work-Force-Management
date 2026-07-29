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
  VillageAllocationInput,
} from '../../ports/procurement-package.repository.port';
import {
  normalizeName,
  ProcurementActorResolver,
} from '../../services/procurement-actor.resolver';
import { ProcurementPackageValidator } from '../../services/procurement-package.validator';
import { ProcurementPackageNamingService } from '../../services/procurement-package-naming.service';
import { ProcurementPackageBudgetEnricher } from '../../services/procurement-package-budget.enricher';
import type { AuthenticatedUser } from '../../types/authenticated-user.type';

export interface VillageAllocationCommand {
  villageId: string;
  allocatedBudget: number;
}

export interface CreateProcurementPackageCommand {
  cluster: string;
  code: string;
  budgetAmount: number;
  contractorId: string;
  consultantId: string;
  tehsilId: string;
  villageIds: string[];
  villageAllocations?: VillageAllocationCommand[];
}

export interface UpdateProcurementPackageCommand {
  name?: string;
  budgetAmount?: number;
  contractorId?: string;
  consultantId?: string;
  villageIds?: string[];
  villageAllocations?: VillageAllocationCommand[];
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}

/**
 * Split a budget equally across villages (in whole cents), distributing any
 * remainder cents onto the first villages so the parts sum exactly to the total.
 */
function equalSplitAllocations(
  budgetAmount: number,
  villageIds: string[],
): VillageAllocationInput[] {
  const n = villageIds.length;
  if (n === 0) return [];
  const totalCents = Math.round(budgetAmount * 100);
  const base = Math.floor(totalCents / n);
  const remainder = totalCents - base * n;
  return villageIds.map((villageId, index) => {
    const cents = base + (index < remainder ? 1 : 0);
    return { villageId, allocatedBudget: (cents / 100).toFixed(2) };
  });
}

/**
 * Resolve the per-village allocations to persist. When explicit allocations are
 * provided they must cover exactly the selected villages and sum to the budget;
 * otherwise the budget is split equally.
 */
function resolveVillageAllocations(
  budgetAmount: number,
  villageIds: string[],
  provided: VillageAllocationCommand[] | undefined,
): VillageAllocationInput[] {
  if (!provided || provided.length === 0) {
    return equalSplitAllocations(budgetAmount, villageIds);
  }

  const villageIdSet = new Set(villageIds);
  const seen = new Set<string>();
  let sum = 0;
  for (const allocation of provided) {
    if (!villageIdSet.has(allocation.villageId)) {
      throw new BadRequestException(
        'Village allocations must match the selected villages',
      );
    }
    if (seen.has(allocation.villageId)) {
      throw new BadRequestException('Duplicate village allocation');
    }
    if (allocation.allocatedBudget < 0) {
      throw new BadRequestException('Village allocation cannot be negative');
    }
    seen.add(allocation.villageId);
    sum += allocation.allocatedBudget;
  }

  if (seen.size !== villageIds.length) {
    throw new BadRequestException(
      'Every selected village must have an allocation',
    );
  }

  if (Math.abs(sum - budgetAmount) > 0.01) {
    throw new BadRequestException(
      'Village allocations must sum to the allocated budget',
    );
  }

  return provided.map((allocation) => ({
    villageId: allocation.villageId,
    allocatedBudget: formatMoney(allocation.allocatedBudget),
  }));
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

    const cluster = normalizeName(command.cluster);
    if (!cluster) {
      throw new BadRequestException('Cluster is required');
    }

    const code = normalizeName(command.code);
    if (!code) {
      throw new BadRequestException('Code is required');
    }

    await this.packageValidator.validate({
      contractorId: command.contractorId,
      consultantId: command.consultantId,
      tehsilId: command.tehsilId,
      villageIds: command.villageIds,
    });

    const villageAllocations = resolveVillageAllocations(
      command.budgetAmount,
      command.villageIds,
      command.villageAllocations,
    );

    const name = await this.namingService.resolvePackageName(
      cluster,
      code,
      command.tehsilId,
    );

    await assertUniquePackageName(this.packageRepository, name);

    return this.packageRepository.create({
      name,
      budgetAmount: formatMoney(command.budgetAmount),
      contractorId: command.contractorId,
      consultantId: command.consultantId,
      tehsilId: command.tehsilId,
      villageAllocations,
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
      command.name === undefined &&
      command.budgetAmount === undefined &&
      command.contractorId === undefined &&
      command.consultantId === undefined &&
      command.villageIds === undefined
    ) {
      throw new BadRequestException(
        'Provide package name, contractor, consultant, budget amount, and/or villages to update',
      );
    }

    let nextName: string | undefined;
    if (command.name !== undefined) {
      nextName = normalizeName(command.name);
      await assertUniquePackageName(this.packageRepository, nextName, id);
    }

    if (command.budgetAmount !== undefined && command.budgetAmount < 0) {
      throw new BadRequestException('Budget amount cannot be negative');
    }

    const villageIds =
      command.villageIds ?? existing.villages.map((village) => village.id);
    const contractorId = command.contractorId ?? existing.contractor.id;
    const consultantId = command.consultantId ?? existing.consultant.id;

    if (
      command.villageIds ||
      command.contractorId ||
      command.consultantId
    ) {
      await this.packageValidator.validate({
        contractorId,
        consultantId,
        tehsilId: existing.tehsil.id,
        villageIds,
      });
    }

    // Re-derive per-village allocations whenever the budget, the village list,
    // or the allocations themselves change so they always sum to the budget.
    const budgetAmount = command.budgetAmount ?? Number(existing.budgetAmount);
    let villageAllocations: VillageAllocationInput[] | undefined;
    if (
      command.villageAllocations !== undefined ||
      command.villageIds !== undefined ||
      command.budgetAmount !== undefined
    ) {
      villageAllocations = resolveVillageAllocations(
        budgetAmount,
        villageIds,
        command.villageAllocations,
      );
    }

    return this.packageRepository.update(id, {
      name: nextName,
      budgetAmount:
        command.budgetAmount !== undefined
          ? formatMoney(command.budgetAmount)
          : undefined,
      contractorId: command.contractorId,
      consultantId: command.consultantId,
      villageAllocations,
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
