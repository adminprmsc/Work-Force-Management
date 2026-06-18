import { ProcurementPackage } from '../../domain/entities/procurement-package.entity';

export interface CreateProcurementPackageData {
  name: string;
  budgetAmount: string;
  contractorId: string;
  consultantId: string;
  tehsilId: string;
  villageIds: string[];
}

export interface UpdateProcurementPackageData {
  name?: string;
  budgetAmount?: string;
  contractorId?: string;
  consultantId?: string;
  tehsilId?: string;
  villageIds?: string[];
}

export interface ListProcurementPackagesFilter {
  tehsilId?: string;
}

export abstract class ProcurementPackageRepositoryPort {
  abstract findAll(
    filter?: ListProcurementPackagesFilter,
  ): Promise<ProcurementPackage[]>;
  abstract findById(id: string): Promise<ProcurementPackage | null>;
  abstract findByName(name: string): Promise<ProcurementPackage | null>;
  abstract create(
    data: CreateProcurementPackageData,
  ): Promise<ProcurementPackage>;
  abstract update(
    id: string,
    data: UpdateProcurementPackageData,
  ): Promise<ProcurementPackage>;
  abstract delete(id: string): Promise<void>;
}

export const PROCUREMENT_PACKAGE_REPOSITORY = Symbol(
  'PROCUREMENT_PACKAGE_REPOSITORY',
);
