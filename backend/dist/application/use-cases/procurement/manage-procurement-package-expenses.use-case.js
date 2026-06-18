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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteProcurementPackageExpenseUseCase = exports.UpdateProcurementPackageExpenseUseCase = exports.CreateProcurementPackageExpenseUseCase = exports.ListProcurementPackageExpensesUseCase = void 0;
const common_1 = require("@nestjs/common");
const procurement_access_policy_1 = require("../../../domain/policies/procurement-access.policy");
const procurement_package_expense_repository_port_1 = require("../../ports/procurement-package-expense.repository.port");
const procurement_package_repository_port_1 = require("../../ports/procurement-package.repository.port");
const procurement_actor_resolver_1 = require("../../services/procurement-actor.resolver");
function formatMoney(value) {
    return value.toFixed(2);
}
let ListProcurementPackageExpensesUseCase = class ListProcurementPackageExpensesUseCase {
    packageRepository;
    expenseRepository;
    actorResolver;
    constructor(packageRepository, expenseRepository, actorResolver) {
        this.packageRepository = packageRepository;
        this.expenseRepository = expenseRepository;
        this.actorResolver = actorResolver;
    }
    async execute(user, packageId) {
        const actor = await this.actorResolver.resolve(user);
        if (!(0, procurement_access_policy_1.canReadProcurementPackages)(actor.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        const pkg = await this.packageRepository.findById(packageId);
        if (!pkg) {
            throw new common_1.NotFoundException('Procurement package not found');
        }
        if (!(0, procurement_access_policy_1.canReadProcurementPackage)(actor, pkg.tehsil.id)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        return this.expenseRepository.findByPackageId(packageId);
    }
};
exports.ListProcurementPackageExpensesUseCase = ListProcurementPackageExpensesUseCase;
exports.ListProcurementPackageExpensesUseCase = ListProcurementPackageExpensesUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(procurement_package_repository_port_1.PROCUREMENT_PACKAGE_REPOSITORY)),
    __param(1, (0, common_1.Inject)(procurement_package_expense_repository_port_1.PROCUREMENT_PACKAGE_EXPENSE_REPOSITORY)),
    __metadata("design:paramtypes", [procurement_package_repository_port_1.ProcurementPackageRepositoryPort,
        procurement_package_expense_repository_port_1.ProcurementPackageExpenseRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver])
], ListProcurementPackageExpensesUseCase);
let CreateProcurementPackageExpenseUseCase = class CreateProcurementPackageExpenseUseCase {
    packageRepository;
    expenseRepository;
    actorResolver;
    constructor(packageRepository, expenseRepository, actorResolver) {
        this.packageRepository = packageRepository;
        this.expenseRepository = expenseRepository;
        this.actorResolver = actorResolver;
    }
    async execute(user, packageId, command) {
        const actor = await this.actorResolver.resolve(user);
        if (!(0, procurement_access_policy_1.canManageProcurementPackages)(actor.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        if (command.amount <= 0) {
            throw new common_1.BadRequestException('Expense amount must be greater than zero');
        }
        const pkg = await this.packageRepository.findById(packageId);
        if (!pkg) {
            throw new common_1.NotFoundException('Procurement package not found');
        }
        return this.expenseRepository.create({
            packageId,
            amount: formatMoney(command.amount),
            description: command.description?.trim() || null,
            expenseDate: command.expenseDate
                ? new Date(command.expenseDate)
                : undefined,
            createdById: user.id,
        });
    }
};
exports.CreateProcurementPackageExpenseUseCase = CreateProcurementPackageExpenseUseCase;
exports.CreateProcurementPackageExpenseUseCase = CreateProcurementPackageExpenseUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(procurement_package_repository_port_1.PROCUREMENT_PACKAGE_REPOSITORY)),
    __param(1, (0, common_1.Inject)(procurement_package_expense_repository_port_1.PROCUREMENT_PACKAGE_EXPENSE_REPOSITORY)),
    __metadata("design:paramtypes", [procurement_package_repository_port_1.ProcurementPackageRepositoryPort,
        procurement_package_expense_repository_port_1.ProcurementPackageExpenseRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver])
], CreateProcurementPackageExpenseUseCase);
let UpdateProcurementPackageExpenseUseCase = class UpdateProcurementPackageExpenseUseCase {
    expenseRepository;
    packageRepository;
    actorResolver;
    constructor(expenseRepository, packageRepository, actorResolver) {
        this.expenseRepository = expenseRepository;
        this.packageRepository = packageRepository;
        this.actorResolver = actorResolver;
    }
    async execute(user, packageId, expenseId, command) {
        const actor = await this.actorResolver.resolve(user);
        if (!(0, procurement_access_policy_1.canManageProcurementPackages)(actor.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        if (command.amount !== undefined && command.amount <= 0) {
            throw new common_1.BadRequestException('Expense amount must be greater than zero');
        }
        const pkg = await this.packageRepository.findById(packageId);
        if (!pkg) {
            throw new common_1.NotFoundException('Procurement package not found');
        }
        const expense = await this.expenseRepository.findById(expenseId);
        if (!expense || expense.packageId !== packageId) {
            throw new common_1.NotFoundException('Expense not found for this package');
        }
        return this.expenseRepository.update(expenseId, {
            amount: command.amount !== undefined ? formatMoney(command.amount) : undefined,
            description: command.description !== undefined
                ? command.description?.trim() || null
                : undefined,
            expenseDate: command.expenseDate
                ? new Date(command.expenseDate)
                : undefined,
        });
    }
};
exports.UpdateProcurementPackageExpenseUseCase = UpdateProcurementPackageExpenseUseCase;
exports.UpdateProcurementPackageExpenseUseCase = UpdateProcurementPackageExpenseUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(procurement_package_expense_repository_port_1.PROCUREMENT_PACKAGE_EXPENSE_REPOSITORY)),
    __param(1, (0, common_1.Inject)(procurement_package_repository_port_1.PROCUREMENT_PACKAGE_REPOSITORY)),
    __metadata("design:paramtypes", [procurement_package_expense_repository_port_1.ProcurementPackageExpenseRepositoryPort,
        procurement_package_repository_port_1.ProcurementPackageRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver])
], UpdateProcurementPackageExpenseUseCase);
let DeleteProcurementPackageExpenseUseCase = class DeleteProcurementPackageExpenseUseCase {
    expenseRepository;
    packageRepository;
    actorResolver;
    constructor(expenseRepository, packageRepository, actorResolver) {
        this.expenseRepository = expenseRepository;
        this.packageRepository = packageRepository;
        this.actorResolver = actorResolver;
    }
    async execute(user, packageId, expenseId) {
        const actor = await this.actorResolver.resolve(user);
        if (!(0, procurement_access_policy_1.canManageProcurementPackages)(actor.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        const pkg = await this.packageRepository.findById(packageId);
        if (!pkg) {
            throw new common_1.NotFoundException('Procurement package not found');
        }
        const expense = await this.expenseRepository.findById(expenseId);
        if (!expense || expense.packageId !== packageId) {
            throw new common_1.NotFoundException('Expense not found for this package');
        }
        await this.expenseRepository.delete(expenseId);
    }
};
exports.DeleteProcurementPackageExpenseUseCase = DeleteProcurementPackageExpenseUseCase;
exports.DeleteProcurementPackageExpenseUseCase = DeleteProcurementPackageExpenseUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(procurement_package_expense_repository_port_1.PROCUREMENT_PACKAGE_EXPENSE_REPOSITORY)),
    __param(1, (0, common_1.Inject)(procurement_package_repository_port_1.PROCUREMENT_PACKAGE_REPOSITORY)),
    __metadata("design:paramtypes", [procurement_package_expense_repository_port_1.ProcurementPackageExpenseRepositoryPort,
        procurement_package_repository_port_1.ProcurementPackageRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver])
], DeleteProcurementPackageExpenseUseCase);
//# sourceMappingURL=manage-procurement-package-expenses.use-case.js.map