import { Module } from '@nestjs/common';
import { OBJECT_STORAGE } from '../../application/ports/object-storage.port';
import { SURVEY_ASSIGNMENT_REPOSITORY } from '../../application/ports/survey-assignment.repository.port';
import { SURVEY_ATTACHMENT_REPOSITORY } from '../../application/ports/survey-attachment.repository.port';
import { SURVEY_FORM_REPOSITORY } from '../../application/ports/survey-form.repository.port';
import { SURVEY_RESPONSE_REPOSITORY } from '../../application/ports/survey-response.repository.port';
import { OFFICE_REPOSITORY } from '../../application/ports/office.repository.port';
import { USER_REPOSITORY } from '../../application/ports/user.repository.port';
import { SurveyAttachmentPathService } from '../../application/services/survey-attachment-path.service';
import { SurveyScopeResolver } from '../../application/services/survey-scope.resolver';
import { GetSurveyAttachmentUrlUseCase } from '../../application/use-cases/storage/get-survey-attachment-url.use-case';
import { UploadSurveyAttachmentUseCase } from '../../application/use-cases/storage/upload-survey-attachment.use-case';
import { PrismaSurveyAssignmentRepository } from '../../infrastructure/database/repositories/prisma-survey-assignment.repository';
import { PrismaSurveyAttachmentRepository } from '../../infrastructure/database/repositories/prisma-survey-attachment.repository';
import { PrismaSurveyFormRepository } from '../../infrastructure/database/repositories/prisma-survey-form.repository';
import { PrismaSurveyResponseRepository } from '../../infrastructure/database/repositories/prisma-survey-response.repository';
import { PrismaOfficeRepository } from '../../infrastructure/database/repositories/prisma-office.repository';
import { PrismaUserRepository } from '../../infrastructure/database/repositories/prisma-user.repository';
import { SupabaseStorageService } from '../../infrastructure/storage/supabase-storage.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { StorageController } from './storage.controller';

@Module({
  controllers: [StorageController],
  providers: [
    RolesGuard,
    SurveyScopeResolver,
    SurveyAttachmentPathService,
    UploadSurveyAttachmentUseCase,
    GetSurveyAttachmentUrlUseCase,
    { provide: OBJECT_STORAGE, useClass: SupabaseStorageService },
    {
      provide: SURVEY_ATTACHMENT_REPOSITORY,
      useClass: PrismaSurveyAttachmentRepository,
    },
    { provide: SURVEY_FORM_REPOSITORY, useClass: PrismaSurveyFormRepository },
    {
      provide: SURVEY_ASSIGNMENT_REPOSITORY,
      useClass: PrismaSurveyAssignmentRepository,
    },
    {
      provide: SURVEY_RESPONSE_REPOSITORY,
      useClass: PrismaSurveyResponseRepository,
    },
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: OFFICE_REPOSITORY, useClass: PrismaOfficeRepository },
  ],
})
export class StorageModule {}
