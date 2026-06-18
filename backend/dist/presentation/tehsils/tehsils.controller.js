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
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tehsil_mapper_1 = require("./mappers/tehsil.mapper");
let TehsilsController = class TehsilsController {
    listTehsilsUseCase;
    listTehsilVillagesUseCase;
    listVillageSettlementsUseCase;
    constructor(listTehsilsUseCase, listTehsilVillagesUseCase, listVillageSettlementsUseCase) {
        this.listTehsilsUseCase = listTehsilsUseCase;
        this.listTehsilVillagesUseCase = listTehsilVillagesUseCase;
        this.listVillageSettlementsUseCase = listVillageSettlementsUseCase;
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
    (0, common_1.Get)(':id/villages'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TehsilsController.prototype, "listVillages", null);
exports.TehsilsController = TehsilsController = __decorate([
    (0, common_1.Controller)('tehsils'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [list_tehsils_use_case_1.ListTehsilsUseCase,
        list_tehsils_use_case_1.ListTehsilVillagesUseCase,
        list_village_settlements_use_case_1.ListVillageSettlementsUseCase])
], TehsilsController);
//# sourceMappingURL=tehsils.controller.js.map