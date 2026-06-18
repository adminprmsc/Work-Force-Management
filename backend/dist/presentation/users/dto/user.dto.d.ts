import { UserRole } from '../../../domain/entities/user.entity';
export declare class CreateUserDto {
    email: string;
    username: string;
    password: string;
    role: UserRole;
    officeId?: string;
}
export declare class UpdateUserDto {
    email?: string;
    username?: string;
    officeId?: string;
}
export declare class UpdateUserStatusDto {
    active: boolean;
}
