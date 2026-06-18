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
exports.OfficesController = void 0;
const common_1 = require("@nestjs/common");
const list_offices_use_case_1 = require("../../application/use-cases/offices/list-offices.use-case");
const user_entity_1 = require("../../domain/entities/user.entity");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const class_validator_1 = require("class-validator");
class ListOfficesQueryDto {
    type;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(user_entity_1.OfficeType),
    __metadata("design:type", String)
], ListOfficesQueryDto.prototype, "type", void 0);
let OfficesController = class OfficesController {
    listOfficesUseCase;
    constructor(listOfficesUseCase) {
        this.listOfficesUseCase = listOfficesUseCase;
    }
    async list(query) {
        const offices = await this.listOfficesUseCase.execute(query.type ? { type: query.type } : undefined);
        return offices.map((office) => ({
            id: office.id,
            type: office.type,
            name: office.name,
            tehsilId: office.tehsilId,
            tehsilName: office.tehsilName,
            createdAt: office.createdAt,
            updatedAt: office.updatedAt,
        }));
    }
};
exports.OfficesController = OfficesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ListOfficesQueryDto]),
    __metadata("design:returntype", Promise)
], OfficesController.prototype, "list", null);
exports.OfficesController = OfficesController = __decorate([
    (0, common_1.Controller)('offices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SENIOR_MANAGER_ES),
    __metadata("design:paramtypes", [list_offices_use_case_1.ListOfficesUseCase])
], OfficesController);
//# sourceMappingURL=offices.controller.js.map