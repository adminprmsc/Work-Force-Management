import { ProcurementPackage } from '../../../domain/entities/procurement-package.entity';
import { ProcurementPackageRepositoryPort } from '../../ports/procurement-package.repository.port';
import { ProcurementActorResolver } from '../../services/procurement-actor.resolver';
import { ProcurementPackageValidator } from '../../services/procurement-package.validator';
import { ProcurementPackageNamingService } from '../../services/procurement-package-naming.service';
import { ProcurementPackageBudgetEnricher } from '../../services/procurement-package-budget.enricher';
import { AuditService } from '../../services/audit.service';
import type { AuthenticatedUser } from '../../types/authenticated-user.type';
export interface VillageAllocationCommand {
    villageId: string;
    allocatedBudget: number;
}
export interface CreateProcurementPackageCommand {
    cluster: string;
    code: string;
    budgetAmount: number;
    contractorId: string;
    consultantId: string;
    tehsilId: string;
    villageIds: string[];
    villageAllocations?: VillageAllocationCommand[];
}
export interface UpdateProcurementPackageCommand {
    name?: string;
    budgetAmount?: number;
    contractorId?: string;
    consultantId?: string;
    villageIds?: string[];
    villageAllocations?: VillageAllocationCommand[];
}
export declare class ListProcurementPackagesUseCase {
    private readonly packageRepository;
    private readonly actorResolver;
    private readonly budgetEnricher;
    constructor(packageRepository: ProcurementPackageRepositoryPort, actorResolver: ProcurementActorResolver, budgetEnricher: ProcurementPackageBudgetEnricher);
    execute(user: AuthenticatedUser, query?: {
        page?: number;
        limit?: number;
    }): Promise<{
        items: ProcurementPackage[];
        total: number;
        page: number;
        limit: number;
    }>;
}
export declare class GetProcurementPackageUseCase {
    private readonly packageRepository;
    private readonly actorResolver;
    private readonly budgetEnricher;
    constructor(packageRepository: ProcurementPackageRepositoryPort, actorResolver: ProcurementActorResolver, budgetEnricher: ProcurementPackageBudgetEnricher);
    execute(user: AuthenticatedUser, id: string): Promise<ProcurementPackage>;
}
export declare class PreviewProcurementPackageNameUseCase {
    private readonly namingService;
    private readonly actorResolver;
    constructor(namingService: ProcurementPackageNamingService, actorResolver: ProcurementActorResolver);
    execute(user: AuthenticatedUser, tehsilId: string): Promise<import("../../services/procurement-package-naming.service").TehsilNamingPreview>;
}
export declare class CreateProcurementPackageUseCase {
    private readonly packageRepository;
    private readonly actorResolver;
    private readonly packageValidator;
    private readonly namingService;
    private readonly auditService;
    constructor(packageRepository: ProcurementPackageRepositoryPort, actorResolver: ProcurementActorResolver, packageValidator: ProcurementPackageValidator, namingService: ProcurementPackageNamingService, auditService: AuditService);
    execute(user: AuthenticatedUser, command: CreateProcurementPackageCommand): Promise<ProcurementPackage>;
}
export declare class UpdateProcurementPackageUseCase {
    private readonly packageRepository;
    private readonly actorResolver;
    private readonly packageValidator;
    private readonly auditService;
    constructor(packageRepository: ProcurementPackageRepositoryPort, actorResolver: ProcurementActorResolver, packageValidator: ProcurementPackageValidator, auditService: AuditService);
    execute(user: AuthenticatedUser, id: string, command: UpdateProcurementPackageCommand): Promise<ProcurementPackage>;
}
export declare class DeleteProcurementPackageUseCase {
    private readonly packageRepository;
    private readonly actorResolver;
    private readonly auditService;
    constructor(packageRepository: ProcurementPackageRepositoryPort, actorResolver: ProcurementActorResolver, auditService: AuditService);
    execute(user: AuthenticatedUser, id: string): Promise<void>;
}
