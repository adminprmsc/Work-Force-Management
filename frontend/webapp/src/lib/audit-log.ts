import { format, isToday, isYesterday } from "date-fns"

import { ROLE_LABELS } from "@/lib/user-management"
import type { AuditAction, AuditLog } from "@/modules/api/types"
import type { Role } from "@/modules/auth/roles"

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  USER_CREATED: "User created",
  USER_UPDATED: "User updated",
  USER_DELETED: "User deleted",
  USER_ACTIVATED: "User activated",
  USER_DEACTIVATED: "User deactivated",
  USER_CREDENTIALS_RESET: "Credentials reset",
  PACKAGE_CREATED: "Package created",
  PACKAGE_UPDATED: "Package updated",
  PACKAGE_DELETED: "Package deleted",
  PACKAGE_EXPENSE_CREATED: "Expense added",
  PACKAGE_EXPENSE_UPDATED: "Expense updated",
  PACKAGE_EXPENSE_DELETED: "Expense deleted",
  PACKAGE_BASELINE_SAVED: "Baseline saved",
  SURVEY_ASSIGNMENT_CREATED: "Survey assigned",
  SURVEY_ASSIGNMENT_DELETED: "Survey unassigned",
  SURVEY_RESPONSE_SUBMITTED: "Survey submitted",
  SURVEY_RESPONSE_ACCEPTED: "Survey accepted",
  SURVEY_RESPONSE_REJECTED: "Survey rejected",
  SURVEY_RESPONSE_REVERTED: "Survey reverted",
}

export const ALL_AUDIT_ACTIONS: AuditAction[] = Object.keys(
  AUDIT_ACTION_LABELS,
) as AuditAction[]

export const USER_AUDIT_ACTIONS: AuditAction[] = [
  "USER_CREATED",
  "USER_UPDATED",
  "USER_DELETED",
  "USER_ACTIVATED",
  "USER_DEACTIVATED",
  "USER_CREDENTIALS_RESET",
]

export const PACKAGE_AUDIT_ACTIONS: AuditAction[] = [
  "PACKAGE_CREATED",
  "PACKAGE_UPDATED",
  "PACKAGE_DELETED",
  "PACKAGE_EXPENSE_CREATED",
  "PACKAGE_EXPENSE_UPDATED",
  "PACKAGE_EXPENSE_DELETED",
  "PACKAGE_BASELINE_SAVED",
  "SURVEY_ASSIGNMENT_CREATED",
  "SURVEY_ASSIGNMENT_DELETED",
  "SURVEY_RESPONSE_SUBMITTED",
  "SURVEY_RESPONSE_ACCEPTED",
  "SURVEY_RESPONSE_REJECTED",
  "SURVEY_RESPONSE_REVERTED",
]

export type AuditActionTone = "success" | "warning" | "danger" | "neutral"

export function getAuditActionTone(action: AuditAction): AuditActionTone {
  switch (action) {
    case "USER_CREATED":
    case "USER_ACTIVATED":
    case "PACKAGE_CREATED":
    case "PACKAGE_EXPENSE_CREATED":
    case "SURVEY_ASSIGNMENT_CREATED":
    case "SURVEY_RESPONSE_SUBMITTED":
    case "SURVEY_RESPONSE_ACCEPTED":
    case "PACKAGE_BASELINE_SAVED":
      return "success"
    case "USER_DELETED":
    case "PACKAGE_DELETED":
    case "PACKAGE_EXPENSE_DELETED":
    case "SURVEY_ASSIGNMENT_DELETED":
    case "SURVEY_RESPONSE_REJECTED":
      return "danger"
    case "USER_DEACTIVATED":
    case "SURVEY_RESPONSE_REVERTED":
      return "warning"
    default:
      return "neutral"
  }
}

export const AUDIT_TONE_CLASSES: Record<AuditActionTone, string> = {
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  warning: "bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/25",
  danger: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/25",
  neutral: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
}

export type AuditTargetInfo = {
  username?: string
  email?: string
  role?: string
  roleLabel?: string
  officeName?: string
  tehsilName?: string
  packageName?: string
}

function metaString(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): string | undefined {
  if (!metadata) return undefined
  const value = metadata[key]
  return typeof value === "string" ? value : undefined
}

export function extractAuditTarget(log: AuditLog): AuditTargetInfo | null {
  const metadata = log.metadata
  if (!metadata) return null

  const role =
    typeof metadata.targetRole === "string" ? metadata.targetRole : undefined

  return {
    username: metaString(metadata, "targetUsername"),
    email: metaString(metadata, "targetEmail"),
    role,
    roleLabel: role ? (ROLE_LABELS[role as Role] ?? role) : undefined,
    officeName: metaString(metadata, "officeName"),
    tehsilName: metaString(metadata, "tehsilName"),
    packageName: metaString(metadata, "packageName"),
  }
}

