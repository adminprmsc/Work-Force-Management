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
exports.DeleteConsultantUseCase = exports.UpdateConsultantUseCase = exports.CreateConsultantUseCase = exports.ListConsultantsUseCase = void 0;
const common_1 = require("@nestjs/common");
const consultant_repository_port_1 = require("../../ports/consultant.repository.port");
const procurement_actor_resolver_1 = require("../../services/procurement-actor.resolver");
let ListConsultantsUseCase = class ListConsultantsUseCase {
    consultantRepository;
    actorResolver;
    constructor(consultantRepository, actorResolver) {
        this.consultantRepository = consultantRepository;
        this.actorResolver = actorResolver;
    }
    async execute(user) {
        const actor = await this.actorResolver.resolve(user);
        this.actorResolver.assertManageMasters(actor);
        return this.consultantRepository.findAll();
    }
};
exports.ListConsultantsUseCase = ListConsultantsUseCase;
exports.ListConsultantsUseCase = ListConsultantsUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(consultant_repository_port_1.CONSULTANT_REPOSITORY)),
    __metadata("design:paramtypes", [consultant_repository_port_1.ConsultantRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver])
], ListConsultantsUseCase);
let CreateConsultantUseCase = class CreateConsultantUseCase {
    consultantRepository;
    actorResolver;
    constructor(consultantRepository, actorResolver) {
        this.consultantRepository = consultantRepository;
        this.actorResolver = actorResolver;
    }
    async execute(user, name) {
        const actor = await this.actorResolver.resolve(user);
        this.actorResolver.assertManageMasters(actor);
        const normalized = (0, procurement_actor_resolver_1.normalizeName)(name);
        const existing = await this.consultantRepository.findByName(normalized);
        if (existing) {
            throw new common_1.ConflictException('Consultant with this name already exists');
        }
        return this.consultantRepository.create(normalized);
    }
};
exports.CreateConsultantUseCase = CreateConsultantUseCase;
exports.CreateConsultantUseCase = CreateConsultantUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(consultant_repository_port_1.CONSULTANT_REPOSITORY)),
    __metadata("design:paramtypes", [consultant_repository_port_1.ConsultantRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver])
], CreateConsultantUseCase);
let UpdateConsultantUseCase = class UpdateConsultantUseCase {
    consultantRepository;
    actorResolver;
    constructor(consultantRepository, actorResolver) {
        this.consultantRepository = consultantRepository;
        this.actorResolver = actorResolver;
    }
    async execute(user, id, name) {
        const actor = await this.actorResolver.resolve(user);
        this.actorResolver.assertManageMasters(actor);
        const consultant = await this.consultantRepository.findById(id);
        if (!consultant) {
            throw new common_1.NotFoundException('Consultant not found');
        }
        const normalized = (0, procurement_actor_resolver_1.normalizeName)(name);
        const existing = await this.consultantRepository.findByName(normalized);
        if (existing && existing.id !== id) {
            throw new common_1.ConflictException('Consultant with this name already exists');
        }
        return this.consultantRepository.update(id, normalized);
    }
};
exports.UpdateConsultantUseCase = UpdateConsultantUseCase;
exports.UpdateConsultantUseCase = UpdateConsultantUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(consultant_repository_port_1.CONSULTANT_REPOSITORY)),
    __metadata("design:paramtypes", [consultant_repository_port_1.ConsultantRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver])
], UpdateConsultantUseCase);
let DeleteConsultantUseCase = class DeleteConsultantUseCase {
    consultantRepository;
    actorResolver;
    constructor(consultantRepository, actorResolver) {
        this.consultantRepository = consultantRepository;
        this.actorResolver = actorResolver;
    }
    async execute(user, id) {
        const actor = await this.actorResolver.resolve(user);
        this.actorResolver.assertManageMasters(actor);
        const consultant = await this.consultantRepository.findById(id);
        if (!consultant) {
            throw new common_1.NotFoundException('Consultant not found');
        }
        const referenced = await this.consultantRepository.isReferencedByPackage(id);
        if (referenced) {
            throw new common_1.ConflictException('Consultant is linked to a procurement package and cannot be deleted');
        }
        await this.consultantRepository.delete(id);
    }
};
exports.DeleteConsultantUseCase = DeleteConsultantUseCase;
exports.DeleteConsultantUseCase = DeleteConsultantUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(consultant_repository_port_1.CONSULTANT_REPOSITORY)),
    __metadata("design:paramtypes", [consultant_repository_port_1.ConsultantRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver])
], DeleteConsultantUseCase);
//# sourceMappingURL=manage-consultants.use-case.js.map