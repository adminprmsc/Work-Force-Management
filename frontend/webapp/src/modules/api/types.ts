import type { Role } from "@/modules/auth/roles"

export type UserStatus = "ACTIVE" | "INACTIVE"

export type OfficeType = "HEAD_OFFICE" | "WORLD_BANK_OFFICE" | "TEHSIL_OFFICE"

export type User = {
  id: string
  email: string
  username: string
  role: Role
  status: UserStatus
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

export type MasterEntity = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
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

export type ProcurementPackage = {
  id: string
  name: string
  budgetAmount: string
  totalExpenses: string
  remainingBudget: string
  contractor: ProcurementPackageRef
  consultant: ProcurementPackageRef
  tehsil: ProcurementPackageRef & { displayName: string }
  villages: ProcurementPackageRef[]
  expenses: ProcurementPackageExpense[]
  createdAt: string
  updatedAt: string
}

export type CreateProcurementPackageInput = {
  name: string
  budgetAmount: number
  contractorId: string
  consultantId: string
  tehsilId: string
  villageIds: string[]
}

export type ProcurementPackageNamePreview = {
  tehsilDisplayName: string
  suggestedZoneLabel: string | null
  suggestedAbbrev: string | null
}

export type UpdateProcurementPackageInput = {
  budgetAmount?: number
  villageIds?: string[]
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
