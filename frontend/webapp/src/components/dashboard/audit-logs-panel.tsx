import { memo, useCallback, useMemo, useState } from "react"
import { format } from "date-fns"
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  ScrollText,
  Search,
  User,
  UserCog,
  X,
} from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"

import { ShimmerContainer, TableRowsShimmer } from "@/components/common/query-shimmer"
import { DataPanel } from "@/components/common/data-panel"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuditLogsQuery } from "@/hooks/api"
import {
  ALL_AUDIT_ACTIONS,
  AUDIT_ACTION_LABELS,
  AUDIT_TONE_CLASSES,
  auditLogMatchesSearch,
  auditLogMatchesUserFilter,
  extractAuditTarget,
  formatAuditDetails,
  formatAuditSummary,
  getAuditActionTone,
  groupAuditLogsByDate,
} from "@/lib/audit-log"
import { getQueryViewState } from "@/lib/query-view-state"
import { userInitials } from "@/lib/user-display"
import { cn } from "@/lib/utils"
import type { AuditAction, AuditLog, AuditLogsResponse } from "@/modules/api/types"

const FETCH_LIMIT = 100
const PAGE_SIZE = 20

type AuditLogEntryProps = {
  log: AuditLog
}

const AuditLogEntry = memo(function AuditLogEntry({ log }: AuditLogEntryProps) {
  const target = extractAuditTarget(log)
  const tone = getAuditActionTone(log.action)
  const details = formatAuditDetails(log)
  const summary = formatAuditSummary(log)

  return (
    <article className="group relative flex gap-4 rounded-lg border border-border/70 bg-card px-4 py-3.5 transition-colors hover:border-border hover:bg-muted/20">
      <div
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border",
          AUDIT_TONE_CLASSES[tone],
        )}
      >
        <UserCog className="size-4" />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn("text-[11px] font-medium", AUDIT_TONE_CLASSES[tone])}
              >
                {AUDIT_ACTION_LABELS[log.action]}
              </Badge>
              <time
                className="text-xs text-muted-foreground"
                dateTime={log.createdAt}
              >
                {format(new Date(log.createdAt), "HH:mm")}
              </time>
            </div>
            <p className="text-sm font-medium leading-snug text-foreground">
              {summary}
            </p>
            {details ? (
              <p className="text-xs text-muted-foreground">{details}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-md bg-muted/30 px-3 py-2 text-xs sm:flex-row sm:items-center sm:gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 font-medium text-muted-foreground">
              Performed by
            </span>
            <Avatar size="sm" className="size-6">
              <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                {userInitials(log.actor.username)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate font-medium">{log.actor.username}</span>
            <span className="hidden truncate text-muted-foreground sm:inline">
              {log.actor.email}
            </span>
          </div>

          {target?.username || target?.email ? (
            <>
              <ArrowRight className="hidden size-3.5 shrink-0 text-muted-foreground sm:block" />
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 font-medium text-muted-foreground">
                  Affected user
                </span>
                <Avatar size="sm" className="size-6">
                  <AvatarFallback className="bg-secondary text-[10px] font-semibold">
                    {userInitials(target.username ?? target.email ?? "?")}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate font-medium">
                  {target.username ?? target.email}
                </span>
                {target.roleLabel ? (
                  <Badge variant="outline" className="hidden text-[10px] sm:inline-flex">
                    {target.roleLabel}
                  </Badge>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </article>
  )
})

type AuditSummaryCardProps = {
  label: string
  value: number | string
  hint?: string
  accentClassName?: string
}

function AuditSummaryCard({
  label,
  value,
  hint,
  accentClassName = "border-l-primary/70",
}: AuditSummaryCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/80 bg-card px-4 py-3 shadow-sm",
        "border-l-4",
        accentClassName,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export const AuditLogsPanel = memo(function AuditLogsPanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const userIdFilter = searchParams.get("userId")
  const userNameFilter = searchParams.get("userName")

  const auditQuery = useAuditLogsQuery({ page: 1, limit: FETCH_LIMIT })
  const auditView = useMemo(
    () => getQueryViewState<AuditLogsResponse>(auditQuery),
    [auditQuery],
  )

  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState<AuditAction | "ALL">("ALL")
  const [page, setPage] = useState(1)

  const allItems = auditView.data?.items ?? []
  const totalInSystem = auditView.data?.total ?? 0

  const filteredItems = useMemo(() => {
    return allItems.filter((log) => {
      if (actionFilter !== "ALL" && log.action !== actionFilter) return false
      if (!auditLogMatchesUserFilter(log, userIdFilter)) return false
      if (!auditLogMatchesSearch(log, search)) return false
      return true
    })
  }, [actionFilter, allItems, search, userIdFilter])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredItems.slice(start, start + PAGE_SIZE)
  }, [filteredItems, safePage])

  const groupedPageItems = useMemo(
    () => groupAuditLogsByDate(pageItems),
    [pageItems],
  )

  const actionCounts = useMemo(() => {
    const counts = new Map<AuditAction, number>()
    for (const action of ALL_AUDIT_ACTIONS) counts.set(action, 0)
    for (const log of allItems) {
      counts.set(log.action, (counts.get(log.action) ?? 0) + 1)
    }
    return counts
  }, [allItems])

  const todayCount = useMemo(() => {
    const todayKey = format(new Date(), "yyyy-MM-dd")
    return allItems.filter(
      (log) => format(new Date(log.createdAt), "yyyy-MM-dd") === todayKey,
    ).length
  }, [allItems])

  const clearUserFilter = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete("userId")
      next.delete("userName")
      return next
    })
    setPage(1)
  }, [setSearchParams])

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, [])

  const handleActionFilterChange = useCallback((value: AuditAction | "ALL") => {
    setActionFilter(value)
    setPage(1)
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AuditSummaryCard
          label="Total events"
          value={totalInSystem}
          hint={`${allItems.length} loaded for review`}
          accentClassName="border-l-amber-500/70"
        />
        <AuditSummaryCard
          label="Today"
          value={todayCount}
          hint="Events in loaded window"
          accentClassName="border-l-emerald-500/70"
        />
        <AuditSummaryCard
          label="User creations"
          value={actionCounts.get("USER_CREATED") ?? 0}
          hint="In loaded window"
          accentClassName="border-l-blue-500/70"
        />
        <AuditSummaryCard
          label="Account changes"
          value={
            (actionCounts.get("USER_UPDATED") ?? 0) +
            (actionCounts.get("USER_ACTIVATED") ?? 0) +
            (actionCounts.get("USER_DEACTIVATED") ?? 0) +
            (actionCounts.get("USER_CREDENTIALS_RESET") ?? 0)
          }
          hint="Updates, status & credentials"
          accentClassName="border-l-violet-500/70"
        />
      </div>

      <DataPanel
        title="Audit trail"
        description="Who did what — user management actions with actor and affected account details"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void auditQuery.refetch()}
            disabled={auditView.isRefreshing}
          >
            <RefreshCw
              className={cn("mr-2 size-4", auditView.isRefreshing && "animate-spin")}
            />
            Refresh
          </Button>
        }
        contentClassName="space-y-4"
      >
        {userIdFilter ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <Filter className="size-4 text-primary" />
              <span>
                Showing activity for{" "}
                <span className="font-medium">
                  {userNameFilter ?? "selected user"}
                </span>{" "}
                (as actor or affected account)
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearUserFilter}>
              <X className="mr-1 size-3.5" />
              Clear filter
            </Button>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by actor, affected user, email, or action…"
              className="pl-9"
            />
          </div>
          <Select
            value={actionFilter}
            onValueChange={(value) =>
              handleActionFilterChange(value as AuditAction | "ALL")
            }
          >
            <SelectTrigger className="w-full lg:w-[220px]">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All actions</SelectItem>
              {ALL_AUDIT_ACTIONS.map((action) => (
                <SelectItem key={action} value={action}>
                  {AUDIT_ACTION_LABELS[action]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {auditView.error ? (
          <p className="text-sm text-destructive">{auditView.error}</p>
        ) : (
          <ShimmerContainer
            isInitialLoading={auditView.isInitialLoading}
            isRefreshing={auditView.isRefreshing}
            shimmer={<TableRowsShimmer rows={5} columns={1} />}
          >
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                <ScrollText className="mb-3 size-10 text-muted-foreground/50" />
                <p className="text-sm font-medium">No audit events match</p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Try clearing filters or broadening your search. Only the most
                  recent {FETCH_LIMIT} events are loaded at once.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedPageItems.map((group) => (
                  <section key={group.key} className="space-y-3">
                    <h3 className="sticky top-14 z-[1] -mx-1 bg-background/95 px-1 py-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase backdrop-blur-sm">
                      {group.label}
                    </h3>
                    <div className="space-y-2">
                      {group.items.map((log) => (
                        <AuditLogEntry key={log.id} log={log} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </ShimmerContainer>
        )}

        {filteredItems.length > 0 ? (
          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, filteredItems.length)} of{" "}
              {filteredItems.length} matching
              {filteredItems.length !== allItems.length
                ? ` (${allItems.length} loaded)`
                : ""}
              {totalInSystem > allItems.length
                ? ` · ${totalInSystem} total in system`
                : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <span className="min-w-[4.5rem] text-center text-xs text-muted-foreground">
                {safePage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </DataPanel>

      <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        <User className="mt-0.5 size-4 shrink-0" />
        <p>
          Each entry shows the <span className="font-medium text-foreground">performer</span>{" "}
          (who took the action) and the{" "}
          <span className="font-medium text-foreground">affected user</span>{" "}
          when applicable. Open a user&apos;s activity from the{" "}
          <Link
            to="/dashboard/senior-manager/users"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Users
          </Link>{" "}
          page via the activity button.
        </p>
      </div>
    </div>
  )
})
