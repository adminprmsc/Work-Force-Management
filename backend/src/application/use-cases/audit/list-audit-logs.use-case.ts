import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { UserRole } from '../../../domain/entities/user.entity';
import {
  AUDIT_LOG_REPOSITORY,
  AuditLogRepositoryPort,
  ListAuditLogsFilter,
} from '../../ports/audit-log.repository.port';
import { AuditLog } from '../../../domain/entities/audit-log.entity';

export interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class ListAuditLogsUseCase {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: AuditLogRepositoryPort,
  ) {}

  async execute(
    actor: ActorContext,
    filter?: ListAuditLogsFilter,
  ): Promise<{ items: AuditLog[]; total: number }> {
    if (actor.role !== UserRole.SENIOR_MANAGER_ES) {
      throw new ForbiddenException(
        'Only Senior Manager E&S can view audit logs',
      );
    }

    return this.auditLogRepository.findAll(filter);
  }
}
