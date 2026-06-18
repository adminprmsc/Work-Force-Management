import { CreateProcurementPackageExpenseData, ProcurementPackageExpenseRepositoryPort, UpdateProcurementPackageExpenseData } from '../../../application/ports/procurement-package-expense.repository.port';
import { PrismaService } from '../prisma/prisma.service';
export declare class PrismaProcurementPackageExpenseRepository implements ProcurementPackageExpenseRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByPackageId(packageId: string): Promise<import("../../../domain/entities/procurement-package.entity").ProcurementPackageExpense[]>;
    findById(id: string): Promise<import("../../../domain/entities/procurement-package.entity").ProcurementPackageExpense | null>;
    create(data: CreateProcurementPackageExpenseData): Promise<import("../../../domain/entities/procurement-package.entity").ProcurementPackageExpense>;
    update(id: string, data: UpdateProcurementPackageExpenseData): Promise<import("../../../domain/entities/procurement-package.entity").ProcurementPackageExpense>;
    delete(id: string): Promise<void>;
    sumByPackageId(packageId: string): Promise<string>;
}
