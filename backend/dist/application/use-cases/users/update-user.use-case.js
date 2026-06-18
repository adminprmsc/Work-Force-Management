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
exports.UpdateUserStatusUseCase = exports.DeleteUserUseCase = exports.UpdateUserUseCase = void 0;
const common_1 = require("@nestjs/common");
const audit_log_entity_1 = require("../../../domain/entities/audit-log.entity");
const user_entity_1 = require("../../../domain/entities/user.entity");
const user_management_policy_1 = require("../../../domain/policies/user-management.policy");
const office_repository_port_1 = require("../../ports/office.repository.port");
const user_repository_port_1 = require("../../ports/user.repository.port");
const audit_service_1 = require("../../services/audit.service");
let UpdateUserUseCase = class UpdateUserUseCase {
    userRepository;
    officeRepository;
    auditService;
    constructor(userRepository, officeRepository, auditService) {
        this.userRepository = userRepository;
        this.officeRepository = officeRepository;
        this.auditService = auditService;
    }
    async execute(actor, userId, input) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!(0, user_management_policy_1.canManageUser)(actor.role)) {
            throw new common_1.ForbiddenException('You cannot update this user');
        }
        if (input.role && input.role !== user.role) {
            throw new common_1.ForbiddenException('Changing user role is not allowed');
        }
        if (input.officeId) {
            const requiredType = (0, user_management_policy_1.requiredOfficeTypeForRole)(user.role);
            const office = await this.officeRepository.findById(input.officeId);
            if (!office) {
                throw new common_1.NotFoundException('Office not found');
            }
            const expectedOfficeType = requiredType;
            if (expectedOfficeType && office.type !== expectedOfficeType) {
                throw new common_1.ForbiddenException(`User must be assigned to a ${requiredType} office`);
            }
            if (user.role === user_entity_1.UserRole.RA_ES_TEHSIL && !office.tehsilId) {
                throw new common_1.ForbiddenException('RA E&S Tehsil user must be assigned to a tehsil office');
            }
        }
        const updateData = {
            email: input.email,
            username: input.username,
            officeId: input.officeId,
        };
        const updated = await this.userRepository.update(userId, updateData);
        await this.auditService.logUserAction(actor.id, audit_log_entity_1.AuditAction.USER_UPDATED, userId, { changes: input });
        return updated;
    }
};
exports.UpdateUserUseCase = UpdateUserUseCase;
exports.UpdateUserUseCase = UpdateUserUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_port_1.USER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(office_repository_port_1.OFFICE_REPOSITORY)),
    __metadata("design:paramtypes", [user_repository_port_1.UserRepositoryPort,
        office_repository_port_1.OfficeRepositoryPort,
        audit_service_1.AuditService])
], UpdateUserUseCase);
let DeleteUserUseCase = class DeleteUserUseCase {
    userRepository;
    auditService;
    constructor(userRepository, auditService) {
        this.userRepository = userRepository;
        this.auditService = auditService;
    }
    async execute(actor, userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!(0, user_management_policy_1.canDeleteUser)(actor.role)) {
            throw new common_1.ForbiddenException('You cannot delete this user');
        }
        if (user.id === actor.id) {
            throw new common_1.ForbiddenException('You cannot delete your own account');
        }
        await this.userRepository.delete(userId);
        await this.auditService.logUserAction(actor.id, audit_log_entity_1.AuditAction.USER_DELETED, userId, {
            targetEmail: user.email,
            targetUsername: user.username,
            targetRole: user.role,
        });
    }
};
exports.DeleteUserUseCase = DeleteUserUseCase;
exports.DeleteUserUseCase = DeleteUserUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_port_1.USER_REPOSITORY)),
    __metadata("design:paramtypes", [user_repository_port_1.UserRepositoryPort,
        audit_service_1.AuditService])
], DeleteUserUseCase);
let UpdateUserStatusUseCase = class UpdateUserStatusUseCase {
    userRepository;
    auditService;
    constructor(userRepository, auditService) {
        this.userRepository = userRepository;
        this.auditService = auditService;
    }
    async execute(actor, userId, active) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!(0, user_management_policy_1.canManageUser)(actor.role)) {
            throw new common_1.ForbiddenException('You cannot update this user status');
        }
        const updated = await this.userRepository.updateStatus(userId, active ? user_entity_1.UserStatus.ACTIVE : user_entity_1.UserStatus.INACTIVE);
        await this.auditService.logUserAction(actor.id, active ? audit_log_entity_1.AuditAction.USER_ACTIVATED : audit_log_entity_1.AuditAction.USER_DEACTIVATED, userId, {
            targetEmail: user.email,
            targetRole: user.role,
            tehsilName: user.tehsilName,
        });
        return updated;
    }
};
exports.UpdateUserStatusUseCase = UpdateUserStatusUseCase;
exports.UpdateUserStatusUseCase = UpdateUserStatusUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_port_1.USER_REPOSITORY)),
    __metadata("design:paramtypes", [user_repository_port_1.UserRepositoryPort,
        audit_service_1.AuditService])
], UpdateUserStatusUseCase);
//# sourceMappingURL=update-user.use-case.js.map