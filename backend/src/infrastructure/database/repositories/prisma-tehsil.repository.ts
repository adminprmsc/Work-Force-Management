import { Injectable } from '@nestjs/common';
import {
  Settlement,
  Tehsil,
  Village,
} from '../../../domain/entities/location.entity';
import { TehsilRepositoryPort } from '../../../application/ports/tehsil.repository.port';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaTehsilRepository implements TehsilRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Tehsil[]> {
    const records = await this.prisma.tehsil.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { villages: true } } },
    });
    return records.map((r) => this.toTehsilDomain(r));
  }

  async findById(id: string): Promise<Tehsil | null> {
    const record = await this.prisma.tehsil.findUnique({
      where: { id },
      include: { _count: { select: { villages: true } } },
    });
    return record ? this.toTehsilDomain(record) : null;
  }

  async findVillagesByTehsilId(tehsilId: string): Promise<Village[]> {
    const records = await this.prisma.village.findMany({
      where: { tehsilId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { settlements: true } } },
    });
    return records.map((r) => this.toVillageDomain(r));
  }

  async findVillageById(id: string): Promise<Village | null> {
    const record = await this.prisma.village.findUnique({
      where: { id },
      include: { _count: { select: { settlements: true } } },
    });
    return record ? this.toVillageDomain(record) : null;
  }

  async findSettlementsByVillageId(villageId: string): Promise<Settlement[]> {
    const records = await this.prisma.settlement.findMany({
      where: { villageId },
      orderBy: { name: 'asc' },
    });
    return records.map(
      (r) => new Settlement(r.id, r.name, r.villageId, r.createdAt),
    );
  }

  private toTehsilDomain(record: {
    id: string;
    name: string;
    createdAt: Date;
    _count?: { villages: number };
  }): Tehsil {
    return new Tehsil(
      record.id,
      record.name,
      record.createdAt,
      record._count?.villages,
    );
  }

  private toVillageDomain(record: {
    id: string;
    name: string;
    tehsilId: string;
    createdAt: Date;
    _count?: { settlements: number };
  }): Village {
    return new Village(
      record.id,
      record.name,
      record.tehsilId,
      record.createdAt,
      record._count?.settlements,
    );
  }
}
