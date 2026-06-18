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
exports.PrismaConsultantRepository = void 0;
const common_1 = require("@nestjs/common");
const consultant_entity_1 = require("../../../domain/entities/consultant.entity");
const procurement_prisma_access_1 = require("../prisma/procurement-prisma.access");
const prisma_service_1 = require("../prisma/prisma.service");
let PrismaConsultantRepository = class PrismaConsultantRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        const records = await (0, procurement_prisma_access_1.asProcurementPrisma)(this.prisma).consultant.findMany({
            orderBy: { name: 'asc' },
        });
        return records.map((record) => this.toDomain(record));
    }
    async findById(id) {
        const record = await (0, procurement_prisma_access_1.asProcurementPrisma)(this.prisma).consultant.findUnique({
            where: { id },
        });
        return record ? this.toDomain(record) : null;
    }
    async findByName(name) {
        const record = await (0, procurement_prisma_access_1.asProcurementPrisma)(this.prisma).consultant.findUnique({
            where: { name },
        });
        return record ? this.toDomain(record) : null;
    }
    async create(name) {
        const record = await (0, procurement_prisma_access_1.asProcurementPrisma)(this.prisma).consultant.create({
            data: { name },
        });
        return this.toDomain(record);
    }
    async update(id, name) {
        const record = await (0, procurement_prisma_access_1.asProcurementPrisma)(this.prisma).consultant.update({
            where: { id },
            data: { name },
        });
        return this.toDomain(record);
    }
    async delete(id) {
        await (0, procurement_prisma_access_1.asProcurementPrisma)(this.prisma).consultant.delete({ where: { id } });
    }
    async isReferencedByPackage(id) {
        const count = await (0, procurement_prisma_access_1.asProcurementPrisma)(this.prisma).procurementPackage.count({
            where: { consultantId: id },
        });
        return count > 0;
    }
    toDomain(record) {
        return new consultant_entity_1.Consultant(record.id, record.name, record.createdAt, record.updatedAt);
    }
};
exports.PrismaConsultantRepository = PrismaConsultantRepository;
exports.PrismaConsultantRepository = PrismaConsultantRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaConsultantRepository);
//# sourceMappingURL=prisma-consultant.repository.js.map