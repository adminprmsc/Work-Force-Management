import { SurveyResponse } from '../../domain/entities/survey.entity';

export interface SurveyAnswerInput {
  fieldId: string;
  value: unknown;
}

export interface CreateSurveyResponseData {
  assignmentId: string;
  formId: string;
  formRevisionId: string;
  respondentId: string;
  tehsilId: string;
  villageId: string;
  settlementId?: string | null;
  visitDate?: Date | null;
}

export interface ListSurveyResponsesFilter {
  tehsilId?: string;
  formId?: string;
  assignmentId?: string;
  respondentId?: string;
}

export abstract class SurveyResponseRepositoryPort {
  abstract findAll(
    filter?: ListSurveyResponsesFilter,
  ): Promise<SurveyResponse[]>;
  abstract findById(id: string): Promise<SurveyResponse | null>;
  abstract create(data: CreateSurveyResponseData): Promise<SurveyResponse>;
  /** Replace the response's answers, keeping it in DRAFT. */
  abstract saveDraftAnswers(
    id: string,
    answers: SurveyAnswerInput[],
  ): Promise<SurveyResponse>;
  /** Replace answers and mark the response SUBMITTED. */
  abstract submit(
    id: string,
    answers: SurveyAnswerInput[],
    submittedAt: Date,
  ): Promise<SurveyResponse>;
  abstract countByFormId(formId: string): Promise<number>;
}

export const SURVEY_RESPONSE_REPOSITORY = Symbol('SURVEY_RESPONSE_REPOSITORY');
