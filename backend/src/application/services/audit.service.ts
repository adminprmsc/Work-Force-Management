import { Inject, Injectable } from '@nestjs/common';
import {
  AUDIT_RESOURCE_TYPES,
  AuditAction,
} from '../../domain/entities/audit-log.entity';
import {
  AUDIT_LOG_REPOSITORY,
  AuditLogRepositoryPort,
  CreateAuditLogData,
} from '../ports/audit-log.repository.port';

@Injectable()
export class AuditService {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: AuditLogRepositoryPort,
  ) {}

  async log(data: CreateAuditLogData): Promise<void> {
    await this.auditLogRepository.create(data);
  }

  async logUserAction(
    actorId: string,
    action: AuditAction,
    targetUserId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      actorId,
      action,
      resourceType: AUDIT_RESOURCE_TYPES.USER,
      resourceId: targetUserId,
      metadata: metadata ?? null,
    });
  }

  async logPackageAction(
    actorId: string,
    action: AuditAction,
    packageId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      actorId,
      action,
      resourceType: AUDIT_RESOURCE_TYPES.PROCUREMENT_PACKAGE,
      resourceId: packageId,
      metadata: metadata ?? null,
    });
  }
}
