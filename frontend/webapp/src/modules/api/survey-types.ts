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

export type SurveyFormAnalyticsSummary = {
  totalResponses: number
  submitted: number
  draft: number
  assignmentCount: number
  packageCount: number
}

export type SurveyFormAnalyticsTehsilRow = {
  tehsilId: string
  tehsilName: string
  submitted: number
  draft: number
  total: number
}

export type SurveyFormAnalyticsVillageRow = {
  villageId: string
  villageName: string
  tehsilId: string
  tehsilName: string
  submitted: number
  draft: number
  total: number
}

export type SurveyFormAnalyticsPackageRow = {
  packageId: string
  packageName: string
  tehsilId: string
  tehsilName: string
  submitted: number
  draft: number
  total: number
}

export type SurveyFormAnalyticsTimePoint = {
  date: string
  count: number
}

export type SurveyFormAnalyticsFieldBreakdown = {
  fieldId: string
  label: string
  type: SurveyFieldType
  answeredCount: number
  choiceCounts?: Record<string, number>
  numeric?: {
    count: number
    sum: number
    avg: number
    min: number
    max: number
  }
}

export type SurveyFormAnalyticsFieldMeta = {
  id: string
  label: string
  type: SurveyFieldType
  order: number
  required: boolean
}

export type SurveyFormAnalytics = {
  form: {
    id: string
    title: string
    description: string | null
    status: SurveyStatus
  }
  filter: {
    procurementPackageId: string | null
    procurementPackageName: string | null
    submittedFrom: string | null
    submittedTo: string | null
  }
  fields: SurveyFormAnalyticsFieldMeta[]
  summary: SurveyFormAnalyticsSummary
  byTehsil: SurveyFormAnalyticsTehsilRow[]
  byVillage: SurveyFormAnalyticsVillageRow[]
  byProcurementPackage: SurveyFormAnalyticsPackageRow[]
  submissionsOverTime: SurveyFormAnalyticsTimePoint[]
  fieldBreakdown: SurveyFormAnalyticsFieldBreakdown[]
  cesmpInsights?: CesmpFormInsights | null
}

export type SurveyFormAnalyticsFilter = {
  procurementPackageId?: string | null
  submittedFrom?: string | null
  submittedTo?: string | null
}

export type CesmpPatternInsight = {
  label: string
  counts: Record<string, number>
  total: number
}

export type CesmpPackageInsight = {
  packageId: string
  packageName: string
  tehsilName: string
  contractorName: string
  consultantName: string
  budgetAllocated: number
  budgetUtilized: number
  budgetRemaining: number
  utilizationRate: number
  villagesCovered: number
  siteVisitsSubmitted: number
  hseStaffHired: boolean | null
  cesmpPlanSubmitted: boolean | null
  budgetByHead: {
    ppe: number
    hse: number
    environmentalMonitoring: number
  }
}

export type CesmpBudgetUtilizationInsight = {
  totalAllocated: number
  totalUtilized: number
  totalRemaining: number
  overallUtilizationRate: number
  byHead: {
    ppe: number
    hse: number
    environmentalMonitoring: number
  }
}

export type CesmpTrainingInsight = {
  responsesWithTraining: number
  totalParticipants: number
  topTrainings: Array<{ title: string; count: number; participants: number }>
  venues: Record<string, number>
}

export type CesmpFormInsights = {
  summary: {
    totalContractors: number
    totalProcurementPackages: number
    totalVillageCoverage: number
    totalSiteVisitsSubmitted: number
    hseStaffHiredPackages: number
    hseStaffHiredRate: number
    cesmpPlanSubmittedPackages: number
  }
  packages: CesmpPackageInsight[]
  ppeCompliance: {
    wearingRate: CesmpPatternInsight
    goodCondition: CesmpPatternInsight
  }
  noise: {
    level: CesmpPatternInsight
    reductionMeasures: CesmpPatternInsight
  }
  dust: {
    level: CesmpPatternInsight
    reductionMeasures: CesmpPatternInsight
  }
  budget: CesmpBudgetUtilizationInsight
  training: CesmpTrainingInsight
}
