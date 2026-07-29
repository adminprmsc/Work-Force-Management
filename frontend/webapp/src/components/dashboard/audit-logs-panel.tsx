import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { format } from "date-fns"
import {
  Eye,
  Filter,
  Package,
  RefreshCw,
  ScrollText,
  Search,
  X,
} from "lucide-react"
import { useSearchParams } from "react-router-dom"

import { ShimmerContainer, TableRowsShimmer } from "@/components/common/query-shimmer"
import { DataPanel } from "@/components/common/data-panel"
import { ListPagination } from "@/components/common/list-pagination"
import { AuditLogDetailDialog } from "@/components/dashboard/audit-log-detail-dialog"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuditLogsQuery } from "@/hooks/api"
import {
  ALL_AUDIT_ACTIONS,
  AUDIT_ACTION_LABELS,
  AUDIT_TONE_CLASSES,
  extractAuditTarget,
  formatAuditSummary,
  getAuditActionTone,
} from "@/lib/audit-log"
import { DEFAULT_PAGE_SIZE, type PageSizeOption } from "@/lib/list-pagination"
import { getQueryViewState } from "@/lib/query-view-state"
import { userInitials } from "@/lib/user-display"
import { cn } from "@/lib/utils"
import type { AuditAction, AuditLog, AuditLogsResponse } from "@/modules/api/types"

const SEARCH_DEBOUNCE_MS = 350

type AuditLogRowProps = {
  log: AuditLog
  onOpenDetail: (log: AuditLog) => void
}

const AuditLogRow = memo(function AuditLogRow({
  log,
  onOpenDetail,
}: AuditLogRowProps) {
  const createdAt = new Date(log.createdAt)
  const target = extractAuditTarget(log)
  const tone = getAuditActionTone(log.action)

  return (
    <TableRow className="group">
      <TableCell className="whitespace-nowrap align-middle">
        <time className="text-sm" dateTime={log.createdAt}>
          {format(createdAt, "d MMM yyyy")}
        </time>
        <span className="ml-2 text-xs text-muted-foreground">
          {format(createdAt, "HH:mm")}
        </span>
      </TableCell>
      <TableCell className="align-middle">
        <Badge
          variant="outline"
          className={cn("whitespace-nowrap font-normal", AUDIT_TONE_CLASSES[tone])}
        >
          {AUDIT_ACTION_LABELS[log.action]}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[22rem] align-middle">
        <p className="truncate text-sm" title={formatAuditSummary(log)}>
          {formatAuditSummary(log)}
        </p>
      </TableCell>
      <TableCell className="align-middle">
        <div className="flex items-center gap-2">
          <Avatar size="sm" className="size-6">
            <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
              {userInitials(log.actor.username)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-sm">{log.actor.username}</span>
        </div>
      </TableCell>
      <TableCell className="max-w-[12rem] align-middle">
        {target?.username || target?.email ? (
          <span className="truncate text-sm">
            {target.username ?? target.email}
          </span>
        ) : target?.packageName ? (
          <span className="flex min-w-0 items-center gap-1.5 text-sm">
            <Package className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate" title={target.packageName}>
              {target.packageName}
            </span>
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right align-middle">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => onOpenDetail(log)}
          aria-label={`Explore details for ${AUDIT_ACTION_LABELS[log.action]}`}
        >
          <Eye className="mr-1.5 size-3.5" />
          Details
        </Button>
      </TableCell>
    </TableRow>
  )
})

export const AuditLogsPanel = memo(function AuditLogsPanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const userIdFilter = searchParams.get("userId")
  const userNameFilter = searchParams.get("userName")

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE)
  const [actionFilter, setActionFilter] = useState<AuditAction | "ALL">("ALL")
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null)
  const searchTimerRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current)
    },
    [],
  )

  const auditQuery = useAuditLogsQuery({
    page,
    limit: pageSize,
    action: actionFilter === "ALL" ? undefined : actionFilter,
    userId: userIdFilter ?? undefined,
    search: search || undefined,
  })
  const auditView = useMemo(
    () => getQueryViewState<AuditLogsResponse>(auditQuery),
    [auditQuery],
  )

  const items = auditView.data?.items ?? []
  const total = auditView.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

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
    setSearchInput(value)
    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current)
    searchTimerRef.current = window.setTimeout(() => {
      setSearch(value.trim())
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
  }, [])

  const handleActionFilterChange = useCallback((value: AuditAction | "ALL") => {
    setActionFilter(value)
    setPage(1)
  }, [])

  const handlePageSizeChange = useCallback((value: PageSizeOption) => {
    setPageSize(value)
    setPage(1)
  }, [])

  const handleOpenDetail = useCallback((log: AuditLog) => {
    setDetailLog(log)
  }, [])

  const hasFilters =
    Boolean(search) || actionFilter !== "ALL" || Boolean(userIdFilter)

  return (
    <div className="space-y-6">
      <DataPanel
        title="Audit trail"
        description="Domain history — users, packages, contractors/consultants, expenses, baselines, and survey milestones"
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
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by actor, affected user, package, or survey…"
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
            shimmer={<TableRowsShimmer rows={8} columns={6} />}
          >
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                <ScrollText className="mb-3 size-10 text-muted-foreground/50" />
                <p className="text-sm font-medium">No audit events found</p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  {hasFilters
                    ? "Try clearing filters or broadening your search."
                    : "Recorded actions will appear here as users work in the system."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="enterprise-table [&_tbody_td]:py-2">
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Performed by</TableHead>
                      <TableHead>Affected</TableHead>
                      <TableHead className="text-right">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((log) => (
                      <AuditLogRow
                        key={log.id}
                        log={log}
                        onOpenDetail={handleOpenDetail}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </ShimmerContainer>
        )}

        <ListPagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          label="events"
        />
      </DataPanel>

      <AuditLogDetailDialog
        log={detailLog}
        open={Boolean(detailLog)}
        onOpenChange={(open) => {
          if (!open) setDetailLog(null)
        }}
      />
    </div>
  )
})
