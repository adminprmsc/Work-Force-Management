import { User } from '../../domain/entities/user.entity';

export interface LoginInput {
  email: string;
  password: string;
}

export abstract class LoginUseCasePort {
  abstract execute(input: LoginInput): Promise<User>;
}

export const LOGIN_USE_CASE = Symbol('LOGIN_USE_CASE');
