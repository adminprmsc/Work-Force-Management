import { Contractor } from '../../../domain/entities/contractor.entity';
import { Consultant } from '../../../domain/entities/consultant.entity';
import { ProcurementPackage, ProcurementPackageExpense } from '../../../domain/entities/procurement-package.entity';
export declare function toContractorResponse(contractor: Contractor): {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
};
export declare function toConsultantResponse(consultant: Consultant): {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
};
export declare function toProcurementPackageExpenseResponse(expense: ProcurementPackageExpense): {
    id: string;
    packageId: string;
    amount: string;
    description: string | null;
    expenseDate: Date;
    createdBy: {
        id: string;
        username: string;
        email: string;
    };
    createdAt: Date;
    updatedAt: Date;
};
export declare function toProcurementPackageResponse(pkg: ProcurementPackage): {
    id: string;
    name: string;
    budgetAmount: string;
    totalExpenses: string;
    remainingBudget: string;
    contractor: {
        id: string;
        name: string;
    };
    consultant: {
        id: string;
        name: string;
    };
    tehsil: {
        id: string;
        name: string;
        displayName: string;
    };
    villages: {
        id: string;
        name: string;
    }[];
    expenses: {
        id: string;
        packageId: string;
        amount: string;
        description: string | null;
        expenseDate: Date;
        createdBy: {
            id: string;
            username: string;
            email: string;
        };
        createdAt: Date;
        updatedAt: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
};
