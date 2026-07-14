import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  SurveyFrequency,
  SurveyResponse,
  SurveyResponseStatus,
  EDITABLE_RESPONSE_STATUSES,
} from '../../../domain/entities/survey.entity';
import {
  canFillSurveyResponses,
  canReadResponseForTehsil,
  canReadSurveyResponse,
  canReadSurveys,
  canReviewSurveyResponses,
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
  ListSurveyResponsesFilter,
  SurveyResponseRepositoryPort,
} from '../../ports/survey-response.repository.port';
import {
  SURVEY_ATTACHMENT_REPOSITORY,
  SurveyAttachmentRepositoryPort,
} from '../../ports/survey-attachment.repository.port';
import { PackageFieldReferenceResolver } from '../../services/package-field-reference.resolver';
import { ProcurementPackageBudgetEnricher } from '../../services/procurement-package-budget.enricher';
import { linkSurveyAttachmentsToResponse } from '../../services/survey-attachment.util';
import { SurveyAnswerValidator } from '../../services/survey-answer.validator';
import { SurveyScopeResolver } from '../../services/survey-scope.resolver';
import type { AuthenticatedUser } from '../../types/authenticated-user.type';
import { ProcurementPackage } from '../../../domain/entities/procurement-package.entity';
import type {
  ReviewSurveyResponseCommand,
  SaveSurveyResponseCommand,
  SubmitSurveyResponseCommand,
} from './survey-response.commands';

export type {
  ReviewSurveyResponseCommand,
  SaveSurveyResponseCommand,
  SubmitSurveyResponseCommand,
} from './survey-response.commands';

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

async function assertDraftUsesCurrentRevision(
  response: SurveyResponse,
  revisionRepository: SurveyFormRevisionRepositoryPort,
  responseRepository: SurveyResponseRepositoryPort,
): Promise<void> {
  if (response.status !== SurveyResponseStatus.DRAFT) {
    return;
  }
  const currentRevisionId = await revisionRepository.findCurrentRevisionId(
    response.form.id,
  );
  if (currentRevisionId && response.formRevision.id !== currentRevisionId) {
    await responseRepository.deleteById(response.id);
    throw new HttpException(
      'A new form version was published. This draft is no longer valid — please start again.',
      HttpStatus.GONE,
    );
  }
}

export interface StartSurveyResponseCommand {
  assignmentId: string;
  villageId: string;
  settlementId?: string | null;
  visitDate?: string | null;
}

/**
 * Statuses that occupy a village/settlement slot for a frequency period. A new
 * visit is blocked while any of these exist; only a REJECTED response frees the
 * slot to be filled again.
 */
const SLOT_OCCUPYING_STATUSES: SurveyResponseStatus[] = [
  SurveyResponseStatus.DRAFT,
  SurveyResponseStatus.SUBMITTED,
  SurveyResponseStatus.REVERTED,
  SurveyResponseStatus.ACCEPTED,
];

/**
 * Resolve the [start, end) window for the current submission period based on
 * the assignment frequency (computed in UTC). ONE_TIME surveys have no window —
 * a single non-rejected response occupies the slot for the whole assignment.
 */
function getFrequencyPeriod(
  frequency: SurveyFrequency,
  now: Date,
): { start: Date; end: Date } | null {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();

  switch (frequency) {
    case SurveyFrequency.DAILY:
      return {
        start: new Date(Date.UTC(year, month, day)),
        end: new Date(Date.UTC(year, month, day + 1)),
      };
    case SurveyFrequency.WEEKLY: {
      // ISO week: Monday start.
      const weekday = new Date(Date.UTC(year, month, day)).getUTCDay();
      const daysFromMonday = (weekday + 6) % 7;
      return {
        start: new Date(Date.UTC(year, month, day - daysFromMonday)),
        end: new Date(Date.UTC(year, month, day - daysFromMonday + 7)),
      };
    }
    case SurveyFrequency.MONTHLY:
      return {
        start: new Date(Date.UTC(year, month, 1)),
        end: new Date(Date.UTC(year, month + 1, 1)),
      };
    case SurveyFrequency.ONE_TIME:
    default:
      return null;
  }
}

function periodLabel(frequency: SurveyFrequency): string {
  switch (frequency) {
    case SurveyFrequency.DAILY:
      return ' today';
    case SurveyFrequency.WEEKLY:
      return ' this week';
    case SurveyFrequency.MONTHLY:
      return ' this month';
    default:
      return '';
  }
}

