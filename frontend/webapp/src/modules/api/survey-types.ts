export type SurveyStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED"

export type SurveyResponseStatus = "DRAFT" | "SUBMITTED"

export type SurveyFrequency = "ONE_TIME" | "DAILY" | "WEEKLY" | "MONTHLY"

export type SurveyFieldType =
  | "TEXT"
  | "PARAGRAPH"
  | "CHECKBOXES"
  | "MULTIPLE_CHOICE"
  | "DATE"
  | "DROPDOWN"
  | "TIME"
  | "NUMBER"
  | "CNIC"
  | "EMAIL"
  | "CONTACT"
  | "FILE"
  | "IMAGE"
  | "SECTION_BREAK"

export type SurveyFieldOption = {
  value: string
  label: string
}

export type PackageFieldReference =
  | "packageName"
  | "budgetAmount"
  | "totalExpenses"
  | "remainingBudget"
  | "contractorName"
  | "consultantName"
  | "tehsilName"

export type SurveyFieldBudgetEffect = "DEDUCT" | "ADD"

export type SurveyFieldConfig = {
  options?: SurveyFieldOption[]
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  integer?: boolean
  minSelected?: number
  maxSelected?: number
  accept?: string
  maxSizeMb?: number
  packageReference?: PackageFieldReference
  readOnly?: boolean
  snapshotOnSubmit?: boolean
  budgetEffect?: "DEDUCT" | "ADD"
  computedRemainingBudget?: boolean
  computedVisitDeductions?: boolean
}

export type SurveyField = {
  id: string
  type: SurveyFieldType
  label: string
  helpText: string | null
  required: boolean
  order: number
  config: SurveyFieldConfig | null
}

export type SurveyFieldInput = {
  type: SurveyFieldType
  label: string
  helpText?: string | null
  required?: boolean
  order: number
  config?: SurveyFieldConfig | null
}

export type SurveyFormBaselineField = {
  id: string
  type: SurveyFieldType
  label: string
  helpText: string | null
  required: boolean
  writeOnce: boolean
  order: number
  config: SurveyFieldConfig | null
}

export type SurveyFormBaselineFieldInput = {
  id?: string
  type: SurveyFieldType
  label: string
  helpText?: string | null
  required?: boolean
  writeOnce?: boolean
  order: number
  config?: SurveyFieldConfig | null
}

export type SurveyForm = {
  id: string
  title: string
  description: string | null
  status: SurveyStatus
  requiresPackageBaseline: boolean
  baselineTitle: string | null
  baselineDescription: string | null
  createdBy: { id: string; username: string; email: string }
  fields: SurveyField[]
  baselineFields: SurveyFormBaselineField[]
  assignmentCount: number
  responseCount: number
  currentRevisionVersion: number | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type SurveyFormRevision = {
  id: string
  version: number
  fields: SurveyField[]
  publishedAt: string
}

export type CreateSurveyFormInput = {
  title: string
  description?: string | null
  requiresPackageBaseline?: boolean
  baselineTitle?: string | null
  baselineDescription?: string | null
  fields: SurveyFieldInput[]
  baselineFields?: SurveyFormBaselineFieldInput[]
}

export type UpdateSurveyFormInput = {
  title?: string
  description?: string | null
  requiresPackageBaseline?: boolean
  baselineTitle?: string | null
  baselineDescription?: string | null
  fields?: SurveyFieldInput[]
  baselineFields?: SurveyFormBaselineFieldInput[]
}

export type SurveyAssignment = {
  id: string
  formId: string
  formTitle: string
  requiresPackageBaseline: boolean
  formRevision: SurveyFormRevision
  tehsil: { id: string; name: string }
  procurementPackage: {
    id: string
    name: string
    isMobilized: boolean
    isBaselineComplete: boolean
  }
  frequency: SurveyFrequency
  startDate: string
  endDate: string
  assignedById: string
  instructions: string | null
  responseCount: number
  createdAt: string
}

export type CreateSurveyAssignmentsInput = {
  procurementPackageIds: string[]
  frequency: SurveyFrequency
  startDate: string
  endDate: string
  instructions?: string | null
}

export type SurveyAnswer = {
  fieldId: string
  value: unknown
}

export type SurveyResponse = {
  id: string
  assignmentId: string
  form: { id: string; title: string }
  procurementPackage: { id: string; name: string }
  formRevision: SurveyFormRevision
  status: SurveyResponseStatus
  tehsil: { id: string; name: string }
  village: { id: string; name: string }
  settlement: { id: string; name: string } | null
  respondent: { id: string; username: string; email: string }
  answers: SurveyAnswer[]
  visitDate: string | null
  submittedAt: string | null
  createdAt: string
  updatedAt: string
}

export type StartSurveyResponseInput = {
  assignmentId: string
  villageId: string
  settlementId?: string | null
  visitDate?: string | null
}

export type SaveSurveyResponseInput = {
  answers: SurveyAnswer[]
}

export type SurveyResponsesFilter = {
  formId?: string
  tehsilId?: string
  assignmentId?: string
}
