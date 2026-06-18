import { Injectable } from '@nestjs/common';
import { AuditAction as PrismaAuditAction, Prisma } from '@prisma/client';
import {
  AuditAction,
  AuditLog,
} from '../../../domain/entities/audit-log.entity';
import {
  AuditLogRepositoryPort,
  CreateAuditLogData,
  ListAuditLogsFilter,
} from '../../../application/ports/audit-log.repository.port';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaAuditLogRepository implements AuditLogRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAuditLogData): Promise<AuditLog> {
    const record = await this.prisma.auditLog.create({
      data: {
        actorId: data.actorId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId ?? null,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
      include: { actor: true },
    });
    return this.toDomain(record);
  }

  async findAll(filter?: ListAuditLogsFilter): Promise<{
    items: AuditLog[];
    total: number;
  }> {
    const page = filter?.page ?? 1;
    const limit = filter?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { actor: true },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      items: records.map((r) => this.toDomain(r)),
      total,
    };
  }

  private toDomain(record: {
    id: string;
    actorId: string;
    action: PrismaAuditAction;
    resourceType: string;
    resourceId: string | null;
    metadata: unknown;
    createdAt: Date;
    actor?: { email: string; username: string };
  }): AuditLog {
    return new AuditLog(
      record.id,
      record.actorId,
      record.action as AuditAction,
      record.resourceType,
      record.resourceId,
      record.metadata as Record<string, unknown> | null,
      record.createdAt,
      record.actor?.email,
      record.actor?.username,
    );
  }
}
