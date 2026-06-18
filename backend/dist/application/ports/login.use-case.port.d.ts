import { User } from '../../domain/entities/user.entity';
export interface LoginInput {
    email: string;
    password: string;
}
export declare abstract class LoginUseCasePort {
    abstract execute(input: LoginInput): Promise<User>;
}
export declare const LOGIN_USE_CASE: unique symbol;
