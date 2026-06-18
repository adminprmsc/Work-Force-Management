import { Injectable } from '@nestjs/common';
import { ContractorRepositoryPort } from '../../../application/ports/contractor.repository.port';
import { Contractor } from '../../../domain/entities/contractor.entity';
import {
  asProcurementPrisma,
  ContractorRow,
} from '../prisma/procurement-prisma.access';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaContractorRepository implements ContractorRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Contractor[]> {
    const records = await asProcurementPrisma(this.prisma).contractor.findMany({
      orderBy: { name: 'asc' },
    });
    return records.map((record) => this.toDomain(record));
  }

  async findById(id: string): Promise<Contractor | null> {
    const record = await asProcurementPrisma(this.prisma).contractor.findUnique(
      {
        where: { id },
      },
    );
    return record ? this.toDomain(record) : null;
  }

  async findByName(name: string): Promise<Contractor | null> {
    const record = await asProcurementPrisma(this.prisma).contractor.findUnique(
      {
        where: { name },
      },
    );
    return record ? this.toDomain(record) : null;
  }

  async create(name: string): Promise<Contractor> {
    const record = await asProcurementPrisma(this.prisma).contractor.create({
      data: { name },
    });
    return this.toDomain(record);
  }

  async update(id: string, name: string): Promise<Contractor> {
    const record = await asProcurementPrisma(this.prisma).contractor.update({
      where: { id },
      data: { name },
    });
    return this.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await asProcurementPrisma(this.prisma).contractor.delete({ where: { id } });
  }

  async isReferencedByPackage(id: string): Promise<boolean> {
    const count = await asProcurementPrisma(
      this.prisma,
    ).procurementPackage.count({
      where: { contractorId: id },
    });
    return count > 0;
  }

  private toDomain(record: ContractorRow): Contractor {
    return new Contractor(
      record.id,
      record.name,
      record.createdAt,
      record.updatedAt,
    );
  }
}
