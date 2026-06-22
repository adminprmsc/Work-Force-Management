import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  SurveyResponse,
  SurveyResponseStatus,
} from '../../../domain/entities/survey.entity';
import {
  canFillSurveyResponses,
  canReadResponseForTehsil,
  canReadSurveys,
} from '../../../domain/policies/survey-access.policy';
import { UserRole } from '../../../domain/entities/user.entity';
import {
  PROCUREMENT_PACKAGE_REPOSITORY,
  ProcurementPackageRepositoryPort,
} from '../../ports/procurement-package.repository.port';
import {
  PACKAGE_BASELINE_REPOSITORY,
  PackageBaselineRepositoryPort,
} from '../../ports/package-baseline.repository.port';
import {
  TEHSIL_REPOSITORY,
  TehsilRepositoryPort,
} from '../../ports/tehsil.repository.port';
import {
  SURVEY_ASSIGNMENT_REPOSITORY,
  SurveyAssignmentRepositoryPort,
} from '../../ports/survey-assignment.repository.port';
import {
  SURVEY_FORM_REPOSITORY,
  SurveyFormRepositoryPort,
} from '../../ports/survey-form.repository.port';
import {
  SURVEY_FORM_REVISION_REPOSITORY,
  SurveyFormRevisionRepositoryPort,
} from '../../ports/survey-form-revision.repository.port';
import {
  SURVEY_RESPONSE_REPOSITORY,
  SurveyAnswerInput,
  ListSurveyResponsesFilter,
  SurveyResponseRepositoryPort,
} from '../../ports/survey-response.repository.port';
import { PackageFieldReferenceResolver } from '../../services/package-field-reference.resolver';
import { ProcurementPackageBudgetEnricher } from '../../services/procurement-package-budget.enricher';
import { SurveyAnswerValidator } from '../../services/survey-answer.validator';
import { SurveyScopeResolver } from '../../services/survey-scope.resolver';
import type { AuthenticatedUser } from '../../types/authenticated-user.type';
import { ProcurementPackage } from '../../../domain/entities/procurement-package.entity';

async function loadPackageForAssignment(
  assignmentRepository: SurveyAssignmentRepositoryPort,
  packageRepository: ProcurementPackageRepositoryPort,
  budgetEnricher: ProcurementPackageBudgetEnricher,
  assignmentId: string,
  options?: { excludeResponseId?: string },
): Promise<ProcurementPackage | null> {
  const assignment = await assignmentRepository.findById(assignmentId);
  if (!assignment) return null;
  const pkg = await packageRepository.findById(
    assignment.procurementPackage.id,
  );
  if (!pkg) return null;
  return budgetEnricher.enrichOne(pkg, options);
}

export interface StartSurveyResponseCommand {
  assignmentId: string;
  villageId: string;
  settlementId?: string | null;
  visitDate?: string | null;
}

export interface SaveSurveyResponseCommand {
  answers: SurveyAnswerInput[];
}

@Injectable()
export class ListSurveyResponsesUseCase {
  constructor(
    @Inject(SURVEY_RESPONSE_REPOSITORY)
    private readonly responseRepository: SurveyResponseRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
  ) {}

