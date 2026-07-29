import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { listAuditLogs, type ListAuditLogsParams } from "@/modules/api/audit-api"
import { queryKeys } from "@/lib/query-keys"
import { useAuthToken } from "@/hooks/use-auth-token"

export function useAuditLogsQuery(params: ListAuditLogsParams = {}) {
  const token = useAuthToken()
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const search = params.search?.trim() || undefined

  return useQuery({
    queryKey: queryKeys.audit.list({
      page,
      limit,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      action: params.action,
      actorId: params.actorId,
      userId: params.userId,
      search,
    }),
    queryFn: () =>
      listAuditLogs(token!, {
        page,
        limit,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        action: params.action,
        actorId: params.actorId,
        userId: params.userId,
        search,
      }),
    enabled: Boolean(token),
    placeholderData: keepPreviousData,
  })
}
