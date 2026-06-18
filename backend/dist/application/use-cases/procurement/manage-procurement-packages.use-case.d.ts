import { ProcurementPackage } from '../../../domain/entities/procurement-package.entity';
import { ProcurementPackageRepositoryPort } from '../../ports/procurement-package.repository.port';
import { ProcurementActorResolver } from '../../services/procurement-actor.resolver';
import { ProcurementPackageValidator } from '../../services/procurement-package.validator';
import { ProcurementPackageNamingService } from '../../services/procurement-package-naming.service';
import type { AuthenticatedUser } from '../../types/authenticated-user.type';
export interface CreateProcurementPackageCommand {
    name: string;
    budgetAmount: number;
    contractorId: string;
    consultantId: string;
    tehsilId: string;
    villageIds: string[];
}
export interface UpdateProcurementPackageCommand {
    budgetAmount?: number;
    villageIds?: string[];
}
export declare class ListProcurementPackagesUseCase {
    private readonly packageRepository;
    private readonly actorResolver;
    constructor(packageRepository: ProcurementPackageRepositoryPort, actorResolver: ProcurementActorResolver);
    execute(user: AuthenticatedUser): Promise<ProcurementPackage[]>;
}
export declare class GetProcurementPackageUseCase {
    private readonly packageRepository;
    private readonly actorResolver;
    constructor(packageRepository: ProcurementPackageRepositoryPort, actorResolver: ProcurementActorResolver);
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
    constructor(packageRepository: ProcurementPackageRepositoryPort, actorResolver: ProcurementActorResolver, packageValidator: ProcurementPackageValidator, namingService: ProcurementPackageNamingService);
    execute(user: AuthenticatedUser, command: CreateProcurementPackageCommand): Promise<ProcurementPackage>;
}
export declare class UpdateProcurementPackageUseCase {
    private readonly packageRepository;
    private readonly actorResolver;
    private readonly packageValidator;
    constructor(packageRepository: ProcurementPackageRepositoryPort, actorResolver: ProcurementActorResolver, packageValidator: ProcurementPackageValidator);
    execute(user: AuthenticatedUser, id: string, command: UpdateProcurementPackageCommand): Promise<ProcurementPackage>;
}
export declare class DeleteProcurementPackageUseCase {
    private readonly packageRepository;
    private readonly actorResolver;
    constructor(packageRepository: ProcurementPackageRepositoryPort, actorResolver: ProcurementActorResolver);
    execute(user: AuthenticatedUser, id: string): Promise<void>;
}
