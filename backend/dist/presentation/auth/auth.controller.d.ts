import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import type { AuthResult, AuthenticatedUser } from './types/auth.types';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<AuthResult>;
    getProfile(user: AuthenticatedUser): AuthenticatedUser;
    changePassword(user: AuthenticatedUser, dto: ChangePasswordDto): Promise<{
        success: true;
    }>;
}
