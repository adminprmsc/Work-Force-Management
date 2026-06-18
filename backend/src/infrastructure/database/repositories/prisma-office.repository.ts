import { Injectable } from '@nestjs/common';
import { OfficeType as PrismaOfficeType } from '@prisma/client';
import { Office } from '../../../domain/entities/office.entity';
import { OfficeType } from '../../../domain/entities/user.entity';
import { OfficeRepositoryPort } from '../../../application/ports/office.repository.port';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaOfficeRepository implements OfficeRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Office | null> {
    const record = await this.prisma.office.findUnique({
      where: { id },
      include: { tehsil: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async findAll(filter?: { type?: OfficeType }): Promise<Office[]> {
    const records = await this.prisma.office.findMany({
      where: { type: filter?.type },
      include: { tehsil: true },
      orderBy: { name: 'asc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findByTehsilId(tehsilId: string): Promise<Office | null> {
    const record = await this.prisma.office.findUnique({
      where: { tehsilId },
      include: { tehsil: true },
    });
    return record ? this.toDomain(record) : null;
  }

  private toDomain(record: {
    id: string;
    type: PrismaOfficeType;
    name: string;
    tehsilId: string | null;
    createdAt: Date;
    updatedAt: Date;
    tehsil?: { name: string } | null;
  }): Office {
    return new Office(
      record.id,
      record.type as OfficeType,
      record.name,
      record.tehsilId,
      record.tehsil?.name ?? null,
      record.createdAt,
      record.updatedAt,
    );
  }
}
