import {
  SurveyResponse,
  SurveyResponseReviewAction,
  SurveyResponseStatus,
} from '../../domain/entities/survey.entity';

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
  status?: string;
  page?: number;
  limit?: number;
}

export interface FindResponseForSlotParams {
  assignmentId: string;
  villageId: string;
  settlementId: string | null;
  statuses: SurveyResponseStatus[];
  /** Inclusive lower bound on createdAt; null to ignore (one-time surveys). */
  createdFrom?: Date | null;
  /** Exclusive upper bound on createdAt; null to ignore (one-time surveys). */
  createdTo?: Date | null;
}

export interface ReviewSurveyResponseData {
  reviewerId: string;
  reviewedAt: Date;
  remarks?: string | null;
}

export interface SurveySubmissionLocation {
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
  capturedAt: Date;
}

export abstract class SurveyResponseRepositoryPort {
  abstract findAll(
    filter?: ListSurveyResponsesFilter,
  ): Promise<{ items: SurveyResponse[]; total: number }>;
  abstract findById(id: string): Promise<SurveyResponse | null>;
  /**
   * Find the most recent response occupying a village/settlement slot for an
   * assignment, restricted to the given statuses and optional createdAt window.
   * Used to stop duplicate submissions within a frequency period.
   */
  abstract findFirstForSlot(
    params: FindResponseForSlotParams,
  ): Promise<SurveyResponse | null>;
  abstract create(data: CreateSurveyResponseData): Promise<SurveyResponse>;
  /** Replace the response's answers while still editable (DRAFT or REVERTED). */
  abstract saveDraftAnswers(
    id: string,
    answers: SurveyAnswerInput[],
  ): Promise<SurveyResponse>;
  /** Replace answers and mark SUBMITTED (from DRAFT or REVERTED). */
  abstract submit(
    id: string,
    answers: SurveyAnswerInput[],
    submittedAt: Date,
    isResubmit: boolean,
    location: SurveySubmissionLocation,
  ): Promise<SurveyResponse>;
  abstract accept(
    id: string,
    data: ReviewSurveyResponseData,
  ): Promise<SurveyResponse>;
  abstract reject(
    id: string,
    data: ReviewSurveyResponseData,
  ): Promise<SurveyResponse>;
  abstract revert(
    id: string,
    data: ReviewSurveyResponseData,
  ): Promise<SurveyResponse>;
  abstract appendReviewEvent(
    responseId: string,
    action: SurveyResponseReviewAction,
    actorId: string,
    remarks?: string | null,
  ): Promise<void>;
  abstract countByFormId(formId: string): Promise<number>;
  /** Remove in-progress drafts superseded by a newly published form version. */
  abstract deleteDraftsByFormId(formId: string): Promise<number>;
  abstract deleteById(id: string): Promise<void>;
}

export const SURVEY_RESPONSE_REPOSITORY = Symbol('SURVEY_RESPONSE_REPOSITORY');
