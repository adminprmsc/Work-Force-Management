import { ConsultantRepositoryPort } from '../../../application/ports/consultant.repository.port';
import { Consultant } from '../../../domain/entities/consultant.entity';
import { PrismaService } from '../prisma/prisma.service';
export declare class PrismaConsultantRepository implements ConsultantRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<Consultant[]>;
    findById(id: string): Promise<Consultant | null>;
    findByName(name: string): Promise<Consultant | null>;
    create(name: string): Promise<Consultant>;
    update(id: string, name: string): Promise<Consultant>;
    delete(id: string): Promise<void>;
    isReferencedByPackage(id: string): Promise<boolean>;
    private toDomain;
}
