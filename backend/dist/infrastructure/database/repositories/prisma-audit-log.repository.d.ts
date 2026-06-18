import { AuditLog } from '../../../domain/entities/audit-log.entity';
import { AuditLogRepositoryPort, CreateAuditLogData, ListAuditLogsFilter } from '../../../application/ports/audit-log.repository.port';
import { PrismaService } from '../prisma/prisma.service';
export declare class PrismaAuditLogRepository implements AuditLogRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: CreateAuditLogData): Promise<AuditLog>;
    findAll(filter?: ListAuditLogsFilter): Promise<{
        items: AuditLog[];
        total: number;
    }>;
    private toDomain;
}
