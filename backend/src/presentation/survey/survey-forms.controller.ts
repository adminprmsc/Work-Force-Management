import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SurveyFieldConfig } from '../../domain/entities/survey.entity';
import { UserRole } from '../../domain/entities/user.entity';
import { SurveyFieldInput } from '../../application/ports/survey-form.repository.port';
import type { SurveyFormBaselineFieldInput } from '../../application/ports/survey-form.repository.port';
import {
  CreateSurveyAssignmentsUseCase,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import {
  CreateSurveyAssignmentsDto,
  CreateSurveyFormDto,
  SurveyFieldDto,
  SurveyFormBaselineFieldDto,
  UpdateSurveyFormDto,
} from './dto/survey.dto';
import {
  toSurveyAssignmentResponse,
  toSurveyFormResponse,
} from './mappers/survey.mapper';

const SURVEY_READERS = [
  UserRole.SENIOR_MANAGER_ES,
  UserRole.RA_ENVIRONMENT_HO,
  UserRole.WORLD_BANK_USER,
  UserRole.RA_ES_TEHSIL,
] as const;

const SURVEY_MANAGERS = [
  UserRole.SENIOR_MANAGER_ES,
  UserRole.RA_ENVIRONMENT_HO,
] as const;

function toFieldInputs(fields: SurveyFieldDto[]): SurveyFieldInput[] {
  return fields.map((field) => ({
    type: field.type,
    label: field.label,
    helpText: field.helpText ?? null,
    required: field.required ?? false,
    order: field.order,
    config: (field.config as SurveyFieldConfig | null | undefined) ?? null,
  }));
}

function toBaselineFieldInputs(
  fields: SurveyFormBaselineFieldDto[],
): SurveyFormBaselineFieldInput[] {
  return fields.map((field) => ({
    ...(field.id ? { id: field.id } : {}),
    type: field.type,
    label: field.label,
    helpText: field.helpText ?? null,
    required: field.required ?? false,
    writeOnce: field.writeOnce ?? false,
    order: field.order,
    config: (field.config as SurveyFieldConfig | null | undefined) ?? null,
  }));
}

@Controller('survey-forms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SurveyFormsController {
  constructor(
    private readonly listForms: ListSurveyFormsUseCase,
    private readonly getForm: GetSurveyFormUseCase,
    private readonly createForm: CreateSurveyFormUseCase,
    private readonly updateForm: UpdateSurveyFormUseCase,
    private readonly publishForm: PublishSurveyFormUseCase,
    private readonly archiveForm: ArchiveSurveyFormUseCase,
    private readonly deleteForm: DeleteSurveyFormUseCase,
    private readonly listAssignments: ListSurveyAssignmentsUseCase,
    private readonly createAssignments: CreateSurveyAssignmentsUseCase,
  ) {}

  @Get()
  @Roles(...SURVEY_READERS)
  async list(@CurrentUser() user: AuthenticatedUser) {
    const forms = await this.listForms.execute(user);
    return forms.map(toSurveyFormResponse);
  }

  @Post()
  @Roles(...SURVEY_MANAGERS)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSurveyFormDto,
  ) {
    const form = await this.createForm.execute(user, {
      title: dto.title,
      description: dto.description ?? null,
      requiresPackageBaseline: dto.requiresPackageBaseline ?? false,
      baselineTitle: dto.baselineTitle ?? null,
      baselineDescription: dto.baselineDescription ?? null,
      fields: toFieldInputs(dto.fields),
      baselineFields: dto.baselineFields
        ? toBaselineFieldInputs(dto.baselineFields)
        : [],
    });
    return toSurveyFormResponse(form);
  }

  @Get(':id/assignments')
  @Roles(...SURVEY_MANAGERS)
  async getAssignments(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const assignments = await this.listAssignments.execute(user, id);
    return assignments.map(toSurveyAssignmentResponse);
  }

  @Post(':id/assignments')
  @Roles(...SURVEY_MANAGERS)
  async assign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSurveyAssignmentsDto,
  ) {
    const assignments = await this.createAssignments.execute(user, id, {
      procurementPackageIds: dto.procurementPackageIds,
      frequency: dto.frequency,
      startDate: dto.startDate,
      endDate: dto.endDate,
      instructions: dto.instructions ?? null,
    });
    return assignments.map(toSurveyAssignmentResponse);
  }

  @Post(':id/publish')
  @Roles(...SURVEY_MANAGERS)
  async publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const form = await this.publishForm.execute(user, id);
    return toSurveyFormResponse(form);
  }

  @Post(':id/archive')
  @Roles(...SURVEY_MANAGERS)
  async archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const form = await this.archiveForm.execute(user, id);
    return toSurveyFormResponse(form);
  }

  @Get(':id')
  @Roles(...SURVEY_READERS)
  async getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const form = await this.getForm.execute(user, id);
    return toSurveyFormResponse(form);
  }

  @Patch(':id')
  @Roles(...SURVEY_MANAGERS)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSurveyFormDto,
  ) {
    const form = await this.updateForm.execute(user, id, {
      title: dto.title,
      description: dto.description,
      requiresPackageBaseline: dto.requiresPackageBaseline,
      baselineTitle: dto.baselineTitle,
      baselineDescription: dto.baselineDescription,
      fields: dto.fields ? toFieldInputs(dto.fields) : undefined,
      baselineFields: dto.baselineFields
        ? toBaselineFieldInputs(dto.baselineFields)
        : undefined,
    });
    return toSurveyFormResponse(form);
  }

  @Delete(':id')
  @Roles(...SURVEY_MANAGERS)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.deleteForm.execute(user, id);
    return { success: true };
  }
}
