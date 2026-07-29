import { ProcurementPackage } from '../../domain/entities/procurement-package.entity';
export interface VillageAllocationInput {
    villageId: string;
    allocatedBudget: string;
}
export interface CreateProcurementPackageData {
    name: string;
    budgetAmount: string;
    contractorId: string;
    consultantId: string;
    tehsilId: string;
    villageAllocations: VillageAllocationInput[];
}
export interface UpdateProcurementPackageData {
    name?: string;
    budgetAmount?: string;
    contractorId?: string;
    consultantId?: string;
    tehsilId?: string;
    villageAllocations?: VillageAllocationInput[];
}
export interface ListProcurementPackagesFilter {
    tehsilId?: string;
    page?: number;
    limit?: number;
}
export declare abstract class ProcurementPackageRepositoryPort {
    abstract findAll(filter?: ListProcurementPackagesFilter): Promise<{
        items: ProcurementPackage[];
        total: number;
    }>;
    abstract findById(id: string): Promise<ProcurementPackage | null>;
    abstract findByName(name: string): Promise<ProcurementPackage | null>;
    abstract create(data: CreateProcurementPackageData): Promise<ProcurementPackage>;
    abstract update(id: string, data: UpdateProcurementPackageData): Promise<ProcurementPackage>;
    abstract delete(id: string): Promise<void>;
}
export declare const PROCUREMENT_PACKAGE_REPOSITORY: unique symbol;
