import { apiRequest } from '@/lib/api-client';
import type {
  SaveSurveyResponseInput,
  StartSurveyResponseInput,
  SubmitSurveyResponseInput,
  SurveyAssignment,
  SurveyResponse,
  SurveyResponsesFilter,
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
): Promise<SurveyResponse[]> {
  const params = new URLSearchParams();
  if (filter.formId) params.set('formId', filter.formId);
  if (filter.tehsilId) params.set('tehsilId', filter.tehsilId);
  if (filter.assignmentId) params.set('assignmentId', filter.assignmentId);
  if (filter.status) params.set('status', filter.status);
  const qs = params.toString();
  return apiRequest<SurveyResponse[]>(`/survey-responses${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    token,
  });
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
