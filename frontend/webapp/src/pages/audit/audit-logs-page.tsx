import { useMemo } from "react"

import { AuditLogsTableCard } from "@/components/dashboard/dashboard-tables"
import { useAuditLogsQuery } from "@/hooks/api"
import { getQueryViewState } from "@/lib/query-view-state"
import type { AuditLogsResponse } from "@/modules/api/types"

const AUDIT_PAGE = { page: 1, limit: 20 } as const

export function AuditLogsPage() {
  const auditQuery = useAuditLogsQuery(AUDIT_PAGE)
  const auditView = useMemo(
    () => getQueryViewState<AuditLogsResponse>(auditQuery),
    [auditQuery],
  )

  return (
    <AuditLogsTableCard
      items={auditView.data?.items}
      total={auditView.data?.total}
      limit={auditView.data?.limit}
      error={auditView.error}
      isInitialLoading={auditView.isInitialLoading}
      isRefreshing={auditView.isRefreshing}
    />
  )
}
