import { Module } from '@nestjs/common';
import { OFFICE_REPOSITORY } from '../../application/ports/office.repository.port';
import { PACKAGE_BASELINE_REPOSITORY } from '../../application/ports/package-baseline.repository.port';
import { PROCUREMENT_PACKAGE_REPOSITORY } from '../../application/ports/procurement-package.repository.port';
import { SURVEY_ASSIGNMENT_REPOSITORY } from '../../application/ports/survey-assignment.repository.port';
import { SURVEY_FORM_REPOSITORY } from '../../application/ports/survey-form.repository.port';
import { SURVEY_FORM_REVISION_REPOSITORY } from '../../application/ports/survey-form-revision.repository.port';
import { SURVEY_RESPONSE_REPOSITORY } from '../../application/ports/survey-response.repository.port';
import { TEHSIL_REPOSITORY } from '../../application/ports/tehsil.repository.port';
import { USER_REPOSITORY } from '../../application/ports/user.repository.port';
import { AssignmentBaselineEnricher } from '../../application/services/assignment-baseline.enricher';
import { PackageSurveyBudgetService } from '../../application/services/package-survey-budget.service';
import { CesmpAnalyticsService } from '../../application/services/cesmp-analytics.service';
import { ProcurementPackageBudgetEnricher } from '../../application/services/procurement-package-budget.enricher';
import { PackageFieldReferenceResolver } from '../../application/services/package-field-reference.resolver';
import { SurveyAnswerValidator } from '../../application/services/survey-answer.validator';
import { SurveyBaselineFieldValidator } from '../../application/services/survey-baseline-field.validator';
import { SurveyFormValidator } from '../../application/services/survey-form.validator';
import { SurveyScopeResolver } from '../../application/services/survey-scope.resolver';
import {
  CreateSurveyAssignmentsUseCase,
  DeleteSurveyAssignmentUseCase,
  ListMyAssignmentsUseCase,
  ListSurveyAssignmentsUseCase,
} from '../../application/use-cases/survey/manage-survey-assignments.use-case';
import {
  ArchiveSurveyFormUseCase,
  CreateSurveyFormUseCase,
  DeleteSurveyFormUseCase,
  GetSurveyFormUseCase,
  ListSurveyFormsUseCase,
  PublishSurveyFormUseCase,
  UpdateSurveyFormUseCase,
} from '../../application/use-cases/survey/manage-survey-forms.use-case';
import { GetSurveyFormAnalyticsUseCase } from '../../application/use-cases/survey/get-survey-form-analytics.use-case';
import {
  GetSurveyResponseUseCase,
  ListSurveyResponsesUseCase,
  SaveSurveyResponseUseCase,
  StartSurveyResponseUseCase,
  SubmitSurveyResponseUseCase,
} from '../../application/use-cases/survey/manage-survey-responses.use-case';
import { PrismaOfficeRepository } from '../../infrastructure/database/repositories/prisma-office.repository';
import { PrismaPackageBaselineRepository } from '../../infrastructure/database/repositories/prisma-package-baseline.repository';
import { PrismaProcurementPackageRepository } from '../../infrastructure/database/repositories/prisma-procurement-package.repository';
import { PrismaSurveyAssignmentRepository } from '../../infrastructure/database/repositories/prisma-survey-assignment.repository';
import { PrismaSurveyFormRepository } from '../../infrastructure/database/repositories/prisma-survey-form.repository';
import { PrismaSurveyFormRevisionRepository } from '../../infrastructure/database/repositories/prisma-survey-form-revision.repository';
import { PrismaSurveyResponseRepository } from '../../infrastructure/database/repositories/prisma-survey-response.repository';
import { PrismaTehsilRepository } from '../../infrastructure/database/repositories/prisma-tehsil.repository';
import { PrismaUserRepository } from '../../infrastructure/database/repositories/prisma-user.repository';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SurveyAssignmentsController } from './survey-assignments.controller';
import { SurveyFormsController } from './survey-forms.controller';
import { SurveyResponsesController } from './survey-responses.controller';

@Module({
  controllers: [
    SurveyFormsController,
    SurveyAssignmentsController,
    SurveyResponsesController,
  ],
  providers: [
    RolesGuard,
    SurveyScopeResolver,
    SurveyFormValidator,
    PackageFieldReferenceResolver,
    SurveyBaselineFieldValidator,
    SurveyAnswerValidator,
    AssignmentBaselineEnricher,
    PackageSurveyBudgetService,
    CesmpAnalyticsService,
    ProcurementPackageBudgetEnricher,
    ListSurveyFormsUseCase,
    GetSurveyFormUseCase,
    CreateSurveyFormUseCase,
    UpdateSurveyFormUseCase,
    PublishSurveyFormUseCase,
    ArchiveSurveyFormUseCase,
    DeleteSurveyFormUseCase,
    GetSurveyFormAnalyticsUseCase,
    ListSurveyAssignmentsUseCase,
    CreateSurveyAssignmentsUseCase,
    DeleteSurveyAssignmentUseCase,
    ListMyAssignmentsUseCase,
    ListSurveyResponsesUseCase,
    GetSurveyResponseUseCase,
    StartSurveyResponseUseCase,
    SaveSurveyResponseUseCase,
    SubmitSurveyResponseUseCase,
    { provide: SURVEY_FORM_REPOSITORY, useClass: PrismaSurveyFormRepository },
    {
      provide: SURVEY_FORM_REVISION_REPOSITORY,
      useClass: PrismaSurveyFormRevisionRepository,
    },
    {
      provide: SURVEY_ASSIGNMENT_REPOSITORY,
      useClass: PrismaSurveyAssignmentRepository,
    },
    {
      provide: SURVEY_RESPONSE_REPOSITORY,
      useClass: PrismaSurveyResponseRepository,
    },
    { provide: TEHSIL_REPOSITORY, useClass: PrismaTehsilRepository },
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: OFFICE_REPOSITORY, useClass: PrismaOfficeRepository },
    {
      provide: PROCUREMENT_PACKAGE_REPOSITORY,
      useClass: PrismaProcurementPackageRepository,
    },
    {
      provide: PACKAGE_BASELINE_REPOSITORY,
      useClass: PrismaPackageBaselineRepository,
    },
  ],
})
export class SurveyModule {}
