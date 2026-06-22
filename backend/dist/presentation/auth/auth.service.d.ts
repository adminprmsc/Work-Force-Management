import type { TokenServicePort } from '../../application/ports/token.service.port';
import type { LoginUseCasePort } from '../../application/ports/login.use-case.port';
import { ChangeOwnPasswordUseCase } from '../../application/use-cases/auth/change-own-password.use-case';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import type { AuthResult } from './types/auth.types';
export declare class AuthService {
    private readonly loginUseCase;
    private readonly tokenService;
    private readonly changeOwnPasswordUseCase;
    constructor(loginUseCase: LoginUseCasePort, tokenService: TokenServicePort, changeOwnPasswordUseCase: ChangeOwnPasswordUseCase);
    login(dto: LoginDto): Promise<AuthResult>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        success: true;
    }>;
    private buildAuthResult;
}
