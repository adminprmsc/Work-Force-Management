import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  SurveyField,
  SurveyForm,
  SurveyFormBaselineField,
  SurveyStatus,
} from '../../../domain/entities/survey.entity';
import { UserRole } from '../../../domain/entities/user.entity';
import {
  canManageSurveyForms,
  canReadSurveys,
} from '../../../domain/policies/survey-access.policy';
import {
  SURVEY_ASSIGNMENT_REPOSITORY,
  SurveyAssignmentRepositoryPort,
} from '../../ports/survey-assignment.repository.port';
import {
  SURVEY_FORM_REPOSITORY,
  SurveyFieldInput,
  SurveyFormBaselineFieldInput,
  SurveyFormRepositoryPort,
} from '../../ports/survey-form.repository.port';
import {
  SURVEY_FORM_REVISION_REPOSITORY,
  SurveyFormRevisionRepositoryPort,
} from '../../ports/survey-form-revision.repository.port';
import { SurveyBaselineFieldValidator } from '../../services/survey-baseline-field.validator';
import { SurveyFormValidator } from '../../services/survey-form.validator';
import { SurveyScopeResolver } from '../../services/survey-scope.resolver';
import type { AuthenticatedUser } from '../../types/authenticated-user.type';

export interface CreateSurveyFormCommand {
  title: string;
  description?: string | null;
  requiresPackageBaseline?: boolean;
  baselineTitle?: string | null;
  baselineDescription?: string | null;
  fields: SurveyFieldInput[];
  baselineFields?: SurveyFormBaselineFieldInput[];
}

export interface UpdateSurveyFormCommand {
  title?: string;
  description?: string | null;
  requiresPackageBaseline?: boolean;
  baselineTitle?: string | null;
  baselineDescription?: string | null;
  fields?: SurveyFieldInput[];
  baselineFields?: SurveyFormBaselineFieldInput[];
}

function fieldsToInput(fields: SurveyField[]): SurveyFieldInput[] {
  return fields.map((field) => ({
    type: field.type,
    label: field.label,
    helpText: field.helpText,
    required: field.required,
    order: field.order,
    config: field.config,
  }));
}

function baselineFieldsToInput(
  fields: SurveyFormBaselineField[],
): SurveyFormBaselineFieldInput[] {
  return fields.map((field) => ({
    type: field.type,
    label: field.label,
    helpText: field.helpText,
    required: field.required,
    writeOnce: field.writeOnce,
    order: field.order,
    config: field.config,
  }));
}

