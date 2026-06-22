import { User, UserRole, UserStatus } from '../../domain/entities/user.entity';

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  role: UserRole;
  officeId?: string | null;
  createdById: string;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  password?: string;
  role?: UserRole;
  officeId?: string | null;
  mustChangePassword?: boolean;
}

export interface ListUsersFilter {
  role?: UserRole;
  officeId?: string;
  createdById?: string;
}

export abstract class UserRepositoryPort {
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findByUsername(username: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
  abstract findAll(filter?: ListUsersFilter): Promise<User[]>;
  abstract create(data: CreateUserData): Promise<User>;
  abstract update(id: string, data: UpdateUserData): Promise<User>;
  abstract updateStatus(id: string, status: UserStatus): Promise<User>;
  abstract delete(id: string): Promise<void>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
