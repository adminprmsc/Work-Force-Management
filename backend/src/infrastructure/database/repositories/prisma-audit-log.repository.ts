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

const SEARCHABLE_METADATA_KEYS = [
  'targetUsername',
  'targetEmail',
  'packageName',
  'formTitle',
  'villageName',
  'contractorName',
  'consultantName',
  'respondentUsername',
  'description',
];

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

    const where: Prisma.AuditLogWhereInput = {};
    if (filter?.resourceType) where.resourceType = filter.resourceType;
    if (filter?.resourceId) where.resourceId = filter.resourceId;
    if (filter?.action) where.action = filter.action;
    if (filter?.actorId) where.actorId = filter.actorId;

    const conditions: Prisma.AuditLogWhereInput[] = [];
    if (filter?.userId) {
      conditions.push({
        OR: [{ actorId: filter.userId }, { resourceId: filter.userId }],
      });
    }

    const search = filter?.search?.trim();
    if (search) {
      conditions.push({
        OR: [
          { actor: { username: { contains: search, mode: 'insensitive' } } },
          { actor: { email: { contains: search, mode: 'insensitive' } } },
          ...SEARCHABLE_METADATA_KEYS.map((key) => ({
            metadata: {
              path: [key],
              string_contains: search,
              mode: 'insensitive' as const,
            },
          })),
        ],
      });
    }

    if (conditions.length > 0) where.AND = conditions;

    const [records, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { actor: true },
      }),
      this.prisma.auditLog.count({ where }),
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
