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
exports.CreateUserUseCase = void 0;
const common_1 = require("@nestjs/common");
const audit_log_entity_1 = require("../../../domain/entities/audit-log.entity");
const user_entity_1 = require("../../../domain/entities/user.entity");
const user_management_policy_1 = require("../../../domain/policies/user-management.policy");
const hashing_service_port_1 = require("../../ports/hashing.service.port");
const office_repository_port_1 = require("../../ports/office.repository.port");
const user_repository_port_1 = require("../../ports/user.repository.port");
const audit_service_1 = require("../../services/audit.service");
let CreateUserUseCase = class CreateUserUseCase {
    userRepository;
    officeRepository;
    hashingService;
    auditService;
    constructor(userRepository, officeRepository, hashingService, auditService) {
        this.userRepository = userRepository;
        this.officeRepository = officeRepository;
        this.hashingService = hashingService;
        this.auditService = auditService;
    }
    async execute(actor, input) {
        if (!(0, user_management_policy_1.canCreateRole)(actor.role, input.role)) {
            throw new common_1.ForbiddenException(`You are not allowed to create users with role ${input.role}`);
        }
        const requiredOfficeType = (0, user_management_policy_1.requiredOfficeTypeForRole)(input.role);
        let officeId = input.officeId ?? null;
        if (requiredOfficeType) {
            if (!officeId) {
                throw new common_1.ForbiddenException('officeId is required for this user type');
            }
            const office = await this.officeRepository.findById(officeId);
            if (!office) {
                throw new common_1.NotFoundException('Office not found');
            }
            const expectedOfficeType = requiredOfficeType;
            if (office.type !== expectedOfficeType) {
                throw new common_1.ForbiddenException(`Role ${input.role} must be assigned to a ${requiredOfficeType} office`);
            }
            if (input.role === user_entity_1.UserRole.RA_ES_TEHSIL && !office.tehsilId) {
                throw new common_1.ForbiddenException('RA E&S Tehsil user must be assigned to a tehsil office');
            }
        }
        else {
            officeId = null;
        }
        const existingEmail = await this.userRepository.findByEmail(input.email);
        if (existingEmail) {
            throw new common_1.ConflictException('Email is already registered');
        }
        const existingUsername = await this.userRepository.findByUsername(input.username);
        if (existingUsername) {
            throw new common_1.ConflictException('Username is already taken');
        }
        const hashedPassword = await this.hashingService.hash(input.password);
        const user = await this.userRepository.create({
            email: input.email,
            username: input.username,
            password: hashedPassword,
            role: input.role,
            officeId,
            createdById: actor.id,
        });
        await this.auditService.logUserAction(actor.id, audit_log_entity_1.AuditAction.USER_CREATED, user.id, {
            targetEmail: user.email,
            targetUsername: user.username,
            targetRole: user.role,
            officeId: user.officeId,
            officeName: user.officeName,
            createdByRole: actor.role,
        });
        return user;
    }
};
exports.CreateUserUseCase = CreateUserUseCase;
exports.CreateUserUseCase = CreateUserUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_port_1.USER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(office_repository_port_1.OFFICE_REPOSITORY)),
    __param(2, (0, common_1.Inject)(hashing_service_port_1.HASHING_SERVICE)),
    __metadata("design:paramtypes", [user_repository_port_1.UserRepositoryPort,
        office_repository_port_1.OfficeRepositoryPort,
        hashing_service_port_1.HashingServicePort,
        audit_service_1.AuditService])
], CreateUserUseCase);
//# sourceMappingURL=create-user.use-case.js.map