import { User, UserRole } from '../../../domain/entities/user.entity';
import { HashingServicePort } from '../../ports/hashing.service.port';
import { OfficeRepositoryPort } from '../../ports/office.repository.port';
import { UserRepositoryPort } from '../../ports/user.repository.port';
import { AuditService } from '../../services/audit.service';
export interface CreateUserInput {
    email: string;
    username: string;
    password: string;
    role: UserRole;
    officeId?: string;
}
export interface ActorContext {
    id: string;
    role: UserRole;
}
export declare class CreateUserUseCase {
    private readonly userRepository;
    private readonly officeRepository;
    private readonly hashingService;
    private readonly auditService;
    constructor(userRepository: UserRepositoryPort, officeRepository: OfficeRepositoryPort, hashingService: HashingServicePort, auditService: AuditService);
    execute(actor: ActorContext, input: CreateUserInput): Promise<User>;
}
