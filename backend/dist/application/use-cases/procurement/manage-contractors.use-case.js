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
exports.DeleteContractorUseCase = exports.UpdateContractorUseCase = exports.CreateContractorUseCase = exports.ListContractorsUseCase = void 0;
const common_1 = require("@nestjs/common");
const contractor_repository_port_1 = require("../../ports/contractor.repository.port");
const procurement_actor_resolver_1 = require("../../services/procurement-actor.resolver");
let ListContractorsUseCase = class ListContractorsUseCase {
    contractorRepository;
    actorResolver;
    constructor(contractorRepository, actorResolver) {
        this.contractorRepository = contractorRepository;
        this.actorResolver = actorResolver;
    }
    async execute(user) {
        const actor = await this.actorResolver.resolve(user);
        this.actorResolver.assertManageMasters(actor);
        return this.contractorRepository.findAll();
    }
};
exports.ListContractorsUseCase = ListContractorsUseCase;
exports.ListContractorsUseCase = ListContractorsUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(contractor_repository_port_1.CONTRACTOR_REPOSITORY)),
    __metadata("design:paramtypes", [contractor_repository_port_1.ContractorRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver])
], ListContractorsUseCase);
let CreateContractorUseCase = class CreateContractorUseCase {
    contractorRepository;
    actorResolver;
    constructor(contractorRepository, actorResolver) {
        this.contractorRepository = contractorRepository;
        this.actorResolver = actorResolver;
    }
    async execute(user, name) {
        const actor = await this.actorResolver.resolve(user);
        this.actorResolver.assertManageMasters(actor);
        const normalized = (0, procurement_actor_resolver_1.normalizeName)(name);
        const existing = await this.contractorRepository.findByName(normalized);
        if (existing) {
            throw new common_1.ConflictException('Contractor with this name already exists');
        }
        return this.contractorRepository.create(normalized);
    }
};
exports.CreateContractorUseCase = CreateContractorUseCase;
exports.CreateContractorUseCase = CreateContractorUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(contractor_repository_port_1.CONTRACTOR_REPOSITORY)),
    __metadata("design:paramtypes", [contractor_repository_port_1.ContractorRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver])
], CreateContractorUseCase);
let UpdateContractorUseCase = class UpdateContractorUseCase {
    contractorRepository;
    actorResolver;
    constructor(contractorRepository, actorResolver) {
        this.contractorRepository = contractorRepository;
        this.actorResolver = actorResolver;
    }
    async execute(user, id, name) {
        const actor = await this.actorResolver.resolve(user);
        this.actorResolver.assertManageMasters(actor);
        const contractor = await this.contractorRepository.findById(id);
        if (!contractor) {
            throw new common_1.NotFoundException('Contractor not found');
        }
        const normalized = (0, procurement_actor_resolver_1.normalizeName)(name);
        const existing = await this.contractorRepository.findByName(normalized);
        if (existing && existing.id !== id) {
            throw new common_1.ConflictException('Contractor with this name already exists');
        }
        return this.contractorRepository.update(id, normalized);
    }
};
exports.UpdateContractorUseCase = UpdateContractorUseCase;
exports.UpdateContractorUseCase = UpdateContractorUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(contractor_repository_port_1.CONTRACTOR_REPOSITORY)),
    __metadata("design:paramtypes", [contractor_repository_port_1.ContractorRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver])
], UpdateContractorUseCase);
let DeleteContractorUseCase = class DeleteContractorUseCase {
    contractorRepository;
    actorResolver;
    constructor(contractorRepository, actorResolver) {
        this.contractorRepository = contractorRepository;
        this.actorResolver = actorResolver;
    }
    async execute(user, id) {
        const actor = await this.actorResolver.resolve(user);
        this.actorResolver.assertManageMasters(actor);
        const contractor = await this.contractorRepository.findById(id);
        if (!contractor) {
            throw new common_1.NotFoundException('Contractor not found');
        }
        const referenced = await this.contractorRepository.isReferencedByPackage(id);
        if (referenced) {
            throw new common_1.ConflictException('Contractor is linked to a procurement package and cannot be deleted');
        }
        await this.contractorRepository.delete(id);
    }
};
exports.DeleteContractorUseCase = DeleteContractorUseCase;
exports.DeleteContractorUseCase = DeleteContractorUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(contractor_repository_port_1.CONTRACTOR_REPOSITORY)),
    __metadata("design:paramtypes", [contractor_repository_port_1.ContractorRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver])
], DeleteContractorUseCase);
//# sourceMappingURL=manage-contractors.use-case.js.map