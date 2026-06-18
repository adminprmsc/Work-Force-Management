import { UserRepositoryPort } from '../../ports/user.repository.port';
import { User } from '../../../domain/entities/user.entity';
export declare class GetUserByIdUseCase {
    private readonly userRepository;
    constructor(userRepository: UserRepositoryPort);
    execute(id: string): Promise<User>;
}
