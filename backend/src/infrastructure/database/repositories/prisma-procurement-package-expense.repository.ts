import { Injectable } from '@nestjs/common';
import {
  CreateProcurementPackageExpenseData,
  ProcurementPackageExpenseRepositoryPort,
  UpdateProcurementPackageExpenseData,
} from '../../../application/ports/procurement-package-expense.repository.port';
import {
  decimalToMoneyString,
  mapExpenseRow,
} from '../mappers/procurement-package.mapper';
import { asProcurementPrisma } from '../prisma/procurement-prisma.access';
import { PrismaService } from '../prisma/prisma.service';

const expenseInclude = {
  createdBy: {
    select: {
      id: true,
      username: true,
      email: true,
    },
  },
} as const;

@Injectable()
export class PrismaProcurementPackageExpenseRepository implements ProcurementPackageExpenseRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByPackageId(packageId: string) {
    const records = await asProcurementPrisma(
      this.prisma,
    ).procurementPackageExpense.findMany({
      where: { packageId },
      include: expenseInclude,
      orderBy: { expenseDate: 'desc' },
    });
    return records.map(mapExpenseRow);
  }

  async findById(id: string) {
    const record = await asProcurementPrisma(
      this.prisma,
    ).procurementPackageExpense.findUnique({
      where: { id },
      include: expenseInclude,
    });
    return record ? mapExpenseRow(record) : null;
  }

  async create(data: CreateProcurementPackageExpenseData) {
    const record = await asProcurementPrisma(
      this.prisma,
    ).procurementPackageExpense.create({
      data: {
        packageId: data.packageId,
        amount: data.amount,
        description: data.description ?? null,
        expenseDate: data.expenseDate,
        createdById: data.createdById,
      },
      include: expenseInclude,
    });
    return mapExpenseRow(record);
  }

  async update(id: string, data: UpdateProcurementPackageExpenseData) {
    const record = await asProcurementPrisma(
      this.prisma,
    ).procurementPackageExpense.update({
      where: { id },
      data: {
        ...(data.amount !== undefined ? { amount: data.amount } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.expenseDate !== undefined
          ? { expenseDate: data.expenseDate }
          : {}),
      },
      include: expenseInclude,
    });
    return mapExpenseRow(record);
  }

  async delete(id: string): Promise<void> {
    await asProcurementPrisma(this.prisma).procurementPackageExpense.delete({
      where: { id },
    });
  }

  async sumByPackageId(packageId: string): Promise<string> {
    const result = await asProcurementPrisma(
      this.prisma,
    ).procurementPackageExpense.aggregate({
      where: { packageId },
      _sum: { amount: true },
    });
    return decimalToMoneyString(result._sum.amount ?? '0');
  }
}
