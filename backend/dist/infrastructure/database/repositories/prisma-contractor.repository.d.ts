import { ContractorRepositoryPort } from '../../../application/ports/contractor.repository.port';
import { Contractor } from '../../../domain/entities/contractor.entity';
import { PrismaService } from '../prisma/prisma.service';
export declare class PrismaContractorRepository implements ContractorRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<Contractor[]>;
    findById(id: string): Promise<Contractor | null>;
    findByName(name: string): Promise<Contractor | null>;
    create(name: string): Promise<Contractor>;
    update(id: string, name: string): Promise<Contractor>;
    delete(id: string): Promise<void>;
    isReferencedByPackage(id: string): Promise<boolean>;
    private toDomain;
}
