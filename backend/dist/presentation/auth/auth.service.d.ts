import type { TokenServicePort } from '../../application/ports/token.service.port';
import type { LoginUseCasePort } from '../../application/ports/login.use-case.port';
import { LoginDto } from './dto/login.dto';
import type { AuthResult } from './types/auth.types';
export declare class AuthService {
    private readonly loginUseCase;
    private readonly tokenService;
    constructor(loginUseCase: LoginUseCasePort, tokenService: TokenServicePort);
    login(dto: LoginDto): Promise<AuthResult>;
    private buildAuthResult;
}
