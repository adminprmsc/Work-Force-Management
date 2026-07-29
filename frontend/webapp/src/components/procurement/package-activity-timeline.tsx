import { memo, useState } from "react"
import { format } from "date-fns"
import { History, ScrollText } from "lucide-react"

import { ListPagination } from "@/components/common/list-pagination"
import { ShimmerContainer, TableRowsShimmer } from "@/components/common/query-shimmer"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { usePackageActivityQuery } from "@/hooks/api"
import {
  AUDIT_ACTION_LABELS,
  AUDIT_TONE_CLASSES,
  formatAuditDetails,
  formatAuditSummary,
  getAuditActionTone,
  groupAuditLogsByDate,
} from "@/lib/audit-log"
import { getQueryViewState } from "@/lib/query-view-state"
import { userInitials } from "@/lib/user-display"
import { cn } from "@/lib/utils"
import type { AuditLogsResponse } from "@/modules/api/types"

const ACTIVITY_PAGE_SIZE = 25

type PackageActivityTimelineProps = {
  packageId: string
}

export const PackageActivityTimeline = memo(function PackageActivityTimeline({
  packageId,
}: PackageActivityTimelineProps) {
  const [page, setPage] = useState(1)
  const activityQuery = usePackageActivityQuery(packageId, {
    page,
    limit: ACTIVITY_PAGE_SIZE,
  })
  const view = getQueryViewState<AuditLogsResponse>(activityQuery)
  const items = view.data?.items ?? []
  const total = view.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / ACTIVITY_PAGE_SIZE))
  const groups = groupAuditLogsByDate(items)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <History className="size-4" />
        <span>
          Complete package history — create/edit, contractor & consultant,
          expenses, baseline, survey assignments and submissions.
        </span>
      </div>

      {view.error ? (
        <p className="text-sm text-destructive">{view.error}</p>
      ) : (
        <ShimmerContainer
          isInitialLoading={view.isInitialLoading}
          isRefreshing={view.isRefreshing}
          shimmer={<TableRowsShimmer rows={4} columns={1} />}
        >
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
              <ScrollText className="mb-2 size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">No activity recorded yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Future package changes and survey milestones will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {groups.map((group) => (
                <section key={group.key} className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </h4>
                  <div className="space-y-2">
                    {group.items.map((log) => {
                      const tone = getAuditActionTone(log.action)
                      const details = formatAuditDetails(log)
                      return (
                        <article
                          key={log.id}
                          className="rounded-lg border border-border/70 bg-card px-3 py-2.5"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[11px] font-medium",
                                AUDIT_TONE_CLASSES[tone],
                              )}
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
                          <p className="mt-1.5 text-sm font-medium leading-snug">
                            {formatAuditSummary(log)}
                          </p>
                          {details ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {details}
                            </p>
                          ) : null}
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <Avatar size="sm" className="size-5">
                              <AvatarFallback className="text-[9px]">
                                {userInitials(log.actor.username)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{log.actor.username}</span>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </ShimmerContainer>
      )}

      <ListPagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={ACTIVITY_PAGE_SIZE}
        onPageChange={setPage}
        label="events"
      />
    </div>
  )
})
