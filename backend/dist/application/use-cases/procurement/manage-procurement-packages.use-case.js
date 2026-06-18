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
exports.DeleteProcurementPackageUseCase = exports.UpdateProcurementPackageUseCase = exports.CreateProcurementPackageUseCase = exports.PreviewProcurementPackageNameUseCase = exports.GetProcurementPackageUseCase = exports.ListProcurementPackagesUseCase = void 0;
const common_1 = require("@nestjs/common");
const user_entity_1 = require("../../../domain/entities/user.entity");
const procurement_access_policy_1 = require("../../../domain/policies/procurement-access.policy");
const procurement_package_repository_port_1 = require("../../ports/procurement-package.repository.port");
const procurement_actor_resolver_1 = require("../../services/procurement-actor.resolver");
const procurement_package_validator_1 = require("../../services/procurement-package.validator");
const procurement_package_naming_service_1 = require("../../services/procurement-package-naming.service");
function formatMoney(value) {
    return value.toFixed(2);
}
async function assertUniquePackageName(repository, name, excludeId) {
    const existing = await repository.findByName(name);
    if (existing && existing.id !== excludeId) {
        throw new common_1.ConflictException('A procurement package with this name already exists');
    }
}
let ListProcurementPackagesUseCase = class ListProcurementPackagesUseCase {
    packageRepository;
    actorResolver;
    constructor(packageRepository, actorResolver) {
        this.packageRepository = packageRepository;
        this.actorResolver = actorResolver;
    }
    async execute(user) {
        const actor = await this.actorResolver.resolve(user);
        if (!(0, procurement_access_policy_1.canReadProcurementPackages)(actor.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        const filter = actor.role === user_entity_1.UserRole.RA_ES_TEHSIL && actor.tehsilId
            ? { tehsilId: actor.tehsilId }
            : undefined;
        return this.packageRepository.findAll(filter);
    }
};
exports.ListProcurementPackagesUseCase = ListProcurementPackagesUseCase;
exports.ListProcurementPackagesUseCase = ListProcurementPackagesUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(procurement_package_repository_port_1.PROCUREMENT_PACKAGE_REPOSITORY)),
    __metadata("design:paramtypes", [procurement_package_repository_port_1.ProcurementPackageRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver])
], ListProcurementPackagesUseCase);
let GetProcurementPackageUseCase = class GetProcurementPackageUseCase {
    packageRepository;
    actorResolver;
    constructor(packageRepository, actorResolver) {
        this.packageRepository = packageRepository;
        this.actorResolver = actorResolver;
    }
    async execute(user, id) {
        const actor = await this.actorResolver.resolve(user);
        if (!(0, procurement_access_policy_1.canReadProcurementPackages)(actor.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        const pkg = await this.packageRepository.findById(id);
        if (!pkg) {
            throw new common_1.NotFoundException('Procurement package not found');
        }
        if (!(0, procurement_access_policy_1.canReadProcurementPackage)(actor, pkg.tehsil.id)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        return pkg;
    }
};
exports.GetProcurementPackageUseCase = GetProcurementPackageUseCase;
exports.GetProcurementPackageUseCase = GetProcurementPackageUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(procurement_package_repository_port_1.PROCUREMENT_PACKAGE_REPOSITORY)),
    __metadata("design:paramtypes", [procurement_package_repository_port_1.ProcurementPackageRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver])
], GetProcurementPackageUseCase);
let PreviewProcurementPackageNameUseCase = class PreviewProcurementPackageNameUseCase {
    namingService;
    actorResolver;
    constructor(namingService, actorResolver) {
        this.namingService = namingService;
        this.actorResolver = actorResolver;
    }
    async execute(user, tehsilId) {
        const actor = await this.actorResolver.resolve(user);
        if (!(0, procurement_access_policy_1.canManageProcurementPackages)(actor.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        return this.namingService.previewTehsilNaming(tehsilId);
    }
};
exports.PreviewProcurementPackageNameUseCase = PreviewProcurementPackageNameUseCase;
exports.PreviewProcurementPackageNameUseCase = PreviewProcurementPackageNameUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [procurement_package_naming_service_1.ProcurementPackageNamingService,
        procurement_actor_resolver_1.ProcurementActorResolver])
], PreviewProcurementPackageNameUseCase);
let CreateProcurementPackageUseCase = class CreateProcurementPackageUseCase {
    packageRepository;
    actorResolver;
    packageValidator;
    namingService;
    constructor(packageRepository, actorResolver, packageValidator, namingService) {
        this.packageRepository = packageRepository;
        this.actorResolver = actorResolver;
        this.packageValidator = packageValidator;
        this.namingService = namingService;
    }
    async execute(user, command) {
        const actor = await this.actorResolver.resolve(user);
        if (!(0, procurement_access_policy_1.canManageProcurementPackages)(actor.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        if (command.budgetAmount < 0) {
            throw new common_1.BadRequestException('Budget amount cannot be negative');
        }
        const namePart = (0, procurement_actor_resolver_1.normalizeName)(command.name);
        if (!namePart) {
            throw new common_1.BadRequestException('Package name is required');
        }
        const input = {
            contractorId: command.contractorId,
            consultantId: command.consultantId,
            tehsilId: command.tehsilId,
            villageIds: command.villageIds,
        };
        await this.packageValidator.validate(input);
        const name = await this.namingService.resolvePackageName(namePart, command.tehsilId);
        await assertUniquePackageName(this.packageRepository, name);
        return this.packageRepository.create({
            name,
            budgetAmount: formatMoney(command.budgetAmount),
            ...input,
        });
    }
};
exports.CreateProcurementPackageUseCase = CreateProcurementPackageUseCase;
exports.CreateProcurementPackageUseCase = CreateProcurementPackageUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(procurement_package_repository_port_1.PROCUREMENT_PACKAGE_REPOSITORY)),
    __metadata("design:paramtypes", [procurement_package_repository_port_1.ProcurementPackageRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver,
        procurement_package_validator_1.ProcurementPackageValidator,
        procurement_package_naming_service_1.ProcurementPackageNamingService])
], CreateProcurementPackageUseCase);
let UpdateProcurementPackageUseCase = class UpdateProcurementPackageUseCase {
    packageRepository;
    actorResolver;
    packageValidator;
    constructor(packageRepository, actorResolver, packageValidator) {
        this.packageRepository = packageRepository;
        this.actorResolver = actorResolver;
        this.packageValidator = packageValidator;
    }
    async execute(user, id, command) {
        const actor = await this.actorResolver.resolve(user);
        if (!(0, procurement_access_policy_1.canManageProcurementPackages)(actor.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        const existing = await this.packageRepository.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException('Procurement package not found');
        }
        if (command.budgetAmount === undefined &&
            command.villageIds === undefined) {
            throw new common_1.BadRequestException('Provide budget amount and/or villages to update');
        }
        if (command.budgetAmount !== undefined && command.budgetAmount < 0) {
            throw new common_1.BadRequestException('Budget amount cannot be negative');
        }
        const villageIds = command.villageIds ?? existing.villages.map((village) => village.id);
        if (command.villageIds) {
            await this.packageValidator.validate({
                contractorId: existing.contractor.id,
                consultantId: existing.consultant.id,
                tehsilId: existing.tehsil.id,
                villageIds,
            });
        }
        return this.packageRepository.update(id, {
            budgetAmount: command.budgetAmount !== undefined
                ? formatMoney(command.budgetAmount)
                : undefined,
            villageIds: command.villageIds,
        });
    }
};
exports.UpdateProcurementPackageUseCase = UpdateProcurementPackageUseCase;
exports.UpdateProcurementPackageUseCase = UpdateProcurementPackageUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(procurement_package_repository_port_1.PROCUREMENT_PACKAGE_REPOSITORY)),
    __metadata("design:paramtypes", [procurement_package_repository_port_1.ProcurementPackageRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver,
        procurement_package_validator_1.ProcurementPackageValidator])
], UpdateProcurementPackageUseCase);
let DeleteProcurementPackageUseCase = class DeleteProcurementPackageUseCase {
    packageRepository;
    actorResolver;
    constructor(packageRepository, actorResolver) {
        this.packageRepository = packageRepository;
        this.actorResolver = actorResolver;
    }
    async execute(user, id) {
        const actor = await this.actorResolver.resolve(user);
        if (!(0, procurement_access_policy_1.canManageProcurementPackages)(actor.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        const existing = await this.packageRepository.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException('Procurement package not found');
        }
        await this.packageRepository.delete(id);
    }
};
exports.DeleteProcurementPackageUseCase = DeleteProcurementPackageUseCase;
exports.DeleteProcurementPackageUseCase = DeleteProcurementPackageUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(procurement_package_repository_port_1.PROCUREMENT_PACKAGE_REPOSITORY)),
    __metadata("design:paramtypes", [procurement_package_repository_port_1.ProcurementPackageRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver])
], DeleteProcurementPackageUseCase);
//# sourceMappingURL=manage-procurement-packages.use-case.js.map