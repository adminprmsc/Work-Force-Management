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
exports.PrismaUserRepository = void 0;
const common_1 = require("@nestjs/common");
const user_entity_1 = require("../../../domain/entities/user.entity");
const prisma_service_1 = require("../prisma/prisma.service");
let PrismaUserRepository = class PrismaUserRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    include = {
        office: { include: { tehsil: true } },
    };
    async findByEmail(email) {
        const record = await this.prisma.user.findUnique({
            where: { email },
            include: this.include,
        });
        return record ? this.toDomain(record) : null;
    }
    async findByUsername(username) {
        const record = await this.prisma.user.findUnique({
            where: { username },
            include: this.include,
        });
        return record ? this.toDomain(record) : null;
    }
    async findById(id) {
        const record = await this.prisma.user.findUnique({
            where: { id },
            include: this.include,
        });
        return record ? this.toDomain(record) : null;
    }
    async findAll(filter) {
        const records = await this.prisma.user.findMany({
            where: {
                role: filter?.role,
                officeId: filter?.officeId,
                createdById: filter?.createdById,
            },
            include: this.include,
            orderBy: { createdAt: 'desc' },
        });
        return records.map((r) => this.toDomain(r));
    }
    async create(data) {
        const record = await this.prisma.user.create({
            data: {
                email: data.email,
                username: data.username,
                password: data.password,
                role: data.role,
                officeId: data.officeId ?? null,
                createdById: data.createdById,
            },
            include: this.include,
        });
        return this.toDomain(record);
    }
    async update(id, data) {
        const record = await this.prisma.user.update({
            where: { id },
            data: {
                email: data.email,
                username: data.username,
                password: data.password,
                role: data.role,
                officeId: data.officeId,
                mustChangePassword: data.mustChangePassword,
            },
            include: this.include,
        });
        return this.toDomain(record);
    }
    async updateStatus(id, status) {
        const record = await this.prisma.user.update({
            where: { id },
            data: { status: status },
            include: this.include,
        });
        return this.toDomain(record);
    }
    async delete(id) {
        await this.prisma.user.delete({ where: { id } });
    }
    toDomain(record) {
        return new user_entity_1.User(record.id, record.email, record.username, record.password, record.role, record.status, record.mustChangePassword, record.officeId, record.office?.name ?? null, record.office?.type ?? null, record.office?.tehsil?.name ?? null, record.createdById, record.createdAt, record.updatedAt);
    }
};
exports.PrismaUserRepository = PrismaUserRepository;
exports.PrismaUserRepository = PrismaUserRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaUserRepository);
//# sourceMappingURL=prisma-user.repository.js.map