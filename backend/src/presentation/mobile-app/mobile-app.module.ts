import { Module } from '@nestjs/common';
import { MOBILE_APP_RELEASE_REPOSITORY } from '../../application/ports/mobile-app-release.repository.port';
import { OBJECT_STORAGE } from '../../application/ports/object-storage.port';
import { AUDIT_LOG_REPOSITORY } from '../../application/ports/audit-log.repository.port';
import { MobileAppPathService } from '../../application/services/mobile-app-path.service';
import { AuditService } from '../../application/services/audit.service';
import {
  GetLatestMobileAppDownloadUseCase,
  GetLatestMobileAppReleaseUseCase,
  ListMobileAppReleasesUseCase,
  UploadMobileAppReleaseUseCase,
} from '../../application/use-cases/mobile-app/manage-mobile-app.use-case';
import { PrismaMobileAppReleaseRepository } from '../../infrastructure/database/repositories/prisma-mobile-app-release.repository';
import { PrismaAuditLogRepository } from '../../infrastructure/database/repositories/prisma-audit-log.repository';
import { SupabaseStorageService } from '../../infrastructure/storage/supabase-storage.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MobileAppController } from './mobile-app.controller';

@Module({
  controllers: [MobileAppController],
  providers: [
    RolesGuard,
    MobileAppPathService,
    AuditService,
    UploadMobileAppReleaseUseCase,
    ListMobileAppReleasesUseCase,
    GetLatestMobileAppReleaseUseCase,
    GetLatestMobileAppDownloadUseCase,
    {
      provide: MOBILE_APP_RELEASE_REPOSITORY,
      useClass: PrismaMobileAppReleaseRepository,
    },
    { provide: OBJECT_STORAGE, useClass: SupabaseStorageService },
    { provide: AUDIT_LOG_REPOSITORY, useClass: PrismaAuditLogRepository },
  ],
})
export class MobileAppModule {}
