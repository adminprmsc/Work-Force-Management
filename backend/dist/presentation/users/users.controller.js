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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const create_user_use_case_1 = require("../../application/use-cases/users/create-user.use-case");
const reset_credentials_use_case_1 = require("../../application/use-cases/users/reset-credentials.use-case");
const list_users_use_case_1 = require("../../application/use-cases/users/list-users.use-case");
const update_user_use_case_1 = require("../../application/use-cases/users/update-user.use-case");
const user_entity_1 = require("../../domain/entities/user.entity");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const user_dto_1 = require("./dto/user.dto");
const user_mapper_1 = require("./mappers/user.mapper");
let UsersController = class UsersController {
    createUserUseCase;
    listUsersUseCase;
    getUserUseCase;
    updateUserUseCase;
    deleteUserUseCase;
    updateUserStatusUseCase;
    resetCredentialsUseCase;
    constructor(createUserUseCase, listUsersUseCase, getUserUseCase, updateUserUseCase, deleteUserUseCase, updateUserStatusUseCase, resetCredentialsUseCase) {
        this.createUserUseCase = createUserUseCase;
        this.listUsersUseCase = listUsersUseCase;
        this.getUserUseCase = getUserUseCase;
        this.updateUserUseCase = updateUserUseCase;
        this.deleteUserUseCase = deleteUserUseCase;
        this.updateUserStatusUseCase = updateUserStatusUseCase;
        this.resetCredentialsUseCase = resetCredentialsUseCase;
    }
    async create(actor, dto) {
        const user = await this.createUserUseCase.execute((0, user_mapper_1.toActorContext)(actor), dto);
        return (0, user_mapper_1.toUserResponse)(user);
    }
    async list() {
        const users = await this.listUsersUseCase.execute();
        return users.map(user_mapper_1.toUserResponse);
    }
    async getOne(actor, id) {
        const user = await this.getUserUseCase.execute((0, user_mapper_1.toActorContext)(actor), id);
        return (0, user_mapper_1.toUserResponse)(user);
    }
    async update(actor, id, dto) {
        const user = await this.updateUserUseCase.execute((0, user_mapper_1.toActorContext)(actor), id, dto);
        return (0, user_mapper_1.toUserResponse)(user);
    }
    async remove(actor, id) {
        await this.deleteUserUseCase.execute((0, user_mapper_1.toActorContext)(actor), id);
        return { success: true };
    }
    async updateStatus(actor, id, dto) {
        const user = await this.updateUserStatusUseCase.execute((0, user_mapper_1.toActorContext)(actor), id, dto.active);
        return (0, user_mapper_1.toUserResponse)(user);
    }
    async resetCredentials(actor, id) {
        return this.resetCredentialsUseCase.execute((0, user_mapper_1.toActorContext)(actor), id);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, user_dto_1.UpdateUserStatusDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/reset-credentials'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "resetCredentials", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SENIOR_MANAGER_ES),
    __metadata("design:paramtypes", [create_user_use_case_1.CreateUserUseCase,
        list_users_use_case_1.ListUsersUseCase,
        list_users_use_case_1.GetUserUseCase,
        update_user_use_case_1.UpdateUserUseCase,
        update_user_use_case_1.DeleteUserUseCase,
        update_user_use_case_1.UpdateUserStatusUseCase,
        reset_credentials_use_case_1.ResetUserCredentialsUseCase])
], UsersController);
//# sourceMappingURL=users.controller.js.map