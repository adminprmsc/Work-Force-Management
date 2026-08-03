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

export interface UpdateSurveyAssignmentData {
  startDate?: Date;
  endDate?: Date;
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
  abstract update(
    id: string,
    data: UpdateSurveyAssignmentData,
  ): Promise<SurveyAssignment>;
  /**
   * Repoint every assignment of a form to a new form revision. Used when a form
   * is re-published so tehsil RAs always fill the latest version.
   */
  abstract updateFormRevisionForForm(
    formId: string,
    formRevisionId: string,
  ): Promise<number>;
  abstract delete(id: string): Promise<void>;
}

export const SURVEY_ASSIGNMENT_REPOSITORY = Symbol(
  'SURVEY_ASSIGNMENT_REPOSITORY',
);
