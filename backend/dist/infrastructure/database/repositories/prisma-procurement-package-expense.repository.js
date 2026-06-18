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
exports.PrismaProcurementPackageExpenseRepository = void 0;
const common_1 = require("@nestjs/common");
const procurement_package_mapper_1 = require("../mappers/procurement-package.mapper");
const procurement_prisma_access_1 = require("../prisma/procurement-prisma.access");
const prisma_service_1 = require("../prisma/prisma.service");
const expenseInclude = {
    createdBy: {
        select: {
            id: true,
            username: true,
            email: true,
        },
    },
};
let PrismaProcurementPackageExpenseRepository = class PrismaProcurementPackageExpenseRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByPackageId(packageId) {
        const records = await (0, procurement_prisma_access_1.asProcurementPrisma)(this.prisma).procurementPackageExpense.findMany({
            where: { packageId },
            include: expenseInclude,
            orderBy: { expenseDate: 'desc' },
        });
        return records.map(procurement_package_mapper_1.mapExpenseRow);
    }
    async findById(id) {
        const record = await (0, procurement_prisma_access_1.asProcurementPrisma)(this.prisma).procurementPackageExpense.findUnique({
            where: { id },
            include: expenseInclude,
        });
        return record ? (0, procurement_package_mapper_1.mapExpenseRow)(record) : null;
    }
    async create(data) {
        const record = await (0, procurement_prisma_access_1.asProcurementPrisma)(this.prisma).procurementPackageExpense.create({
            data: {
                packageId: data.packageId,
                amount: data.amount,
                description: data.description ?? null,
                expenseDate: data.expenseDate,
                createdById: data.createdById,
            },
            include: expenseInclude,
        });
        return (0, procurement_package_mapper_1.mapExpenseRow)(record);
    }
    async update(id, data) {
        const record = await (0, procurement_prisma_access_1.asProcurementPrisma)(this.prisma).procurementPackageExpense.update({
            where: { id },
            data: {
                ...(data.amount !== undefined ? { amount: data.amount } : {}),
                ...(data.description !== undefined
                    ? { description: data.description }
                    : {}),
                ...(data.expenseDate !== undefined
                    ? { expenseDate: data.expenseDate }
                    : {}),
            },
            include: expenseInclude,
        });
        return (0, procurement_package_mapper_1.mapExpenseRow)(record);
    }
    async delete(id) {
        await (0, procurement_prisma_access_1.asProcurementPrisma)(this.prisma).procurementPackageExpense.delete({
            where: { id },
        });
    }
    async sumByPackageId(packageId) {
        const result = await (0, procurement_prisma_access_1.asProcurementPrisma)(this.prisma).procurementPackageExpense.aggregate({
            where: { packageId },
            _sum: { amount: true },
        });
        return (0, procurement_package_mapper_1.decimalToMoneyString)(result._sum.amount ?? '0');
    }
};
exports.PrismaProcurementPackageExpenseRepository = PrismaProcurementPackageExpenseRepository;
exports.PrismaProcurementPackageExpenseRepository = PrismaProcurementPackageExpenseRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaProcurementPackageExpenseRepository);
//# sourceMappingURL=prisma-procurement-package-expense.repository.js.map