import { Consultant } from '../../../domain/entities/consultant.entity';
import { ConsultantRepositoryPort } from '../../ports/consultant.repository.port';
import { ProcurementActorResolver } from '../../services/procurement-actor.resolver';
import type { AuthenticatedUser } from '../../types/authenticated-user.type';
export declare class ListConsultantsUseCase {
    private readonly consultantRepository;
    private readonly actorResolver;
    constructor(consultantRepository: ConsultantRepositoryPort, actorResolver: ProcurementActorResolver);
    execute(user: AuthenticatedUser): Promise<Consultant[]>;
}
export declare class CreateConsultantUseCase {
    private readonly consultantRepository;
    private readonly actorResolver;
    constructor(consultantRepository: ConsultantRepositoryPort, actorResolver: ProcurementActorResolver);
    execute(user: AuthenticatedUser, name: string): Promise<Consultant>;
}
export declare class UpdateConsultantUseCase {
    private readonly consultantRepository;
    private readonly actorResolver;
    constructor(consultantRepository: ConsultantRepositoryPort, actorResolver: ProcurementActorResolver);
    execute(user: AuthenticatedUser, id: string, name: string): Promise<Consultant>;
}
export declare class DeleteConsultantUseCase {
    private readonly consultantRepository;
    private readonly actorResolver;
    constructor(consultantRepository: ConsultantRepositoryPort, actorResolver: ProcurementActorResolver);
    execute(user: AuthenticatedUser, id: string): Promise<void>;
}
