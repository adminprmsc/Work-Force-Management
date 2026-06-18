import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProcurementPackageExpense } from '../../../domain/entities/procurement-package.entity';
import {
  canManageProcurementPackages,
  canReadProcurementPackage,
  canReadProcurementPackages,
} from '../../../domain/policies/procurement-access.policy';
import {
  PROCUREMENT_PACKAGE_EXPENSE_REPOSITORY,
  ProcurementPackageExpenseRepositoryPort,
} from '../../ports/procurement-package-expense.repository.port';
import {
  PROCUREMENT_PACKAGE_REPOSITORY,
  ProcurementPackageRepositoryPort,
} from '../../ports/procurement-package.repository.port';
import { ProcurementActorResolver } from '../../services/procurement-actor.resolver';
import type { AuthenticatedUser } from '../../types/authenticated-user.type';

export interface CreateProcurementPackageExpenseCommand {
  amount: number;
  description?: string;
  expenseDate?: string;
}

export interface UpdateProcurementPackageExpenseCommand {
  amount?: number;
  description?: string | null;
  expenseDate?: string;
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}

@Injectable()
export class ListProcurementPackageExpensesUseCase {
  constructor(
    @Inject(PROCUREMENT_PACKAGE_REPOSITORY)
    private readonly packageRepository: ProcurementPackageRepositoryPort,
    @Inject(PROCUREMENT_PACKAGE_EXPENSE_REPOSITORY)
    private readonly expenseRepository: ProcurementPackageExpenseRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
  ) {}

  async execute(
    user: AuthenticatedUser,
    packageId: string,
  ): Promise<ProcurementPackageExpense[]> {
    const actor = await this.actorResolver.resolve(user);
    if (!canReadProcurementPackages(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const pkg = await this.packageRepository.findById(packageId);
    if (!pkg) {
      throw new NotFoundException('Procurement package not found');
    }
    if (!canReadProcurementPackage(actor, pkg.tehsil.id)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.expenseRepository.findByPackageId(packageId);
  }
}

@Injectable()
export class CreateProcurementPackageExpenseUseCase {
  constructor(
    @Inject(PROCUREMENT_PACKAGE_REPOSITORY)
    private readonly packageRepository: ProcurementPackageRepositoryPort,
    @Inject(PROCUREMENT_PACKAGE_EXPENSE_REPOSITORY)
    private readonly expenseRepository: ProcurementPackageExpenseRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
  ) {}

  async execute(
    user: AuthenticatedUser,
    packageId: string,
    command: CreateProcurementPackageExpenseCommand,
  ): Promise<ProcurementPackageExpense> {
    const actor = await this.actorResolver.resolve(user);
    if (!canManageProcurementPackages(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (command.amount <= 0) {
      throw new BadRequestException('Expense amount must be greater than zero');
    }

    const pkg = await this.packageRepository.findById(packageId);
    if (!pkg) {
      throw new NotFoundException('Procurement package not found');
    }

    return this.expenseRepository.create({
      packageId,
      amount: formatMoney(command.amount),
      description: command.description?.trim() || null,
      expenseDate: command.expenseDate
        ? new Date(command.expenseDate)
        : undefined,
      createdById: user.id,
    });
  }
}

@Injectable()
export class UpdateProcurementPackageExpenseUseCase {
  constructor(
    @Inject(PROCUREMENT_PACKAGE_EXPENSE_REPOSITORY)
    private readonly expenseRepository: ProcurementPackageExpenseRepositoryPort,
    @Inject(PROCUREMENT_PACKAGE_REPOSITORY)
    private readonly packageRepository: ProcurementPackageRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
  ) {}

  async execute(
    user: AuthenticatedUser,
    packageId: string,
    expenseId: string,
    command: UpdateProcurementPackageExpenseCommand,
  ): Promise<ProcurementPackageExpense> {
    const actor = await this.actorResolver.resolve(user);
    if (!canManageProcurementPackages(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (command.amount !== undefined && command.amount <= 0) {
      throw new BadRequestException('Expense amount must be greater than zero');
    }

    const pkg = await this.packageRepository.findById(packageId);
    if (!pkg) {
      throw new NotFoundException('Procurement package not found');
    }

    const expense = await this.expenseRepository.findById(expenseId);
    if (!expense || expense.packageId !== packageId) {
      throw new NotFoundException('Expense not found for this package');
    }

    return this.expenseRepository.update(expenseId, {
      amount:
        command.amount !== undefined ? formatMoney(command.amount) : undefined,
      description:
        command.description !== undefined
          ? command.description?.trim() || null
          : undefined,
      expenseDate: command.expenseDate
        ? new Date(command.expenseDate)
        : undefined,
    });
  }
}

@Injectable()
export class DeleteProcurementPackageExpenseUseCase {
  constructor(
    @Inject(PROCUREMENT_PACKAGE_EXPENSE_REPOSITORY)
    private readonly expenseRepository: ProcurementPackageExpenseRepositoryPort,
    @Inject(PROCUREMENT_PACKAGE_REPOSITORY)
    private readonly packageRepository: ProcurementPackageRepositoryPort,
    private readonly actorResolver: ProcurementActorResolver,
  ) {}

  async execute(
    user: AuthenticatedUser,
    packageId: string,
    expenseId: string,
  ): Promise<void> {
    const actor = await this.actorResolver.resolve(user);
    if (!canManageProcurementPackages(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const pkg = await this.packageRepository.findById(packageId);
    if (!pkg) {
      throw new NotFoundException('Procurement package not found');
    }

    const expense = await this.expenseRepository.findById(expenseId);
    if (!expense || expense.packageId !== packageId) {
      throw new NotFoundException('Expense not found for this package');
    }

    await this.expenseRepository.delete(expenseId);
  }
}
