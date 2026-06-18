import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { listAuditLogs } from "@/modules/api/audit-api"
import { queryKeys } from "@/lib/query-keys"
import { useAuthToken } from "@/hooks/use-auth-token"

export function useAuditLogsQuery(params: { page?: number; limit?: number } = {}) {
  const token = useAuthToken()
  const page = params.page ?? 1
  const limit = params.limit ?? 20

  return useQuery({
    queryKey: queryKeys.audit.list({ page, limit }),
    queryFn: () => listAuditLogs(token!, { page, limit }),
    enabled: Boolean(token),
    placeholderData: keepPreviousData,
  })
}
