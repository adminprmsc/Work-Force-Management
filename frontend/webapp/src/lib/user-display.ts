import type { Role as RoleType } from "@/modules/auth/roles"
import { ROLE_LABELS } from "@/lib/user-management"

export function userInitials(username: string): string {
  const parts = username
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
  }
  return username.slice(0, 2).toUpperCase()
}

export const ROLE_BADGE_CLASSES: Record<RoleType, string> = {
  SENIOR_MANAGER_ES: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
  RA_ENVIRONMENT_HO: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  RA_ES_TEHSIL: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  WORLD_BANK_USER: "bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/20",
}

export function roleBadgeClass(role: RoleType): string {
  return ROLE_BADGE_CLASSES[role] ?? "bg-muted text-muted-foreground"
}

export function roleLabel(role: RoleType): string {
  return ROLE_LABELS[role] ?? role
}
