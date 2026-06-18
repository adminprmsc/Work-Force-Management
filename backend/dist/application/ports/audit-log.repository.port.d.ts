import { AuditAction, AuditLog } from '../../domain/entities/audit-log.entity';
export interface CreateAuditLogData {
    actorId: string;
    action: AuditAction;
    resourceType: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown> | null;
}
export interface ListAuditLogsFilter {
    page?: number;
    limit?: number;
}
export declare abstract class AuditLogRepositoryPort {
    abstract create(data: CreateAuditLogData): Promise<AuditLog>;
    abstract findAll(filter?: ListAuditLogsFilter): Promise<{
        items: AuditLog[];
        total: number;
    }>;
}
export declare const AUDIT_LOG_REPOSITORY: unique symbol;
