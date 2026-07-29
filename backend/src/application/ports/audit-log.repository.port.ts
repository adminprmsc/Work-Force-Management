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
  resourceType?: string;
  resourceId?: string;
  action?: AuditAction;
  actorId?: string;
  /** Matches events where the user is the actor or the affected resource. */
  userId?: string;
  /** Free-text match on actor identity and well-known metadata labels. */
  search?: string;
}

export abstract class AuditLogRepositoryPort {
  abstract create(data: CreateAuditLogData): Promise<AuditLog>;
  abstract findAll(filter?: ListAuditLogsFilter): Promise<{
    items: AuditLog[];
    total: number;
  }>;
}

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');
