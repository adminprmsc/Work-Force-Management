import { apiRequest } from "@/lib/api-client"
import type { AuditAction, AuditLogsResponse } from "./types"

export type ListAuditLogsParams = {
  page?: number
  limit?: number
  resourceType?: string
  resourceId?: string
  action?: AuditAction
  actorId?: string
  userId?: string
  search?: string
}

export function listAuditLogs(
  token: string,
  params: ListAuditLogsParams = {},
): Promise<AuditLogsResponse> {
  const search = new URLSearchParams()
  if (params.page) search.set("page", String(params.page))
  if (params.limit) search.set("limit", String(params.limit))
  if (params.resourceType) search.set("resourceType", params.resourceType)
  if (params.resourceId) search.set("resourceId", params.resourceId)
  if (params.action) search.set("action", params.action)
  if (params.actorId) search.set("actorId", params.actorId)
  if (params.userId) search.set("userId", params.userId)
  if (params.search?.trim()) search.set("search", params.search.trim())
  const query = search.toString() ? `?${search.toString()}` : ""

  return apiRequest<AuditLogsResponse>(`/audit-logs${query}`, {
    method: "GET",
    token,
  })
}
