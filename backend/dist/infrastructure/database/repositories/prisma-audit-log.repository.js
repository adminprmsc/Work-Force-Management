"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaAuditLogRepository = void 0;
const common_1 = require("@nestjs/common");
const audit_log_entity_1 = require("../../../domain/entities/audit-log.entity");
const prisma_service_1 = require("../prisma/prisma.service");
let PrismaAuditLogRepository = class PrismaAuditLogRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const record = await this.prisma.auditLog.create({
            data: {
                actorId: data.actorId,
                action: data.action,
                resourceType: data.resourceType,
                resourceId: data.resourceId ?? null,
                metadata: data.metadata,
            },
            include: { actor: true },
        });
        return this.toDomain(record);
    }
    async findAll(filter) {
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
    toDomain(record) {
        return new audit_log_entity_1.AuditLog(record.id, record.actorId, record.action, record.resourceType, record.resourceId, record.metadata, record.createdAt, record.actor?.email, record.actor?.username);
    }
};
exports.PrismaAuditLogRepository = PrismaAuditLogRepository;
exports.PrismaAuditLogRepository = PrismaAuditLogRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaAuditLogRepository);
//# sourceMappingURL=prisma-audit-log.repository.js.map