function duplicateResponseMessage(
  status: SurveyResponseStatus,
  frequency: SurveyFrequency,
): string {
  const scope = periodLabel(frequency);
  switch (status) {
    case SurveyResponseStatus.DRAFT:
      return `You already have a draft survey for this village and settlement${scope}. Continue that draft instead of starting a new one.`;
    case SurveyResponseStatus.REVERTED:
      return `A survey for this village and settlement was sent back for changes. Please edit and resubmit that one instead of starting a new visit.`;
    case SurveyResponseStatus.SUBMITTED:
      return `You have already submitted a survey for this village and settlement${scope} and it is awaiting review. You can submit again only if it is rejected.`;
    case SurveyResponseStatus.ACCEPTED:
      return `A survey for this village and settlement${scope} has already been accepted. No further submission is needed${scope ? ' for this period' : ''}.`;
    default:
      return `A survey for this village and settlement already exists${scope}.`;
  }
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
    query: {
      formId?: string;
      tehsilId?: string;
      assignmentId?: string;
      status?: string;
    },
  ): Promise<SurveyResponse[]> {
    const actor = await this.scopeResolver.resolve(user);
    if (!canReadSurveys(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const filter: ListSurveyResponsesFilter = {
      formId: query.formId,
      assignmentId: query.assignmentId,
      status: query.status,
    };

    if (actor.role === UserRole.RA_ES_TEHSIL) {
      if (!actor.tehsilId) return [];
      filter.tehsilId = actor.tehsilId;
      filter.respondentId = actor.id;
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
    @Inject(SURVEY_FORM_REVISION_REPOSITORY)
    private readonly revisionRepository: SurveyFormRevisionRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
  ) {}

  async execute(user: AuthenticatedUser, id: string): Promise<SurveyResponse> {
    const actor = await this.scopeResolver.resolve(user);
    const response = await this.responseRepository.findById(id);
    if (!response) {
      throw new NotFoundException('Survey response not found');
    }
    if (!canReadSurveyResponse(actor, response)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    await assertDraftUsesCurrentRevision(
      response,
      this.revisionRepository,
      this.responseRepository,
    );
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

    // Prevent duplicate visits for the same village/settlement within the
    // frequency period. A rejected response frees the slot to be filled again.
    const period = getFrequencyPeriod(assignment.frequency, now);
    const existing = await this.responseRepository.findFirstForSlot({
      assignmentId: assignment.id,
      villageId: command.villageId,
      settlementId,
      statuses: SLOT_OCCUPYING_STATUSES,
      createdFrom: period?.start ?? null,
      createdTo: period?.end ?? null,
    });
    if (existing) {
      throw new ConflictException(
        duplicateResponseMessage(existing.status, assignment.frequency),
      );
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
    @Inject(SURVEY_FORM_REVISION_REPOSITORY)
    private readonly revisionRepository: SurveyFormRevisionRepositoryPort,
    @Inject(SURVEY_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepository: SurveyAssignmentRepositoryPort,
    @Inject(PROCUREMENT_PACKAGE_REPOSITORY)
    private readonly packageRepository: ProcurementPackageRepositoryPort,
    @Inject(SURVEY_ATTACHMENT_REPOSITORY)
    private readonly attachmentRepository: SurveyAttachmentRepositoryPort,
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
    await assertDraftUsesCurrentRevision(
      response,
      this.revisionRepository,
      this.responseRepository,
    );

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
      answers = this.packageFieldResolver.applyToAnswers(
        fields,
        answers,
        pkg,
        response.village.id,
      );
    }

    await linkSurveyAttachmentsToResponse(
      this.attachmentRepository,
      answers,
      id,
    );

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
    if (!EDITABLE_RESPONSE_STATUSES.includes(response.status)) {
      throw new BadRequestException(
        `This response cannot be edited in its current state (${response.status})`,
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
    @Inject(SURVEY_FORM_REVISION_REPOSITORY)
    private readonly revisionRepository: SurveyFormRevisionRepositoryPort,
    @Inject(SURVEY_FORM_REPOSITORY)
    private readonly formRepository: SurveyFormRepositoryPort,
    @Inject(SURVEY_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepository: SurveyAssignmentRepositoryPort,
    @Inject(PROCUREMENT_PACKAGE_REPOSITORY)
    private readonly packageRepository: ProcurementPackageRepositoryPort,
    @Inject(SURVEY_ATTACHMENT_REPOSITORY)
    private readonly attachmentRepository: SurveyAttachmentRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
    private readonly answerValidator: SurveyAnswerValidator,
    private readonly budgetEnricher: ProcurementPackageBudgetEnricher,
  ) {}

  async execute(
    user: AuthenticatedUser,
    id: string,
    command: SubmitSurveyResponseCommand,
  ): Promise<SurveyResponse> {
    const actor = await this.scopeResolver.resolve(user);
    if (!canFillSurveyResponses(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (
      command.latitude == null ||
      command.longitude == null ||
      Number.isNaN(command.latitude) ||
      Number.isNaN(command.longitude)
    ) {
      throw new BadRequestException(
        'Live GPS location is required when submitting a survey response',
      );
    }
    if (command.latitude < -90 || command.latitude > 90) {
      throw new BadRequestException('Latitude must be between -90 and 90');
    }
    if (command.longitude < -180 || command.longitude > 180) {
      throw new BadRequestException('Longitude must be between -180 and 180');
    }

    const response = await this.responseRepository.findById(id);
    if (!response) {
      throw new NotFoundException('Survey response not found');
    }
    if (response.respondent.id !== actor.id) {
      throw new ForbiddenException('You can only submit your own responses');
    }
    if (!EDITABLE_RESPONSE_STATUSES.includes(response.status)) {
      throw new BadRequestException(
        `This response cannot be submitted in its current state (${response.status})`,
      );
    }

    await assertDraftUsesCurrentRevision(
      response,
      this.revisionRepository,
      this.responseRepository,
    );

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
      response.village.id,
    );

    await linkSurveyAttachmentsToResponse(
      this.attachmentRepository,
      cleaned,
      id,
    );

    const isResubmit = response.status === SurveyResponseStatus.REVERTED;
    const submittedAt = new Date();
    return this.responseRepository.submit(
      id,
      cleaned,
      submittedAt,
      isResubmit,
      {
        latitude: command.latitude,
        longitude: command.longitude,
        accuracyMeters: command.locationAccuracyMeters ?? null,
        capturedAt: submittedAt,
      },
    );
  }
}

async function assertReviewable(
  actor: { id: string; role: UserRole; tehsilId: string | null },
  responseRepository: SurveyResponseRepositoryPort,
  id: string,
): Promise<SurveyResponse> {
  if (!canReviewSurveyResponses(actor.role)) {
    throw new ForbiddenException(
      'Insufficient permissions to review responses',
    );
  }
  const response = await responseRepository.findById(id);
  if (!response) {
    throw new NotFoundException('Survey response not found');
  }
  if (!canReadResponseForTehsil(actor, response.tehsil.id)) {
    throw new ForbiddenException('Insufficient permissions');
  }
  if (response.status !== SurveyResponseStatus.SUBMITTED) {
    throw new BadRequestException(
      `Only submitted responses can be reviewed (current: ${response.status})`,
    );
  }
  return response;
}

@Injectable()
export class AcceptSurveyResponseUseCase {
  constructor(
    @Inject(SURVEY_RESPONSE_REPOSITORY)
    private readonly responseRepository: SurveyResponseRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
  ) {}

  async execute(
    user: AuthenticatedUser,
    id: string,
    command: ReviewSurveyResponseCommand,
  ): Promise<SurveyResponse> {
    const actor = await this.scopeResolver.resolve(user);
    await assertReviewable(actor, this.responseRepository, id);
    return this.responseRepository.accept(id, {
      reviewerId: actor.id,
      reviewedAt: new Date(),
      remarks: command.remarks ?? null,
    });
  }
}

@Injectable()
export class RejectSurveyResponseUseCase {
  constructor(
    @Inject(SURVEY_RESPONSE_REPOSITORY)
    private readonly responseRepository: SurveyResponseRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
  ) {}

  async execute(
    user: AuthenticatedUser,
    id: string,
    command: ReviewSurveyResponseCommand,
  ): Promise<SurveyResponse> {
    const actor = await this.scopeResolver.resolve(user);
    await assertReviewable(actor, this.responseRepository, id);
    const remarks = command.remarks?.trim();
    if (!remarks) {
      throw new BadRequestException(
        'Remarks are required when rejecting a response',
      );
    }
    return this.responseRepository.reject(id, {
      reviewerId: actor.id,
      reviewedAt: new Date(),
      remarks,
    });
  }
}

@Injectable()
export class RevertSurveyResponseUseCase {
  constructor(
    @Inject(SURVEY_RESPONSE_REPOSITORY)
    private readonly responseRepository: SurveyResponseRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
  ) {}

  async execute(
    user: AuthenticatedUser,
    id: string,
    command: ReviewSurveyResponseCommand,
  ): Promise<SurveyResponse> {
    const actor = await this.scopeResolver.resolve(user);
    await assertReviewable(actor, this.responseRepository, id);
    const remarks = command.remarks?.trim();
    if (!remarks) {
      throw new BadRequestException(
        'Remarks are required when reverting a response to the author',
      );
    }
    return this.responseRepository.revert(id, {
      reviewerId: actor.id,
      reviewedAt: new Date(),
      remarks,
    });
  }
}
