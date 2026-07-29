import { CreateProcurementPackageData, ListProcurementPackagesFilter, ProcurementPackageRepositoryPort, UpdateProcurementPackageData } from '../../../application/ports/procurement-package.repository.port';
import { ProcurementPackage } from '../../../domain/entities/procurement-package.entity';
import { PrismaService } from '../prisma/prisma.service';
export declare class PrismaProcurementPackageRepository implements ProcurementPackageRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly include;
    findAll(filter?: ListProcurementPackagesFilter): Promise<{
        items: ProcurementPackage[];
        total: number;
    }>;
    findById(id: string): Promise<ProcurementPackage | null>;
    findByName(name: string): Promise<ProcurementPackage | null>;
    create(data: CreateProcurementPackageData): Promise<ProcurementPackage>;
    update(id: string, data: UpdateProcurementPackageData): Promise<ProcurementPackage>;
    delete(id: string): Promise<void>;
}
