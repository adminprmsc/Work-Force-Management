import { keepPreviousData, useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query"

import { useAuthToken } from "@/hooks/use-auth-token"
import { queryKeys } from "@/lib/query-keys"
import {
  createConsultant,
  createContractor,
  createProcurementPackage,
  createProcurementPackageExpense,
  deleteConsultant,
  deleteContractor,
  deleteProcurementPackage,
  deleteProcurementPackageExpense,
  getPackageFormBaseline,
  getProcurementPackage,
  listConsultants,
  listContractors,
  listPackageBaselineForms,
  listProcurementPackages,
  previewProcurementPackageName,
  savePackageFormBaseline,
  updateConsultant,
  updateContractor,
  updateProcurementPackage,
} from "@/modules/api/procurement-api"
import type {
  CreateProcurementPackageExpenseInput,
  CreateProcurementPackageInput,
  ProcurementPackageNamePreview,
  SavePackageBaselineInput,
  UpdateProcurementPackageInput,
} from "@/modules/api/types"

export function useContractorsQuery(enabled = true) {
  const token = useAuthToken()

  return useQuery({
    queryKey: queryKeys.contractors.list(),
    queryFn: () => listContractors(token!),
    enabled: Boolean(token) && enabled,
    placeholderData: keepPreviousData,
  })
}

export function useCreateContractorMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => createContractor(token!, name),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.contractors.all })
    },
  })
}

export function useUpdateContractorMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: { id: string; name: string }) =>
      updateContractor(token!, params.id, params.name),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.contractors.all })
      await qc.invalidateQueries({ queryKey: queryKeys.procurementPackages.all })
    },
  })
}

export function useDeleteContractorMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteContractor(token!, id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.contractors.all })
    },
  })
}

export function useConsultantsQuery(enabled = true) {
  const token = useAuthToken()

  return useQuery({
    queryKey: queryKeys.consultants.list(),
    queryFn: () => listConsultants(token!),
    enabled: Boolean(token) && enabled,
    placeholderData: keepPreviousData,
  })
}

export function useCreateConsultantMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => createConsultant(token!, name),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.consultants.all })
    },
  })
}

export function useUpdateConsultantMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: { id: string; name: string }) =>
      updateConsultant(token!, params.id, params.name),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.consultants.all })
      await qc.invalidateQueries({ queryKey: queryKeys.procurementPackages.all })
    },
  })
}

export function useDeleteConsultantMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteConsultant(token!, id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.consultants.all })
    },
  })
}

export function useProcurementPackagesQuery(enabled = true) {
  const token = useAuthToken()

  return useQuery({
    queryKey: queryKeys.procurementPackages.list(),
    queryFn: () => listProcurementPackages(token!),
    enabled: Boolean(token) && enabled,
    placeholderData: keepPreviousData,
  })
}

export function useProcurementPackageQuery(
  packageId: string | null | undefined,
  enabled = true,
) {
  const token = useAuthToken()

  return useQuery({
    queryKey: queryKeys.procurementPackages.detail(packageId ?? ""),
    queryFn: () => getProcurementPackage(token!, packageId!),
    enabled: Boolean(token && packageId) && enabled,
    placeholderData: keepPreviousData,
  })
}

export function useProcurementPackageNamePreviewQuery(
  tehsilId: string | null,
  enabled = true,
): UseQueryResult<ProcurementPackageNamePreview> {
  const token = useAuthToken()

  return useQuery({
    queryKey: queryKeys.procurementPackages.namePreview(tehsilId ?? ""),
    queryFn: () => previewProcurementPackageName(token!, tehsilId!),
    enabled: Boolean(token && tehsilId) && enabled,
    placeholderData: keepPreviousData,
  })
}

export function useCreateProcurementPackageMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateProcurementPackageInput) =>
      createProcurementPackage(token!, input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.procurementPackages.all })
    },
  })
}

export function useUpdateProcurementPackageMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: { id: string; input: UpdateProcurementPackageInput }) =>
      updateProcurementPackage(token!, params.id, params.input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.procurementPackages.all })
    },
  })
}

export function useDeleteProcurementPackageMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteProcurementPackage(token!, id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.procurementPackages.all })
    },
  })
}

export function useCreateProcurementPackageExpenseMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      packageId: string
      input: CreateProcurementPackageExpenseInput
    }) => createProcurementPackageExpense(token!, params.packageId, params.input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.procurementPackages.all })
    },
  })
}

export function useDeleteProcurementPackageExpenseMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: { packageId: string; expenseId: string }) =>
      deleteProcurementPackageExpense(token!, params.packageId, params.expenseId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.procurementPackages.all })
    },
  })
}

export function usePackageBaselineFormsQuery(
  packageId: string | null,
  enabled = true,
) {
  const token = useAuthToken()

  return useQuery({
    queryKey: queryKeys.procurementPackages.baselineForms(packageId ?? ""),
    queryFn: () => listPackageBaselineForms(token!, packageId!),
    enabled: Boolean(token && packageId) && enabled,
    placeholderData: keepPreviousData,
  })
}

export function usePackageFormBaselineQuery(
  packageId: string | null,
  formId: string | null,
  enabled = true,
) {
  const token = useAuthToken()

  return useQuery({
    queryKey: queryKeys.procurementPackages.baseline(packageId ?? "", formId ?? ""),
    queryFn: () => getPackageFormBaseline(token!, packageId!, formId!),
    enabled: Boolean(token && packageId && formId) && enabled,
    placeholderData: keepPreviousData,
  })
}

export function useSavePackageFormBaselineMutation() {
  const token = useAuthToken()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      packageId: string
      formId: string
      input: SavePackageBaselineInput
    }) =>
      savePackageFormBaseline(
        token!,
        params.packageId,
        params.formId,
        params.input,
      ),
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({
        queryKey: queryKeys.procurementPackages.baseline(
          variables.packageId,
          variables.formId,
        ),
      })
      await qc.invalidateQueries({
        queryKey: queryKeys.procurementPackages.baselineForms(variables.packageId),
      })
      await qc.invalidateQueries({ queryKey: queryKeys.surveyAssignments.all })
    },
  })
}
