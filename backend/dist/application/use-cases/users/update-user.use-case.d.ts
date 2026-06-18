import { User, UserRole } from '../../../domain/entities/user.entity';
import { OfficeRepositoryPort } from '../../ports/office.repository.port';
import { UserRepositoryPort } from '../../ports/user.repository.port';
import { AuditService } from '../../services/audit.service';
export interface UpdateUserInput {
    email?: string;
    username?: string;
    role?: UserRole;
    officeId?: string;
}
export interface ActorContext {
    id: string;
    role: UserRole;
}
export declare class UpdateUserUseCase {
    private readonly userRepository;
    private readonly officeRepository;
    private readonly auditService;
    constructor(userRepository: UserRepositoryPort, officeRepository: OfficeRepositoryPort, auditService: AuditService);
    execute(actor: ActorContext, userId: string, input: UpdateUserInput): Promise<User>;
}
export declare class DeleteUserUseCase {
    private readonly userRepository;
    private readonly auditService;
    constructor(userRepository: UserRepositoryPort, auditService: AuditService);
    execute(actor: ActorContext, userId: string): Promise<void>;
}
export declare class UpdateUserStatusUseCase {
    private readonly userRepository;
    private readonly auditService;
    constructor(userRepository: UserRepositoryPort, auditService: AuditService);
    execute(actor: ActorContext, userId: string, active: boolean): Promise<User>;
}