function formatChanges(metadata: Record<string, unknown> | null): string | null {
  if (!metadata?.changes || typeof metadata.changes !== "object") return null
  const changes = metadata.changes as Record<string, unknown>
  const parts: string[] = []
  if (typeof changes.email === "string") parts.push(`email → ${changes.email}`)
  if (typeof changes.username === "string") {
    parts.push(`username → ${changes.username}`)
  }
  if (changes.officeId !== undefined) parts.push("office assignment changed")
  if (changes.contractor === true) parts.push("contractor changed")
  if (changes.consultant === true) parts.push("consultant changed")
  if (changes.budgetAmount === true) parts.push("budget changed")
  if (changes.villages === true) parts.push("villages/allocations changed")
  if (changes.name === true) parts.push("name changed")
  return parts.length > 0 ? parts.join(", ") : null
}

export function formatAuditSummary(log: AuditLog): string {
  const target = extractAuditTarget(log)
  const actor = log.actor.username
  const targetName = target?.username ?? target?.email ?? "a user account"
  const packageName = target?.packageName ?? "a package"
  const formTitle = metaString(log.metadata, "formTitle")
  const villageName = metaString(log.metadata, "villageName")
  const respondent = metaString(log.metadata, "respondentUsername")

  switch (log.action) {
    case "USER_CREATED":
      return `${actor} created ${targetName}`
    case "USER_UPDATED":
      return `${actor} updated ${targetName}`
    case "USER_DELETED":
      return `${actor} deleted ${targetName}`
    case "USER_ACTIVATED":
      return `${actor} activated ${targetName}`
    case "USER_DEACTIVATED":
      return `${actor} deactivated ${targetName}`
    case "USER_CREDENTIALS_RESET":
      return `${actor} reset credentials for ${targetName}`
    case "PACKAGE_CREATED":
      return `${actor} created package ${packageName}`
    case "PACKAGE_UPDATED":
      return `${actor} updated package ${packageName}`
    case "PACKAGE_DELETED":
      return `${actor} deleted package ${packageName}`
    case "PACKAGE_EXPENSE_CREATED":
      return `${actor} added an expense on ${packageName}`
    case "PACKAGE_EXPENSE_UPDATED":
      return `${actor} updated an expense on ${packageName}`
    case "PACKAGE_EXPENSE_DELETED":
      return `${actor} deleted an expense on ${packageName}`
    case "PACKAGE_BASELINE_SAVED":
      return `${actor} saved baseline${formTitle ? ` for ${formTitle}` : ""} on ${packageName}`
    case "SURVEY_ASSIGNMENT_CREATED":
      return `${actor} assigned ${formTitle ?? "a survey"} to ${packageName}`
    case "SURVEY_ASSIGNMENT_DELETED":
      return `${actor} removed ${formTitle ?? "a survey"} from ${packageName}`
    case "SURVEY_RESPONSE_SUBMITTED":
      return `${respondent ?? actor} submitted ${formTitle ?? "a survey"} on ${packageName}${villageName ? ` (${villageName})` : ""}`
    case "SURVEY_RESPONSE_ACCEPTED":
      return `${actor} accepted a survey on ${packageName}`
    case "SURVEY_RESPONSE_REJECTED":
      return `${actor} rejected a survey on ${packageName}`
    case "SURVEY_RESPONSE_REVERTED":
      return `${actor} reverted a survey on ${packageName}`
    default:
      return `${actor} performed ${log.action}`
  }
}

