import { ListAuditLogsUseCase } from '../../application/use-cases/audit/list-audit-logs.use-case';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { ListAuditLogsQueryDto } from './dto/audit-log.dto';
export declare class AuditLogsController {
    private readonly listAuditLogsUseCase;
    constructor(listAuditLogsUseCase: ListAuditLogsUseCase);
    list(actor: AuthenticatedUser, query: ListAuditLogsQueryDto): Promise<{
        items: {
            id: string;
            action: import("../../domain/entities/audit-log.entity").AuditAction;
            resourceType: string;
            resourceId: string | null;
            metadata: Record<string, unknown> | null;
            createdAt: Date;
            actor: {
                id: string;
                email: string | undefined;
                username: string | undefined;
            };
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
}
