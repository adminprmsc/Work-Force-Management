import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  SurveyAssignment,
  SurveyFrequency,
  SurveyStatus,
} from '../../../domain/entities/survey.entity';
import { UserRole } from '../../../domain/entities/user.entity';
import { canManageSurveyForms } from '../../../domain/policies/survey-access.policy';
import {
  PROCUREMENT_PACKAGE_REPOSITORY,
  ProcurementPackageRepositoryPort,
} from '../../ports/procurement-package.repository.port';
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
import { SurveyScopeResolver } from '../../services/survey-scope.resolver';
import { AssignmentBaselineEnricher } from '../../services/assignment-baseline.enricher';
import type { AuthenticatedUser } from '../../types/authenticated-user.type';

export interface CreateSurveyAssignmentsCommand {
  procurementPackageIds: string[];
  frequency: SurveyFrequency;
  startDate: string;
  endDate: string;
  instructions?: string | null;
}

@Injectable()
export class ListSurveyAssignmentsUseCase {
  constructor(
    @Inject(SURVEY_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepository: SurveyAssignmentRepositoryPort,
    @Inject(SURVEY_FORM_REPOSITORY)
    private readonly formRepository: SurveyFormRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
    private readonly baselineEnricher: AssignmentBaselineEnricher,
  ) {}

  async execute(
    user: AuthenticatedUser,
    formId: string,
  ): Promise<SurveyAssignment[]> {
    const actor = await this.scopeResolver.resolve(user);
    if (!canManageSurveyForms(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const form = await this.formRepository.findById(formId);
    if (!form) {
      throw new NotFoundException('Survey form not found');
    }

    const assignments = await this.assignmentRepository.findByForm(formId);
    return this.baselineEnricher.enrich(assignments);
  }
}

@Injectable()
export class CreateSurveyAssignmentsUseCase {
  constructor(
    @Inject(SURVEY_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepository: SurveyAssignmentRepositoryPort,
    @Inject(SURVEY_FORM_REPOSITORY)
    private readonly formRepository: SurveyFormRepositoryPort,
    @Inject(SURVEY_FORM_REVISION_REPOSITORY)
    private readonly revisionRepository: SurveyFormRevisionRepositoryPort,
    @Inject(PROCUREMENT_PACKAGE_REPOSITORY)
    private readonly packageRepository: ProcurementPackageRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
    private readonly baselineEnricher: AssignmentBaselineEnricher,
  ) {}

  async execute(
    user: AuthenticatedUser,
    formId: string,
    command: CreateSurveyAssignmentsCommand,
  ): Promise<SurveyAssignment[]> {
    const actor = await this.scopeResolver.resolve(user);
    if (!canManageSurveyForms(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const form = await this.formRepository.findById(formId);
    if (!form) {
      throw new NotFoundException('Survey form not found');
    }

    if (form.status !== SurveyStatus.PUBLISHED) {
      throw new BadRequestException(
        'Only published forms can be assigned. Publish it first.',
      );
    }

    const formRevisionId =
      await this.revisionRepository.findCurrentRevisionId(formId);
    if (!formRevisionId) {
      throw new BadRequestException(
        'This form has no published revision. Publish it again before assigning.',
      );
    }

    const packageIds = Array.from(new Set(command.procurementPackageIds));
    if (packageIds.length === 0) {
      throw new BadRequestException('Select at least one procurement package');
    }

    if (!Object.values(SurveyFrequency).includes(command.frequency)) {
      throw new BadRequestException('Invalid submission frequency');
    }

    const startDate = new Date(command.startDate);
    const endDate = new Date(command.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid start or end date');
    }
    if (endDate < startDate) {
      throw new BadRequestException('End date must be on or after start date');
    }

    const instructions = command.instructions?.trim() || null;

    for (const packageId of packageIds) {
      const pkg = await this.packageRepository.findById(packageId);
      if (!pkg) {
        throw new NotFoundException(
          `Procurement package not found: ${packageId}`,
        );
      }

      const existing = await this.assignmentRepository.findByFormAndPackage(
        formId,
        packageId,
      );
      if (existing) {
        continue; // already assigned — idempotent
      }

      await this.assignmentRepository.create({
        formId,
        formRevisionId,
        tehsilId: pkg.tehsil.id,
        procurementPackageId: packageId,
        assignedById: actor.id,
        frequency: command.frequency,
        startDate,
        endDate,
        instructions,
      });
    }

    const assignments = await this.assignmentRepository.findByForm(formId);
    return this.baselineEnricher.enrich(assignments);
  }
}

@Injectable()
export class DeleteSurveyAssignmentUseCase {
  constructor(
    @Inject(SURVEY_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepository: SurveyAssignmentRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
  ) {}

  async execute(user: AuthenticatedUser, assignmentId: string): Promise<void> {
    const actor = await this.scopeResolver.resolve(user);
    if (!canManageSurveyForms(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const assignment = await this.assignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.responseCount > 0) {
      throw new BadRequestException(
        'Cannot remove an assignment that already has responses',
      );
    }

    await this.assignmentRepository.delete(assignmentId);
  }
}

@Injectable()
export class ListMyAssignmentsUseCase {
  constructor(
    @Inject(SURVEY_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepository: SurveyAssignmentRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
    private readonly baselineEnricher: AssignmentBaselineEnricher,
  ) {}

  async execute(user: AuthenticatedUser): Promise<SurveyAssignment[]> {
    const actor = await this.scopeResolver.resolve(user);
    if (actor.role !== UserRole.RA_ES_TEHSIL || !actor.tehsilId) {
      throw new ForbiddenException('Only tehsil RAs have survey assignments');
    }
    const assignments = await this.assignmentRepository.findForTehsil(
      actor.tehsilId,
    );
    return this.baselineEnricher.enrich(assignments);
  }
}
