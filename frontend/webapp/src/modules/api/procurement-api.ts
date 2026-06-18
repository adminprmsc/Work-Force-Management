import { apiRequest } from "@/lib/api-client"
import type {
  Consultant,
  Contractor,
  CreateProcurementPackageExpenseInput,
  CreateProcurementPackageInput,
  ProcurementPackage,
  ProcurementPackageExpense,
  ProcurementPackageNamePreview,
  UpdateProcurementPackageExpenseInput,
  UpdateProcurementPackageInput,
} from "./types"

export function listContractors(token: string): Promise<Contractor[]> {
  return apiRequest<Contractor[]>("/contractors", { method: "GET", token })
}

export function createContractor(token: string, name: string): Promise<Contractor> {
  return apiRequest<Contractor>("/contractors", {
    method: "POST",
    token,
    body: JSON.stringify({ name }),
  })
}

export function updateContractor(
  token: string,
  id: string,
  name: string,
): Promise<Contractor> {
  return apiRequest<Contractor>(`/contractors/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ name }),
  })
}

export function deleteContractor(
  token: string,
  id: string,
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/contractors/${id}`, {
    method: "DELETE",
    token,
  })
}

export function listConsultants(token: string): Promise<Consultant[]> {
  return apiRequest<Consultant[]>("/consultants", { method: "GET", token })
}

export function createConsultant(token: string, name: string): Promise<Consultant> {
  return apiRequest<Consultant>("/consultants", {
    method: "POST",
    token,
    body: JSON.stringify({ name }),
  })
}

export function updateConsultant(
  token: string,
  id: string,
  name: string,
): Promise<Consultant> {
  return apiRequest<Consultant>(`/consultants/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ name }),
  })
}

export function deleteConsultant(
  token: string,
  id: string,
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/consultants/${id}`, {
    method: "DELETE",
    token,
  })
}

export function previewProcurementPackageName(
  token: string,
  tehsilId: string,
): Promise<ProcurementPackageNamePreview> {
  return apiRequest<ProcurementPackageNamePreview>(
    `/procurement-packages/naming-preview?tehsilId=${encodeURIComponent(tehsilId)}`,
    { method: "GET", token },
  )
}

export function listProcurementPackages(token: string): Promise<ProcurementPackage[]> {
  return apiRequest<ProcurementPackage[]>("/procurement-packages", {
    method: "GET",
    token,
  })
}

export function getProcurementPackage(
  token: string,
  id: string,
): Promise<ProcurementPackage> {
  return apiRequest<ProcurementPackage>(`/procurement-packages/${id}`, {
    method: "GET",
    token,
  })
}

export function createProcurementPackage(
  token: string,
  input: CreateProcurementPackageInput,
): Promise<ProcurementPackage> {
  return apiRequest<ProcurementPackage>("/procurement-packages", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  })
}

export function updateProcurementPackage(
  token: string,
  id: string,
  input: UpdateProcurementPackageInput,
): Promise<ProcurementPackage> {
  return apiRequest<ProcurementPackage>(`/procurement-packages/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(input),
  })
}

export function deleteProcurementPackage(
  token: string,
  id: string,
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/procurement-packages/${id}`, {
    method: "DELETE",
    token,
  })
}

export function listProcurementPackageExpenses(
  token: string,
  packageId: string,
): Promise<ProcurementPackageExpense[]> {
  return apiRequest<ProcurementPackageExpense[]>(
    `/procurement-packages/${packageId}/expenses`,
    { method: "GET", token },
  )
}

export function createProcurementPackageExpense(
  token: string,
  packageId: string,
  input: CreateProcurementPackageExpenseInput,
): Promise<ProcurementPackageExpense> {
  return apiRequest<ProcurementPackageExpense>(
    `/procurement-packages/${packageId}/expenses`,
    {
      method: "POST",
      token,
      body: JSON.stringify(input),
    },
  )
}

export function updateProcurementPackageExpense(
  token: string,
  packageId: string,
  expenseId: string,
  input: UpdateProcurementPackageExpenseInput,
): Promise<ProcurementPackageExpense> {
  return apiRequest<ProcurementPackageExpense>(
    `/procurement-packages/${packageId}/expenses/${expenseId}`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify(input),
    },
  )
}

export function deleteProcurementPackageExpense(
  token: string,
  packageId: string,
  expenseId: string,
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `/procurement-packages/${packageId}/expenses/${expenseId}`,
    {
      method: "DELETE",
      token,
    },
  )
}
