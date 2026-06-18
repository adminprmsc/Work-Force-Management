import type { HashingServicePort } from '../../ports/hashing.service.port';
import { LoginInput, LoginUseCasePort } from '../../ports/login.use-case.port';
import type { UserRepositoryPort } from '../../ports/user.repository.port';
import { User } from '../../../domain/entities/user.entity';
export type { LoginInput };
export declare class LoginUseCase implements LoginUseCasePort {
    private readonly userRepository;
    private readonly hashingService;
    constructor(userRepository: UserRepositoryPort, hashingService: HashingServicePort);
    execute(input: LoginInput): Promise<User>;
}
