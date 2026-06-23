import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { useAuthToken } from "@/hooks/use-auth-token"
import { queryKeys } from "@/lib/query-keys"
import {
  archiveSurveyForm,
  createSurveyAssignments,
  createSurveyForm,
  deleteSurveyAssignment,
  deleteSurveyForm,
  getSurveyForm,
  getSurveyFormAnalytics,
  listMySurveyAssignments,
  listSurveyFormAssignments,
  listSurveyForms,
  listSurveyResponses,
  publishSurveyForm,
  saveSurveyResponse,
  startSurveyResponse,
  submitSurveyResponse,
  updateSurveyForm,
} from "@/modules/api/survey-api"
import type {
  CreateSurveyAssignmentsInput,
  CreateSurveyFormInput,
  SaveSurveyResponseInput,
  StartSurveyResponseInput,
  SurveyFormAnalyticsFilter,
  SurveyResponsesFilter,
  UpdateSurveyFormInput,
} from "@/modules/api/survey-types"

export function useSurveyFormsQuery(enabled = true) {
  const token = useAuthToken()

  return useQuery({
    queryKey: queryKeys.surveyForms.list(),
    queryFn: () => listSurveyForms(token!),
    enabled: Boolean(token) && enabled,
    placeholderData: keepPreviousData,
  })
}

export function useSurveyFormQuery(id: string | null, enabled = true) {
  const token = useAuthToken()

  return useQuery({
    queryKey: queryKeys.surveyForms.detail(id ?? ""),
    queryFn: () => getSurveyForm(token!, id!),
    enabled: Boolean(token && id) && enabled,
  })
}

export function useSurveyFormAnalyticsQuery(
  formId: string | null,
  filter: SurveyFormAnalyticsFilter = {},
  enabled = true,
) {
  const token = useAuthToken()

  return useQuery({
    queryKey: queryKeys.surveyForms.analytics(formId ?? "", filter),
    queryFn: () => getSurveyFormAnalytics(token!, formId!, filter),
    enabled: Boolean(token && formId) && enabled,
    placeholderData: keepPreviousData,
  })
}

export function useCreateSurveyFormMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateSurveyFormInput) => createSurveyForm(token!, input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.surveyForms.all })
    },
  })
}

export function useUpdateSurveyFormMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: { id: string; input: UpdateSurveyFormInput }) =>
      updateSurveyForm(token!, params.id, params.input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.surveyForms.all })
    },
  })
}

export function usePublishSurveyFormMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => publishSurveyForm(token!, id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.surveyForms.all })
    },
  })
}

export function useArchiveSurveyFormMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => archiveSurveyForm(token!, id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.surveyForms.all })
    },
  })
}

export function useDeleteSurveyFormMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteSurveyForm(token!, id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.surveyForms.all })
    },
  })
}

export function useSurveyFormAssignmentsQuery(
  formId: string | null,
  enabled = true,
) {
  const token = useAuthToken()

  return useQuery({
    queryKey: queryKeys.surveyForms.assignments(formId ?? ""),
    queryFn: () => listSurveyFormAssignments(token!, formId!),
    enabled: Boolean(token && formId) && enabled,
    placeholderData: keepPreviousData,
  })
}

export function useCreateSurveyAssignmentsMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: { formId: string; input: CreateSurveyAssignmentsInput }) =>
      createSurveyAssignments(token!, params.formId, params.input),
    onSuccess: async (_data, params) => {
      await qc.invalidateQueries({
        queryKey: queryKeys.surveyForms.assignments(params.formId),
      })
      await qc.invalidateQueries({ queryKey: queryKeys.surveyForms.all })
      await qc.invalidateQueries({ queryKey: queryKeys.surveyAssignments.all })
    },
  })
}

export function useDeleteSurveyAssignmentMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: { assignmentId: string; formId: string }) =>
      deleteSurveyAssignment(token!, params.assignmentId),
    onSuccess: async (_data, params) => {
      await qc.invalidateQueries({
        queryKey: queryKeys.surveyForms.assignments(params.formId),
      })
      await qc.invalidateQueries({ queryKey: queryKeys.surveyForms.all })
      await qc.invalidateQueries({ queryKey: queryKeys.surveyAssignments.all })
    },
  })
}

export function useMySurveyAssignmentsQuery(enabled = true) {
  const token = useAuthToken()

  return useQuery({
    queryKey: queryKeys.surveyAssignments.mine(),
    queryFn: () => listMySurveyAssignments(token!),
    enabled: Boolean(token) && enabled,
    placeholderData: keepPreviousData,
  })
}

export function useSurveyResponsesQuery(
  filter: SurveyResponsesFilter = {},
  enabled = true,
) {
  const token = useAuthToken()

  return useQuery({
    queryKey: queryKeys.surveyResponses.list(filter),
    queryFn: () => listSurveyResponses(token!, filter),
    enabled: Boolean(token) && enabled,
    placeholderData: keepPreviousData,
  })
}

export function useStartSurveyResponseMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: StartSurveyResponseInput) =>
      startSurveyResponse(token!, input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.surveyResponses.all })
    },
  })
}

export function useSaveSurveyResponseMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: { id: string; input: SaveSurveyResponseInput }) =>
      saveSurveyResponse(token!, params.id, params.input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.surveyResponses.all })
      await qc.invalidateQueries({ queryKey: queryKeys.procurementPackages.all })
    },
  })
}

export function useSubmitSurveyResponseMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: { id: string; input: SaveSurveyResponseInput }) =>
      submitSurveyResponse(token!, params.id, params.input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.surveyResponses.all })
      await qc.invalidateQueries({ queryKey: queryKeys.procurementPackages.all })
    },
  })
}
