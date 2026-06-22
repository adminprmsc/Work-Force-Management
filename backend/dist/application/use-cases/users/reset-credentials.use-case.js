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
exports.ResetUserCredentialsUseCase = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const audit_log_entity_1 = require("../../../domain/entities/audit-log.entity");
const user_management_policy_1 = require("../../../domain/policies/user-management.policy");
const hashing_service_port_1 = require("../../ports/hashing.service.port");
const user_repository_port_1 = require("../../ports/user.repository.port");
const audit_service_1 = require("../../services/audit.service");
let ResetUserCredentialsUseCase = class ResetUserCredentialsUseCase {
    userRepository;
    hashingService;
    auditService;
    constructor(userRepository, hashingService, auditService) {
        this.userRepository = userRepository;
        this.hashingService = hashingService;
        this.auditService = auditService;
    }
    async execute(actor, userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!(0, user_management_policy_1.canManageUser)(actor.role)) {
            throw new common_1.ForbiddenException('You cannot reset credentials for this user');
        }
        const temporaryPassword = (0, crypto_1.randomBytes)(9).toString('base64url');
        const hashedPassword = await this.hashingService.hash(temporaryPassword);
        await this.userRepository.update(userId, {
            password: hashedPassword,
            mustChangePassword: true,
        });
        await this.auditService.logUserAction(actor.id, audit_log_entity_1.AuditAction.USER_CREDENTIALS_RESET, userId, { targetEmail: user.email, targetRole: user.role });
        return {
            email: user.email,
            username: user.username,
            temporaryPassword,
        };
    }
};
exports.ResetUserCredentialsUseCase = ResetUserCredentialsUseCase;
exports.ResetUserCredentialsUseCase = ResetUserCredentialsUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_port_1.USER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(hashing_service_port_1.HASHING_SERVICE)),
    __metadata("design:paramtypes", [user_repository_port_1.UserRepositoryPort,
        hashing_service_port_1.HashingServicePort,
        audit_service_1.AuditService])
], ResetUserCredentialsUseCase);
//# sourceMappingURL=reset-credentials.use-case.js.map