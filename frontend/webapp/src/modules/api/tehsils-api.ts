import { apiRequest } from "@/lib/api-client"
import type { Settlement, Tehsil, Village } from "./types"

export function listTehsils(token: string): Promise<Tehsil[]> {
  return apiRequest<Tehsil[]>("/tehsils", { method: "GET", token })
}

export function listVillages(token: string, tehsilId: string): Promise<Village[]> {
  return apiRequest<Village[]>(`/tehsils/${tehsilId}/villages`, {
    method: "GET",
    token,
  })
}

export function listSettlements(token: string, villageId: string): Promise<Settlement[]> {
  return apiRequest<Settlement[]>(`/tehsils/villages/${villageId}/settlements`, {
    method: "GET",
    token,
  })
}
