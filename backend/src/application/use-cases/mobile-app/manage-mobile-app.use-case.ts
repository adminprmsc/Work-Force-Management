import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuditAction,
  AUDIT_RESOURCE_TYPES,
} from '../../../domain/entities/audit-log.entity';
import { MobileAppRelease } from '../../../domain/entities/mobile-app-release.entity';
import { canManageMobileApp } from '../../../domain/policies/mobile-app.policy';
import {
  MOBILE_APP_RELEASE_REPOSITORY,
  MobileAppReleaseRepositoryPort,
} from '../../ports/mobile-app-release.repository.port';
import {
  OBJECT_STORAGE,
  ObjectStoragePort,
} from '../../ports/object-storage.port';
import { AuditService } from '../../services/audit.service';
import { MobileAppPathService } from '../../services/mobile-app-path.service';
import type { AuthenticatedUser } from '../../types/authenticated-user.type';
import type { UploadedFilePayload } from '../../types/uploaded-file.type';

const ACCEPTED_RELEASE_MIME_TYPES = new Set([
  'application/vnd.android.package-archive',
  'application/octet-stream',
  'application/java-archive',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  'multipart/x-zip',
]);

const DEFAULT_APK_MAX_MB = 200;

function isAcceptedReleaseFileName(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith('.apk') || lower.endsWith('.zip');
}

function defaultMimeForFileName(fileName: string): string {
  if (fileName.toLowerCase().endsWith('.zip')) {
    return 'application/zip';
  }
  return 'application/vnd.android.package-archive';
}

export interface UploadMobileAppReleaseCommand {
  versionName: string;
  versionCode: number;
  releaseNotes?: string | null;
  file: UploadedFilePayload;
}

export interface MobileAppDownloadPayload {
  release: MobileAppRelease;
  downloadUrl: string;
  expiresInSeconds: number;
}

@Injectable()
export class UploadMobileAppReleaseUseCase {
  constructor(
    @Inject(MOBILE_APP_RELEASE_REPOSITORY)
    private readonly releaseRepository: MobileAppReleaseRepositoryPort,
    @Inject(OBJECT_STORAGE)
    private readonly objectStorage: ObjectStoragePort,
    private readonly pathService: MobileAppPathService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    user: AuthenticatedUser,
    command: UploadMobileAppReleaseCommand,
  ): Promise<MobileAppRelease> {
    if (!canManageMobileApp(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const versionName = command.versionName.trim();
    if (!versionName) {
      throw new BadRequestException('versionName is required');
    }
    if (!/^[0-9A-Za-z][0-9A-Za-z._+-]{0,30}$/.test(versionName)) {
      throw new BadRequestException(
        'versionName must be a short alphanumeric build label (e.g. 1.2.0)',
      );
    }

    const versionCode = Number(command.versionCode);
    if (
      !Number.isInteger(versionCode) ||
      versionCode < 1 ||
      versionCode > 2_147_483_647
    ) {
      throw new BadRequestException(
        'versionCode must be a positive integer (Android versionCode)',
      );
    }

    const existing =
      await this.releaseRepository.findByVersionCode(versionCode);
    if (existing) {
      throw new BadRequestException(
        `versionCode ${versionCode} is already published. Use a higher versionCode.`,
      );
    }

    const file = command.file;
    const lowerName = file.originalname.toLowerCase();
    if (!isAcceptedReleaseFileName(file.originalname)) {
      throw new BadRequestException('Only .apk or .zip files are accepted');
    }
    if (file.mimetype && !ACCEPTED_RELEASE_MIME_TYPES.has(file.mimetype)) {
      // Browsers often send generic types — allow when extension is .apk/.zip.
      if (
        !file.mimetype.includes('android') &&
        !file.mimetype.includes('octet') &&
        !file.mimetype.includes('zip')
      ) {
        throw new BadRequestException('Invalid app package file type');
      }
    }

    const maxMb =
      this.configService.get<number>('supabase.apkUploadMaxMb') ??
      DEFAULT_APK_MAX_MB;
    const maxBytes = maxMb * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(`File exceeds maximum size of ${maxMb} MB`);
    }
    if (file.size <= 0) {
      throw new BadRequestException('File is empty');
    }

    const bucket =
      this.configService.get<string>('supabase.storageBucket') ?? 'LOCAL';
    const storagePath = this.pathService.buildPath({
      versionCode,
      fileName: file.originalname,
    });
    const mimeType =
      file.mimetype && file.mimetype !== 'application/octet-stream'
        ? file.mimetype
        : defaultMimeForFileName(lowerName);

    await this.objectStorage.upload({
      bucket,
      path: storagePath,
      body: file.buffer,
      contentType: mimeType,
      upsert: false,
    });

    const release = await this.releaseRepository.createAsLatest({
      versionName,
      versionCode,
      fileName: file.originalname,
      mimeType,
      sizeBytes: file.size,
      bucket,
      storagePath,
      releaseNotes: command.releaseNotes?.trim() || null,
      uploadedById: user.id,
    });

    await this.auditService.log({
      actorId: user.id,
      action: AuditAction.MOBILE_APP_UPLOADED,
      resourceType: AUDIT_RESOURCE_TYPES.MOBILE_APP_RELEASE,
      resourceId: release.id,
      metadata: {
        versionName: release.versionName,
        versionCode: release.versionCode,
        fileName: release.fileName,
        sizeBytes: release.sizeBytes,
      },
    });

    return release;
  }
}

@Injectable()
export class ListMobileAppReleasesUseCase {
  constructor(
    @Inject(MOBILE_APP_RELEASE_REPOSITORY)
    private readonly releaseRepository: MobileAppReleaseRepositoryPort,
  ) {}

  async execute(user: AuthenticatedUser): Promise<MobileAppRelease[]> {
    if (!canManageMobileApp(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return this.releaseRepository.list();
  }
}

@Injectable()
export class GetLatestMobileAppReleaseUseCase {
  constructor(
    @Inject(MOBILE_APP_RELEASE_REPOSITORY)
    private readonly releaseRepository: MobileAppReleaseRepositoryPort,
  ) {}

  async execute(): Promise<MobileAppRelease> {
    const release = await this.releaseRepository.findLatest();
    if (!release) {
      throw new NotFoundException(
        'No mobile app release has been published yet',
      );
    }
    return release;
  }
}

@Injectable()
export class GetLatestMobileAppDownloadUseCase {
  constructor(
    @Inject(MOBILE_APP_RELEASE_REPOSITORY)
    private readonly releaseRepository: MobileAppReleaseRepositoryPort,
    @Inject(OBJECT_STORAGE)
    private readonly objectStorage: ObjectStoragePort,
    private readonly configService: ConfigService,
  ) {}

  async execute(): Promise<MobileAppDownloadPayload> {
    const release = await this.releaseRepository.findLatest();
    if (!release) {
      throw new NotFoundException(
        'No mobile app release has been published yet',
      );
    }

    const expiresInSeconds =
      this.configService.get<number>('supabase.signedUrlTtlSeconds') ?? 3600;

    const downloadUrl = await this.objectStorage.createSignedUrl(
      release.bucket,
      release.storagePath,
      expiresInSeconds,
    );

    return { release, downloadUrl, expiresInSeconds };
  }
}
