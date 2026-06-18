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
exports.PrismaOfficeRepository = void 0;
const common_1 = require("@nestjs/common");
const office_entity_1 = require("../../../domain/entities/office.entity");
const prisma_service_1 = require("../prisma/prisma.service");
let PrismaOfficeRepository = class PrismaOfficeRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const record = await this.prisma.office.findUnique({
            where: { id },
            include: { tehsil: true },
        });
        return record ? this.toDomain(record) : null;
    }
    async findAll(filter) {
        const records = await this.prisma.office.findMany({
            where: { type: filter?.type },
            include: { tehsil: true },
            orderBy: { name: 'asc' },
        });
        return records.map((r) => this.toDomain(r));
    }
    async findByTehsilId(tehsilId) {
        const record = await this.prisma.office.findUnique({
            where: { tehsilId },
            include: { tehsil: true },
        });
        return record ? this.toDomain(record) : null;
    }
    toDomain(record) {
        return new office_entity_1.Office(record.id, record.type, record.name, record.tehsilId, record.tehsil?.name ?? null, record.createdAt, record.updatedAt);
    }
};
exports.PrismaOfficeRepository = PrismaOfficeRepository;
exports.PrismaOfficeRepository = PrismaOfficeRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaOfficeRepository);
//# sourceMappingURL=prisma-office.repository.js.map