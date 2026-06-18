import { Contractor } from './contractor.entity';
import { Consultant } from './consultant.entity';
export declare class ProcurementPackageVillageRef {
    readonly id: string;
    readonly name: string;
    constructor(id: string, name: string);
}
export declare class ProcurementPackageTehsilRef {
    readonly id: string;
    readonly name: string;
    readonly displayName: string;
    constructor(id: string, name: string, displayName: string);
}
export declare class ProcurementPackageExpense {
    readonly id: string;
    readonly packageId: string;
    readonly amount: string;
    readonly description: string | null;
    readonly expenseDate: Date;
    readonly createdBy: {
        id: string;
        username: string;
        email: string;
    };
    readonly createdAt: Date;
    readonly updatedAt: Date;
    constructor(id: string, packageId: string, amount: string, description: string | null, expenseDate: Date, createdBy: {
        id: string;
        username: string;
        email: string;
    }, createdAt: Date, updatedAt: Date);
}
export declare class ProcurementPackage {
    readonly id: string;
    readonly name: string;
    readonly budgetAmount: string;
    readonly totalExpenses: string;
    readonly remainingBudget: string;
    readonly contractor: Contractor;
    readonly consultant: Consultant;
    readonly tehsil: ProcurementPackageTehsilRef;
    readonly villages: ProcurementPackageVillageRef[];
    readonly expenses: ProcurementPackageExpense[];
    readonly createdAt: Date;
    readonly updatedAt: Date;
    constructor(id: string, name: string, budgetAmount: string, totalExpenses: string, remainingBudget: string, contractor: Contractor, consultant: Consultant, tehsil: ProcurementPackageTehsilRef, villages: ProcurementPackageVillageRef[], expenses: ProcurementPackageExpense[], createdAt: Date, updatedAt: Date);
}
