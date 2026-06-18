export declare class CreateMasterNameDto {
    name: string;
}
export declare class UpdateMasterNameDto {
    name: string;
}
export declare class CreateProcurementPackageDto {
    name: string;
    budgetAmount: number;
    contractorId: string;
    consultantId: string;
    tehsilId: string;
    villageIds: string[];
}
export declare class UpdateProcurementPackageDto {
    budgetAmount?: number;
    villageIds?: string[];
}
export declare class CreateProcurementPackageExpenseDto {
    amount: number;
    description?: string;
    expenseDate?: string;
}
export declare class UpdateProcurementPackageExpenseDto {
    amount?: number;
    description?: string | null;
    expenseDate?: string;
}
