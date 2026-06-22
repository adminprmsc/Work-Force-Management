import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HASHING_SERVICE } from '../../application/ports/hashing.service.port';
import { LOGIN_USE_CASE } from '../../application/ports/login.use-case.port';
import { TOKEN_SERVICE } from '../../application/ports/token.service.port';
import { USER_REPOSITORY } from '../../application/ports/user.repository.port';
import { GetUserByIdUseCase } from '../../application/use-cases/auth/get-user-by-id.use-case';
import { ChangeOwnPasswordUseCase } from '../../application/use-cases/auth/change-own-password.use-case';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case';
import { PrismaUserRepository } from '../../infrastructure/database/repositories/prisma-user.repository';
import { BcryptHashingService } from '../../infrastructure/security/bcrypt-hashing.service';
import { JwtTokenService } from '../../infrastructure/security/jwt-token.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>(
            'jwt.expiresIn',
          ) as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LoginUseCase,
    GetUserByIdUseCase,
    ChangeOwnPasswordUseCase,
    JwtStrategy,
    {
      provide: LOGIN_USE_CASE,
      useClass: LoginUseCase,
    },
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: HASHING_SERVICE,
      useClass: BcryptHashingService,
    },
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
  ],
})
export class AuthModule {}
