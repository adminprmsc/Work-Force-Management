import { UserRole } from '../../../domain/entities/user.entity';
import type { AuthenticatedUser } from '../../../application/types/authenticated-user.type';

export type { AuthenticatedUser };

export interface AuthResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: UserRole;
    createdAt: Date;
  };
}
