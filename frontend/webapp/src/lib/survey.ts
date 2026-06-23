import type { LucideIcon } from "lucide-react"
import {
  AlignLeft,
  CalendarDays,
  CheckSquare,
  ChevronDownSquare,
  Clock,
  CircleDot,
  Hash,
  IdCard,
  Image as ImageIcon,
  Mail,
  Minus,
  Paperclip,
  Phone,
  Type,
} from "lucide-react"

import { Role, type Role as RoleType, roleToDashboardPath } from "@/modules/auth/roles"
import type {
  SurveyFieldType,
  SurveyFrequency,
  SurveyStatus,
} from "@/modules/api/survey-types"

const SURVEY_MANAGERS: RoleType[] = [Role.SENIOR_MANAGER_ES, Role.RA_ENVIRONMENT_HO]

export function canManageSurveys(role: RoleType): boolean {
  return SURVEY_MANAGERS.includes(role)
}

export function canFillSurveys(role: RoleType): boolean {
  return role === Role.RA_ES_TEHSIL
}

const SURVEY_ANALYTICS_VIEWERS: RoleType[] = [
  Role.SENIOR_MANAGER_ES,
  Role.RA_ENVIRONMENT_HO,
  Role.WORLD_BANK_USER,
]

export function canViewSurveyAnalytics(role: RoleType): boolean {
  return SURVEY_ANALYTICS_VIEWERS.includes(role)
}

export function surveyFormsPath(role: RoleType): string {
  return `${roleToDashboardPath(role)}/surveys`
}

export function surveyResponsesPath(role: RoleType): string {
  return `${roleToDashboardPath(role)}/surveys/responses`
}

export function canReadSurveyResponses(role: RoleType): boolean {
  return canManageSurveys(role) || canFillSurveys(role)
}

export function surveyFormDashboardsPath(role: RoleType): string {
  return `${roleToDashboardPath(role)}/form-dashboards`
}

export function surveyFormDashboardPath(role: RoleType, formId: string): string {
  return `${surveyFormDashboardsPath(role)}/${formId}`
}

export type SurveyFieldMeta = {
  type: SurveyFieldType
  label: string
  icon: LucideIcon
  hasOptions: boolean
  presentational: boolean
}

export const SURVEY_FIELD_META: SurveyFieldMeta[] = [
  { type: "TEXT", label: "Text", icon: Type, hasOptions: false, presentational: false },
  { type: "PARAGRAPH", label: "Paragraph", icon: AlignLeft, hasOptions: false, presentational: false },
  { type: "CHECKBOXES", label: "Checkboxes", icon: CheckSquare, hasOptions: true, presentational: false },
  { type: "MULTIPLE_CHOICE", label: "Multiple Choice", icon: CircleDot, hasOptions: true, presentational: false },
  { type: "DATE", label: "Date", icon: CalendarDays, hasOptions: false, presentational: false },
  { type: "DROPDOWN", label: "Dropdown", icon: ChevronDownSquare, hasOptions: true, presentational: false },
  { type: "TIME", label: "Time", icon: Clock, hasOptions: false, presentational: false },
  { type: "NUMBER", label: "Number", icon: Hash, hasOptions: false, presentational: false },
  { type: "CNIC", label: "CNIC", icon: IdCard, hasOptions: false, presentational: false },
  { type: "EMAIL", label: "Email", icon: Mail, hasOptions: false, presentational: false },
  { type: "CONTACT", label: "Contact", icon: Phone, hasOptions: false, presentational: false },
  { type: "FILE", label: "File", icon: Paperclip, hasOptions: false, presentational: false },
  { type: "IMAGE", label: "Image", icon: ImageIcon, hasOptions: false, presentational: false },
  { type: "SECTION_BREAK", label: "Section Break", icon: Minus, hasOptions: false, presentational: true },
]

const FIELD_META_BY_TYPE = new Map(SURVEY_FIELD_META.map((meta) => [meta.type, meta]))

export function fieldMeta(type: SurveyFieldType): SurveyFieldMeta {
  return FIELD_META_BY_TYPE.get(type) ?? SURVEY_FIELD_META[0]
}

export function fieldHasOptions(type: SurveyFieldType): boolean {
  return fieldMeta(type).hasOptions
}

export function fieldIsPresentational(type: SurveyFieldType): boolean {
  return fieldMeta(type).presentational
}

export const SURVEY_FREQUENCY_OPTIONS: { value: SurveyFrequency; label: string }[] = [
  { value: "ONE_TIME", label: "One-time" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
]

export function frequencyLabel(frequency: SurveyFrequency): string {
  return (
    SURVEY_FREQUENCY_OPTIONS.find((option) => option.value === frequency)?.label ??
    frequency
  )
}

export function statusLabel(status: SurveyStatus): string {
  switch (status) {
    case "DRAFT":
      return "Draft"
    case "PUBLISHED":
      return "Published"
    case "ARCHIVED":
      return "Archived"
    default:
      return status
  }
}

export function statusBadgeVariant(
  status: SurveyStatus,
): "default" | "secondary" | "outline" {
  switch (status) {
    case "PUBLISHED":
      return "default"
    case "DRAFT":
      return "secondary"
    case "ARCHIVED":
      return "outline"
    default:
      return "secondary"
  }
}
