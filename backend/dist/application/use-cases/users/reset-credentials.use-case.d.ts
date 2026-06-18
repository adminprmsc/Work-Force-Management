import { UserRole } from '../../../domain/entities/user.entity';
import { HashingServicePort } from '../../ports/hashing.service.port';
import { UserRepositoryPort } from '../../ports/user.repository.port';
import { AuditService } from '../../services/audit.service';
export interface ActorContext {
    id: string;
    role: UserRole;
}
export interface ResetCredentialsResult {
    email: string;
    username: string;
    temporaryPassword: string;
}
export declare class ResetUserCredentialsUseCase {
    private readonly userRepository;
    private readonly hashingService;
    private readonly auditService;
    constructor(userRepository: UserRepositoryPort, hashingService: HashingServicePort, auditService: AuditService);
    execute(actor: ActorContext, userId: string): Promise<ResetCredentialsResult>;
}
