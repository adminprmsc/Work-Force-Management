import { apiRequest } from "@/lib/api-client"
import type {
  CreateSurveyAssignmentsInput,
  CreateSurveyFormInput,
  SaveSurveyResponseInput,
  StartSurveyResponseInput,
  SurveyAssignment,
  SurveyForm,
  SurveyFormAnalytics,
  SurveyFormAnalyticsFilter,
  SurveyResponse,
  SurveyResponsesFilter,
  UpdateSurveyFormInput,
} from "./survey-types"

export function listSurveyForms(token: string): Promise<SurveyForm[]> {
  return apiRequest<SurveyForm[]>("/survey-forms", { method: "GET", token })
}

export function getSurveyForm(token: string, id: string): Promise<SurveyForm> {
  return apiRequest<SurveyForm>(`/survey-forms/${id}`, { method: "GET", token })
}

export function getSurveyFormAnalytics(
  token: string,
  formId: string,
  filter: SurveyFormAnalyticsFilter = {},
): Promise<SurveyFormAnalytics> {
  const params = new URLSearchParams()
  if (filter.procurementPackageId) {
    params.set("procurementPackageId", filter.procurementPackageId)
  }
  if (filter.submittedFrom) {
    params.set("submittedFrom", filter.submittedFrom)
  }
  if (filter.submittedTo) {
    params.set("submittedTo", filter.submittedTo)
  }
  const qs = params.toString()
  return apiRequest<SurveyFormAnalytics>(
    `/survey-forms/${formId}/analytics${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      token,
    },
  )
}

export function createSurveyForm(
  token: string,
  input: CreateSurveyFormInput,
): Promise<SurveyForm> {
  return apiRequest<SurveyForm>("/survey-forms", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  })
}

export function updateSurveyForm(
  token: string,
  id: string,
  input: UpdateSurveyFormInput,
): Promise<SurveyForm> {
  return apiRequest<SurveyForm>(`/survey-forms/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(input),
  })
}

export function publishSurveyForm(token: string, id: string): Promise<SurveyForm> {
  return apiRequest<SurveyForm>(`/survey-forms/${id}/publish`, {
    method: "POST",
    token,
  })
}

export function archiveSurveyForm(token: string, id: string): Promise<SurveyForm> {
  return apiRequest<SurveyForm>(`/survey-forms/${id}/archive`, {
    method: "POST",
    token,
  })
}

export function deleteSurveyForm(
  token: string,
  id: string,
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/survey-forms/${id}`, {
    method: "DELETE",
    token,
  })
}

export function listSurveyFormAssignments(
  token: string,
  formId: string,
): Promise<SurveyAssignment[]> {
  return apiRequest<SurveyAssignment[]>(`/survey-forms/${formId}/assignments`, {
    method: "GET",
    token,
  })
}

export function createSurveyAssignments(
  token: string,
  formId: string,
  input: CreateSurveyAssignmentsInput,
): Promise<SurveyAssignment[]> {
  return apiRequest<SurveyAssignment[]>(`/survey-forms/${formId}/assignments`, {
    method: "POST",
    token,
    body: JSON.stringify(input),
  })
}

export function deleteSurveyAssignment(
  token: string,
  assignmentId: string,
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/survey-assignments/${assignmentId}`, {
    method: "DELETE",
    token,
  })
}

export function listMySurveyAssignments(token: string): Promise<SurveyAssignment[]> {
  return apiRequest<SurveyAssignment[]>("/survey-assignments/mine", {
    method: "GET",
    token,
  })
}

export function listSurveyResponses(
  token: string,
  filter: SurveyResponsesFilter = {},
): Promise<SurveyResponse[]> {
  const params = new URLSearchParams()
  if (filter.formId) params.set("formId", filter.formId)
  if (filter.tehsilId) params.set("tehsilId", filter.tehsilId)
  if (filter.assignmentId) params.set("assignmentId", filter.assignmentId)
  const qs = params.toString()
  return apiRequest<SurveyResponse[]>(`/survey-responses${qs ? `?${qs}` : ""}`, {
    method: "GET",
    token,
  })
}

export function getSurveyResponse(
  token: string,
  id: string,
): Promise<SurveyResponse> {
  return apiRequest<SurveyResponse>(`/survey-responses/${id}`, {
    method: "GET",
    token,
  })
}

export function startSurveyResponse(
  token: string,
  input: StartSurveyResponseInput,
): Promise<SurveyResponse> {
  return apiRequest<SurveyResponse>("/survey-responses", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  })
}

export function saveSurveyResponse(
  token: string,
  id: string,
  input: SaveSurveyResponseInput,
): Promise<SurveyResponse> {
  return apiRequest<SurveyResponse>(`/survey-responses/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(input),
  })
}

export function submitSurveyResponse(
  token: string,
  id: string,
  input: SaveSurveyResponseInput,
): Promise<SurveyResponse> {
  return apiRequest<SurveyResponse>(`/survey-responses/${id}/submit`, {
    method: "POST",
    token,
    body: JSON.stringify(input),
  })
}
