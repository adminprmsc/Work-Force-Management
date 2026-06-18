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
exports.ProcurementPackagesController = void 0;
const common_1 = require("@nestjs/common");
const manage_procurement_package_expenses_use_case_1 = require("../../application/use-cases/procurement/manage-procurement-package-expenses.use-case");
const manage_procurement_packages_use_case_1 = require("../../application/use-cases/procurement/manage-procurement-packages.use-case");
const user_entity_1 = require("../../domain/entities/user.entity");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const procurement_dto_1 = require("./dto/procurement.dto");
const procurement_mapper_1 = require("./mappers/procurement.mapper");
const PROCUREMENT_READERS = [
    user_entity_1.UserRole.SENIOR_MANAGER_ES,
    user_entity_1.UserRole.RA_ENVIRONMENT_HO,
    user_entity_1.UserRole.WORLD_BANK_USER,
    user_entity_1.UserRole.RA_ES_TEHSIL,
];
const PROCUREMENT_MANAGERS = [
    user_entity_1.UserRole.SENIOR_MANAGER_ES,
    user_entity_1.UserRole.RA_ENVIRONMENT_HO,
];
let ProcurementPackagesController = class ProcurementPackagesController {
    listPackagesUseCase;
    getPackageUseCase;
    previewNameUseCase;
    createPackageUseCase;
    updatePackageUseCase;
    deletePackageUseCase;
    listExpensesUseCase;
    createExpenseUseCase;
    updateExpenseUseCase;
    deleteExpenseUseCase;
    constructor(listPackagesUseCase, getPackageUseCase, previewNameUseCase, createPackageUseCase, updatePackageUseCase, deletePackageUseCase, listExpensesUseCase, createExpenseUseCase, updateExpenseUseCase, deleteExpenseUseCase) {
        this.listPackagesUseCase = listPackagesUseCase;
        this.getPackageUseCase = getPackageUseCase;
        this.previewNameUseCase = previewNameUseCase;
        this.createPackageUseCase = createPackageUseCase;
        this.updatePackageUseCase = updatePackageUseCase;
        this.deletePackageUseCase = deletePackageUseCase;
        this.listExpensesUseCase = listExpensesUseCase;
        this.createExpenseUseCase = createExpenseUseCase;
        this.updateExpenseUseCase = updateExpenseUseCase;
        this.deleteExpenseUseCase = deleteExpenseUseCase;
    }
    async list(user) {
        const packages = await this.listPackagesUseCase.execute(user);
        return packages.map(procurement_mapper_1.toProcurementPackageResponse);
    }
    async previewName(user, tehsilId) {
        return this.previewNameUseCase.execute(user, tehsilId);
    }
    async listExpenses(user, id) {
        const expenses = await this.listExpensesUseCase.execute(user, id);
        return expenses.map(procurement_mapper_1.toProcurementPackageExpenseResponse);
    }
    async createExpense(user, id, dto) {
        const expense = await this.createExpenseUseCase.execute(user, id, dto);
        return (0, procurement_mapper_1.toProcurementPackageExpenseResponse)(expense);
    }
    async updateExpense(user, id, expenseId, dto) {
        const expense = await this.updateExpenseUseCase.execute(user, id, expenseId, dto);
        return (0, procurement_mapper_1.toProcurementPackageExpenseResponse)(expense);
    }
    async deleteExpense(user, id, expenseId) {
        await this.deleteExpenseUseCase.execute(user, id, expenseId);
        return { success: true };
    }
    async getOne(user, id) {
        const pkg = await this.getPackageUseCase.execute(user, id);
        return (0, procurement_mapper_1.toProcurementPackageResponse)(pkg);
    }
    async create(user, dto) {
        const pkg = await this.createPackageUseCase.execute(user, dto);
        return (0, procurement_mapper_1.toProcurementPackageResponse)(pkg);
    }
    async update(user, id, dto) {
        const pkg = await this.updatePackageUseCase.execute(user, id, dto);
        return (0, procurement_mapper_1.toProcurementPackageResponse)(pkg);
    }
    async remove(user, id) {
        await this.deletePackageUseCase.execute(user, id);
        return { success: true };
    }
};
exports.ProcurementPackagesController = ProcurementPackagesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(...PROCUREMENT_READERS),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProcurementPackagesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('naming-preview'),
    (0, roles_decorator_1.Roles)(...PROCUREMENT_MANAGERS),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('tehsilId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProcurementPackagesController.prototype, "previewName", null);
__decorate([
    (0, common_1.Get)(':id/expenses'),
    (0, roles_decorator_1.Roles)(...PROCUREMENT_READERS),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProcurementPackagesController.prototype, "listExpenses", null);
__decorate([
    (0, common_1.Post)(':id/expenses'),
    (0, roles_decorator_1.Roles)(...PROCUREMENT_MANAGERS),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, procurement_dto_1.CreateProcurementPackageExpenseDto]),
    __metadata("design:returntype", Promise)
], ProcurementPackagesController.prototype, "createExpense", null);
__decorate([
    (0, common_1.Patch)(':id/expenses/:expenseId'),
    (0, roles_decorator_1.Roles)(...PROCUREMENT_MANAGERS),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Param)('expenseId', common_1.ParseUUIDPipe)),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, procurement_dto_1.UpdateProcurementPackageExpenseDto]),
    __metadata("design:returntype", Promise)
], ProcurementPackagesController.prototype, "updateExpense", null);
__decorate([
    (0, common_1.Delete)(':id/expenses/:expenseId'),
    (0, roles_decorator_1.Roles)(...PROCUREMENT_MANAGERS),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Param)('expenseId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ProcurementPackagesController.prototype, "deleteExpense", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(...PROCUREMENT_READERS),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProcurementPackagesController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(...PROCUREMENT_MANAGERS),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, procurement_dto_1.CreateProcurementPackageDto]),
    __metadata("design:returntype", Promise)
], ProcurementPackagesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(...PROCUREMENT_MANAGERS),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, procurement_dto_1.UpdateProcurementPackageDto]),
    __metadata("design:returntype", Promise)
], ProcurementPackagesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(...PROCUREMENT_MANAGERS),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProcurementPackagesController.prototype, "remove", null);
exports.ProcurementPackagesController = ProcurementPackagesController = __decorate([
    (0, common_1.Controller)('procurement-packages'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [manage_procurement_packages_use_case_1.ListProcurementPackagesUseCase,
        manage_procurement_packages_use_case_1.GetProcurementPackageUseCase,
        manage_procurement_packages_use_case_1.PreviewProcurementPackageNameUseCase,
        manage_procurement_packages_use_case_1.CreateProcurementPackageUseCase,
        manage_procurement_packages_use_case_1.UpdateProcurementPackageUseCase,
        manage_procurement_packages_use_case_1.DeleteProcurementPackageUseCase,
        manage_procurement_package_expenses_use_case_1.ListProcurementPackageExpensesUseCase,
        manage_procurement_package_expenses_use_case_1.CreateProcurementPackageExpenseUseCase,
        manage_procurement_package_expenses_use_case_1.UpdateProcurementPackageExpenseUseCase,
        manage_procurement_package_expenses_use_case_1.DeleteProcurementPackageExpenseUseCase])
], ProcurementPackagesController);
//# sourceMappingURL=procurement-packages.controller.js.map