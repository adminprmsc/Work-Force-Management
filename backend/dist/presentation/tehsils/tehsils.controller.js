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
exports.TehsilsController = void 0;
const common_1 = require("@nestjs/common");
const list_tehsils_use_case_1 = require("../../application/use-cases/tehsils/list-tehsils.use-case");
const list_village_settlements_use_case_1 = require("../../application/use-cases/tehsils/list-village-settlements.use-case");
const manage_geography_use_case_1 = require("../../application/use-cases/tehsils/manage-geography.use-case");
const user_entity_1 = require("../../domain/entities/user.entity");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const geography_dto_1 = require("./dto/geography.dto");
const tehsil_mapper_1 = require("./mappers/tehsil.mapper");
const GEOGRAPHY_MANAGERS = [
    user_entity_1.UserRole.SENIOR_MANAGER_ES,
    user_entity_1.UserRole.RA_ENVIRONMENT_HO,
];
let TehsilsController = class TehsilsController {
    listTehsilsUseCase;
    listTehsilVillagesUseCase;
    listVillageSettlementsUseCase;
    createVillageUseCase;
    updateVillageUseCase;
    deleteVillageUseCase;
    createSettlementUseCase;
    updateSettlementUseCase;
    deleteSettlementUseCase;
    constructor(listTehsilsUseCase, listTehsilVillagesUseCase, listVillageSettlementsUseCase, createVillageUseCase, updateVillageUseCase, deleteVillageUseCase, createSettlementUseCase, updateSettlementUseCase, deleteSettlementUseCase) {
        this.listTehsilsUseCase = listTehsilsUseCase;
        this.listTehsilVillagesUseCase = listTehsilVillagesUseCase;
        this.listVillageSettlementsUseCase = listVillageSettlementsUseCase;
        this.createVillageUseCase = createVillageUseCase;
        this.updateVillageUseCase = updateVillageUseCase;
        this.deleteVillageUseCase = deleteVillageUseCase;
        this.createSettlementUseCase = createSettlementUseCase;
        this.updateSettlementUseCase = updateSettlementUseCase;
        this.deleteSettlementUseCase = deleteSettlementUseCase;
    }
    async list() {
        const tehsils = await this.listTehsilsUseCase.execute();
        return tehsils.map((t) => ({
            id: t.id,
            name: t.name,
            villageCount: t.villageCount,
            createdAt: t.createdAt,
        }));
    }
    async listVillageSettlements(id) {
        const settlements = await this.listVillageSettlementsUseCase.execute(id);
        return settlements.map(tehsil_mapper_1.toSettlementResponse);
    }
    async createSettlement(villageId, dto) {
        const settlement = await this.createSettlementUseCase.execute(villageId, dto.name);
        return (0, tehsil_mapper_1.toSettlementResponse)(settlement);
    }
    async updateSettlement(id, dto) {
        const settlement = await this.updateSettlementUseCase.execute(id, dto.name);
        return (0, tehsil_mapper_1.toSettlementResponse)(settlement);
    }
    async deleteSettlement(id) {
        await this.deleteSettlementUseCase.execute(id);
        return { success: true };
    }
    async updateVillage(id, dto) {
        const village = await this.updateVillageUseCase.execute(id, dto.name);
        return {
            id: village.id,
            name: village.name,
            tehsilId: village.tehsilId,
            settlementCount: village.settlementCount ?? 0,
            createdAt: village.createdAt,
        };
    }
    async deleteVillage(id) {
        await this.deleteVillageUseCase.execute(id);
        return { success: true };
    }
    async listVillages(id) {
        const villages = await this.listTehsilVillagesUseCase.execute(id);
        return villages.map((v) => ({
            id: v.id,
            name: v.name,
            tehsilId: v.tehsilId,
            settlementCount: v.settlementCount,
            createdAt: v.createdAt,
        }));
    }
    async createVillage(tehsilId, dto) {
        const village = await this.createVillageUseCase.execute(tehsilId, dto.name);
        return {
            id: village.id,
            name: village.name,
            tehsilId: village.tehsilId,
            settlementCount: village.settlementCount ?? 0,
            createdAt: village.createdAt,
        };
    }
};
exports.TehsilsController = TehsilsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TehsilsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('villages/:id/settlements'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TehsilsController.prototype, "listVillageSettlements", null);
__decorate([
    (0, common_1.Post)('villages/:villageId/settlements'),
    (0, roles_decorator_1.Roles)(...GEOGRAPHY_MANAGERS),
    __param(0, (0, common_1.Param)('villageId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, geography_dto_1.GeographyNameDto]),
    __metadata("design:returntype", Promise)
], TehsilsController.prototype, "createSettlement", null);
__decorate([
    (0, common_1.Patch)('settlements/:id'),
    (0, roles_decorator_1.Roles)(...GEOGRAPHY_MANAGERS),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, geography_dto_1.GeographyNameDto]),
    __metadata("design:returntype", Promise)
], TehsilsController.prototype, "updateSettlement", null);
__decorate([
    (0, common_1.Delete)('settlements/:id'),
    (0, roles_decorator_1.Roles)(...GEOGRAPHY_MANAGERS),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TehsilsController.prototype, "deleteSettlement", null);
__decorate([
    (0, common_1.Patch)('villages/:id'),
    (0, roles_decorator_1.Roles)(...GEOGRAPHY_MANAGERS),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, geography_dto_1.GeographyNameDto]),
    __metadata("design:returntype", Promise)
], TehsilsController.prototype, "updateVillage", null);
__decorate([
    (0, common_1.Delete)('villages/:id'),
    (0, roles_decorator_1.Roles)(...GEOGRAPHY_MANAGERS),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TehsilsController.prototype, "deleteVillage", null);
__decorate([
    (0, common_1.Get)(':id/villages'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TehsilsController.prototype, "listVillages", null);
__decorate([
    (0, common_1.Post)(':tehsilId/villages'),
    (0, roles_decorator_1.Roles)(...GEOGRAPHY_MANAGERS),
    __param(0, (0, common_1.Param)('tehsilId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, geography_dto_1.GeographyNameDto]),
    __metadata("design:returntype", Promise)
], TehsilsController.prototype, "createVillage", null);
exports.TehsilsController = TehsilsController = __decorate([
    (0, common_1.Controller)('tehsils'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [list_tehsils_use_case_1.ListTehsilsUseCase,
        list_tehsils_use_case_1.ListTehsilVillagesUseCase,
        list_village_settlements_use_case_1.ListVillageSettlementsUseCase,
        manage_geography_use_case_1.CreateVillageUseCase,
        manage_geography_use_case_1.UpdateVillageUseCase,
        manage_geography_use_case_1.DeleteVillageUseCase,
        manage_geography_use_case_1.CreateSettlementUseCase,
        manage_geography_use_case_1.UpdateSettlementUseCase,
        manage_geography_use_case_1.DeleteSettlementUseCase])
], TehsilsController);
//# sourceMappingURL=tehsils.controller.js.map