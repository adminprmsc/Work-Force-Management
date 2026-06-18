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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const token_service_port_1 = require("../../application/ports/token.service.port");
const login_use_case_port_1 = require("../../application/ports/login.use-case.port");
let AuthService = class AuthService {
    loginUseCase;
    tokenService;
    constructor(loginUseCase, tokenService) {
        this.loginUseCase = loginUseCase;
        this.tokenService = tokenService;
    }
    async login(dto) {
        const input = {
            email: dto.email,
            password: dto.password,
        };
        const user = await this.loginUseCase.execute(input);
        return this.buildAuthResult(user);
    }
    async buildAuthResult(user) {
        const accessToken = await this.tokenService.generateAccessToken({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                createdAt: user.createdAt,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(login_use_case_port_1.LOGIN_USE_CASE)),
    __param(1, (0, common_1.Inject)(token_service_port_1.TOKEN_SERVICE)),
    __metadata("design:paramtypes", [Function, Function])
], AuthService);
//# sourceMappingURL=auth.service.js.map