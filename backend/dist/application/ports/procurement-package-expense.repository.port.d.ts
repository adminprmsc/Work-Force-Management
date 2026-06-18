import { ProcurementPackageExpense } from '../../domain/entities/procurement-package.entity';
export interface CreateProcurementPackageExpenseData {
    packageId: string;
    amount: string;
    description?: string | null;
    expenseDate?: Date;
    createdById: string;
}
export interface UpdateProcurementPackageExpenseData {
    amount?: string;
    description?: string | null;
    expenseDate?: Date;
}
export declare abstract class ProcurementPackageExpenseRepositoryPort {
    abstract findByPackageId(packageId: string): Promise<ProcurementPackageExpense[]>;
    abstract findById(id: string): Promise<ProcurementPackageExpense | null>;
    abstract create(data: CreateProcurementPackageExpenseData): Promise<ProcurementPackageExpense>;
    abstract update(id: string, data: UpdateProcurementPackageExpenseData): Promise<ProcurementPackageExpense>;
    abstract delete(id: string): Promise<void>;
    abstract sumByPackageId(packageId: string): Promise<string>;
}
export declare const PROCUREMENT_PACKAGE_EXPENSE_REPOSITORY: unique symbol;
