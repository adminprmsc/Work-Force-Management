import { Module } from '@nestjs/common';
import { AUDIT_LOG_REPOSITORY } from '../../application/ports/audit-log.repository.port';
import { AuditService } from '../../application/services/audit.service';
import { ListAuditLogsUseCase } from '../../application/use-cases/audit/list-audit-logs.use-case';
import { PrismaAuditLogRepository } from '../../infrastructure/database/repositories/prisma-audit-log.repository';

@Module({
  providers: [
    AuditService,
    ListAuditLogsUseCase,
    { provide: AUDIT_LOG_REPOSITORY, useClass: PrismaAuditLogRepository },
  ],
  exports: [AuditService, ListAuditLogsUseCase, AUDIT_LOG_REPOSITORY],
})
export class AuditModule {}
