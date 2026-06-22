import { Inject, Injectable } from '@nestjs/common';
import { TOKEN_SERVICE } from '../../application/ports/token.service.port';
import type { TokenServicePort } from '../../application/ports/token.service.port';
import { LOGIN_USE_CASE } from '../../application/ports/login.use-case.port';
import type {
  LoginInput,
  LoginUseCasePort,
} from '../../application/ports/login.use-case.port';
import { ChangeOwnPasswordUseCase } from '../../application/use-cases/auth/change-own-password.use-case';
import { User } from '../../domain/entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import type { AuthResult } from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    @Inject(LOGIN_USE_CASE)
    private readonly loginUseCase: LoginUseCasePort,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenServicePort,
    private readonly changeOwnPasswordUseCase: ChangeOwnPasswordUseCase,
  ) {}

  async login(dto: LoginDto): Promise<AuthResult> {
    const input: LoginInput = {
      email: dto.email,
      password: dto.password,
    };

    const user: User = await this.loginUseCase.execute(input);

    return this.buildAuthResult(user);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ success: true }> {
    await this.changeOwnPasswordUseCase.execute(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
    return { success: true };
  }

  private async buildAuthResult(user: User): Promise<AuthResult> {
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
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
      },
    };
  }
}
