export declare class CreateMasterNameDto {
    name: string;
}
export declare class UpdateMasterNameDto {
    name: string;
}
export declare class VillageAllocationDto {
    villageId: string;
    allocatedBudget: number;
}
export declare class CreateProcurementPackageDto {
    cluster: string;
    code: string;
    budgetAmount: number;
    contractorId: string;
    consultantId: string;
    tehsilId: string;
    villageIds: string[];
    villageAllocations?: VillageAllocationDto[];
}
export declare class UpdateProcurementPackageDto {
    name?: string;
    budgetAmount?: number;
    contractorId?: string;
    consultantId?: string;
    villageIds?: string[];
    villageAllocations?: VillageAllocationDto[];
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
export declare class SavePackageBaselineDto {
    answers: PackageBaselineAnswerDto[];
}
export declare class PackageBaselineAnswerDto {
    fieldId: string;
    value: unknown;
}
