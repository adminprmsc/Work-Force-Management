import { User, UserRole } from '../../../domain/entities/user.entity';
import { UserRepositoryPort } from '../../ports/user.repository.port';
export interface ActorContext {
    id: string;
    role: UserRole;
}
export declare class ListUsersUseCase {
    private readonly userRepository;
    constructor(userRepository: UserRepositoryPort);
    execute(): Promise<User[]>;
}
export declare class GetUserUseCase {
    private readonly userRepository;
    constructor(userRepository: UserRepositoryPort);
    execute(actor: ActorContext, userId: string): Promise<User>;
}
