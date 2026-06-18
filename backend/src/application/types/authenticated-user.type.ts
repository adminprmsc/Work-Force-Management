import { UserRole } from '../../domain/entities/user.entity';

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}
