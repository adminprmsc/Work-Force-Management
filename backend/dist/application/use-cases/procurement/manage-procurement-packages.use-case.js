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
const procurement_package_budget_enricher_1 = require("../../services/procurement-package-budget.enricher");
const audit_service_1 = require("../../services/audit.service");
const audit_log_entity_1 = require("../../../domain/entities/audit-log.entity");
function formatMoney(value) {
    return value.toFixed(2);
}
function equalSplitAllocations(budgetAmount, villageIds) {
    const n = villageIds.length;
    if (n === 0)
        return [];
    const totalCents = Math.round(budgetAmount * 100);
    const base = Math.floor(totalCents / n);
    const remainder = totalCents - base * n;
    return villageIds.map((villageId, index) => {
        const cents = base + (index < remainder ? 1 : 0);
        return { villageId, allocatedBudget: (cents / 100).toFixed(2) };
    });
}
function resolveVillageAllocations(budgetAmount, villageIds, provided) {
    if (!provided || provided.length === 0) {
        return equalSplitAllocations(budgetAmount, villageIds);
    }
    const villageIdSet = new Set(villageIds);
    const seen = new Set();
    let sum = 0;
    for (const allocation of provided) {
        if (!villageIdSet.has(allocation.villageId)) {
            throw new common_1.BadRequestException('Village allocations must match the selected villages');
        }
        if (seen.has(allocation.villageId)) {
            throw new common_1.BadRequestException('Duplicate village allocation');
        }
        if (allocation.allocatedBudget < 0) {
            throw new common_1.BadRequestException('Village allocation cannot be negative');
        }
        seen.add(allocation.villageId);
        sum += allocation.allocatedBudget;
    }
    if (seen.size !== villageIds.length) {
        throw new common_1.BadRequestException('Every selected village must have an allocation');
    }
    if (Math.abs(sum - budgetAmount) > 0.01) {
        throw new common_1.BadRequestException('Village allocations must sum to the allocated budget');
    }
    return provided.map((allocation) => ({
        villageId: allocation.villageId,
        allocatedBudget: formatMoney(allocation.allocatedBudget),
    }));
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
    budgetEnricher;
    constructor(packageRepository, actorResolver, budgetEnricher) {
        this.packageRepository = packageRepository;
        this.actorResolver = actorResolver;
        this.budgetEnricher = budgetEnricher;
    }
    async execute(user, query) {
        const actor = await this.actorResolver.resolve(user);
        if (!(0, procurement_access_policy_1.canReadProcurementPackages)(actor.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        const page = Math.max(1, query?.page ?? 1);
        const limit = query?.limit ?? 25;
        const filter = {
            page,
            limit,
        };
        if (actor.role === user_entity_1.UserRole.RA_ES_TEHSIL && actor.tehsilId) {
            filter.tehsilId = actor.tehsilId;
        }
        const listed = await this.packageRepository.findAll(filter);
        const items = await this.budgetEnricher.enrich(listed.items);
        return {
            items,
            total: listed.total,
            page,
            limit,
        };
    }
};
exports.ListProcurementPackagesUseCase = ListProcurementPackagesUseCase;
exports.ListProcurementPackagesUseCase = ListProcurementPackagesUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(procurement_package_repository_port_1.PROCUREMENT_PACKAGE_REPOSITORY)),
    __metadata("design:paramtypes", [procurement_package_repository_port_1.ProcurementPackageRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver,
        procurement_package_budget_enricher_1.ProcurementPackageBudgetEnricher])
], ListProcurementPackagesUseCase);
let GetProcurementPackageUseCase = class GetProcurementPackageUseCase {
    packageRepository;
    actorResolver;
    budgetEnricher;
    constructor(packageRepository, actorResolver, budgetEnricher) {
        this.packageRepository = packageRepository;
        this.actorResolver = actorResolver;
        this.budgetEnricher = budgetEnricher;
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
        return this.budgetEnricher.enrichOne(pkg);
    }
};
exports.GetProcurementPackageUseCase = GetProcurementPackageUseCase;
exports.GetProcurementPackageUseCase = GetProcurementPackageUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(procurement_package_repository_port_1.PROCUREMENT_PACKAGE_REPOSITORY)),
    __metadata("design:paramtypes", [procurement_package_repository_port_1.ProcurementPackageRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver,
        procurement_package_budget_enricher_1.ProcurementPackageBudgetEnricher])
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
    auditService;
    constructor(packageRepository, actorResolver, packageValidator, namingService, auditService) {
        this.packageRepository = packageRepository;
        this.actorResolver = actorResolver;
        this.packageValidator = packageValidator;
        this.namingService = namingService;
        this.auditService = auditService;
    }
    async execute(user, command) {
        const actor = await this.actorResolver.resolve(user);
        if (!(0, procurement_access_policy_1.canManageProcurementPackages)(actor.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        if (command.budgetAmount < 0) {
            throw new common_1.BadRequestException('Budget amount cannot be negative');
        }
        const cluster = (0, procurement_actor_resolver_1.normalizeName)(command.cluster);
        if (!cluster) {
            throw new common_1.BadRequestException('Cluster is required');
        }
        const code = (0, procurement_actor_resolver_1.normalizeName)(command.code);
        if (!code) {
            throw new common_1.BadRequestException('Code is required');
        }
        await this.packageValidator.validate({
            contractorId: command.contractorId,
            consultantId: command.consultantId,
            tehsilId: command.tehsilId,
            villageIds: command.villageIds,
        });
        const villageAllocations = resolveVillageAllocations(command.budgetAmount, command.villageIds, command.villageAllocations);
        const name = await this.namingService.resolvePackageName(cluster, code, command.tehsilId);
        await assertUniquePackageName(this.packageRepository, name);
        const created = await this.packageRepository.create({
            name,
            budgetAmount: formatMoney(command.budgetAmount),
            contractorId: command.contractorId,
            consultantId: command.consultantId,
            tehsilId: command.tehsilId,
            villageAllocations,
        });
        await this.auditService.logPackageAction(user.id, audit_log_entity_1.AuditAction.PACKAGE_CREATED, created.id, {
            packageName: created.name,
            budgetAmount: created.budgetAmount,
            contractorId: created.contractor.id,
            contractorName: created.contractor.name,
            consultantId: created.consultant.id,
            consultantName: created.consultant.name,
            tehsilId: created.tehsil.id,
            tehsilName: created.tehsil.displayName,
            villageIds: created.villages.map((v) => v.id),
            villageNames: created.villages.map((v) => v.name),
        });
        return created;
    }
};
exports.CreateProcurementPackageUseCase = CreateProcurementPackageUseCase;
exports.CreateProcurementPackageUseCase = CreateProcurementPackageUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(procurement_package_repository_port_1.PROCUREMENT_PACKAGE_REPOSITORY)),
    __metadata("design:paramtypes", [procurement_package_repository_port_1.ProcurementPackageRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver,
        procurement_package_validator_1.ProcurementPackageValidator,
        procurement_package_naming_service_1.ProcurementPackageNamingService,
        audit_service_1.AuditService])
], CreateProcurementPackageUseCase);
let UpdateProcurementPackageUseCase = class UpdateProcurementPackageUseCase {
    packageRepository;
    actorResolver;
    packageValidator;
    auditService;
    constructor(packageRepository, actorResolver, packageValidator, auditService) {
        this.packageRepository = packageRepository;
        this.actorResolver = actorResolver;
        this.packageValidator = packageValidator;
        this.auditService = auditService;
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
        if (command.name === undefined &&
            command.budgetAmount === undefined &&
            command.contractorId === undefined &&
            command.consultantId === undefined &&
            command.villageIds === undefined) {
            throw new common_1.BadRequestException('Provide package name, contractor, consultant, budget amount, and/or villages to update');
        }
        let nextName;
        if (command.name !== undefined) {
            nextName = (0, procurement_actor_resolver_1.normalizeName)(command.name);
            await assertUniquePackageName(this.packageRepository, nextName, id);
        }
        if (command.budgetAmount !== undefined && command.budgetAmount < 0) {
            throw new common_1.BadRequestException('Budget amount cannot be negative');
        }
        const villageIds = command.villageIds ?? existing.villages.map((village) => village.id);
        const contractorId = command.contractorId ?? existing.contractor.id;
        const consultantId = command.consultantId ?? existing.consultant.id;
        if (command.villageIds || command.contractorId || command.consultantId) {
            await this.packageValidator.validate({
                contractorId,
                consultantId,
                tehsilId: existing.tehsil.id,
                villageIds,
            });
        }
        const budgetAmount = command.budgetAmount ?? Number(existing.budgetAmount);
        let villageAllocations;
        if (command.villageAllocations !== undefined ||
            command.villageIds !== undefined ||
            command.budgetAmount !== undefined) {
            villageAllocations = resolveVillageAllocations(budgetAmount, villageIds, command.villageAllocations);
        }
        const updated = await this.packageRepository.update(id, {
            name: nextName,
            budgetAmount: command.budgetAmount !== undefined
                ? formatMoney(command.budgetAmount)
                : undefined,
            contractorId: command.contractorId,
            consultantId: command.consultantId,
            villageAllocations,
        });
        await this.auditService.logPackageAction(user.id, audit_log_entity_1.AuditAction.PACKAGE_UPDATED, updated.id, {
            packageName: updated.name,
            before: {
                name: existing.name,
                budgetAmount: existing.budgetAmount,
                contractorId: existing.contractor.id,
                contractorName: existing.contractor.name,
                consultantId: existing.consultant.id,
                consultantName: existing.consultant.name,
                villageIds: existing.villages.map((v) => v.id),
                villageNames: existing.villages.map((v) => v.name),
            },
            after: {
                name: updated.name,
                budgetAmount: updated.budgetAmount,
                contractorId: updated.contractor.id,
                contractorName: updated.contractor.name,
                consultantId: updated.consultant.id,
                consultantName: updated.consultant.name,
                villageIds: updated.villages.map((v) => v.id),
                villageNames: updated.villages.map((v) => v.name),
            },
            changes: {
                name: command.name !== undefined,
                budgetAmount: command.budgetAmount !== undefined,
                contractor: command.contractorId !== undefined,
                consultant: command.consultantId !== undefined,
                villages: command.villageIds !== undefined ||
                    command.villageAllocations !== undefined,
            },
        });
        return updated;
    }
};
exports.UpdateProcurementPackageUseCase = UpdateProcurementPackageUseCase;
exports.UpdateProcurementPackageUseCase = UpdateProcurementPackageUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(procurement_package_repository_port_1.PROCUREMENT_PACKAGE_REPOSITORY)),
    __metadata("design:paramtypes", [procurement_package_repository_port_1.ProcurementPackageRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver,
        procurement_package_validator_1.ProcurementPackageValidator,
        audit_service_1.AuditService])
], UpdateProcurementPackageUseCase);
let DeleteProcurementPackageUseCase = class DeleteProcurementPackageUseCase {
    packageRepository;
    actorResolver;
    auditService;
    constructor(packageRepository, actorResolver, auditService) {
        this.packageRepository = packageRepository;
        this.actorResolver = actorResolver;
        this.auditService = auditService;
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
        await this.auditService.logPackageAction(user.id, audit_log_entity_1.AuditAction.PACKAGE_DELETED, existing.id, {
            packageName: existing.name,
            budgetAmount: existing.budgetAmount,
            contractorId: existing.contractor.id,
            contractorName: existing.contractor.name,
            consultantId: existing.consultant.id,
            consultantName: existing.consultant.name,
            tehsilId: existing.tehsil.id,
            tehsilName: existing.tehsil.displayName,
            villageIds: existing.villages.map((v) => v.id),
            villageNames: existing.villages.map((v) => v.name),
        });
        await this.packageRepository.delete(id);
    }
};
exports.DeleteProcurementPackageUseCase = DeleteProcurementPackageUseCase;
exports.DeleteProcurementPackageUseCase = DeleteProcurementPackageUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(procurement_package_repository_port_1.PROCUREMENT_PACKAGE_REPOSITORY)),
    __metadata("design:paramtypes", [procurement_package_repository_port_1.ProcurementPackageRepositoryPort,
        procurement_actor_resolver_1.ProcurementActorResolver,
        audit_service_1.AuditService])
], DeleteProcurementPackageUseCase);
//# sourceMappingURL=manage-procurement-packages.use-case.js.map