import { Module } from '@nestjs/common';
import { CONTRACTOR_REPOSITORY } from '../../application/ports/contractor.repository.port';
import { CONSULTANT_REPOSITORY } from '../../application/ports/consultant.repository.port';
import { OFFICE_REPOSITORY } from '../../application/ports/office.repository.port';
import { PACKAGE_BASELINE_REPOSITORY } from '../../application/ports/package-baseline.repository.port';
import { PROCUREMENT_PACKAGE_EXPENSE_REPOSITORY } from '../../application/ports/procurement-package-expense.repository.port';
import { PROCUREMENT_PACKAGE_REPOSITORY } from '../../application/ports/procurement-package.repository.port';
import { SURVEY_ASSIGNMENT_REPOSITORY } from '../../application/ports/survey-assignment.repository.port';
import { SURVEY_FORM_REPOSITORY } from '../../application/ports/survey-form.repository.port';
import { TEHSIL_REPOSITORY } from '../../application/ports/tehsil.repository.port';
import { USER_REPOSITORY } from '../../application/ports/user.repository.port';
import { AssignmentBaselineEnricher } from '../../application/services/assignment-baseline.enricher';
import { ProcurementPackageBudgetEnricher } from '../../application/services/procurement-package-budget.enricher';
import { PackageSurveyBudgetService } from '../../application/services/package-survey-budget.service';
import { ProcurementActorResolver } from '../../application/services/procurement-actor.resolver';
import { ProcurementPackageNamingService } from '../../application/services/procurement-package-naming.service';
import { ProcurementPackageValidator } from '../../application/services/procurement-package.validator';
import { SurveyAnswerValidator } from '../../application/services/survey-answer.validator';
import { PackageFieldReferenceResolver } from '../../application/services/package-field-reference.resolver';
import { SurveyBaselineFieldValidator } from '../../application/services/survey-baseline-field.validator';
import {
  CreateContractorUseCase,
  DeleteContractorUseCase,
  ListContractorsUseCase,
  UpdateContractorUseCase,
} from '../../application/use-cases/procurement/manage-contractors.use-case';
import {
  CreateConsultantUseCase,
  DeleteConsultantUseCase,
  ListConsultantsUseCase,
  UpdateConsultantUseCase,
} from '../../application/use-cases/procurement/manage-consultants.use-case';
import {
  CreateProcurementPackageExpenseUseCase,
  DeleteProcurementPackageExpenseUseCase,
  ListProcurementPackageExpensesUseCase,
  UpdateProcurementPackageExpenseUseCase,
} from '../../application/use-cases/procurement/manage-procurement-package-expenses.use-case';
import {
  GetPackageFormBaselineUseCase,
  SavePackageFormBaselineUseCase,
} from '../../application/use-cases/procurement/manage-package-baseline.use-case';
import { ListPackageBaselineFormsUseCase } from '../../application/use-cases/procurement/list-package-baseline-forms.use-case';
import {
  CreateProcurementPackageUseCase,
  DeleteProcurementPackageUseCase,
  GetProcurementPackageUseCase,
  ListProcurementPackagesUseCase,
  PreviewProcurementPackageNameUseCase,
  UpdateProcurementPackageUseCase,
} from '../../application/use-cases/procurement/manage-procurement-packages.use-case';
import { PrismaContractorRepository } from '../../infrastructure/database/repositories/prisma-contractor.repository';
import { PrismaConsultantRepository } from '../../infrastructure/database/repositories/prisma-consultant.repository';
import { PrismaOfficeRepository } from '../../infrastructure/database/repositories/prisma-office.repository';
import { PrismaPackageBaselineRepository } from '../../infrastructure/database/repositories/prisma-package-baseline.repository';
import { PrismaProcurementPackageExpenseRepository } from '../../infrastructure/database/repositories/prisma-procurement-package-expense.repository';
import { PrismaProcurementPackageRepository } from '../../infrastructure/database/repositories/prisma-procurement-package.repository';
import { PrismaSurveyAssignmentRepository } from '../../infrastructure/database/repositories/prisma-survey-assignment.repository';
import { PrismaSurveyFormRepository } from '../../infrastructure/database/repositories/prisma-survey-form.repository';
import { PrismaTehsilRepository } from '../../infrastructure/database/repositories/prisma-tehsil.repository';
import { PrismaUserRepository } from '../../infrastructure/database/repositories/prisma-user.repository';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ConsultantsController } from './consultants.controller';
import { ContractorsController } from './contractors.controller';
import { ProcurementPackagesController } from './procurement-packages.controller';

@Module({
  controllers: [
    ContractorsController,
    ConsultantsController,
    ProcurementPackagesController,
  ],
  providers: [
    RolesGuard,
    ProcurementActorResolver,
    ProcurementPackageValidator,
    ProcurementPackageNamingService,
    SurveyAnswerValidator,
    PackageFieldReferenceResolver,
    SurveyBaselineFieldValidator,
    AssignmentBaselineEnricher,
    PackageSurveyBudgetService,
    ProcurementPackageBudgetEnricher,
    ListContractorsUseCase,
    CreateContractorUseCase,
    UpdateContractorUseCase,
    DeleteContractorUseCase,
    ListConsultantsUseCase,
    CreateConsultantUseCase,
    UpdateConsultantUseCase,
    DeleteConsultantUseCase,
    ListProcurementPackagesUseCase,
    GetProcurementPackageUseCase,
    CreateProcurementPackageUseCase,
    PreviewProcurementPackageNameUseCase,
    UpdateProcurementPackageUseCase,
    DeleteProcurementPackageUseCase,
    GetPackageFormBaselineUseCase,
    SavePackageFormBaselineUseCase,
    ListPackageBaselineFormsUseCase,
    ListProcurementPackageExpensesUseCase,
    CreateProcurementPackageExpenseUseCase,
    UpdateProcurementPackageExpenseUseCase,
    DeleteProcurementPackageExpenseUseCase,
    { provide: CONTRACTOR_REPOSITORY, useClass: PrismaContractorRepository },
    { provide: CONSULTANT_REPOSITORY, useClass: PrismaConsultantRepository },
    {
      provide: PACKAGE_BASELINE_REPOSITORY,
      useClass: PrismaPackageBaselineRepository,
    },
    {
      provide: PROCUREMENT_PACKAGE_REPOSITORY,
      useClass: PrismaProcurementPackageRepository,
    },
    {
      provide: PROCUREMENT_PACKAGE_EXPENSE_REPOSITORY,
      useClass: PrismaProcurementPackageExpenseRepository,
    },
    { provide: TEHSIL_REPOSITORY, useClass: PrismaTehsilRepository },
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: OFFICE_REPOSITORY, useClass: PrismaOfficeRepository },
    {
      provide: SURVEY_ASSIGNMENT_REPOSITORY,
      useClass: PrismaSurveyAssignmentRepository,
    },
    { provide: SURVEY_FORM_REPOSITORY, useClass: PrismaSurveyFormRepository },
  ],
})
export class ProcurementModule {}
