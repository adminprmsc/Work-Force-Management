import { User, UserStatus } from '../../../domain/entities/user.entity';
import { CreateUserData, ListUsersFilter, UpdateUserData, UserRepositoryPort } from '../../../application/ports/user.repository.port';
import { PrismaService } from '../prisma/prisma.service';
export declare class PrismaUserRepository implements UserRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly include;
    findByEmail(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findAll(filter?: ListUsersFilter): Promise<User[]>;
    create(data: CreateUserData): Promise<User>;
    update(id: string, data: UpdateUserData): Promise<User>;
    updateStatus(id: string, status: UserStatus): Promise<User>;
    delete(id: string): Promise<void>;
    private toDomain;
}
