import {
  SurveyAssignment,
  SurveyFrequency,
} from '../../domain/entities/survey.entity';

export interface CreateSurveyAssignmentData {
  formId: string;
  formRevisionId: string;
  tehsilId: string;
  procurementPackageId: string;
  assignedById: string;
  frequency: SurveyFrequency;
  startDate: Date;
  endDate: Date;
  instructions?: string | null;
}

export abstract class SurveyAssignmentRepositoryPort {
  abstract findByForm(formId: string): Promise<SurveyAssignment[]>;
  abstract findById(id: string): Promise<SurveyAssignment | null>;
  abstract findByFormAndPackage(
    formId: string,
    procurementPackageId: string,
  ): Promise<SurveyAssignment | null>;
  abstract findByFormAndTehsil(
    formId: string,
    tehsilId: string,
  ): Promise<SurveyAssignment | null>;
  abstract findForTehsil(tehsilId: string): Promise<SurveyAssignment[]>;
  abstract findByPackage(
    procurementPackageId: string,
  ): Promise<SurveyAssignment[]>;
  abstract create(data: CreateSurveyAssignmentData): Promise<SurveyAssignment>;
  abstract delete(id: string): Promise<void>;
}

export const SURVEY_ASSIGNMENT_REPOSITORY = Symbol(
  'SURVEY_ASSIGNMENT_REPOSITORY',
);
