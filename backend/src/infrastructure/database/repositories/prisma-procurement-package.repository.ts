import { Injectable } from '@nestjs/common';
import {
  CreateProcurementPackageData,
  ListProcurementPackagesFilter,
  ProcurementPackageRepositoryPort,
  UpdateProcurementPackageData,
} from '../../../application/ports/procurement-package.repository.port';
import { ProcurementPackage } from '../../../domain/entities/procurement-package.entity';
import {
  asProcurementPrisma,
  ProcurementPackageInclude,
} from '../prisma/procurement-prisma.access';
import { mapPackageRecord } from '../mappers/procurement-package.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaProcurementPackageRepository implements ProcurementPackageRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include: ProcurementPackageInclude = {
    contractor: true,
    consultant: true,
    tehsil: true,
    villages: {
      include: { village: true },
      orderBy: { village: { name: 'asc' } },
    },
    expenses: {
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { expenseDate: 'desc' },
    },
  };

  async findAll(
    filter?: ListProcurementPackagesFilter,
  ): Promise<{ items: ProcurementPackage[]; total: number }> {
    const page = Math.max(1, filter?.page ?? 1);
    const limit = filter?.limit ?? 25;
    const skip = (page - 1) * limit;
    const where = filter?.tehsilId ? { tehsilId: filter.tehsilId } : undefined;
    const client = asProcurementPrisma(this.prisma);

    const [records, total] = await Promise.all([
      client.procurementPackage.findMany({
        where,
        include: this.include,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      client.procurementPackage.count({ where }),
    ]);

    return {
      items: records.map((record) => mapPackageRecord(record)),
      total,
    };
  }

  async findById(id: string) {
    const record = await asProcurementPrisma(
      this.prisma,
    ).procurementPackage.findUnique({
      where: { id },
      include: this.include,
    });
    return record ? mapPackageRecord(record) : null;
  }

  async findByName(name: string) {
    const record = await asProcurementPrisma(
      this.prisma,
    ).procurementPackage.findUnique({
      where: { name },
      include: this.include,
    });
    return record ? mapPackageRecord(record) : null;
  }

  async create(data: CreateProcurementPackageData) {
    const record = await asProcurementPrisma(
      this.prisma,
    ).procurementPackage.create({
      data: {
        name: data.name,
        budgetAmount: data.budgetAmount,
        contractorId: data.contractorId,
        consultantId: data.consultantId,
        tehsilId: data.tehsilId,
        villages: {
          create: data.villageAllocations.map((allocation) => ({
            villageId: allocation.villageId,
            allocatedBudget: allocation.allocatedBudget,
          })),
        },
      },
      include: this.include,
    });
    return mapPackageRecord(record);
  }

  async update(id: string, data: UpdateProcurementPackageData) {
    const db = asProcurementPrisma(this.prisma);
    const record = await db.$transaction(async (tx) => {
      if (data.villageAllocations) {
        await tx.procurementPackageVillage.deleteMany({
          where: { packageId: id },
        });
        if (data.villageAllocations.length > 0) {
          await tx.procurementPackageVillage.createMany({
            data: data.villageAllocations.map((allocation) => ({
              packageId: id,
              villageId: allocation.villageId,
              allocatedBudget: allocation.allocatedBudget,
            })),
          });
        }
      }

      return tx.procurementPackage.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.budgetAmount !== undefined
            ? { budgetAmount: data.budgetAmount }
            : {}),
          ...(data.contractorId !== undefined
            ? { contractorId: data.contractorId }
            : {}),
          ...(data.consultantId !== undefined
            ? { consultantId: data.consultantId }
            : {}),
          ...(data.tehsilId !== undefined ? { tehsilId: data.tehsilId } : {}),
        },
        include: this.include,
      });
    });

    return mapPackageRecord(record);
  }

  async delete(id: string): Promise<void> {
    await asProcurementPrisma(this.prisma).procurementPackage.delete({
      where: { id },
    });
  }
}
