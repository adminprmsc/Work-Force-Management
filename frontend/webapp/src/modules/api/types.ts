import type { Role } from "@/modules/auth/roles"

export type UserStatus = "ACTIVE" | "INACTIVE"

export type OfficeType = "HEAD_OFFICE" | "WORLD_BANK_OFFICE" | "TEHSIL_OFFICE"

export type User = {
  id: string
  email: string
  username: string
  role: Role
  status: UserStatus
  canManageUsers: boolean
  officeId: string | null
  officeName: string | null
  officeType: OfficeType | null
  tehsilName: string | null
  createdById: string | null
  createdAt: string
  updatedAt: string
}

export type Office = {
  id: string
  type: OfficeType
  name: string
  tehsilId: string | null
  tehsilName: string | null
  createdAt: string
  updatedAt: string
}

export type Tehsil = {
  id: string
  name: string
  villageCount: number
  createdAt: string
}

export type Village = {
  id: string
  name: string
  tehsilId: string
  settlementCount: number
  createdAt: string
}

export type Settlement = {
  id: string
  name: string
  villageId: string
  createdAt: string
}

export type AuditAction =
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "USER_ACTIVATED"
  | "USER_DEACTIVATED"
  | "USER_CREDENTIALS_RESET"
  | "PACKAGE_CREATED"
  | "PACKAGE_UPDATED"
  | "PACKAGE_DELETED"
  | "PACKAGE_EXPENSE_CREATED"
  | "PACKAGE_EXPENSE_UPDATED"
  | "PACKAGE_EXPENSE_DELETED"
  | "PACKAGE_BASELINE_SAVED"
  | "SURVEY_ASSIGNMENT_CREATED"
  | "SURVEY_ASSIGNMENT_UPDATED"
  | "SURVEY_ASSIGNMENT_DELETED"
  | "SURVEY_RESPONSE_SUBMITTED"
  | "SURVEY_RESPONSE_ACCEPTED"
  | "SURVEY_RESPONSE_REJECTED"
  | "SURVEY_RESPONSE_REVERTED"
  | "MOBILE_APP_UPLOADED"

export type AuditLog = {
  id: string
  action: AuditAction
  resourceType: string
  resourceId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  actor: {
    id: string
    email: string
    username: string
  }
}

export type AuditLogsResponse = {
  items: AuditLog[]
  total: number
  page: number
  limit: number
}

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  limit: number
}

export type PaginationParams = {
  page?: number
  limit?: 25 | 50 | 100
}

export type MasterEntity = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  linkedPackageNames?: string[]
}

export type Contractor = MasterEntity
export type Consultant = MasterEntity

export type ProcurementPackageRef = {
  id: string
  name: string
  displayName?: string
}

export type ProcurementPackageExpense = {
  id: string
  packageId: string
  amount: string
  description: string | null
  expenseDate: string
  createdBy: {
    id: string
    username: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export type ProcurementPackageVillage = ProcurementPackageRef & {
  allocatedBudget: string
  spent: string
  remaining: string
}

export type VillageAllocationInput = {
  villageId: string
  allocatedBudget: number
}

export type ProcurementPackage = {
  id: string
  name: string
  budgetAmount: string
  totalExpenses: string
  remainingBudget: string
  contractor: ProcurementPackageRef
  consultant: ProcurementPackageRef
  tehsil: ProcurementPackageRef & { displayName: string }
  villages: ProcurementPackageVillage[]
  expenses: ProcurementPackageExpense[]
  createdAt: string
  updatedAt: string
}

export type CreateProcurementPackageInput = {
  cluster: string
  code: string
  budgetAmount: number
  contractorId: string
  consultantId: string
  tehsilId: string
  villageIds: string[]
  villageAllocations?: VillageAllocationInput[]
}

export type ProcurementPackageNamePreview = {
  tehsilDisplayName: string
  suggestedZoneLabel: string | null
  suggestedAbbrev: string | null
}

export type UpdateProcurementPackageInput = {
  name?: string
  budgetAmount?: number
  contractorId?: string
  consultantId?: string
  villageIds?: string[]
  villageAllocations?: VillageAllocationInput[]
}

export type CreateProcurementPackageExpenseInput = {
  amount: number
  description?: string
  expenseDate?: string
}

export type UpdateProcurementPackageExpenseInput = {
  amount?: number
  description?: string | null
  expenseDate?: string
}

export type PackageBaselineFormSummary = {
  formId: string
  formTitle: string
  baselineTitle: string | null
  isBaselineComplete: boolean
}

export type PackageFormBaseline = {
  packageId: string
  formId: string
  formTitle: string
  baselineTitle: string | null
  baselineDescription: string | null
  fields: import("@/modules/api/survey-types").SurveyFormBaselineField[]
  answers: { fieldId: string; value: unknown }[]
  isBaselineComplete: boolean
  isMobilized: boolean
  submittedAt: string | null
  submittedBy: { id: string; username: string; email: string } | null
  updatedAt: string | null
}

export type SavePackageBaselineInput = {
  answers: { fieldId: string; value: unknown }[]
}
