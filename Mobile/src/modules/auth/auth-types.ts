import type { Role } from './roles';

export type AuthenticatedUser = {
  id: string;
  email: string;
  username: string;
  role: Role;
  mustChangePassword: boolean;
};

export type AuthResult = {
  accessToken: string;
  user: AuthenticatedUser & { createdAt: string };
};
