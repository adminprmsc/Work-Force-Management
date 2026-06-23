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
}

export const ALL_AUDIT_ACTIONS: AuditAction[] = [
  "USER_CREATED",
  "USER_UPDATED",
  "USER_DELETED",
  "USER_ACTIVATED",
  "USER_DEACTIVATED",
  "USER_CREDENTIALS_RESET",
]

export type AuditActionTone = "success" | "warning" | "danger" | "neutral"

export function getAuditActionTone(action: AuditAction): AuditActionTone {
  switch (action) {
    case "USER_CREATED":
    case "USER_ACTIVATED":
      return "success"
    case "USER_DELETED":
      return "danger"
    case "USER_DEACTIVATED":
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
}

export function extractAuditTarget(log: AuditLog): AuditTargetInfo | null {
  const metadata = log.metadata
  if (!metadata) return null

  const role =
    typeof metadata.targetRole === "string" ? metadata.targetRole : undefined

  return {
    username:
      typeof metadata.targetUsername === "string"
        ? metadata.targetUsername
        : undefined,
    email:
      typeof metadata.targetEmail === "string" ? metadata.targetEmail : undefined,
    role,
    roleLabel: role ? (ROLE_LABELS[role as Role] ?? role) : undefined,
    officeName:
      typeof metadata.officeName === "string" ? metadata.officeName : undefined,
    tehsilName:
      typeof metadata.tehsilName === "string" ? metadata.tehsilName : undefined,
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
  return parts.length > 0 ? parts.join(", ") : null
}

export function formatAuditSummary(log: AuditLog): string {
  const target = extractAuditTarget(log)
  const actor = log.actor.username
  const targetName = target?.username ?? target?.email ?? "a user account"

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
    default:
      return `${actor} performed ${log.action}`
  }
}

export function formatAuditDetails(log: AuditLog): string | null {
  const target = extractAuditTarget(log)

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
      return formatChanges(log.metadata)
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
    default:
      return null
  }
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

export function auditLogMatchesSearch(log: AuditLog, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const target = extractAuditTarget(log)
  const haystack = [
    log.actor.username,
    log.actor.email,
    log.action,
    AUDIT_ACTION_LABELS[log.action],
    target?.username,
    target?.email,
    target?.roleLabel,
    formatAuditSummary(log),
    formatAuditDetails(log),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return haystack.includes(q)
}

export function auditLogMatchesUserFilter(
  log: AuditLog,
  userId: string | null,
): boolean {
  if (!userId) return true
  if (log.actor.id === userId) return true
  if (log.resourceId === userId) return true
  return false
}
