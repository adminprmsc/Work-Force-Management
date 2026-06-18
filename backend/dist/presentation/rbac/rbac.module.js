"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacModule = void 0;
const common_1 = require("@nestjs/common");
const audit_log_repository_port_1 = require("../../application/ports/audit-log.repository.port");
const hashing_service_port_1 = require("../../application/ports/hashing.service.port");
const office_repository_port_1 = require("../../application/ports/office.repository.port");
const tehsil_repository_port_1 = require("../../application/ports/tehsil.repository.port");
const user_repository_port_1 = require("../../application/ports/user.repository.port");
const audit_service_1 = require("../../application/services/audit.service");
const list_audit_logs_use_case_1 = require("../../application/use-cases/audit/list-audit-logs.use-case");
const list_offices_use_case_1 = require("../../application/use-cases/offices/list-offices.use-case");
const list_tehsils_use_case_1 = require("../../application/use-cases/tehsils/list-tehsils.use-case");
const list_village_settlements_use_case_1 = require("../../application/use-cases/tehsils/list-village-settlements.use-case");
const create_user_use_case_1 = require("../../application/use-cases/users/create-user.use-case");
const list_users_use_case_1 = require("../../application/use-cases/users/list-users.use-case");
const reset_credentials_use_case_1 = require("../../application/use-cases/users/reset-credentials.use-case");
const update_user_use_case_1 = require("../../application/use-cases/users/update-user.use-case");
const prisma_audit_log_repository_1 = require("../../infrastructure/database/repositories/prisma-audit-log.repository");
const prisma_office_repository_1 = require("../../infrastructure/database/repositories/prisma-office.repository");
const prisma_tehsil_repository_1 = require("../../infrastructure/database/repositories/prisma-tehsil.repository");
const prisma_user_repository_1 = require("../../infrastructure/database/repositories/prisma-user.repository");
const bcrypt_hashing_service_1 = require("../../infrastructure/security/bcrypt-hashing.service");
const audit_logs_controller_1 = require("../audit/audit-logs.controller");
const roles_guard_1 = require("../auth/guards/roles.guard");
const offices_controller_1 = require("../offices/offices.controller");
const tehsils_controller_1 = require("../tehsils/tehsils.controller");
const users_controller_1 = require("../users/users.controller");
let RbacModule = class RbacModule {
};
exports.RbacModule = RbacModule;
exports.RbacModule = RbacModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            users_controller_1.UsersController,
            offices_controller_1.OfficesController,
            tehsils_controller_1.TehsilsController,
            audit_logs_controller_1.AuditLogsController,
        ],
        providers: [
            roles_guard_1.RolesGuard,
            audit_service_1.AuditService,
            create_user_use_case_1.CreateUserUseCase,
            list_users_use_case_1.ListUsersUseCase,
            list_users_use_case_1.GetUserUseCase,
            update_user_use_case_1.UpdateUserUseCase,
            update_user_use_case_1.DeleteUserUseCase,
            update_user_use_case_1.UpdateUserStatusUseCase,
            reset_credentials_use_case_1.ResetUserCredentialsUseCase,
            list_offices_use_case_1.ListOfficesUseCase,
            list_tehsils_use_case_1.ListTehsilsUseCase,
            list_tehsils_use_case_1.ListTehsilVillagesUseCase,
            list_village_settlements_use_case_1.ListVillageSettlementsUseCase,
            list_audit_logs_use_case_1.ListAuditLogsUseCase,
            { provide: user_repository_port_1.USER_REPOSITORY, useClass: prisma_user_repository_1.PrismaUserRepository },
            { provide: office_repository_port_1.OFFICE_REPOSITORY, useClass: prisma_office_repository_1.PrismaOfficeRepository },
            { provide: tehsil_repository_port_1.TEHSIL_REPOSITORY, useClass: prisma_tehsil_repository_1.PrismaTehsilRepository },
            { provide: audit_log_repository_port_1.AUDIT_LOG_REPOSITORY, useClass: prisma_audit_log_repository_1.PrismaAuditLogRepository },
            { provide: hashing_service_port_1.HASHING_SERVICE, useClass: bcrypt_hashing_service_1.BcryptHashingService },
        ],
    })
], RbacModule);
//# sourceMappingURL=rbac.module.js.map