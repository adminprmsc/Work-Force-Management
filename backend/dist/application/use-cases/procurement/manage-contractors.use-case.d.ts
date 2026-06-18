import { Contractor } from '../../../domain/entities/contractor.entity';
import { ContractorRepositoryPort } from '../../ports/contractor.repository.port';
import { ProcurementActorResolver } from '../../services/procurement-actor.resolver';
import type { AuthenticatedUser } from '../../types/authenticated-user.type';
export declare class ListContractorsUseCase {
    private readonly contractorRepository;
    private readonly actorResolver;
    constructor(contractorRepository: ContractorRepositoryPort, actorResolver: ProcurementActorResolver);
    execute(user: AuthenticatedUser): Promise<Contractor[]>;
}
export declare class CreateContractorUseCase {
    private readonly contractorRepository;
    private readonly actorResolver;
    constructor(contractorRepository: ContractorRepositoryPort, actorResolver: ProcurementActorResolver);
    execute(user: AuthenticatedUser, name: string): Promise<Contractor>;
}
export declare class UpdateContractorUseCase {
    private readonly contractorRepository;
    private readonly actorResolver;
    constructor(contractorRepository: ContractorRepositoryPort, actorResolver: ProcurementActorResolver);
    execute(user: AuthenticatedUser, id: string, name: string): Promise<Contractor>;
}
export declare class DeleteContractorUseCase {
    private readonly contractorRepository;
    private readonly actorResolver;
    constructor(contractorRepository: ContractorRepositoryPort, actorResolver: ProcurementActorResolver);
    execute(user: AuthenticatedUser, id: string): Promise<void>;
}
