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
exports.PrismaProcurementPackageRepository = void 0;
const common_1 = require("@nestjs/common");
const procurement_prisma_access_1 = require("../prisma/procurement-prisma.access");
const procurement_package_mapper_1 = require("../mappers/procurement-package.mapper");
const prisma_service_1 = require("../prisma/prisma.service");
let PrismaProcurementPackageRepository = class PrismaProcurementPackageRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    include = {
        contractor: true,
        consultant: true,
        tehsil: true,
        villages: {
            include: { village: true },
            orderBy: { village: { name: 'asc' } },
        },
        expenses: {
            include: {
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
            orderBy: { expenseDate: 'desc' },
        },
    };
    async findAll(filter) {
        const records = await (0, procurement_prisma_access_1.asProcurementPrisma)(this.prisma).procurementPackage.findMany({
            where: filter?.tehsilId ? { tehsilId: filter.tehsilId } : undefined,
            include: this.include,
            orderBy: { createdAt: 'desc' },
        });
        return records.map((record) => (0, procurement_package_mapper_1.mapPackageRecord)(record));
    }
    async findById(id) {
        const record = await (0, procurement_prisma_access_1.asProcurementPrisma)(this.prisma).procurementPackage.findUnique({
            where: { id },
            include: this.include,
        });
        return record ? (0, procurement_package_mapper_1.mapPackageRecord)(record) : null;
    }
    async findByName(name) {
        const record = await (0, procurement_prisma_access_1.asProcurementPrisma)(this.prisma).procurementPackage.findUnique({
            where: { name },
            include: this.include,
        });
        return record ? (0, procurement_package_mapper_1.mapPackageRecord)(record) : null;
    }
    async create(data) {
        const record = await (0, procurement_prisma_access_1.asProcurementPrisma)(this.prisma).procurementPackage.create({
            data: {
                name: data.name,
                budgetAmount: data.budgetAmount,
                contractorId: data.contractorId,
                consultantId: data.consultantId,
                tehsilId: data.tehsilId,
                villages: {
                    create: data.villageIds.map((villageId) => ({ villageId })),
                },
            },
            include: this.include,
        });
        return (0, procurement_package_mapper_1.mapPackageRecord)(record);
    }
    async update(id, data) {
        const db = (0, procurement_prisma_access_1.asProcurementPrisma)(this.prisma);
        const record = await db.$transaction(async (tx) => {
            if (data.villageIds) {
                await tx.procurementPackageVillage.deleteMany({
                    where: { packageId: id },
                });
                if (data.villageIds.length > 0) {
                    await tx.procurementPackageVillage.createMany({
                        data: data.villageIds.map((villageId) => ({
                            packageId: id,
                            villageId,
                        })),
                    });
                }
            }
            return tx.procurementPackage.update({
                where: { id },
                data: {
                    ...(data.name !== undefined ? { name: data.name } : {}),
                    ...(data.budgetAmount !== undefined
                        ? { budgetAmount: data.budgetAmount }
                        : {}),
                    ...(data.contractorId !== undefined
                        ? { contractorId: data.contractorId }
                        : {}),
                    ...(data.consultantId !== undefined
                        ? { consultantId: data.consultantId }
                        : {}),
                    ...(data.tehsilId !== undefined ? { tehsilId: data.tehsilId } : {}),
                },
                include: this.include,
            });
        });
        return (0, procurement_package_mapper_1.mapPackageRecord)(record);
    }
    async delete(id) {
        await (0, procurement_prisma_access_1.asProcurementPrisma)(this.prisma).procurementPackage.delete({
            where: { id },
        });
    }
};
exports.PrismaProcurementPackageRepository = PrismaProcurementPackageRepository;
exports.PrismaProcurementPackageRepository = PrismaProcurementPackageRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaProcurementPackageRepository);
//# sourceMappingURL=prisma-procurement-package.repository.js.map