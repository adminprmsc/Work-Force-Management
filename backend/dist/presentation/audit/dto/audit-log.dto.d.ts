import { AuditAction } from '../../../domain/entities/audit-log.entity';
export declare class ListAuditLogsQueryDto {
    page?: number;
    limit?: number;
    resourceType?: string;
    resourceId?: string;
    action?: AuditAction;
    actorId?: string;
    userId?: string;
    search?: string;
}
