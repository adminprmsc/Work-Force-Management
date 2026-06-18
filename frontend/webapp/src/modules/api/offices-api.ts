import { apiRequest } from "@/lib/api-client"
import type { Office, OfficeType } from "./types"

export function listOffices(token: string, type?: OfficeType): Promise<Office[]> {
  const query = type ? `?type=${type}` : ""
  return apiRequest<Office[]>(`/offices${query}`, { method: "GET", token })
}
