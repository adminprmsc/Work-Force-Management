import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { AuthResult, AuthenticatedUser } from './types/auth.types';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<AuthResult>;
    getProfile(user: AuthenticatedUser): AuthenticatedUser;
}
