import { Office } from '../../../domain/entities/office.entity';
import { OfficeType } from '../../../domain/entities/user.entity';
import { OfficeRepositoryPort } from '../../../application/ports/office.repository.port';
import { PrismaService } from '../prisma/prisma.service';
export declare class PrismaOfficeRepository implements OfficeRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<Office | null>;
    findAll(filter?: {
        type?: OfficeType;
    }): Promise<Office[]>;
    findByTehsilId(tehsilId: string): Promise<Office | null>;
    private toDomain;
}
