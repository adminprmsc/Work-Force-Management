import { MobileAppRelease } from '../../domain/entities/mobile-app-release.entity';

export interface CreateMobileAppReleaseData {
  versionName: string;
  versionCode: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  bucket: string;
  storagePath: string;
  releaseNotes?: string | null;
  uploadedById: string;
}

export abstract class MobileAppReleaseRepositoryPort {
  abstract createAsLatest(
    data: CreateMobileAppReleaseData,
  ): Promise<MobileAppRelease>;
  abstract findLatest(): Promise<MobileAppRelease | null>;
  abstract findByVersionCode(
    versionCode: number,
  ): Promise<MobileAppRelease | null>;
  abstract list(): Promise<MobileAppRelease[]>;
}

export const MOBILE_APP_RELEASE_REPOSITORY = Symbol(
  'MOBILE_APP_RELEASE_REPOSITORY',
);