  async execute(
    user: AuthenticatedUser,
    query: { formId?: string; tehsilId?: string; assignmentId?: string },
  ): Promise<SurveyResponse[]> {
    const actor = await this.scopeResolver.resolve(user);
    if (!canReadSurveys(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const filter: ListSurveyResponsesFilter = {
      formId: query.formId,
      assignmentId: query.assignmentId,
    };

    if (actor.role === UserRole.RA_ES_TEHSIL) {
      if (!actor.tehsilId) return [];
      filter.tehsilId = actor.tehsilId;
    } else if (query.tehsilId) {
      filter.tehsilId = query.tehsilId;
    }

    return this.responseRepository.findAll(filter);
  }
}

@Injectable()
export class GetSurveyResponseUseCase {
  constructor(
    @Inject(SURVEY_RESPONSE_REPOSITORY)
    private readonly responseRepository: SurveyResponseRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
  ) {}

  async execute(user: AuthenticatedUser, id: string): Promise<SurveyResponse> {
    const actor = await this.scopeResolver.resolve(user);
    const response = await this.responseRepository.findById(id);
    if (!response) {
      throw new NotFoundException('Survey response not found');
    }
    if (!canReadResponseForTehsil(actor, response.tehsil.id)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return response;
  }
}

@Injectable()
export class StartSurveyResponseUseCase {
  constructor(
    @Inject(SURVEY_RESPONSE_REPOSITORY)
    private readonly responseRepository: SurveyResponseRepositoryPort,
    @Inject(SURVEY_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepository: SurveyAssignmentRepositoryPort,
    @Inject(TEHSIL_REPOSITORY)
    private readonly tehsilRepository: TehsilRepositoryPort,
    @Inject(PROCUREMENT_PACKAGE_REPOSITORY)
    private readonly packageRepository: ProcurementPackageRepositoryPort,
    @Inject(PACKAGE_BASELINE_REPOSITORY)
    private readonly baselineRepository: PackageBaselineRepositoryPort,
    @Inject(SURVEY_FORM_REVISION_REPOSITORY)
    private readonly revisionRepository: SurveyFormRevisionRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
  ) {}

  async execute(
    user: AuthenticatedUser,
    command: StartSurveyResponseCommand,
  ): Promise<SurveyResponse> {
    const actor = await this.scopeResolver.resolve(user);
    if (!canFillSurveyResponses(actor.role) || !actor.tehsilId) {
      throw new ForbiddenException(
        'Only tehsil RAs can fill out survey responses',
      );
    }

    const assignment = await this.assignmentRepository.findById(
      command.assignmentId,
    );
    if (!assignment) {
      throw new NotFoundException('Survey assignment not found');
    }
    if (assignment.tehsil.id !== actor.tehsilId) {
      throw new ForbiddenException('This form is not assigned to your tehsil');
    }

    // Enforce the submission window (end date inclusive through end of day).
    const now = new Date();
    if (now < assignment.startDate) {
      throw new BadRequestException(
        'This survey is not open for submissions yet',
      );
    }
    const windowEnd = new Date(assignment.endDate);
    windowEnd.setHours(23, 59, 59, 999);
    if (now > windowEnd) {
      throw new BadRequestException(
        'The submission window for this survey has closed',
      );
    }

    // The site visit must be to a village within the assigned procurement package.
    const pkg = await this.packageRepository.findById(
      assignment.procurementPackage.id,
    );
    if (!pkg) {
      throw new NotFoundException('Procurement package not found');
    }

    if (assignment.requiresPackageBaseline) {
      const complete = await this.baselineRepository.isBaselineComplete(
        pkg.id,
        assignment.formId,
      );
      if (!complete) {
        throw new BadRequestException(
          'Complete the package baseline for this survey before starting submissions',
        );
      }
    }

    const packageVillage = pkg.villages.find((v) => v.id === command.villageId);
    if (!packageVillage) {
      throw new BadRequestException(
        'Selected village is not part of this procurement package',
      );
    }

    let settlementId: string | null = null;
    if (command.settlementId) {
      const settlements =
        await this.tehsilRepository.findSettlementsByVillageId(
          command.villageId,
        );
      const match = settlements.find((s) => s.id === command.settlementId);
      if (!match) {
        throw new BadRequestException(
          'Selected settlement does not belong to the village',
        );
      }
      settlementId = command.settlementId;
    }

    let visitDate: Date | null = null;
    if (command.visitDate) {
      visitDate = new Date(`${command.visitDate}T00:00:00.000Z`);
      if (Number.isNaN(visitDate.getTime())) {
        throw new BadRequestException('Invalid visit date');
      }
    }

    const formRevisionId =
      (await this.revisionRepository.findCurrentRevisionId(
        assignment.formId,
      )) ?? assignment.formRevision.id;

    return this.responseRepository.create({
      assignmentId: assignment.id,
      formId: assignment.formId,
      formRevisionId,
      respondentId: actor.id,
      tehsilId: actor.tehsilId,
      villageId: command.villageId,
      settlementId,
      visitDate,
    });
  }
}

@Injectable()
export class SaveSurveyResponseUseCase {
  constructor(
    @Inject(SURVEY_RESPONSE_REPOSITORY)
    private readonly responseRepository: SurveyResponseRepositoryPort,
    @Inject(SURVEY_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepository: SurveyAssignmentRepositoryPort,
    @Inject(PROCUREMENT_PACKAGE_REPOSITORY)
    private readonly packageRepository: ProcurementPackageRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
    private readonly packageFieldResolver: PackageFieldReferenceResolver,
    private readonly budgetEnricher: ProcurementPackageBudgetEnricher,
  ) {}

  async execute(
    user: AuthenticatedUser,
    id: string,
    command: SaveSurveyResponseCommand,
  ): Promise<SurveyResponse> {
    const actor = await this.scopeResolver.resolve(user);
    const response = await this.assertEditable(actor, id);

    const fields = response.formRevision.fields;
    const validFieldIds = new Set(fields.map((f) => f.id));
    let answers = (command.answers ?? []).filter((answer) =>
      validFieldIds.has(answer.fieldId),
    );

    const pkg = await loadPackageForAssignment(
      this.assignmentRepository,
      this.packageRepository,
      this.budgetEnricher,
      response.assignmentId,
      { excludeResponseId: id },
    );
    if (pkg) {
      answers = this.packageFieldResolver.applyToAnswers(fields, answers, pkg);
    }

    return this.responseRepository.saveDraftAnswers(id, answers);
  }

  private async assertEditable(
    actor: { id: string; role: UserRole; tehsilId: string | null },
    id: string,
  ): Promise<SurveyResponse> {
    if (!canFillSurveyResponses(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    const response = await this.responseRepository.findById(id);
    if (!response) {
      throw new NotFoundException('Survey response not found');
    }
    if (response.respondent.id !== actor.id) {
      throw new ForbiddenException('You can only edit your own responses');
    }
    if (response.status !== SurveyResponseStatus.DRAFT) {
      throw new BadRequestException(
        'This response has already been submitted and is read-only',
      );
    }
    return response;
  }
}

@Injectable()
export class SubmitSurveyResponseUseCase {
  constructor(
    @Inject(SURVEY_RESPONSE_REPOSITORY)
    private readonly responseRepository: SurveyResponseRepositoryPort,
    @Inject(SURVEY_FORM_REPOSITORY)
    private readonly formRepository: SurveyFormRepositoryPort,
    @Inject(SURVEY_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepository: SurveyAssignmentRepositoryPort,
    @Inject(PROCUREMENT_PACKAGE_REPOSITORY)
    private readonly packageRepository: ProcurementPackageRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
    private readonly answerValidator: SurveyAnswerValidator,
    private readonly budgetEnricher: ProcurementPackageBudgetEnricher,
  ) {}

  async execute(
    user: AuthenticatedUser,
    id: string,
    command: SaveSurveyResponseCommand,
  ): Promise<SurveyResponse> {
    const actor = await this.scopeResolver.resolve(user);
    if (!canFillSurveyResponses(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const response = await this.responseRepository.findById(id);
    if (!response) {
      throw new NotFoundException('Survey response not found');
    }
    if (response.respondent.id !== actor.id) {
      throw new ForbiddenException('You can only submit your own responses');
    }
    if (response.status !== SurveyResponseStatus.DRAFT) {
      throw new BadRequestException('This response has already been submitted');
    }

    const form = await this.formRepository.findById(response.form.id);
    if (!form) {
      throw new NotFoundException('Survey form not found');
    }

    const fields = response.formRevision.fields;
    const pkg = await loadPackageForAssignment(
      this.assignmentRepository,
      this.packageRepository,
      this.budgetEnricher,
      response.assignmentId,
      { excludeResponseId: id },
    );
    const cleaned = this.answerValidator.validateForSubmit(
      fields,
      command.answers ?? [],
      pkg,
    );

    return this.responseRepository.submit(id, cleaned, new Date());
  }
}
