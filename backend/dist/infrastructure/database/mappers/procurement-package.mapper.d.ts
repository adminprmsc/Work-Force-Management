import { ProcurementPackage, ProcurementPackageExpense } from '../../../domain/entities/procurement-package.entity';
export declare function decimalToMoneyString(value: {
    toString(): string;
} | string): string;
export declare function subtractMoney(budget: string, spent: string): string;
type ExpenseRow = {
    id: string;
    packageId: string;
    amount: {
        toString(): string;
    };
    description: string | null;
    expenseDate: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy: {
        id: string;
        username: string;
        email: string;
    };
};
export type ProcurementPackageRecord = {
    id: string;
    name: string;
    budgetAmount: {
        toString(): string;
    };
    contractorId: string;
    consultantId: string;
    tehsilId: string;
    createdAt: Date;
    updatedAt: Date;
    contractor: {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    };
    consultant: {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    };
    tehsil: {
        id: string;
        name: string;
    };
    villages: Array<{
        village: {
            id: string;
            name: string;
        };
    }>;
    expenses: ExpenseRow[];
};
export declare function mapExpenseRow(row: ExpenseRow): ProcurementPackageExpense;
export declare function mapPackageRecord(record: ProcurementPackageRecord): ProcurementPackage;
export {};
