import { AuditLog } from '../../../domain/entities/audit-log.entity';
import { UserRole } from '../../../domain/entities/user.entity';
import { AuditLogRepositoryPort, ListAuditLogsFilter } from '../../ports/audit-log.repository.port';
export interface ActorContext {
    id: string;
    role: UserRole;
}
export declare class ListAuditLogsUseCase {
    private readonly auditLogRepository;
    constructor(auditLogRepository: AuditLogRepositoryPort);
    execute(actor: ActorContext, filter?: ListAuditLogsFilter): Promise<{
        items: AuditLog[];
        total: number;
    }>;
}
