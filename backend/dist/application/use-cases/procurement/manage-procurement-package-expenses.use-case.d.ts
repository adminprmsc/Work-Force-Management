import { ProcurementPackageExpense } from '../../../domain/entities/procurement-package.entity';
import { ProcurementPackageExpenseRepositoryPort } from '../../ports/procurement-package-expense.repository.port';
import { ProcurementPackageRepositoryPort } from '../../ports/procurement-package.repository.port';
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
export declare class ListProcurementPackageExpensesUseCase {
    private readonly packageRepository;
    private readonly expenseRepository;
    private readonly actorResolver;
    constructor(packageRepository: ProcurementPackageRepositoryPort, expenseRepository: ProcurementPackageExpenseRepositoryPort, actorResolver: ProcurementActorResolver);
    execute(user: AuthenticatedUser, packageId: string): Promise<ProcurementPackageExpense[]>;
}
export declare class CreateProcurementPackageExpenseUseCase {
    private readonly packageRepository;
    private readonly expenseRepository;
    private readonly actorResolver;
    constructor(packageRepository: ProcurementPackageRepositoryPort, expenseRepository: ProcurementPackageExpenseRepositoryPort, actorResolver: ProcurementActorResolver);
    execute(user: AuthenticatedUser, packageId: string, command: CreateProcurementPackageExpenseCommand): Promise<ProcurementPackageExpense>;
}
export declare class UpdateProcurementPackageExpenseUseCase {
    private readonly expenseRepository;
    private readonly packageRepository;
    private readonly actorResolver;
    constructor(expenseRepository: ProcurementPackageExpenseRepositoryPort, packageRepository: ProcurementPackageRepositoryPort, actorResolver: ProcurementActorResolver);
    execute(user: AuthenticatedUser, packageId: string, expenseId: string, command: UpdateProcurementPackageExpenseCommand): Promise<ProcurementPackageExpense>;
}
export declare class DeleteProcurementPackageExpenseUseCase {
    private readonly expenseRepository;
    private readonly packageRepository;
    private readonly actorResolver;
    constructor(expenseRepository: ProcurementPackageExpenseRepositoryPort, packageRepository: ProcurementPackageRepositoryPort, actorResolver: ProcurementActorResolver);
    execute(user: AuthenticatedUser, packageId: string, expenseId: string): Promise<void>;
}
