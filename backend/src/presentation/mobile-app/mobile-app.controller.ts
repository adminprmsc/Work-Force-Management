import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { UserRole } from '../../domain/entities/user.entity';
import type { UploadedFilePayload } from '../../application/types/uploaded-file.type';
import {
  GetLatestMobileAppDownloadUseCase,
  GetLatestMobileAppReleaseUseCase,
  ListMobileAppReleasesUseCase,
  UploadMobileAppReleaseUseCase,
} from '../../application/use-cases/mobile-app/manage-mobile-app.use-case';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { UploadMobileAppReleaseDto } from './dto/mobile-app.dto';
import {
  toMobileAppReleaseResponse,
  toPublicMobileAppReleaseResponse,
} from './mappers/mobile-app.mapper';

const MOBILE_APP_MANAGERS = [
  UserRole.SENIOR_MANAGER_ES,
  UserRole.RA_ENVIRONMENT_HO,
] as const;

const MAX_APK_BYTES = 200 * 1024 * 1024;

function toUploadedFilePayload(
  file: UploadedFilePayload | undefined,
): UploadedFilePayload {
  if (
    !file ||
    !Buffer.isBuffer(file.buffer) ||
    typeof file.originalname !== 'string' ||
    typeof file.mimetype !== 'string' ||
    typeof file.size !== 'number'
  ) {
    throw new BadRequestException('file is required');
  }
  return file;
}

@Controller('mobile-app')
export class MobileAppController {
  constructor(
    private readonly uploadRelease: UploadMobileAppReleaseUseCase,
    private readonly listReleases: ListMobileAppReleasesUseCase,
    private readonly getLatest: GetLatestMobileAppReleaseUseCase,
    private readonly getLatestDownload: GetLatestMobileAppDownloadUseCase,
  ) {}

  @Get('releases')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MOBILE_APP_MANAGERS)
  async list(@CurrentUser() user: AuthenticatedUser) {
    const releases = await this.listReleases.execute(user);
    return releases.map(toMobileAppReleaseResponse);
  }

  @Post('releases')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...MOBILE_APP_MANAGERS)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_APK_BYTES },
    }),
  )
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedFilePayload | undefined,
    @Body() body: UploadMobileAppReleaseDto,
  ) {
    const release = await this.uploadRelease.execute(user, {
      versionName: body.versionName,
      versionCode: body.versionCode,
      releaseNotes: body.releaseNotes,
      file: toUploadedFilePayload(file),
    });
    return toMobileAppReleaseResponse(release);
  }

  /** Public metadata for the shareable download page (no auth). */
  @Get('public/latest')
  async publicLatest() {
    const release = await this.getLatest.execute();
    return toPublicMobileAppReleaseResponse(release);
  }

  /**
   * Stable public download entrypoint.
   * Redirects to a short-lived Supabase signed URL so the binary stays private.
   */
  @Get('public/latest/download')
  async publicDownload(@Res() res: Response) {
    const { downloadUrl, release } = await this.getLatestDownload.execute();
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${release.fileName.replace(/"/g, '')}"`,
    );
    return res.redirect(302, downloadUrl);
  }
}
