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
exports.PrismaTehsilRepository = void 0;
const common_1 = require("@nestjs/common");
const location_entity_1 = require("../../../domain/entities/location.entity");
const prisma_service_1 = require("../prisma/prisma.service");
let PrismaTehsilRepository = class PrismaTehsilRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        const records = await this.prisma.tehsil.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { villages: true } } },
        });
        return records.map((r) => this.toTehsilDomain(r));
    }
    async findById(id) {
        const record = await this.prisma.tehsil.findUnique({
            where: { id },
            include: { _count: { select: { villages: true } } },
        });
        return record ? this.toTehsilDomain(record) : null;
    }
    async findVillagesByTehsilId(tehsilId) {
        const records = await this.prisma.village.findMany({
            where: { tehsilId },
            orderBy: { name: 'asc' },
            include: { _count: { select: { settlements: true } } },
        });
        return records.map((r) => this.toVillageDomain(r));
    }
    async findVillageById(id) {
        const record = await this.prisma.village.findUnique({
            where: { id },
            include: { _count: { select: { settlements: true } } },
        });
        return record ? this.toVillageDomain(record) : null;
    }
    async findSettlementsByVillageId(villageId) {
        const records = await this.prisma.settlement.findMany({
            where: { villageId },
            orderBy: { name: 'asc' },
        });
        return records.map((r) => new location_entity_1.Settlement(r.id, r.name, r.villageId, r.createdAt));
    }
    toTehsilDomain(record) {
        return new location_entity_1.Tehsil(record.id, record.name, record.createdAt, record._count?.villages);
    }
    toVillageDomain(record) {
        return new location_entity_1.Village(record.id, record.name, record.tehsilId, record.createdAt, record._count?.settlements);
    }
};
exports.PrismaTehsilRepository = PrismaTehsilRepository;
exports.PrismaTehsilRepository = PrismaTehsilRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaTehsilRepository);
//# sourceMappingURL=prisma-tehsil.repository.js.map