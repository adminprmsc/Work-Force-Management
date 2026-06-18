"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const hashing_service_port_1 = require("../../application/ports/hashing.service.port");
const login_use_case_port_1 = require("../../application/ports/login.use-case.port");
const token_service_port_1 = require("../../application/ports/token.service.port");
const user_repository_port_1 = require("../../application/ports/user.repository.port");
const get_user_by_id_use_case_1 = require("../../application/use-cases/auth/get-user-by-id.use-case");
const login_use_case_1 = require("../../application/use-cases/auth/login.use-case");
const prisma_user_repository_1 = require("../../infrastructure/database/repositories/prisma-user.repository");
const bcrypt_hashing_service_1 = require("../../infrastructure/security/bcrypt-hashing.service");
const jwt_token_service_1 = require("../../infrastructure/security/jwt-token.service");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.getOrThrow('jwt.secret'),
                    signOptions: {
                        expiresIn: configService.getOrThrow('jwt.expiresIn'),
                    },
                }),
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            login_use_case_1.LoginUseCase,
            get_user_by_id_use_case_1.GetUserByIdUseCase,
            jwt_strategy_1.JwtStrategy,
            {
                provide: login_use_case_port_1.LOGIN_USE_CASE,
                useClass: login_use_case_1.LoginUseCase,
            },
            {
                provide: user_repository_port_1.USER_REPOSITORY,
                useClass: prisma_user_repository_1.PrismaUserRepository,
            },
            {
                provide: hashing_service_port_1.HASHING_SERVICE,
                useClass: bcrypt_hashing_service_1.BcryptHashingService,
            },
            {
                provide: token_service_port_1.TOKEN_SERVICE,
                useClass: jwt_token_service_1.JwtTokenService,
            },
        ],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map