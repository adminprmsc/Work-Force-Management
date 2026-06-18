import { CreateProcurementPackageData, ListProcurementPackagesFilter, ProcurementPackageRepositoryPort, UpdateProcurementPackageData } from '../../../application/ports/procurement-package.repository.port';
import { PrismaService } from '../prisma/prisma.service';
export declare class PrismaProcurementPackageRepository implements ProcurementPackageRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly include;
    findAll(filter?: ListProcurementPackagesFilter): Promise<import("../../../domain/entities/procurement-package.entity").ProcurementPackage[]>;
    findById(id: string): Promise<import("../../../domain/entities/procurement-package.entity").ProcurementPackage | null>;
    findByName(name: string): Promise<import("../../../domain/entities/procurement-package.entity").ProcurementPackage | null>;
    create(data: CreateProcurementPackageData): Promise<import("../../../domain/entities/procurement-package.entity").ProcurementPackage>;
    update(id: string, data: UpdateProcurementPackageData): Promise<import("../../../domain/entities/procurement-package.entity").ProcurementPackage>;
    delete(id: string): Promise<void>;
}
