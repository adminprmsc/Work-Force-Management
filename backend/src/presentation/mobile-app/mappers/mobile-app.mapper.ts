import { MobileAppRelease } from '../../../domain/entities/mobile-app-release.entity';

export function toMobileAppReleaseResponse(release: MobileAppRelease) {
  return {
    id: release.id,
    versionName: release.versionName,
    versionCode: release.versionCode,
    fileName: release.fileName,
    mimeType: release.mimeType,
    sizeBytes: release.sizeBytes,
    releaseNotes: release.releaseNotes,
    isLatest: release.isLatest,
    uploadedById: release.uploadedById,
    createdAt: release.createdAt.toISOString(),
  };
}

export function toPublicMobileAppReleaseResponse(release: MobileAppRelease) {
  return {
    versionName: release.versionName,
    versionCode: release.versionCode,
    fileName: release.fileName,
    sizeBytes: release.sizeBytes,
    releaseNotes: release.releaseNotes,
    publishedAt: release.createdAt.toISOString(),
  };
}
