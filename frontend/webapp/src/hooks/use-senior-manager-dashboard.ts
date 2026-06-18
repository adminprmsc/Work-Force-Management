import { useCallback, useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { useAuditLogsQuery, useOfficesQuery, useUsersQuery } from "@/hooks/api"
import { queryKeys } from "@/lib/query-keys"
import { getQueryViewState, mergeQueryViewStates } from "@/lib/query-view-state"
import type { AuditLogsResponse, Office, User } from "@/modules/api/types"

const AUDIT_PAGE = { page: 1, limit: 20 } as const

export function useSeniorManagerDashboardData() {
  const queryClient = useQueryClient()
  const usersQuery = useUsersQuery()
  const officesQuery = useOfficesQuery()
  const auditQuery = useAuditLogsQuery(AUDIT_PAGE)

  const usersView = useMemo(
    () => getQueryViewState<User[]>(usersQuery),
    [usersQuery],
  )
  const officesView = useMemo(
    () => getQueryViewState<Office[]>(officesQuery),
    [officesQuery],
  )
  const auditView = useMemo(
    () => getQueryViewState<AuditLogsResponse>(auditQuery),
    [auditQuery],
  )

  const combinedView = useMemo(
    () => mergeQueryViewStates([usersView, officesView, auditView]),
    [auditView, officesView, usersView],
  )

  const refreshAll = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.offices.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.tehsils.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.audit.list(AUDIT_PAGE) }),
    ])
  }, [queryClient])

  return {
    usersQuery,
    officesQuery,
    auditQuery,
    usersView,
    officesView,
    auditView,
    combinedView,
    refreshAll,
  }
}
