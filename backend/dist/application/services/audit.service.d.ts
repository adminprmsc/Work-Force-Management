import { AuditAction } from '../../domain/entities/audit-log.entity';
import { AuditLogRepositoryPort, CreateAuditLogData } from '../ports/audit-log.repository.port';
export declare class AuditService {
    private readonly auditLogRepository;
    constructor(auditLogRepository: AuditLogRepositoryPort);
    log(data: CreateAuditLogData): Promise<void>;
    logUserAction(actorId: string, action: AuditAction, targetUserId: string, metadata?: Record<string, unknown>): Promise<void>;
}
