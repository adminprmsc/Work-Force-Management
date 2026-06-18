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
exports.ConsultantsController = void 0;
const common_1 = require("@nestjs/common");
const manage_consultants_use_case_1 = require("../../application/use-cases/procurement/manage-consultants.use-case");
const user_entity_1 = require("../../domain/entities/user.entity");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const procurement_dto_1 = require("./dto/procurement.dto");
const procurement_mapper_1 = require("./mappers/procurement.mapper");
let ConsultantsController = class ConsultantsController {
    listConsultantsUseCase;
    createConsultantUseCase;
    updateConsultantUseCase;
    deleteConsultantUseCase;
    constructor(listConsultantsUseCase, createConsultantUseCase, updateConsultantUseCase, deleteConsultantUseCase) {
        this.listConsultantsUseCase = listConsultantsUseCase;
        this.createConsultantUseCase = createConsultantUseCase;
        this.updateConsultantUseCase = updateConsultantUseCase;
        this.deleteConsultantUseCase = deleteConsultantUseCase;
    }
    async list(user) {
        const consultants = await this.listConsultantsUseCase.execute(user);
        return consultants.map(procurement_mapper_1.toConsultantResponse);
    }
    async create(user, dto) {
        const consultant = await this.createConsultantUseCase.execute(user, dto.name);
        return (0, procurement_mapper_1.toConsultantResponse)(consultant);
    }
    async update(user, id, dto) {
        const consultant = await this.updateConsultantUseCase.execute(user, id, dto.name);
        return (0, procurement_mapper_1.toConsultantResponse)(consultant);
    }
    async remove(user, id) {
        await this.deleteConsultantUseCase.execute(user, id);
        return { success: true };
    }
};
exports.ConsultantsController = ConsultantsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConsultantsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, procurement_dto_1.CreateMasterNameDto]),
    __metadata("design:returntype", Promise)
], ConsultantsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, procurement_dto_1.UpdateMasterNameDto]),
    __metadata("design:returntype", Promise)
], ConsultantsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ConsultantsController.prototype, "remove", null);
exports.ConsultantsController = ConsultantsController = __decorate([
    (0, common_1.Controller)('consultants'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SENIOR_MANAGER_ES, user_entity_1.UserRole.RA_ENVIRONMENT_HO),
    __metadata("design:paramtypes", [manage_consultants_use_case_1.ListConsultantsUseCase,
        manage_consultants_use_case_1.CreateConsultantUseCase,
        manage_consultants_use_case_1.UpdateConsultantUseCase,
        manage_consultants_use_case_1.DeleteConsultantUseCase])
], ConsultantsController);
//# sourceMappingURL=consultants.controller.js.map