export function formatAuditDetails(log: AuditLog): string | null {
  const target = extractAuditTarget(log)
  const metadata = log.metadata

  switch (log.action) {
    case "USER_CREATED": {
      const parts: string[] = []
      if (target?.roleLabel) parts.push(target.roleLabel)
      if (target?.officeName) parts.push(target.officeName)
      else if (target?.tehsilName) parts.push(target.tehsilName)
      if (target?.email) parts.push(target.email)
      return parts.length > 0 ? parts.join(" · ") : null
    }
    case "USER_UPDATED":
      return formatChanges(metadata)
    case "USER_DELETED":
    case "USER_ACTIVATED":
    case "USER_DEACTIVATED":
    case "USER_CREDENTIALS_RESET": {
      const parts: string[] = []
      if (target?.roleLabel) parts.push(target.roleLabel)
      if (target?.email) parts.push(target.email)
      if (target?.tehsilName) parts.push(target.tehsilName)
      return parts.length > 0 ? parts.join(" · ") : null
    }
    case "PACKAGE_CREATED":
    case "PACKAGE_DELETED": {
      const parts: string[] = []
      const contractor = metaString(metadata, "contractorName")
      const consultant = metaString(metadata, "consultantName")
      const tehsil = metaString(metadata, "tehsilName")
      const budget = metaString(metadata, "budgetAmount")
      if (contractor) parts.push(`Contractor: ${contractor}`)
      if (consultant) parts.push(`Consultant: ${consultant}`)
      if (tehsil) parts.push(tehsil)
      if (budget) parts.push(`Budget ${budget}`)
      return parts.length > 0 ? parts.join(" · ") : null
    }
    case "PACKAGE_UPDATED": {
      const changeText = formatChanges(metadata)
      const after = metadata?.after
      if (after && typeof after === "object") {
        const afterObj = after as Record<string, unknown>
        const parts: string[] = []
        if (typeof afterObj.contractorName === "string") {
          parts.push(`Contractor: ${afterObj.contractorName}`)
        }
        if (typeof afterObj.consultantName === "string") {
          parts.push(`Consultant: ${afterObj.consultantName}`)
        }
        if (typeof afterObj.budgetAmount === "string") {
          parts.push(`Budget ${afterObj.budgetAmount}`)
        }
        const joined = [changeText, parts.join(" · ")].filter(Boolean).join(" · ")
        return joined || null
      }
      return changeText
    }
    case "PACKAGE_EXPENSE_CREATED":
    case "PACKAGE_EXPENSE_UPDATED":
    case "PACKAGE_EXPENSE_DELETED": {
      const amount = metaString(metadata, "amount")
      const description = metaString(metadata, "description")
      const parts: string[] = []
      if (amount) parts.push(`Amount ${amount}`)
      if (description) parts.push(description)
      return parts.length > 0 ? parts.join(" · ") : null
    }
    case "PACKAGE_BASELINE_SAVED": {
      const formTitle = metaString(metadata, "formTitle")
      const count =
        typeof metadata?.answerCount === "number"
          ? `${metadata.answerCount} answers`
          : undefined
      return [formTitle, count].filter(Boolean).join(" · ") || null
    }
    case "SURVEY_ASSIGNMENT_CREATED":
    case "SURVEY_ASSIGNMENT_DELETED": {
      const formTitle = metaString(metadata, "formTitle")
      const frequency = metaString(metadata, "frequency")
      return [formTitle, frequency].filter(Boolean).join(" · ") || null
    }
    case "SURVEY_RESPONSE_SUBMITTED":
    case "SURVEY_RESPONSE_ACCEPTED":
    case "SURVEY_RESPONSE_REJECTED":
    case "SURVEY_RESPONSE_REVERTED": {
      const parts: string[] = []
      const formTitle = metaString(metadata, "formTitle")
      const villageName = metaString(metadata, "villageName")
      const remarks = metaString(metadata, "remarks")
      if (formTitle) parts.push(formTitle)
      if (villageName) parts.push(villageName)
      if (remarks) parts.push(remarks)
      return parts.length > 0 ? parts.join(" · ") : null
    }
    default:
      return null
  }
}

export type AuditDetailField = { label: string; value: string }

export type AuditMetadataSection = {
  key: string
  title: string | null
  fields: AuditDetailField[]
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T|$)/

export function humanizeMetadataKey(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .trim()
  const withIds = spaced.replace(/\bid\b/g, "ID")
  return withIds.charAt(0).toUpperCase() + withIds.slice(1)
}

function formatMetadataValue(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "number") return value.toLocaleString()
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return null
    if (ISO_DATE_PATTERN.test(trimmed)) {
      const parsed = new Date(trimmed)
      if (!Number.isNaN(parsed.getTime())) {
        return format(parsed, "d MMM yyyy, HH:mm")
      }
    }
    return trimmed
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return null
    const primitives = value.filter(
      (item) => typeof item === "string" || typeof item === "number",
    )
    if (primitives.length === value.length) return primitives.join(", ")
    return `${value.length} item${value.length === 1 ? "" : "s"}`
  }
  return null
}

function toMetadataFields(source: Record<string, unknown>): AuditDetailField[] {
  const fields: AuditDetailField[] = []
  for (const [key, value] of Object.entries(source)) {
    const formatted = formatMetadataValue(value)
    if (formatted === null) continue
    fields.push({ label: humanizeMetadataKey(key), value: formatted })
  }
  return fields
}

/** Flattens audit metadata into readable sections for the event detail view. */
export function buildAuditMetadataSections(
  metadata: Record<string, unknown> | null,
): AuditMetadataSection[] {
  if (!metadata) return []

  const scalars: Record<string, unknown> = {}
  const nested: AuditMetadataSection[] = []

  for (const [key, value] of Object.entries(metadata)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const fields = toMetadataFields(value as Record<string, unknown>)
      if (fields.length > 0) {
        nested.push({ key, title: humanizeMetadataKey(key), fields })
      }
      continue
    }
    scalars[key] = value
  }

  const sections: AuditMetadataSection[] = []
  const scalarFields = toMetadataFields(scalars)
  if (scalarFields.length > 0) {
    sections.push({ key: "__root", title: null, fields: scalarFields })
  }
  return [...sections, ...nested]
}

export function formatAuditDateGroup(dateIso: string): string {
  const date = new Date(dateIso)
  if (isToday(date)) return "Today"
  if (isYesterday(date)) return "Yesterday"
  return format(date, "EEEE, d MMMM yyyy")
}

export function groupAuditLogsByDate(
  logs: AuditLog[],
): { key: string; label: string; items: AuditLog[] }[] {
  const groups = new Map<string, AuditLog[]>()

  for (const log of logs) {
    const key = format(new Date(log.createdAt), "yyyy-MM-dd")
    const bucket = groups.get(key)
    if (bucket) bucket.push(log)
    else groups.set(key, [log])
  }

  return Array.from(groups.entries()).map(([key, items]) => ({
    key,
    label: formatAuditDateGroup(items[0]!.createdAt),
    items,
  }))
}