@Injectable()
export class ListSurveyFormsUseCase {
  constructor(
    @Inject(SURVEY_FORM_REPOSITORY)
    private readonly formRepository: SurveyFormRepositoryPort,
    @Inject(SURVEY_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepository: SurveyAssignmentRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
  ) {}

  async execute(user: AuthenticatedUser): Promise<SurveyForm[]> {
    const actor = await this.scopeResolver.resolve(user);
    if (!canReadSurveys(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (canManageSurveyForms(actor.role)) {
      return this.formRepository.findAll();
    }

    if (actor.role === UserRole.RA_ES_TEHSIL) {
      if (!actor.tehsilId) return [];
      const assignments = await this.assignmentRepository.findForTehsil(
        actor.tehsilId,
      );
      const formIds = assignments.map((assignment) => assignment.formId);
      if (formIds.length === 0) return [];
      return this.formRepository.findAll({
        status: SurveyStatus.PUBLISHED,
        formIds,
      });
    }

    // World Bank: published forms only.
    return this.formRepository.findAll({ status: SurveyStatus.PUBLISHED });
  }
}

@Injectable()
export class GetSurveyFormUseCase {
  constructor(
    @Inject(SURVEY_FORM_REPOSITORY)
    private readonly formRepository: SurveyFormRepositoryPort,
    @Inject(SURVEY_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepository: SurveyAssignmentRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
  ) {}

  async execute(user: AuthenticatedUser, id: string): Promise<SurveyForm> {
    const actor = await this.scopeResolver.resolve(user);
    if (!canReadSurveys(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const form = await this.formRepository.findById(id);
    if (!form) {
      throw new NotFoundException('Survey form not found');
    }

    if (canManageSurveyForms(actor.role)) {
      return form;
    }

    if (form.status !== SurveyStatus.PUBLISHED) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (actor.role === UserRole.RA_ES_TEHSIL) {
      if (!actor.tehsilId) {
        throw new ForbiddenException('Insufficient permissions');
      }
      const assignment = await this.assignmentRepository.findByFormAndTehsil(
        id,
        actor.tehsilId,
      );
      if (!assignment) {
        throw new ForbiddenException(
          'This form is not assigned to your tehsil',
        );
      }
    }

    return form;
  }
}

@Injectable()
export class CreateSurveyFormUseCase {
  constructor(
    @Inject(SURVEY_FORM_REPOSITORY)
    private readonly formRepository: SurveyFormRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
    private readonly formValidator: SurveyFormValidator,
    private readonly baselineValidator: SurveyBaselineFieldValidator,
  ) {}

  async execute(
    user: AuthenticatedUser,
    command: CreateSurveyFormCommand,
  ): Promise<SurveyForm> {
    const actor = await this.scopeResolver.resolve(user);
    if (!canManageSurveyForms(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const title = (command.title ?? '').trim();
    if (!title) {
      throw new BadRequestException('Form title is required');
    }

    const requiresBaseline = command.requiresPackageBaseline ?? false;
    const fields = this.formValidator.validateAndNormalize(
      command.fields ?? [],
      { forPublish: false },
    );
    const baselineFields = this.baselineValidator.validateAndNormalize(
      command.baselineFields ?? [],
      { forPublish: false, requiresBaseline },
    );

    return this.formRepository.create({
      title,
      description: command.description?.trim() || null,
      requiresPackageBaseline: requiresBaseline,
      baselineTitle: command.baselineTitle?.trim() || null,
      baselineDescription: command.baselineDescription?.trim() || null,
      createdById: actor.id,
      fields,
      baselineFields,
    });
  }
}

@Injectable()
export class UpdateSurveyFormUseCase {
  constructor(
    @Inject(SURVEY_FORM_REPOSITORY)
    private readonly formRepository: SurveyFormRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
    private readonly formValidator: SurveyFormValidator,
    private readonly baselineValidator: SurveyBaselineFieldValidator,
  ) {}

  async execute(
    user: AuthenticatedUser,
    id: string,
    command: UpdateSurveyFormCommand,
  ): Promise<SurveyForm> {
    const actor = await this.scopeResolver.resolve(user);
    if (!canManageSurveyForms(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const existing = await this.formRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Survey form not found');
    }

    if (existing.status === SurveyStatus.PUBLISHED) {
      if (command.fields !== undefined) {
        throw new ConflictException(
          'Published forms cannot change fields. Archive the form, edit it, then republish.',
        );
      }
      if (
        command.requiresPackageBaseline !== undefined ||
        command.baselineFields !== undefined ||
        command.baselineTitle !== undefined ||
        command.baselineDescription !== undefined
      ) {
        throw new ConflictException(
          'Published forms cannot change baseline requirements. Archive the form, edit it, then republish.',
        );
      }
    } else if (
      existing.status !== SurveyStatus.DRAFT &&
      existing.status !== SurveyStatus.ARCHIVED
    ) {
      throw new ConflictException('This form cannot be edited');
    }

    if (
      command.title === undefined &&
      command.description === undefined &&
      command.fields === undefined &&
      command.requiresPackageBaseline === undefined &&
      command.baselineTitle === undefined &&
      command.baselineDescription === undefined &&
      command.baselineFields === undefined
    ) {
      throw new BadRequestException('Provide fields to update');
    }

    const requiresBaseline =
      command.requiresPackageBaseline ?? existing.requiresPackageBaseline;

    let title: string | undefined;
    if (command.title !== undefined) {
      title = command.title.trim();
      if (!title) {
        throw new BadRequestException('Form title is required');
      }
    }

    const fields =
      command.fields !== undefined
        ? this.formValidator.validateAndNormalize(command.fields, {
            forPublish: false,
          })
        : undefined;

    const baselineFields =
      command.baselineFields !== undefined
        ? this.baselineValidator.validateAndNormalize(command.baselineFields, {
            forPublish: false,
            requiresBaseline,
          })
        : undefined;

    return this.formRepository.update(id, {
      title,
      description:
        command.description === undefined
          ? undefined
          : command.description?.trim() || null,
      requiresPackageBaseline: command.requiresPackageBaseline,
      baselineTitle:
        command.baselineTitle === undefined
          ? undefined
          : command.baselineTitle?.trim() || null,
      baselineDescription:
        command.baselineDescription === undefined
          ? undefined
          : command.baselineDescription?.trim() || null,
      fields,
      baselineFields,
    });
  }
}

@Injectable()
export class PublishSurveyFormUseCase {
  constructor(
    @Inject(SURVEY_FORM_REPOSITORY)
    private readonly formRepository: SurveyFormRepositoryPort,
    @Inject(SURVEY_FORM_REVISION_REPOSITORY)
    private readonly revisionRepository: SurveyFormRevisionRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
    private readonly formValidator: SurveyFormValidator,
    private readonly baselineValidator: SurveyBaselineFieldValidator,
  ) {}

  async execute(user: AuthenticatedUser, id: string): Promise<SurveyForm> {
    const actor = await this.scopeResolver.resolve(user);
    if (!canManageSurveyForms(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const existing = await this.formRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Survey form not found');
    }

    if (
      existing.status !== SurveyStatus.DRAFT &&
      existing.status !== SurveyStatus.ARCHIVED
    ) {
      throw new ConflictException(
        'Only draft or archived forms can be published',
      );
    }

    // Enforce the stricter publish-time rules on the stored fields.
    this.formValidator.validateAndNormalize(fieldsToInput(existing.fields), {
      forPublish: true,
    });
    this.baselineValidator.validateAndNormalize(
      baselineFieldsToInput(existing.baselineFields),
      { forPublish: true, requiresBaseline: existing.requiresPackageBaseline },
    );

    const publishedAt = new Date();
    await this.revisionRepository.createFromForm(existing, publishedAt);

    return this.formRepository.updateStatus(
      id,
      SurveyStatus.PUBLISHED,
      publishedAt,
    );
  }
}

@Injectable()
export class ArchiveSurveyFormUseCase {
  constructor(
    @Inject(SURVEY_FORM_REPOSITORY)
    private readonly formRepository: SurveyFormRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
  ) {}

  async execute(user: AuthenticatedUser, id: string): Promise<SurveyForm> {
    const actor = await this.scopeResolver.resolve(user);
    if (!canManageSurveyForms(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const existing = await this.formRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Survey form not found');
    }

    if (existing.status === SurveyStatus.ARCHIVED) {
      throw new ConflictException('Form is already archived');
    }

    return this.formRepository.updateStatus(id, SurveyStatus.ARCHIVED);
  }
}

@Injectable()
export class DeleteSurveyFormUseCase {
  constructor(
    @Inject(SURVEY_FORM_REPOSITORY)
    private readonly formRepository: SurveyFormRepositoryPort,
    private readonly scopeResolver: SurveyScopeResolver,
  ) {}

  async execute(user: AuthenticatedUser, id: string): Promise<void> {
    const actor = await this.scopeResolver.resolve(user);
    if (!canManageSurveyForms(actor.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const existing = await this.formRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Survey form not found');
    }

    if (existing.responseCount > 0) {
      throw new ConflictException(
        'Cannot delete a form that already has responses. Archive it instead.',
      );
    }

    if (existing.status === SurveyStatus.PUBLISHED) {
      throw new ConflictException(
        'Unpublish or archive the form before deleting it.',
      );
    }

    await this.formRepository.delete(id);
  }
}
