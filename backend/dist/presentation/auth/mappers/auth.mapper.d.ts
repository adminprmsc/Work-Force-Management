import { User } from '../../../domain/entities/user.entity';
import { AuthResponseDto, UserResponseDto } from '../dto/auth-response.dto';
export declare function toUserResponse(user: User): UserResponseDto;
export declare function toAuthResponse(accessToken: string): AuthResponseDto;
