import { Injectable } from '@nestjs/common';
import { ConsultantRepositoryPort } from '../../../application/ports/consultant.repository.port';
import { Consultant } from '../../../domain/entities/consultant.entity';
import {
  asProcurementPrisma,
  ConsultantRow,
} from '../prisma/procurement-prisma.access';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaConsultantRepository implements ConsultantRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Consultant[]> {
    const records = await asProcurementPrisma(this.prisma).consultant.findMany({
      orderBy: { name: 'asc' },
    });
    return records.map((record) => this.toDomain(record));
  }

  async findById(id: string): Promise<Consultant | null> {
    const record = await asProcurementPrisma(this.prisma).consultant.findUnique(
      {
        where: { id },
      },
    );
    return record ? this.toDomain(record) : null;
  }

  async findByName(name: string): Promise<Consultant | null> {
    const record = await asProcurementPrisma(this.prisma).consultant.findUnique(
      {
        where: { name },
      },
    );
    return record ? this.toDomain(record) : null;
  }

  async create(name: string): Promise<Consultant> {
    const record = await asProcurementPrisma(this.prisma).consultant.create({
      data: { name },
    });
    return this.toDomain(record);
  }

  async update(id: string, name: string): Promise<Consultant> {
    const record = await asProcurementPrisma(this.prisma).consultant.update({
      where: { id },
      data: { name },
    });
    return this.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await asProcurementPrisma(this.prisma).consultant.delete({ where: { id } });
  }

  async isReferencedByPackage(id: string): Promise<boolean> {
    const count = await asProcurementPrisma(
      this.prisma,
    ).procurementPackage.count({
      where: { consultantId: id },
    });
    return count > 0;
  }

  private toDomain(record: ConsultantRow): Consultant {
    return new Consultant(
      record.id,
      record.name,
      record.createdAt,
      record.updatedAt,
    );
  }
}
