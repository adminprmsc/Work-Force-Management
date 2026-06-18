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
exports.ProcurementActorResolver = void 0;
exports.normalizeName = normalizeName;
const common_1 = require("@nestjs/common");
const user_entity_1 = require("../../domain/entities/user.entity");
const procurement_access_policy_1 = require("../../domain/policies/procurement-access.policy");
const office_repository_port_1 = require("../ports/office.repository.port");
const user_repository_port_1 = require("../ports/user.repository.port");
let ProcurementActorResolver = class ProcurementActorResolver {
    userRepository;
    officeRepository;
    constructor(userRepository, officeRepository) {
        this.userRepository = userRepository;
        this.officeRepository = officeRepository;
    }
    async resolve(user) {
        if (user.role !== user_entity_1.UserRole.RA_ES_TEHSIL) {
            return { id: user.id, role: user.role, tehsilId: null };
        }
        const fullUser = await this.userRepository.findById(user.id);
        if (!fullUser?.officeId) {
            throw new common_1.ForbiddenException('Tehsil office is not assigned to this user');
        }
        const office = await this.officeRepository.findById(fullUser.officeId);
        if (!office?.tehsilId) {
            throw new common_1.ForbiddenException('User office is not linked to a tehsil');
        }
        return {
            id: user.id,
            role: user.role,
            tehsilId: office.tehsilId,
        };
    }
    assertManageMasters(actor) {
        if (!(0, procurement_access_policy_1.canManageProcurementMasters)(actor.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
    }
};
exports.ProcurementActorResolver = ProcurementActorResolver;
exports.ProcurementActorResolver = ProcurementActorResolver = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_port_1.USER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(office_repository_port_1.OFFICE_REPOSITORY)),
    __metadata("design:paramtypes", [user_repository_port_1.UserRepositoryPort,
        office_repository_port_1.OfficeRepositoryPort])
], ProcurementActorResolver);
function normalizeName(name) {
    const trimmed = name.trim();
    if (!trimmed) {
        throw new common_1.BadRequestException('Name is required');
    }
    return trimmed;
}
//# sourceMappingURL=procurement-actor.resolver.js.map