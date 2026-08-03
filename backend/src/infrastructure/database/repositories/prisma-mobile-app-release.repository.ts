import { Injectable } from '@nestjs/common';
import { MobileAppRelease } from '../../../domain/entities/mobile-app-release.entity';
import {
  CreateMobileAppReleaseData,
  MobileAppReleaseRepositoryPort,
} from '../../../application/ports/mobile-app-release.repository.port';
import {
  asMobileAppPrisma,
  type MobileAppReleaseRecord,
} from '../prisma/mobile-app-prisma.access';
import { PrismaService } from '../prisma/prisma.service';

function mapRecord(record: MobileAppReleaseRecord): MobileAppRelease {
  return new MobileAppRelease(
    record.id,
    record.versionName,
    record.versionCode,
    record.fileName,
    record.mimeType,
    record.sizeBytes,
    record.bucket,
    record.storagePath,
    record.releaseNotes,
    record.isLatest,
    record.uploadedById,
    record.createdAt,
  );
}

@Injectable()
export class PrismaMobileAppReleaseRepository implements MobileAppReleaseRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async createAsLatest(
    data: CreateMobileAppReleaseData,
  ): Promise<MobileAppRelease> {
    const db = asMobileAppPrisma(this.prisma);
    const record = await db.$transaction(async (tx) => {
      await tx.mobileAppRelease.updateMany({
        where: { isLatest: true },
        data: { isLatest: false },
      });

      return tx.mobileAppRelease.create({
        data: {
          versionName: data.versionName,
          versionCode: data.versionCode,
          fileName: data.fileName,
          mimeType: data.mimeType,
          sizeBytes: data.sizeBytes,
          bucket: data.bucket,
          storagePath: data.storagePath,
          releaseNotes: data.releaseNotes ?? null,
          isLatest: true,
          uploadedById: data.uploadedById,
        },
      });
    });

    return mapRecord(record);
  }

  async findLatest(): Promise<MobileAppRelease | null> {
    const record = await asMobileAppPrisma(
      this.prisma,
    ).mobileAppRelease.findFirst({
      where: { isLatest: true },
      orderBy: { createdAt: 'desc' },
    });
    return record ? mapRecord(record) : null;
  }

  async findByVersionCode(
    versionCode: number,
  ): Promise<MobileAppRelease | null> {
    const record = await asMobileAppPrisma(
      this.prisma,
    ).mobileAppRelease.findUnique({
      where: { versionCode },
    });
    return record ? mapRecord(record) : null;
  }

  async list(): Promise<MobileAppRelease[]> {
    const records = await asMobileAppPrisma(
      this.prisma,
    ).mobileAppRelease.findMany({
      orderBy: [{ versionCode: 'desc' }, { createdAt: 'desc' }],
    });
    return records.map(mapRecord);
  }
}
