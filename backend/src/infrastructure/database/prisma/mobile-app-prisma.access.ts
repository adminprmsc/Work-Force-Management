import type { PrismaService } from './prisma.service';

export type MobileAppReleaseRecord = {
  id: string;
  versionName: string;
  versionCode: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  bucket: string;
  storagePath: string;
  releaseNotes: string | null;
  isLatest: boolean;
  uploadedById: string;
  createdAt: Date;
};

export type CreateMobileAppReleaseRow = {
  versionName: string;
  versionCode: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  bucket: string;
  storagePath: string;
  releaseNotes: string | null;
  isLatest: boolean;
  uploadedById: string;
};

type MobileAppReleaseDelegate = {
  updateMany(args: {
    where: { isLatest: boolean };
    data: { isLatest: boolean };
  }): Promise<{ count: number }>;
  create(args: {
    data: CreateMobileAppReleaseRow;
  }): Promise<MobileAppReleaseRecord>;
  findFirst(args: {
    where: { isLatest: boolean };
    orderBy: { createdAt: 'desc' };
  }): Promise<MobileAppReleaseRecord | null>;
  findUnique(args: {
    where: { versionCode: number };
  }): Promise<MobileAppReleaseRecord | null>;
  findMany(args: {
    orderBy: Array<{ versionCode: 'desc' } | { createdAt: 'desc' }>;
  }): Promise<MobileAppReleaseRecord[]>;
};

type TransactionClient = {
  mobileAppRelease: MobileAppReleaseDelegate;
};

export type MobileAppPrismaAccess = {
  mobileAppRelease: MobileAppReleaseDelegate;
  $transaction<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T>;
};

export function asMobileAppPrisma(
  prisma: PrismaService,
): MobileAppPrismaAccess {
  return prisma;
}
