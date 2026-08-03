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
import { AuditService } from '../../services/audit.service';
import { AuditAction } from '../../../domain/entities/audit-log.entity';
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
    private readonly auditService: AuditService,
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

      const created = await this.assignmentRepository.create({
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

      await this.auditService.logPackageAction(
        user.id,
        AuditAction.SURVEY_ASSIGNMENT_CREATED,
        packageId,
        {
          packageName: pkg.name,
          assignmentId: created.id,
          formId: form.id,
          formTitle: form.title,
          frequency: command.frequency,
          startDate: command.startDate,
          endDate: command.endDate,
        },
      );
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
    private readonly auditService: AuditService,
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

    await this.auditService.logPackageAction(
      user.id,
      AuditAction.SURVEY_ASSIGNMENT_DELETED,
      assignment.procurementPackage.id,
      {
        packageName: assignment.procurementPackage.name,
        assignmentId: assignment.id,
        formId: assignment.formId,
        formTitle: assignment.formTitle,
      },
    );

    await this.assignmentRepository.delete(assignmentId);
  }
}

export interface UpdateSurveyAssignmentCommand {
  startDate?: string;
  endDate?: string;
  instructions?: string | null;
}

@Injectable()
export class UpdateSurveyAssignmentUseCase {
  constructor(
    @Inject(SURVEY_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepository: SurveyAssignmentRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
    private readonly baselineEnricher: AssignmentBaselineEnricher,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    user: AuthenticatedUser,
    assignmentId: string,
    command: UpdateSurveyAssignmentCommand,
  ): Promise<SurveyAssignment> {
    const actor = await this.scopeResolver.resolve(user);
    if (!canManageSurveyForms(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const assignment = await this.assignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    const hasStart = command.startDate !== undefined;
    const hasEnd = command.endDate !== undefined;
    const hasInstructions = command.instructions !== undefined;
    if (!hasStart && !hasEnd && !hasInstructions) {
      throw new BadRequestException(
        'Provide a start date, end date, and/or instructions to update',
      );
    }

    let nextStart = assignment.startDate;
    let nextEnd = assignment.endDate;

    if (hasStart) {
      nextStart = new Date(command.startDate!);
      if (Number.isNaN(nextStart.getTime())) {
        throw new BadRequestException('Invalid start date');
      }
    }

    if (hasEnd) {
      nextEnd = new Date(command.endDate!);
      if (Number.isNaN(nextEnd.getTime())) {
        throw new BadRequestException('Invalid end date');
      }
    }

    if (nextEnd < nextStart) {
      throw new BadRequestException('End date must be on or after start date');
    }

    const nextInstructions = hasInstructions
      ? command.instructions?.trim() || null
      : undefined;

    const updated = await this.assignmentRepository.update(assignmentId, {
      ...(hasStart ? { startDate: nextStart } : {}),
      ...(hasEnd ? { endDate: nextEnd } : {}),
      ...(hasInstructions ? { instructions: nextInstructions } : {}),
    });

    await this.auditService.logPackageAction(
      user.id,
      AuditAction.SURVEY_ASSIGNMENT_UPDATED,
      assignment.procurementPackage.id,
      {
        packageName: assignment.procurementPackage.name,
        assignmentId: assignment.id,
        formId: assignment.formId,
        formTitle: assignment.formTitle,
        before: {
          startDate: assignment.startDate.toISOString(),
          endDate: assignment.endDate.toISOString(),
          instructions: assignment.instructions,
        },
        after: {
          startDate: updated.startDate.toISOString(),
          endDate: updated.endDate.toISOString(),
          instructions: updated.instructions,
        },
        changes: {
          startDate: hasStart,
          endDate: hasEnd,
          instructions: hasInstructions,
        },
      },
    );

    const [enriched] = await this.baselineEnricher.enrich([updated]);
    return enriched ?? updated;
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
