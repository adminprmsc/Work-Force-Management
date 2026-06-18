import { User } from '../../../domain/entities/user.entity';
import { AuthResponseDto, UserResponseDto } from '../dto/auth-response.dto';

export function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt,
  };
}

export function toAuthResponse(accessToken: string): AuthResponseDto {
  return { accessToken };
}
