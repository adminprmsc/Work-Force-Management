import { Injectable } from '@nestjs/common';
import {
  Settlement,
  Tehsil,
  Village,
} from '../../../domain/entities/location.entity';
import {
  SettlementUsage,
  TehsilRepositoryPort,
  VillageUsage,
} from '../../../application/ports/tehsil.repository.port';
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

  async findSettlementById(id: string): Promise<Settlement | null> {
    const record = await this.prisma.settlement.findUnique({ where: { id } });
    return record
      ? new Settlement(
          record.id,
          record.name,
          record.villageId,
          record.createdAt,
        )
      : null;
  }

  async findVillageByTehsilAndName(
    tehsilId: string,
    name: string,
  ): Promise<Village | null> {
    const record = await this.prisma.village.findFirst({
      where: { tehsilId, name },
      include: { _count: { select: { settlements: true } } },
    });
    return record ? this.toVillageDomain(record) : null;
  }

  async findSettlementByVillageAndName(
    villageId: string,
    name: string,
  ): Promise<Settlement | null> {
    const record = await this.prisma.settlement.findFirst({
      where: { villageId, name },
    });
    return record
      ? new Settlement(
          record.id,
          record.name,
          record.villageId,
          record.createdAt,
        )
      : null;
  }

  async createVillage(tehsilId: string, name: string): Promise<Village> {
    const record = await this.prisma.village.create({
      data: { tehsilId, name },
      include: { _count: { select: { settlements: true } } },
    });
    return this.toVillageDomain(record);
  }

  async updateVillageName(id: string, name: string): Promise<Village> {
    const record = await this.prisma.village.update({
      where: { id },
      data: { name },
      include: { _count: { select: { settlements: true } } },
    });
    return this.toVillageDomain(record);
  }

  async deleteVillage(id: string): Promise<void> {
    await this.prisma.village.delete({ where: { id } });
  }

  async getVillageUsage(id: string): Promise<VillageUsage> {
    const [settlementCount, packageLinkCount, surveyResponseCount] =
      await Promise.all([
        this.prisma.settlement.count({ where: { villageId: id } }),
        this.prisma.procurementPackageVillage.count({
          where: { villageId: id },
        }),
        this.prisma.surveyResponse.count({ where: { villageId: id } }),
      ]);
    return { settlementCount, packageLinkCount, surveyResponseCount };
  }

  async createSettlement(villageId: string, name: string): Promise<Settlement> {
    const record = await this.prisma.settlement.create({
      data: { villageId, name },
    });
    return new Settlement(
      record.id,
      record.name,
      record.villageId,
      record.createdAt,
    );
  }

  async updateSettlementName(id: string, name: string): Promise<Settlement> {
    const record = await this.prisma.settlement.update({
      where: { id },
      data: { name },
    });
    return new Settlement(
      record.id,
      record.name,
      record.villageId,
      record.createdAt,
    );
  }

  async deleteSettlement(id: string): Promise<void> {
    await this.prisma.settlement.delete({ where: { id } });
  }

  async getSettlementUsage(id: string): Promise<SettlementUsage> {
    const surveyResponseCount = await this.prisma.surveyResponse.count({
      where: { settlementId: id },
    });
    return { surveyResponseCount };
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
