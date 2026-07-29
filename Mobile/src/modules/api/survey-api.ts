import { apiRequest } from '@/lib/api-client';
import type {
  SaveSurveyResponseInput,
  StartSurveyResponseInput,
  SubmitSurveyResponseInput,
  SurveyAssignment,
  SurveyResponse,
  SurveyResponsesFilter,
  SurveyResponsesListResponse,
} from './types';

export function listMySurveyAssignments(token: string): Promise<SurveyAssignment[]> {
  return apiRequest<SurveyAssignment[]>('/survey-assignments/mine', {
    method: 'GET',
    token,
  });
}

export function listSurveyResponses(
  token: string,
  filter: SurveyResponsesFilter = {},
): Promise<SurveyResponsesListResponse> {
  const params = new URLSearchParams();
  if (filter.formId) params.set('formId', filter.formId);
  if (filter.tehsilId) params.set('tehsilId', filter.tehsilId);
  if (filter.assignmentId) params.set('assignmentId', filter.assignmentId);
  if (filter.status) params.set('status', filter.status);
  if (filter.page) params.set('page', String(filter.page));
  if (filter.limit) params.set('limit', String(filter.limit));
  // Default to the largest page so mobile screens still see a full working set.
  if (!filter.page && !filter.limit) {
    params.set('page', '1');
    params.set('limit', '100');
  }
  const qs = params.toString();
  return apiRequest<SurveyResponsesListResponse>(
    `/survey-responses${qs ? `?${qs}` : ''}`,
    {
      method: 'GET',
      token,
    },
  );
}

export function getSurveyResponse(token: string, id: string): Promise<SurveyResponse> {
  return apiRequest<SurveyResponse>(`/survey-responses/${id}`, {
    method: 'GET',
    token,
  });
}

export function startSurveyResponse(
  token: string,
  input: StartSurveyResponseInput,
): Promise<SurveyResponse> {
  return apiRequest<SurveyResponse>('/survey-responses', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export function saveSurveyResponse(
  token: string,
  id: string,
  input: SaveSurveyResponseInput,
): Promise<SurveyResponse> {
  return apiRequest<SurveyResponse>(`/survey-responses/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(input),
  });
}

export function submitSurveyResponse(
  token: string,
  id: string,
  input: SubmitSurveyResponseInput,
): Promise<SurveyResponse> {
  return apiRequest<SurveyResponse>(`/survey-responses/${id}/submit`, {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}
