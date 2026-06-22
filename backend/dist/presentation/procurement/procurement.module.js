"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcurementModule = void 0;
const common_1 = require("@nestjs/common");
const contractor_repository_port_1 = require("../../application/ports/contractor.repository.port");
const consultant_repository_port_1 = require("../../application/ports/consultant.repository.port");
const office_repository_port_1 = require("../../application/ports/office.repository.port");
const package_baseline_repository_port_1 = require("../../application/ports/package-baseline.repository.port");
const procurement_package_expense_repository_port_1 = require("../../application/ports/procurement-package-expense.repository.port");
const procurement_package_repository_port_1 = require("../../application/ports/procurement-package.repository.port");
const survey_assignment_repository_port_1 = require("../../application/ports/survey-assignment.repository.port");
const survey_form_repository_port_1 = require("../../application/ports/survey-form.repository.port");
const tehsil_repository_port_1 = require("../../application/ports/tehsil.repository.port");
const user_repository_port_1 = require("../../application/ports/user.repository.port");
const assignment_baseline_enricher_1 = require("../../application/services/assignment-baseline.enricher");
const procurement_package_budget_enricher_1 = require("../../application/services/procurement-package-budget.enricher");
const package_survey_budget_service_1 = require("../../application/services/package-survey-budget.service");
const procurement_actor_resolver_1 = require("../../application/services/procurement-actor.resolver");
const procurement_package_naming_service_1 = require("../../application/services/procurement-package-naming.service");
const procurement_package_validator_1 = require("../../application/services/procurement-package.validator");
const survey_answer_validator_1 = require("../../application/services/survey-answer.validator");
const package_field_reference_resolver_1 = require("../../application/services/package-field-reference.resolver");
const survey_baseline_field_validator_1 = require("../../application/services/survey-baseline-field.validator");
const manage_contractors_use_case_1 = require("../../application/use-cases/procurement/manage-contractors.use-case");
const manage_consultants_use_case_1 = require("../../application/use-cases/procurement/manage-consultants.use-case");
const manage_procurement_package_expenses_use_case_1 = require("../../application/use-cases/procurement/manage-procurement-package-expenses.use-case");
const manage_package_baseline_use_case_1 = require("../../application/use-cases/procurement/manage-package-baseline.use-case");
const list_package_baseline_forms_use_case_1 = require("../../application/use-cases/procurement/list-package-baseline-forms.use-case");
const manage_procurement_packages_use_case_1 = require("../../application/use-cases/procurement/manage-procurement-packages.use-case");
const prisma_contractor_repository_1 = require("../../infrastructure/database/repositories/prisma-contractor.repository");
const prisma_consultant_repository_1 = require("../../infrastructure/database/repositories/prisma-consultant.repository");
const prisma_office_repository_1 = require("../../infrastructure/database/repositories/prisma-office.repository");
const prisma_package_baseline_repository_1 = require("../../infrastructure/database/repositories/prisma-package-baseline.repository");
const prisma_procurement_package_expense_repository_1 = require("../../infrastructure/database/repositories/prisma-procurement-package-expense.repository");
const prisma_procurement_package_repository_1 = require("../../infrastructure/database/repositories/prisma-procurement-package.repository");
const prisma_survey_assignment_repository_1 = require("../../infrastructure/database/repositories/prisma-survey-assignment.repository");
const prisma_survey_form_repository_1 = require("../../infrastructure/database/repositories/prisma-survey-form.repository");
const prisma_tehsil_repository_1 = require("../../infrastructure/database/repositories/prisma-tehsil.repository");
const prisma_user_repository_1 = require("../../infrastructure/database/repositories/prisma-user.repository");
const roles_guard_1 = require("../auth/guards/roles.guard");
const consultants_controller_1 = require("./consultants.controller");
const contractors_controller_1 = require("./contractors.controller");
const procurement_packages_controller_1 = require("./procurement-packages.controller");
let ProcurementModule = class ProcurementModule {
};
exports.ProcurementModule = ProcurementModule;
exports.ProcurementModule = ProcurementModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            contractors_controller_1.ContractorsController,
            consultants_controller_1.ConsultantsController,
            procurement_packages_controller_1.ProcurementPackagesController,
        ],
        providers: [
            roles_guard_1.RolesGuard,
            procurement_actor_resolver_1.ProcurementActorResolver,
            procurement_package_validator_1.ProcurementPackageValidator,
            procurement_package_naming_service_1.ProcurementPackageNamingService,
            survey_answer_validator_1.SurveyAnswerValidator,
            package_field_reference_resolver_1.PackageFieldReferenceResolver,
            survey_baseline_field_validator_1.SurveyBaselineFieldValidator,
            assignment_baseline_enricher_1.AssignmentBaselineEnricher,
            package_survey_budget_service_1.PackageSurveyBudgetService,
            procurement_package_budget_enricher_1.ProcurementPackageBudgetEnricher,
            manage_contractors_use_case_1.ListContractorsUseCase,
            manage_contractors_use_case_1.CreateContractorUseCase,
            manage_contractors_use_case_1.UpdateContractorUseCase,
            manage_contractors_use_case_1.DeleteContractorUseCase,
            manage_consultants_use_case_1.ListConsultantsUseCase,
            manage_consultants_use_case_1.CreateConsultantUseCase,
            manage_consultants_use_case_1.UpdateConsultantUseCase,
            manage_consultants_use_case_1.DeleteConsultantUseCase,
            manage_procurement_packages_use_case_1.ListProcurementPackagesUseCase,
            manage_procurement_packages_use_case_1.GetProcurementPackageUseCase,
            manage_procurement_packages_use_case_1.CreateProcurementPackageUseCase,
            manage_procurement_packages_use_case_1.PreviewProcurementPackageNameUseCase,
            manage_procurement_packages_use_case_1.UpdateProcurementPackageUseCase,
            manage_procurement_packages_use_case_1.DeleteProcurementPackageUseCase,
            manage_package_baseline_use_case_1.GetPackageFormBaselineUseCase,
            manage_package_baseline_use_case_1.SavePackageFormBaselineUseCase,
            list_package_baseline_forms_use_case_1.ListPackageBaselineFormsUseCase,
            manage_procurement_package_expenses_use_case_1.ListProcurementPackageExpensesUseCase,
            manage_procurement_package_expenses_use_case_1.CreateProcurementPackageExpenseUseCase,
            manage_procurement_package_expenses_use_case_1.UpdateProcurementPackageExpenseUseCase,
            manage_procurement_package_expenses_use_case_1.DeleteProcurementPackageExpenseUseCase,
            { provide: contractor_repository_port_1.CONTRACTOR_REPOSITORY, useClass: prisma_contractor_repository_1.PrismaContractorRepository },
            { provide: consultant_repository_port_1.CONSULTANT_REPOSITORY, useClass: prisma_consultant_repository_1.PrismaConsultantRepository },
            {
                provide: package_baseline_repository_port_1.PACKAGE_BASELINE_REPOSITORY,
                useClass: prisma_package_baseline_repository_1.PrismaPackageBaselineRepository,
            },
            {
                provide: procurement_package_repository_port_1.PROCUREMENT_PACKAGE_REPOSITORY,
                useClass: prisma_procurement_package_repository_1.PrismaProcurementPackageRepository,
            },
            {
                provide: procurement_package_expense_repository_port_1.PROCUREMENT_PACKAGE_EXPENSE_REPOSITORY,
                useClass: prisma_procurement_package_expense_repository_1.PrismaProcurementPackageExpenseRepository,
            },
            { provide: tehsil_repository_port_1.TEHSIL_REPOSITORY, useClass: prisma_tehsil_repository_1.PrismaTehsilRepository },
            { provide: user_repository_port_1.USER_REPOSITORY, useClass: prisma_user_repository_1.PrismaUserRepository },
            { provide: office_repository_port_1.OFFICE_REPOSITORY, useClass: prisma_office_repository_1.PrismaOfficeRepository },
            {
                provide: survey_assignment_repository_port_1.SURVEY_ASSIGNMENT_REPOSITORY,
                useClass: prisma_survey_assignment_repository_1.PrismaSurveyAssignmentRepository,
            },
            { provide: survey_form_repository_port_1.SURVEY_FORM_REPOSITORY, useClass: prisma_survey_form_repository_1.PrismaSurveyFormRepository },
        ],
    })
], ProcurementModule);
//# sourceMappingURL=procurement.module.js.map