import {
  SurveyFieldConfig,
  SurveyFieldType,
  SurveyForm,
  SurveyStatus,
} from '../../domain/entities/survey.entity';

export interface SurveyFieldInput {
  type: SurveyFieldType;
  label: string;
  helpText?: string | null;
  required: boolean;
  order: number;
  config?: SurveyFieldConfig | null;
}

export interface SurveyFormBaselineFieldInput {
  id?: string;
  type: SurveyFieldType;
  label: string;
  helpText?: string | null;
  required?: boolean;
  writeOnce?: boolean;
  order: number;
  config?: SurveyFieldConfig | null;
}

export interface CreateSurveyFormData {
  title: string;
  description?: string | null;
  requiresPackageBaseline?: boolean;
  baselineTitle?: string | null;
  baselineDescription?: string | null;
  createdById: string;
  fields: SurveyFieldInput[];
  baselineFields?: SurveyFormBaselineFieldInput[];
}

export interface UpdateSurveyFormData {
  title?: string;
  description?: string | null;
  requiresPackageBaseline?: boolean;
  baselineTitle?: string | null;
  baselineDescription?: string | null;
  fields?: SurveyFieldInput[];
  baselineFields?: SurveyFormBaselineFieldInput[];
}

export interface ListSurveyFormsFilter {
  status?: SurveyStatus;
  formIds?: string[];
}

export abstract class SurveyFormRepositoryPort {
  abstract findAll(filter?: ListSurveyFormsFilter): Promise<SurveyForm[]>;
  abstract findById(id: string): Promise<SurveyForm | null>;
  abstract create(data: CreateSurveyFormData): Promise<SurveyForm>;
  abstract update(id: string, data: UpdateSurveyFormData): Promise<SurveyForm>;
  abstract updateStatus(
    id: string,
    status: SurveyStatus,
    publishedAt?: Date | null,
  ): Promise<SurveyForm>;
  abstract delete(id: string): Promise<void>;
}

export const SURVEY_FORM_REPOSITORY = Symbol('SURVEY_FORM_REPOSITORY');
