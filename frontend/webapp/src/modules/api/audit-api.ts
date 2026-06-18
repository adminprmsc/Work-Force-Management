import { apiRequest } from "@/lib/api-client"
import type { AuditLogsResponse } from "./types"

export function listAuditLogs(
  token: string,
  params: { page?: number; limit?: number } = {},
): Promise<AuditLogsResponse> {
  const search = new URLSearchParams()
  if (params.page) search.set("page", String(params.page))
  if (params.limit) search.set("limit", String(params.limit))
  const query = search.toString() ? `?${search.toString()}` : ""

  return apiRequest<AuditLogsResponse>(`/audit-logs${query}`, {
    method: "GET",
    token,
  })
}
